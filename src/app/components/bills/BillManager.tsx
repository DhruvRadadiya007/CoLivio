import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Receipt, Plus, Edit2, Trash2, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const BillManager = () => {
  const { currentRoom, bills, setBills } = useApp();
  const [showAddBill, setShowAddBill] = useState(false);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState(false);

  const handleAddBill = () => {
    if (!currentRoom || !name.trim() || !amount || !dueDate) {
      toast.error('Please fill all fields');
      return;
    }

    const newBill = {
      id: Date.now().toString(),
      name,
      amount: parseFloat(amount),
      dueDate,
      recurring,
      status: 'pending' as const,
      roomId: currentRoom.id,
    };

    setBills([...bills, newBill]);
    setShowAddBill(false);
    resetForm();
    toast.success('Bill added successfully!');
  };

  const handleUpdateBill = () => {
    if (!editingBill || !name.trim() || !amount || !dueDate) return;

    const updatedBills = bills.map(b =>
      b.id === editingBill
        ? { ...b, name, amount: parseFloat(amount), dueDate, recurring }
        : b
    );

    setBills(updatedBills);
    setEditingBill(null);
    setShowAddBill(false);
    resetForm();
    toast.success('Bill updated successfully!');
  };

  const handleToggleStatus = (billId: string) => {
    const updatedBills = bills.map(b =>
      b.id === billId
        ? { ...b, status: b.status === 'pending' ? 'paid' as const : 'pending' as const }
        : b
    );
    setBills(updatedBills);
    const bill = bills.find(b => b.id === billId);
    toast.success(bill?.status === 'pending' ? 'Bill marked as paid!' : 'Bill marked as pending');
  };

  const handleDeleteBill = (billId: string) => {
    const updatedBills = bills.filter(b => b.id !== billId);
    setBills(updatedBills);
    toast.success('Bill deleted!');
  };

  const startEdit = (bill: any) => {
    setEditingBill(bill.id);
    setName(bill.name);
    setAmount(bill.amount.toString());
    setDueDate(bill.dueDate);
    setRecurring(bill.recurring);
    setShowAddBill(true);
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setDueDate('');
    setRecurring(false);
  };

  if (!currentRoom) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Selected</h2>
        <p className="text-gray-600">Please create or join a room first</p>
      </div>
    );
  }

  const roomBills = bills.filter(b => b.roomId === currentRoom.id);
  const pendingBills = roomBills.filter(b => b.status === 'pending');
  const paidBills = roomBills.filter(b => b.status === 'paid');
  const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0);

  // Check for due bills (within 3 days)
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const dueSoonBills = pendingBills.filter(b => {
    const dueDate = new Date(b.dueDate);
    return dueDate <= threeDaysFromNow && dueDate >= today;
  });

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill Management</h1>
          <p className="text-gray-600 mt-1">Track recurring and one-time bills</p>
        </div>
        <button
          onClick={() => {
            setShowAddBill(true);
            setEditingBill(null);
            resetForm();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Bill</span>
        </button>
      </div>

      {/* Alert for due bills */}
      {dueSoonBills.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800 font-medium">
              {dueSoonBills.length} bill{dueSoonBills.length > 1 ? 's' : ''} due within 3 days!
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-red-600">₹{totalPending.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Pending Bills</p>
            <p className="text-2xl font-bold text-gray-900">{pendingBills.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Paid This Month</p>
            <p className="text-2xl font-bold text-green-600">{paidBills.length}</p>
          </div>
        </div>
      </div>

      {/* Pending Bills */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Bills ({pendingBills.length})</h2>
        {pendingBills.length > 0 ? (
          <div className="space-y-3">
            {pendingBills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(bill => {
              const dueDate = new Date(bill.dueDate);
              const today = new Date();
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntilDue < 0;
              const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

              return (
                <div key={bill.id} className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                  isOverdue ? 'border-red-500' : isDueSoon ? 'border-yellow-500' : 'border-gray-300'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{bill.name}</h3>
                        <span className="text-xl font-bold text-gray-900">₹{bill.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className={`flex items-center gap-1 ${
                          isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-yellow-600 font-medium' : 'text-gray-600'
                        }`}>
                          <Calendar className="h-4 w-4" />
                          Due: {dueDate.toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                          {isDueSoon && ` (${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''})`}
                        </span>
                        {bill.recurring && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleStatus(bill.id)}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                        title="Mark as paid"
                      >
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </button>
                      <button
                        onClick={() => startEdit(bill)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
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
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No pending bills</p>
          </div>
        )}
      </div>

      {/* Paid Bills */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Paid Bills ({paidBills.length})</h2>
        {paidBills.length > 0 ? (
          <div className="space-y-3">
            {paidBills.map(bill => (
              <div key={bill.id} className="bg-white rounded-lg shadow-sm p-4 opacity-60 border-l-4 border-green-500">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{bill.name}</h3>
                      <span className="text-xl font-bold text-gray-900">₹{bill.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Paid
                      </span>
                      {bill.recurring && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Recurring
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleStatus(bill.id)}
                      className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                      title="Mark as pending"
                    >
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No paid bills</p>
          </div>
        )}
      </div>

      {/* Add/Edit Bill Modal */}
      {showAddBill && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingBill ? 'Edit Bill' : 'Add New Bill'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Rent, Electricity, WiFi, etc."
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Recurring Bill</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingBill ? handleUpdateBill : handleAddBill}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingBill ? 'Update' : 'Add'} Bill
                </button>
                <button
                  onClick={() => {
                    setShowAddBill(false);
                    setEditingBill(null);
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
