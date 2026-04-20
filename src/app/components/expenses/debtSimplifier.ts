// ============================================================
//  Debt Simplifier — pure utility, no React dependencies
//  Used by BalanceSheet and ExpenseTracker to compute who
//  owes whom and minimise the number of transactions.
// ============================================================

export interface DebtTransaction {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

// ─── helpers ────────────────────────────────────────────────

/** Return each participant's share (in currency units) for an expense. */
export function getShares(expense: {
  amount: number;
  splitType?: string;
  splitAmong: string[];
  splitDetails?: Record<string, number>;
  paidBy: string;
}): Record<string, number> {
  const { amount, splitType, splitAmong, splitDetails, paidBy } = expense;

  if (splitType === 'exact' && splitDetails && Object.keys(splitDetails).length > 0) {
    // splitDetails holds exact monetary amounts per user
    return splitDetails;
  }

  if (splitType === 'percentage' && splitDetails && Object.keys(splitDetails).length > 0) {
    // splitDetails holds percentages; convert to currency amounts
    const result: Record<string, number> = {};
    for (const [uid, pct] of Object.entries(splitDetails)) {
      result[uid] = round2(amount * pct / 100);
    }
    return result;
  }

  // Default: equal split
  const participants = splitAmong.length > 0 ? splitAmong : [paidBy];
  const share = round2(amount / participants.length);
  const result: Record<string, number> = {};
  for (const uid of participants) result[uid] = share;
  return result;
}

/** Round to 2 decimal places (avoids floating-point drift). */
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ─── net balance (who is up/down overall) ───────────────────

/**
 * Compute each user's net position across all expenses + settlements.
 * Positive = user is owed money.  Negative = user owes money.
 */
export function computeNetBalances(
  expenses: {
    amount: number;
    paidBy: string;
    splitType?: string;
    splitAmong: string[];
    splitDetails?: Record<string, number>;
  }[],
  settlements: { fromUserId: string; toUserId: string; amount: number }[]
): Record<string, number> {
  const net: Record<string, number> = {};

  for (const expense of expenses) {
    const { paidBy, amount } = expense;
    const shares = getShares(expense as any);

    net[paidBy] = (net[paidBy] ?? 0) + amount;
    for (const [uid, share] of Object.entries(shares)) {
      net[uid] = (net[uid] ?? 0) - share;
    }
  }

  for (const s of settlements) {
    // fromUser paid toUser → fromUser's debt shrinks (+), toUser's credit shrinks (-)
    net[s.fromUserId] = (net[s.fromUserId] ?? 0) + s.amount;
    net[s.toUserId]   = (net[s.toUserId]   ?? 0) - s.amount;
  }

  for (const uid in net) net[uid] = round2(net[uid]);
  return net;
}

// ─── pairwise owes (detailed, before simplification) ────────

/**
 * Compute user-centric pairwise owes without netting between the same pair.
 * Returns { userOwes, userReceives } where both are maps from userId to amount.
 */
export function computeUserPairwiseOwes(
  currentUserId: string,
  expenses: {
    amount: number;
    paidBy: string;
    splitType?: string;
    splitAmong: string[];
    splitDetails?: Record<string, number>;
  }[],
  settlements: { fromUserId: string; toUserId: string; amount: number }[]
): { userOwes: Record<string, number>; userReceives: Record<string, number> } {
  const userOwes: Record<string, number> = {};
  const userReceives: Record<string, number> = {};

  const addOwe = (toId: string, v: number) => {
    userOwes[toId] = round2((userOwes[toId] ?? 0) + v);
  };
  const addReceive = (fromId: string, v: number) => {
    userReceives[fromId] = round2((userReceives[fromId] ?? 0) + v);
  };

  for (const expense of expenses) {
    const { paidBy } = expense;
    const shares = getShares(expense as any);

    if (paidBy === currentUserId) {
      // User paid, others owe user
      for (const [uid, share] of Object.entries(shares)) {
        if (uid === currentUserId) continue;
        addReceive(uid, share);
      }
    } else if (shares[currentUserId]) {
      // Someone else paid, user owes them
      addOwe(paidBy, shares[currentUserId]);
    }
  }

  for (const s of settlements) {
    if (s.fromUserId === currentUserId) {
      // User paid back someone
      addOwe(s.toUserId, -s.amount);
    } else if (s.toUserId === currentUserId) {
      // Someone paid back user
      addReceive(s.fromUserId, -s.amount);
    }
  }

  // Clean up values near zero
  for (const id in userOwes) if (userOwes[id] < 0.005) delete userOwes[id];
  for (const id in userReceives) if (userReceives[id] < 0.005) delete userReceives[id];

  return { userOwes, userReceives };
}

/**
 * Compute the net balance for the current user against every other member.
 * Returns:
 *  - totalNet: sum of all individual net positions (derived from rounded individual balances)
 *  - balances: Record<string, number> where +X means "User [ID] owes you X" and -X means "You owe User [ID] X"
 */
export function computeUserNetBalances(
  currentUserId: string,
  expenses: {
    amount: number;
    paidBy: string;
    splitType?: string;
    splitAmong: string[];
    splitDetails?: Record<string, number>;
  }[],
  settlements: { fromUserId: string; toUserId: string; amount: number }[]
): { totalNet: number; balances: Record<string, number> } {
  // 1. Get raw amounts (what you owe them, what they owe you)
  const { userOwes, userReceives } = computeUserPairwiseOwes(currentUserId, expenses, settlements);
  
  const balances: Record<string, number> = {};
  let totalNet = 0;
  
  // 2. Identify all relevant users
  const allUserIds = new Set([...Object.keys(userOwes), ...Object.keys(userReceives)]);
  
  for (const userId of allUserIds) {
    // Net = (They owe you) - (You owe them)
    // Positive = You are UP (they owe you)
    // Negative = You are DOWN (you owe them)
    const net = (userReceives[userId] || 0) - (userOwes[userId] || 0);
    
    if (Math.abs(net) > 0.005) {
      const roundedNet = round2(net);
      balances[userId] = roundedNet;
      totalNet += roundedNet;
    }
  }
  
  return { totalNet: round2(totalNet), balances };
}

export function computePairwiseOwes(
  expenses: {
    amount: number;
    paidBy: string;
    splitType?: string;
    splitAmong: string[];
    splitDetails?: Record<string, number>;
  }[],
  settlements: { fromUserId: string; toUserId: string; amount: number }[]
): Record<string, Record<string, number>> {
  const owes: Record<string, Record<string, number>> = {};

  const add = (a: string, b: string, v: number) => {
    if (!owes[a]) owes[a] = {};
    owes[a][b] = round2((owes[a][b] ?? 0) + v);
  };

  for (const expense of expenses) {
    const { paidBy } = expense;
    const shares = getShares(expense as any);
    for (const [uid, share] of Object.entries(shares)) {
      if (uid === paidBy) continue; // payer's own share cancels out
      add(uid, paidBy, share);
    }
  }

  for (const s of settlements) {
    add(s.fromUserId, s.toUserId, -s.amount);
  }

  // Net each pair (cancel cross-debts)
  const users = new Set<string>([
    ...Object.keys(owes),
    ...Object.values(owes).flatMap(m => Object.keys(m)),
  ]);

  for (const a of users) {
    for (const b of users) {
      if (a >= b) continue;
      const ab = owes[a]?.[b] ?? 0;
      const ba = owes[b]?.[a] ?? 0;
      if (ab > ba) {
        add(a, b, -(ba));
        if (owes[b]) owes[b][a] = 0;
      } else if (ba > ab) {
        add(b, a, -(ab));
        if (owes[a]) owes[a][b] = 0;
      } else {
        if (owes[a]) owes[a][b] = 0;
        if (owes[b]) owes[b][a] = 0;
      }
    }
  }

  return owes;
}

// ─── greedy simplification ───────────────────────────────────

/**
 * Given net balances (positive = owed, negative = owes),
 * return the minimum set of transactions that settles all debts.
 * O(n log n) greedy algorithm.
 */
export function simplifyDebts(netBalances: Record<string, number>): DebtTransaction[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, net] of Object.entries(netBalances)) {
    if (net > 0.005) creditors.push({ userId, amount: net });
    else if (net < -0.005) debtors.push({ userId, amount: -net });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: DebtTransaction[] = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt   = debtors[di];
    const amount = round2(Math.min(credit.amount, debt.amount));

    if (amount > 0.005) {
      transactions.push({ fromUserId: debt.userId, toUserId: credit.userId, amount });
    }

    credit.amount = round2(credit.amount - amount);
    debt.amount   = round2(debt.amount   - amount);

    if (credit.amount < 0.005) ci++;
    if (debt.amount   < 0.005) di++;
  }

  return transactions;
}
