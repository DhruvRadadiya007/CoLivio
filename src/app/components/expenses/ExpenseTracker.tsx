import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  HandCoins, 
  Receipt, 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CreditCard,
  Wallet,
  TrendingUp,
  Tag,
  Search,
  Sparkles
} from 'lucide-react';
import { AddExpenseModal } from './AddExpenseModal';
import { SettleModal } from './SettleModal';
import { BalanceSheet } from './BalanceSheet';
import { ActivityHistory } from './ActivityHistory';
import { computeNetBalances } from './debtSimplifier';

export const ExpenseTracker = () => {
  const { currentRoom, expenses, splitSettlements, currency, loading, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'balances' | 'history'>('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettle, setShowSettle] = useState(false);

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  // Summary logic
  const netBalances = useMemo(() => 
    computeNetBalances(expenses, splitSettlements),
  [expenses, splitSettlements]);

  const currentUserId = currentRoom?.members?.[0]?.userId; // For demo/context purposes
  const userNet = currentUserId ? (netBalances[currentUserId] || 0) : 0;

  const totalRoomExpenses = useMemo(() => 
    expenses.reduce((sum, e) => sum + e.amount, 0),
  [expenses]);

  const totalOwed = useMemo(() => 
    Object.values(netBalances).filter(v => v > 0).reduce((sum, v) => sum + v, 0),
  [netBalances]);

  const totalToReceive = useMemo(() => 
    Object.values(netBalances).filter(v => v < 0).reduce((sum, v) => sum + Math.abs(v), 0),
  [netBalances]);

  if (!currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Wallet className="h-10 w-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">No Room Selected</h2>
        <p className="text-gray-500 max-w-xs leading-relaxed">Please create or join a room first to start tracking shared expenses.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 lg:pb-8">
      {/* Header section with Stats */}
      <div className="bg-white rounded-[40px] p-8 lg:p-10 border border-gray-100 shadow-xl shadow-indigo-100/20 relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-50 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-50 -z-10" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-indigo-600 rounded-2xl">
                <Wallet className="h-6 w-6 text-white" />
              </span>
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Financial Hub</h1>
            </div>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest pl-12">Split bills • Settle debts • Live balances</p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowSettle(true)}
              className="flex-1 lg:flex-none px-6 py-4 bg-gray-50 text-gray-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-gray-100"
            >
              <HandCoins className="h-4 w-4" />
              Settle Up
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex-1 lg:flex-none px-8 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-gray-900 rounded-3xl text-white relative group overflow-hidden">
            <TrendingUp className="absolute top-6 right-6 h-6 w-6 text-white/20 group-hover:text-white/40 transition-all group-hover:scale-110" />
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Total Pool</p>
            <h3 className="text-3xl font-black">{currencySymbol}{totalRoomExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">All room expenses recorded</p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-gray-100 ring-1 ring-red-50 relative group overflow-hidden">
            <ArrowUpRight className="absolute top-6 right-6 h-6 w-6 text-red-100 group-hover:text-red-200 transition-all group-hover:scale-110" />
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Total Owed</p>
            <h3 className="text-3xl font-black text-gray-900">{currencySymbol}{totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Across all members</p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-gray-100 ring-1 ring-green-50 relative group overflow-hidden">
            <ArrowDownLeft className="absolute top-6 right-6 h-6 w-6 text-green-100 group-hover:text-green-200 transition-all group-hover:scale-110" />
            <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">Total to Receive</p>
            <h3 className="text-3xl font-black text-gray-900">{currencySymbol}{totalToReceive.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Across all members</p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-6">
        {/* Custom Tab Switcher */}
        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-[28px] border border-white/20 w-full lg:w-fit shadow-lg shadow-indigo-100/10 ring-1 ring-gray-950/5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 lg:flex-none px-8 py-3.5 text-xs font-black uppercase tracking-[0.15em] rounded-[22px] transition-all flex items-center justify-center gap-3 ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex-1 lg:flex-none px-8 py-3.5 text-xs font-black uppercase tracking-[0.15em] rounded-[22px] transition-all flex items-center justify-center gap-3 ${activeTab === 'balances' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
          >
            <CreditCard className="h-4 w-4" />
            Balances
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 lg:flex-none px-8 py-3.5 text-xs font-black uppercase tracking-[0.15em] rounded-[22px] transition-all flex items-center justify-center gap-3 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
          >
            <History className="h-4 w-4" />
            Activity
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-gray-100">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-indigo-50 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600/50">Computing data...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Summary and Key Actions */}
                <div className="space-y-6">
                  <div className="bg-indigo-600 rounded-[40px] p-8 text-white relative group overflow-hidden shadow-2xl shadow-indigo-200 h-full">
                    <Sparkles className="absolute top-8 right-8 h-8 w-8 text-indigo-400 group-hover:scale-125 transition-transform duration-700" />
                    <h2 className="text-2xl font-black mb-1">Financial Overview</h2>
                    <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-8">Quick actions & Room status</p>
                    
                    <div className="space-y-4">
                      <div className="p-6 bg-indigo-500/30 backdrop-blur-xl border border-white/10 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Top Expense Creator</p>
                        {expenses.length > 0 ? (
                          <p className="text-lg font-black truncate">
                            {(() => {
                              const payers = expenses.reduce((acc, curr) => {
                                acc[curr.paidBy] = (acc[curr.paidBy] || 0) + 1;
                                return acc;
                              }, {} as any);
                              const topId = Object.entries(payers).sort((a,b) => (b[1] as any) - (a[1] as any))[0]?.[0];
                              return currentRoom.members.find(m => m.userId === topId)?.name || 'N/A';
                            })()}
                          </p>
                        ) : <p className="text-lg font-black italic text-white/30">None yet</p>}
                      </div>
                      
                      <div className="p-6 bg-indigo-500/30 backdrop-blur-xl border border-white/10 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Recent Big Spender</p>
                        {expenses.length > 0 ? (
                          <p className="text-lg font-black truncate">
                            {expenses.sort((a,b) => b.amount - a.amount)[0]?.title} 
                            <span className="text-indigo-300 ml-2 font-black">{currencySymbol}{expenses.sort((a,b) => b.amount - a.amount)[0]?.amount}</span>
                          </p>
                        ) : <p className="text-lg font-black italic text-white/30">None yet</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Recent activity snapshot */}
                <div className="bg-white rounded-[40px] p-8 lg:p-10 border border-gray-100 shadow-sm flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                       Recent Entries
                    </h3>
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    {expenses.slice(0, 4).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                      <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-bold text-gray-400 group-hover:bg-white group-hover:text-indigo-600 transition-all shadow-indigo-100/50">
                            <Receipt className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate text-sm">{exp.title}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {currentRoom.members.find(m => m.userId === exp.paidBy)?.name}
                            </p>
                          </div>
                        </div>
                        <p className="font-black text-gray-900 text-base">{currencySymbol}{exp.amount.toFixed(2)}</p>
                      </div>
                    ))}
                    {expenses.length === 0 && (
                      <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                          <Search className="h-6 w-6 text-gray-200" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-300">Clean Slate</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'balances' && <BalanceSheet />}
            {activeTab === 'history' && <ActivityHistory />}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddExpenseModal 
        isOpen={showAddExpense} 
        onClose={() => setShowAddExpense(false)} 
      />
      
      <SettleModal 
        isOpen={showSettle} 
        onClose={() => setShowSettle(false)} 
      />
    </div>
  );
};
