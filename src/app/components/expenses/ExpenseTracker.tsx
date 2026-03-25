import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, Plus, Edit2, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export const ExpenseTracker = () => {
  const { currentRoom, expenses, setExpenses } = useApp();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddExpense = () => {
    if (!currentRoom || !title.trim() || !amount || !paidBy || splitAmong.length === 0) {
      toast.error('Please fill all fields');
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      title,
      amount: parseFloat(amount),
      paidBy,
      splitAmong,
      date,
      roomId: currentRoom.id,
    };

    setExpenses([...expenses, newExpense]);
    setShowAddExpense(false);
    resetForm();
    toast.success('Expense added successfully!');
  };

  const handleUpdateExpense = () => {
    if (!editingExpense || !title.trim() || !amount || !paidBy || splitAmong.length === 0) return;

    const updatedExpenses = expenses.map(e =>
      e.id === editingExpense
        ? { ...e, title, amount: parseFloat(amount), paidBy, splitAmong, date }
        : e
    );

    setExpenses(updatedExpenses);
    setEditingExpense(null);
    setShowAddExpense(false);
    resetForm();
    toast.success('Expense updated successfully!');
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== expenseId);
    setExpenses(updatedExpenses);
    toast.success('Expense deleted!');
  };

  const startEdit = (expense: any) => {
    setEditingExpense(expense.id);
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setPaidBy(expense.paidBy);
    setSplitAmong(expense.splitAmong);
    setDate(expense.date);
    setShowAddExpense(true);
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setPaidBy('');
    setSplitAmong([]);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const toggleSplitMember = (memberId: string) => {
    if (splitAmong.includes(memberId)) {
      setSplitAmong(splitAmong.filter(id => id !== memberId));
    } else {
      setSplitAmong([...splitAmong, memberId]);
    }
  };

  if (!currentRoom) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Selected</h2>
        <p className="text-gray-600">Please create or join a room first</p>
      </div>
    );
  }

  const roomExpenses = expenses.filter(e => e.roomId === currentRoom.id);
  const totalExpenses = roomExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate monthly summary
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = roomExpenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate per-member breakdown
  const memberBreakdown = currentRoom.members.map(member => {
    const paid = roomExpenses
      .filter(e => e.paidBy === member.userId)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const owes = roomExpenses
      .filter(e => e.splitAmong.includes(member.userId))
      .reduce((sum, e) => sum + (e.amount / e.splitAmong.length), 0);

    return {
      member,
      paid,
      owes,
      balance: paid - owes,
    };
  });

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
          <p className="text-gray-600 mt-1">Track and split expenses fairly</p>
        </div>
        <button
          onClick={() => {
            setShowAddExpense(true);
            setEditingExpense(null);
            resetForm();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-700">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{totalExpenses.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-1">All time</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-700">This Month</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{monthlyTotal.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-1">{monthlyExpenses.length} expenses</p>
        </div>
      </div>

      {/* Member Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Member Breakdown</h2>
        <div className="space-y-3">
          {memberBreakdown.map(({ member, paid, owes, balance }) => (
            <div key={member.userId} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{member.name}</h3>
                <span className={`font-bold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {balance > 0 ? '+' : ''}₹{balance.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Paid: ₹{paid.toFixed(2)}</span>
                <span>Owes: ₹{owes.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Expenses</h2>
        {roomExpenses.length > 0 ? (
          <div className="space-y-3">
            {roomExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => {
              const payer = currentRoom.members.find(m => m.userId === expense.paidBy);
              const splitPerPerson = expense.amount / expense.splitAmong.length;
              return (
                <div key={expense.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{expense.title}</h3>
                        <span className="text-xl font-bold text-gray-900">₹{expense.amount.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Paid by: {payer?.name || 'Unknown'}</p>
                        <p>Split among: {expense.splitAmong.length} member(s) (₹{splitPerPerson.toFixed(2)} each)</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(expense)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No expenses yet</p>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Groceries, Rent, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select member</option>
                  {currentRoom.members.map(member => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Split Among</label>
                <div className="space-y-2">
                  {currentRoom.members.map(member => (
                    <label key={member.userId} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={splitAmong.includes(member.userId)}
                        onChange={() => toggleSplitMember(member.userId)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-gray-900">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
                <button
                  onClick={() => {
                    setShowAddExpense(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
