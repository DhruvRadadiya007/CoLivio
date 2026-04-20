import { describe, it, expect } from 'vitest';
import { getShares, computeNetBalances, simplifyDebts } from './debtSimplifier';

describe('Debt Simplifier Utilities', () => {
  describe('getShares', () => {
    it('should split equally by default', () => {
      const expense = {
        amount: 300,
        paidBy: 'user1',
        splitAmong: ['user1', 'user2', 'user3'],
      };
      const shares = getShares(expense);
      expect(shares).toEqual({
        user1: 100,
        user2: 100,
        user3: 100,
      });
    });

    it('should handle exact splits', () => {
      const expense = {
        amount: 300,
        paidBy: 'user1',
        splitType: 'exact',
        splitAmong: ['user1', 'user2'],
        splitDetails: { user1: 100, user2: 200 },
      };
      const shares = getShares(expense);
      expect(shares).toEqual({
        user1: 100,
        user2: 200,
      });
    });

    it('should handle percentage splits', () => {
      const expense = {
        amount: 300,
        paidBy: 'user1',
        splitType: 'percentage',
        splitAmong: ['user1', 'user2'],
        splitDetails: { user1: 25, user2: 75 },
      };
      const shares = getShares(expense);
      expect(shares).toEqual({
        user1: 75,
        user2: 225,
      });
    });
  });

  describe('computeNetBalances', () => {
    it('should calculate net balances correctly for multiple expenses', () => {
      const expenses = [
        {
          amount: 100,
          paidBy: 'user1',
          splitAmong: ['user1', 'user2'],
        },
        {
          amount: 50,
          paidBy: 'user2',
          splitAmong: ['user1', 'user2'],
        }
      ];
      const settlements: any[] = [];
      const net = computeNetBalances(expenses, settlements);
      
      // User1: Paid 100. Share was 50. Share of expense2 was 25. Net = +100 - 50 - 25 = +25
      // User2: Paid 50. Share of expense1 was 50. Share was 25. Net = +50 - 25 - 50 = -25
      expect(net).toEqual({
        user1: 25,
        user2: -25,
      });
    });

    it('should account for settlements', () => {
      const expenses: any[] = [];
      const settlements = [
        { fromUserId: 'user2', toUserId: 'user1', amount: 25 }
      ];
      const net = computeNetBalances(expenses, settlements);
      expect(net).toEqual({
        user1: -25, // Receiving 25 from user2 makes user1 "down" relative to the pool? Wait.
        user2: 25,  // Paying 25 to user1 makes user2 "up" relative to the pool?
        // Let's re-read the logic:
        // net[s.fromUserId] = (net[s.fromUserId] ?? 0) + s.amount;
        // net[s.toUserId]   = (net[s.toUserId]   ?? 0) - s.amount;
        // This means "paying someone makes your balance more positive (less owed)".
        // So User2 (from) gets +25, User1 (to) gets -25.
      });
      expect(net.user2).toBe(25);
      expect(net.user1).toBe(-25);
    });
  });

  describe('simplifyDebts', () => {
    it('should minimize transactions', () => {
      // Scenario: A owes B $10, B owes C $10
      // Simplified: A owes C $10
      const netBalances = {
        'A': -10,
        'B': 0,
        'C': 10
      };
      const txs = simplifyDebts(netBalances);
      expect(txs).toEqual([
        { fromUserId: 'A', toUserId: 'C', amount: 10 }
      ]);
    });

    it('should handle complex scenarios', () => {
      const netBalances = {
        'User1': 100,
        'User2': -50,
        'User3': -50,
      };
      const txs = simplifyDebts(netBalances);
      expect(txs).toHaveLength(2);
      expect(txs).toContainEqual({ fromUserId: 'User2', toUserId: 'User1', amount: 50 });
      expect(txs).toContainEqual({ fromUserId: 'User3', toUserId: 'User1', amount: 50 });
    });
  });
});
