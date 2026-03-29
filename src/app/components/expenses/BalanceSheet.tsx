import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { computeNetBalances, simplifyDebts, computePairwiseOwes } from './debtSimplifier';
import { TrendingDown, TrendingUp, HandCoins, Minus, Info, Sparkles, ChevronRight } from 'lucide-react';
import { SettleModal } from './SettleModal';

export const BalanceSheet = () => {
  const { currentRoom, expenses, splitSettlements, currency } = useApp();
  const [showSimplified, setShowSimplified] = useState(true);
  const [settleData, setSettleData] = useState<{ fromUserId: string; toUserId: string; amount: number } | null>(null);

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  // 1. Compute overall net positions per user
  const netBalances = useMemo(() => 
    computeNetBalances(expenses, splitSettlements),
  [expenses, splitSettlements]);

  // 2. Compute raw pairwise debts (A owes B)
  const pairwiseOwes = useMemo(() => 
    computePairwiseOwes(expenses, splitSettlements),
  [expenses, splitSettlements]);

  // 3. Compute simplified transactions (minimized set)
  const simplifiedTransactions = useMemo(() => 
    simplifyDebts(netBalances),
  [netBalances]);

  if (!currentRoom) return null;

  const currentUserId = currentRoom.members?.[0]?.userId; // Fallback or context user?
  // Let's assume we want to show all room balances.
  
  const getMemberName = (id: string) => currentRoom.members.find(m => m.userId === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Room Balances</h2>
          <p className="text-sm text-gray-500">Track who owes whom overall</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl shadow-inner group">
          <button
            onClick={() => setShowSimplified(false)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${!showSimplified ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Raw Debts
          </button>
          <button
            onClick={() => setShowSimplified(true)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${showSimplified ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${showSimplified ? 'text-indigo-200' : 'text-indigo-400'}`} />
            Simplified
          </button>
        </div>
      </div>

      {/* Simplified View (transactions to settle) */}
      {showSimplified ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {simplifiedTransactions.length > 0 ? (
            simplifiedTransactions.map((tx, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500">Pay From</span>
                    <HandCoins className="h-4 w-4 text-gray-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-green-600">Receive To</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl">
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-gray-900 truncate">{getMemberName(tx.fromUserId)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="flex-1 text-right">
                      <p className="text-sm font-bold text-gray-900 truncate">{getMemberName(tx.toUserId)}</p>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Amount Owed</p>
                    <p className="text-2xl font-black text-gray-900">{currencySymbol}{tx.amount.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSettleData(tx)}
                  className="mt-6 w-full py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  Settle Debt
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
              <Sparkles className="h-12 w-12 text-indigo-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">All Settled!</h3>
              <p className="text-sm text-gray-500">No pending transactions found.</p>
            </div>
          )}
        </div>
      ) : (
        /* Raw View (every user position) */
        <div className="space-y-4">
          {currentRoom.members.map(member => {
            const net = netBalances[member.userId] || 0;
            const owesToOthers = Object.entries(pairwiseOwes[member.userId] || {}).filter(([_, val]) => val > 0.005);
            
            return (
              <div key={member.userId} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${net > 0 ? 'bg-green-100 text-green-700' : net < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {member.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{member.name}</h4>
                      <p className={`text-xs font-bold uppercase ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {net > 0 ? 'Total Owed' : net < 0 ? 'Owes Total' : 'Settled'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {net > 0 ? '+' : ''}{currencySymbol}{Math.abs(net).toFixed(2)}
                    </p>
                  </div>
                </div>

                {owesToOthers.length > 0 && (
                  <div className="pt-4 border-t border-gray-50 space-y-2">
                    {owesToOthers.map(([toId, amount]) => (
                      <div key={toId} className="flex items-center justify-between text-sm py-2 px-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-500 flex items-center gap-2">
                          Owes <span className="font-bold text-gray-700">{getMemberName(toId)}</span>
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-gray-900">{currencySymbol}{amount.toFixed(2)}</span>
                          <button
                            onClick={() => setSettleData({ fromUserId: member.userId, toUserId: toId, amount })}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-indigo-600"
                            title="Settle this specific debt"
                          >
                            <HandCoins className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex items-start gap-4">
        <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-1" />
        <div>
          <h5 className="text-sm font-bold text-indigo-900 mb-1">How balances work</h5>
          <p className="text-xs text-indigo-700/80 leading-relaxed">
            Balances are calculated from all expenses and payments recorded in this room.
            <strong> Simplified Transactions</strong> use a greedy algorithm to minimize the number of payments needed 
            to settle everyone's debts without changing the net amount anyone owes or is owed.
          </p>
        </div>
      </div>

      <SettleModal
        isOpen={!!settleData}
        onClose={() => setSettleData(null)}
        defaultData={settleData || undefined}
      />
    </div>
  );
};
