import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Users, DollarSign, Percent, Calculator, Plus, Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { expenseAPI, expenseCategoryAPI } from '../../services/api';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: any;
}

export const AddExpenseModal = ({ isOpen, onClose, editingExpense }: AddExpenseModalProps) => {
  const { currentRoom, refreshData, expenseCategories, currency } = useApp();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('General');
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [splitDetails, setSplitDetails] = useState<Record<string, number>>({});
  
  // Category management state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      setPaidBy(editingExpense.paidBy);
      setDate(editingExpense.date);
      setCategory(editingExpense.category || 'General');
      setSplitType(editingExpense.splitType || 'equal');
      setSplitAmong(editingExpense.splitAmong || []);
      setSplitDetails(editingExpense.splitDetails || {});
    } else if (currentRoom?.members.length) {
      // Default: current user pays, everyone splits equally
      setSplitAmong(currentRoom.members.map(m => m.userId));
    }
  }, [editingExpense, currentRoom]);

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  const validate = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return false;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    if (!paidBy) {
      toast.error('Please select who paid');
      return false;
    }
    if (splitAmong.length === 0) {
      toast.error('Please select at least one participant');
      return false;
    }

    if (splitType === 'exact') {
      const sum = Object.values(splitDetails).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - numAmount) > 0.01) {
        toast.error(`Total split (${currencySymbol}${sum.toFixed(2)}) must equal amount (${currencySymbol}${numAmount.toFixed(2)})`);
        return false;
      }
    }

    if (splitType === 'percentage') {
      const sum = Object.values(splitDetails).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.1) {
        toast.error(`Total percentage (${sum.toFixed(1)}%) must equal 100%`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !currentRoom) return;

    setLoading(true);
    try {
      const expenseData = {
        title,
        amount: parseFloat(amount),
        category,
        paidBy,
        splitType,
        splitAmong,
        splitDetails: splitType === 'equal' ? {} : splitDetails,
        date,
        roomId: currentRoom.id,
      };

      if (editingExpense) {
        await expenseAPI.updateExpense(currentRoom.id, editingExpense.id, expenseData);
        toast.success('Expense updated');
      } else {
        await expenseAPI.createExpense(expenseData);
        toast.success('Expense added');
      }

      await refreshData();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    if (splitAmong.includes(userId)) {
      setSplitAmong(splitAmong.filter(id => id !== userId));
      const newDetails = { ...splitDetails };
      delete newDetails[userId];
      setSplitDetails(newDetails);
    } else {
      setSplitAmong([...splitAmong, userId]);
    }
  };

  const updateSplitDetail = (userId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setSplitDetails({ ...splitDetails, [userId]: num });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !currentRoom) return;
    
    setCategoryLoading(true);
    try {
      await expenseCategoryAPI.createCategory(currentRoom.id, newCategoryName.trim());
      toast.success('Category added');
      setNewCategoryName('');
      setShowAddCategory(false);
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    setCategoryLoading(true);
    try {
      await expenseCategoryAPI.deleteCategory(categoryId);
      toast.success('Category deleted');
      if (category === expenseCategories.find(c => c.id === categoryId)?.name) {
        setCategory('General');
      }
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    } finally {
      setCategoryLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What was it for?"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category & Payer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Category</label>
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowManageCategories(!showManageCategories);
                      setShowAddCategory(false);
                    }}
                    className={`p-1 rounded-md transition-colors ${showManageCategories ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Manage categories"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddCategory(!showAddCategory);
                      setShowManageCategories(false);
                    }}
                    className={`p-1 rounded-md transition-colors ${showAddCategory ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Quick add category"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              
              {!showAddCategory && !showManageCategories && (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                >
                  <option value="General">General</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              )}

              {showAddCategory && (
                <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200">
                  <input
                    type="text"
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={categoryLoading || !newCategoryName.trim()}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {categoryLoading ? '...' : 'Add'}
                  </button>
                </div>
              )}

              {showManageCategories && (
                <div className="space-y-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 px-1">
                    <span>Active Categories</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 bg-white rounded-lg border border-gray-100 text-sm font-medium">
                    <span className="text-gray-900">General</span>
                    <span className="text-[10px] text-gray-400 uppercase font-black">Default</span>
                  </div>
                  {expenseCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between px-2 py-1.5 bg-white rounded-lg border border-gray-100 text-sm group">
                      <span className="text-gray-900 font-medium truncate pr-2">{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {expenseCategories.length === 0 && (
                    <p className="text-[10px] text-center text-gray-300 py-2 italic">No custom categories</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              >
                <option value="">Select member</option>
                {currentRoom?.members.map(member => (
                  <option key={member.userId} value={member.userId}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Logic */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Split Among
              </label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSplitType('equal')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${splitType === 'equal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Equal
                </button>
                <button
                  onClick={() => setSplitType('exact')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${splitType === 'exact' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Exact
                </button>
                <button
                  onClick={() => setSplitType('percentage')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${splitType === 'percentage' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  %
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {currentRoom?.members.map(member => {
                const isActive = splitAmong.includes(member.userId);
                return (
                  <div key={member.userId} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleParticipant(member.userId)}
                        className="w-5 h-5 rounded-lg text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className={`font-medium ${isActive ? 'text-indigo-900' : 'text-gray-500'}`}>
                        {member.name}
                      </span>
                    </label>

                    {isActive && splitType !== 'equal' && (
                      <div className="relative w-32">
                        {splitType === 'exact' ? (
                          <>
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={splitDetails[member.userId] || ''}
                              onChange={(e) => updateSplitDetail(member.userId, e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right font-semibold"
                              placeholder="0.00"
                            />
                          </>
                        ) : (
                          <>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                            <input
                              type="number"
                              step="0.1"
                              value={splitDetails[member.userId] || ''}
                              onChange={(e) => updateSplitDetail(member.userId, e.target.value)}
                              className="w-full pl-3 pr-7 py-1.5 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right font-semibold"
                              placeholder="0"
                            />
                          </>
                        )}
                      </div>
                    )}

                    {isActive && splitType === 'equal' && (
                      <span className="text-sm font-semibold text-indigo-600">
                        {currencySymbol}{(parseFloat(amount || '0') / splitAmong.length).toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {(splitType === 'exact' || splitType === 'percentage') && (
              <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-600">Total Split</span>
                <span className={`font-bold ${
                  (splitType === 'exact' && Math.abs(Object.values(splitDetails).reduce((a,b)=>a+b,0) - parseFloat(amount || '0')) < 0.01) ||
                  (splitType === 'percentage' && Math.abs(Object.values(splitDetails).reduce((a,b)=>a+b,0) - 100) < 0.1)
                  ? 'text-green-600' : 'text-red-600'
                }`}>
                  {splitType === 'exact' ? currencySymbol : ''}
                  {Object.values(splitDetails).reduce((a,b)=>a+b,0).toFixed(splitType === 'exact' ? 2 : 1)}
                  {splitType === 'percentage' ? '%' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              editingExpense ? 'Update Expense' : 'Add Expense'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
