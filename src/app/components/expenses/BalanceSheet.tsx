import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { computeUserNetBalances } from './debtSimplifier';
import { HandCoins, ArrowDownRight, ArrowUpRight, Wallet, User, History, MessageSquareShare } from 'lucide-react';
import { toast } from 'sonner';
import { SettleModal } from './SettleModal';

export const BalanceSheet = () => {
  const { currentRoom, expenses, splitSettlements, currency, user } = useApp();
  const [settleData, setSettleData] = useState<{ fromUserId: string; toUserId: string; amount: number } | null>(null);

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  if (!currentRoom || !user) return null;

  const currentUserId = user.id;

  // 1. Compute reconciled user balances with automatic netting
  const { totalNet, balances } = useMemo(() => 
    computeUserNetBalances(currentUserId, expenses, splitSettlements),
  [currentUserId, expenses, splitSettlements]);

  const getMemberName = (id: string) => currentRoom.members.find(m => m.userId === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Summary Section */}
      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
        <div className={`absolute inset-0 opacity-[0.03] transition-colors duration-500 ${totalNet > 0 ? 'bg-green-600' : totalNet < 0 ? 'bg-red-600' : 'bg-gray-600'}`} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${totalNet > 0 ? 'bg-green-50 text-green-600' : totalNet < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
              <Wallet className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Overall Balance</p>
              <h2 className={`text-4xl font-black ${totalNet > 0 ? 'text-green-600' : totalNet < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {totalNet === 0 ? 'Settled Up' : `${totalNet > 0 ? 'You are owed' : 'You owe'} ${currencySymbol}${Math.abs(totalNet).toFixed(2)}`}
              </h2>
            </div>
          </div>
          {totalNet !== 0 && (
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${totalNet > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {totalNet > 0 ? 'Overall Profit' : 'Pending Action'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Individual Breakdown Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-gray-400">Individual Net Balances</h3>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{Object.keys(balances).length} people involved</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(balances).length > 0 ? (
            Object.entries(balances).map(([userId, amount]) => {
              const isOwedToUser = amount > 0;
              return (
                <div 
                  key={userId} 
                  className={`bg-white rounded-[28px] p-6 border transition-all duration-300 flex flex-col justify-between h-full group
                    ${isOwedToUser ? 'border-gray-100 hover:border-green-200 hover:shadow-green-100/20' : 'border-gray-100 hover:border-red-200 hover:shadow-red-100/20'}
                  `}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border transition-colors
                        ${isOwedToUser ? 'bg-green-50 text-green-600 border-green-100 group-hover:bg-green-100' : 'bg-red-50 text-red-500 border-red-100 group-hover:bg-red-100'}
                      `}>
                        {getMemberName(userId)[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 text-lg">{getMemberName(userId)}</h4>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isOwedToUser ? 'text-green-600' : 'text-red-500'}`}>
                          {isOwedToUser ? 'Owes you' : 'You owe'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${isOwedToUser ? 'text-green-600' : 'text-red-600'}`}>
                        {currencySymbol}{Math.abs(amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isOwedToUser ? (
                      <button
                        onClick={() => {
                          toast.info(`Payment request sent to ${getMemberName(userId)} (Simulated)`);
                        }}
                        className="flex-1 px-4 py-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                      >
                        <MessageSquareShare className="h-3.5 w-3.5" />
                        Request Payment
                      </button>
                    ) : (
                      <button
                        onClick={() => setSettleData({ fromUserId: currentUserId, toUserId: userId, amount: Math.abs(amount) })}
                        className="flex-1 px-4 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                      >
                        <HandCoins className="h-3.5 w-3.5" />
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="md:col-span-2 py-24 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
              <History className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400">All Settled Up</h3>
              <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-bold">No pending balances or debts in this room</p>
            </div>
          )}
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
