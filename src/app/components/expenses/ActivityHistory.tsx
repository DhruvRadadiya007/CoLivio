import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Receipt, 
  HandCoins, 
  Trash2, 
  Calendar, 
  Filter, 
  ChevronDown, 
  Edit3, 
  Tag, 
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { expenseAPI, splitSettlementAPI } from '../../services/api';

import { ConfirmModal } from '../ui/ConfirmModal';

export const ActivityHistory = () => {
  const { currentRoom, expenses, splitSettlements, refreshData, currency } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'settlement'>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'expense' | 'settlement' } | null>(null);

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  // Build a unified, sorted list of activities
  const unifiedActivities = useMemo(() => {
    const list: any[] = [
      ...expenses.map(e => ({ ...e, type: 'expense', timestamp: new Date(e.date).getTime() })),
      ...splitSettlements.map(s => ({ ...s, type: 'settlement', timestamp: new Date(s.settledAt).getTime() }))
    ];

    // Sort by timestamp DESC (newest first)
    list.sort((a, b) => b.timestamp - a.timestamp);

    return list.filter(item => {
      if (filterType === 'all') return true;
      return item.type === filterType;
    });
  }, [expenses, splitSettlements, filterType]);

  const handleDeleteExpense = async (id: string) => {
    if (!currentRoom) return;
    setLoading(id);
    try {
      await expenseAPI.deleteExpense(currentRoom.id, id);
      toast.success('Expense deleted');
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense');
    } finally {
      setLoading(null);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteSettlement = async (id: string) => {
    setLoading(id);
    try {
      await splitSettlementAPI.deleteSettlement(id);
      toast.success('Payment record removed');
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete settlement');
    } finally {
      setLoading(null);
      setDeleteConfirm(null);
    }
  };

  const getUserName = (id: string) => currentRoom?.members.find(m => m.userId === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex bg-gray-100 p-1 rounded-2xl w-fit group">
        <button
          onClick={() => setFilterType('all')}
          className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filterType === 'all' ? 'bg-white text-gray-900 shadow-sm shadow-black/5' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filterType === 'expense' ? 'bg-white text-gray-900 shadow-sm shadow-black/5' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Expenses
        </button>
        <button
          onClick={() => setFilterType('settlement')}
          className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filterType === 'settlement' ? 'bg-white text-gray-900 shadow-sm shadow-black/5' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Settlements
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {unifiedActivities.length > 0 ? (
          unifiedActivities.map((item, idx) => {
            const isExpense = item.type === 'expense';
            const dateStr = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            return (
              <div key={item.id} className="bg-white hover:bg-gray-50 rounded-3xl p-6 border border-gray-100 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm group">
                {/* Icon Circle */}
                <div className={`w-14 h-14 rounded-3xl shrink-0 flex items-center justify-center font-bold text-xl ring-4 transition-all ${isExpense ? 'bg-indigo-50 text-indigo-600 ring-indigo-50/50' : 'bg-green-50 text-green-600 ring-green-50/50'}`}>
                  {isExpense ? <Receipt className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-gray-900 truncate">
                      {isExpense ? item.title : `${getUserName(item.fromUserId)} paid ${getUserName(item.toUserId)}`}
                    </h4>
                    {isExpense && item.category && (
                      <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 rounded-md shrink-0">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {dateStr}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      {isExpense ? `Paid by ${getUserName(item.paidBy)}` : 'Payment Settlement'}
                    </div>
                    {isExpense && (
                      <div className="flex items-center gap-1.5">
                        <Filter className="h-3 w-3" />
                        {item.splitType || 'Equal'} Split
                      </div>
                    )}
                  </div>
                  
                  {item.note && (
                    <p className="mt-2 text-sm text-gray-500 italic bg-gray-50 px-3 py-1.5 rounded-lg border-l-2 border-gray-200">
                      "{item.note}"
                    </p>
                  )}
                </div>

                {/* Amount and Actions */}
                <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 mt-2 sm:mt-0">
                  <p className={`text-2xl font-black ${isExpense ? 'text-gray-900' : 'text-green-600'}`}>
                    {currencySymbol}{parseFloat(item.amount).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeleteConfirm({ id: item.id, type: isExpense ? 'expense' : 'settlement' })}
                      disabled={loading === item.id}
                      className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl transition-all disabled:opacity-50 group-hover:scale-105"
                      title="Delete entry"
                    >
                      {loading === item.id ? (
                        <div className="h-4 w-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 text-center space-y-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <Receipt className="h-16 w-12 text-gray-200 mx-auto" strokeWidth={1} />
            <div>
              <h3 className="text-xl font-bold text-gray-900">No activity yet</h3>
              <p className="text-sm text-gray-500">Add an expense or record a payment to get started.</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm?.type === 'expense') handleDeleteExpense(deleteConfirm.id);
          else if (deleteConfirm?.type === 'settlement') handleDeleteSettlement(deleteConfirm.id);
        }}
        title={`Delete ${deleteConfirm?.type === 'expense' ? 'Expense' : 'Settlement'}?`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type}? This action cannot be undone and will affect room balances.`}
        confirmText="Delete permanently"
        loading={!!loading}
      />
    </div>
  );
};
