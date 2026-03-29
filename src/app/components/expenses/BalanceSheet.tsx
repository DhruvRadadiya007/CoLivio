import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { computeNetBalances, computePairwiseOwes } from './debtSimplifier';
import { HandCoins, Info } from 'lucide-react';
import { SettleModal } from './SettleModal';

export const BalanceSheet = () => {
  const { currentRoom, expenses, splitSettlements, currency } = useApp();
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


  if (!currentRoom) return null;

  const currentUserId = currentRoom.members?.[0]?.userId; // Fallback or context user?
  // Let's assume we want to show all room balances.
  
  const getMemberName = (id: string) => currentRoom.members.find(m => m.userId === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Room Balances</h2>
        <p className="text-sm text-gray-500">Track who owes whom overall</p>
      </div>

      {/* Raw View (every user position) */}
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

      {/* Info card */}
      <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex items-start gap-4">
        <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-1" />
        <div>
          <h5 className="text-sm font-bold text-indigo-900 mb-1">How balances work</h5>
          <p className="text-xs text-indigo-700/80 leading-relaxed">
            Balances are calculated from all expenses and payments recorded in this room.
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
