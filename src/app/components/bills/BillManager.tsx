import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Receipt, Plus, Edit2, Trash2, Calendar, AlertCircle, CheckCircle, History, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { billAPI, createRecurringBillCatchup } from '../../services/api';

export const BillManager = () => {
  const { currentRoom, bills, refreshData, currency } = useApp();
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  const [showAddBill, setShowAddBill] = useState(false);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;

  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}` === currentMonthKey;
  };

  const handleAddBill = async () => {
    if (!currentRoom || !name.trim() || !amount || !dueDate) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await billAPI.createBill({
        name,
        amount: parseFloat(amount),
        dueDate,
        recurring,
        status: 'pending',
        roomId: currentRoom.id,
      });

      // If recurring and the due-date is in a past month, auto-fill missing months
      if (recurring) {
        const billDate = new Date(dueDate);
        const isPastMonth =
          billDate.getFullYear() < today.getFullYear() ||
          (billDate.getFullYear() === today.getFullYear() && billDate.getMonth() < today.getMonth());

        if (isPastMonth) {
          await createRecurringBillCatchup(currentRoom.id, {
            name,
            amount: parseFloat(amount),
            dueDateStr: dueDate,
          });
          toast.info('Missing monthly bills auto-generated for catch-up.');
        }
      }

      await refreshData();
      setShowAddBill(false);
      resetForm();
      toast.success('Bill added successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add bill');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBill = async () => {
    if (!currentRoom || !editingBill || !name.trim() || !amount || !dueDate) return;

    setLoading(true);
    try {
      await billAPI.updateBill(currentRoom.id, editingBill, {
        name,
        amount: parseFloat(amount),
        dueDate,
        recurring,
      });

      await refreshData();
      setEditingBill(null);
      setShowAddBill(false);
      resetForm();
      toast.success('Bill updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update bill');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (billId: string) => {
    if (!currentRoom) return;
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    setLoading(true);
    try {
      const newStatus = bill.status === 'pending' ? 'paid' : 'pending';
      await billAPI.updateBill(currentRoom.id, billId, { status: newStatus });
      await refreshData();
      toast.success(`Bill marked as ${newStatus}!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update bill status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!currentRoom) return;
    setLoading(true);
    try {
      await billAPI.deleteBill(currentRoom.id, billId);
      await refreshData();
      toast.success('Bill deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete bill');
    } finally {
      setLoading(false);
    }
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

  const toggleHistory = (billName: string) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(billName)) next.delete(billName);
      else next.add(billName);
      return next;
    });
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

  // Group recurring bills by name
  const recurringNames = Array.from(
    new Set(roomBills.filter(b => b.recurring).map(b => b.name))
  );

  // One-time (non-recurring) bills
  const oneTimeBills = roomBills.filter(b => !b.recurring);

  // Find current-month bill for a recurring group
  const getCurrentBill = (name: string) =>
    roomBills
      .filter(b => b.recurring && b.name === name)
      .find(b => isCurrentMonth(b.dueDate)) || null;

  const getPastBills = (name: string) =>
    roomBills
      .filter(b => b.recurring && b.name === name && !isCurrentMonth(b.dueDate))
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const pendingOneTime = oneTimeBills.filter(b => b.status === 'pending');
  const paidOneTime = oneTimeBills.filter(b => b.status === 'paid');

  const allPendingCount =
    pendingOneTime.length +
    recurringNames.filter(name => {
      const cur = getCurrentBill(name);
      return !cur || cur.status === 'pending';
    }).length;

  const totalPending =
    pendingOneTime.reduce((s, b) => s + b.amount, 0) +
    recurringNames.reduce((s, name) => {
      const cur = getCurrentBill(name);
      return s + (cur && cur.status === 'pending' ? cur.amount : 0);
    }, 0);

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const dueSoonBills = roomBills.filter(b => {
    if (b.status !== 'pending') return false;
    const d = new Date(b.dueDate);
    return d <= threeDaysFromNow && d >= today;
  });

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill Management</h1>
          <p className="text-gray-600 mt-1">Track recurring and one-time bills</p>
        </div>
        <button
          onClick={() => { setShowAddBill(true); setEditingBill(null); resetForm(); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Bill</span>
        </button>
      </div>

      {/* Due-soon alert */}
      {dueSoonBills.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 font-medium">
            {dueSoonBills.length} bill{dueSoonBills.length > 1 ? 's' : ''} due within 3 days!
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Pending</p>
          <p className="text-2xl font-bold text-red-600">{currencySymbol}{totalPending.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Pending Bills</p>
          <p className="text-2xl font-bold text-gray-900">{allPendingCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Bills Tracked</p>
          <p className="text-2xl font-bold text-green-600">{roomBills.length}</p>
        </div>
      </div>

      {/* ── RECURRING BILLS ── */}
      {recurringNames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-indigo-500" />
            Recurring Bills
          </h2>
          <div className="space-y-4">
            {recurringNames.map(billName => {
              const currentBill = getCurrentBill(billName);
              const pastBills = getPastBills(billName);
              const showHistory = expandedHistory.has(billName);
              const isPendingNow = !currentBill || currentBill.status === 'pending';

              return (
                <div
                  key={billName}
                  className={`bg-white rounded-lg shadow-sm border-l-4 ${
                    isPendingNow ? 'border-yellow-400' : 'border-green-400'
                  }`}
                >
                  {/* Current cycle */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{billName}</h3>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">Recurring</span>
                          {currentBill && (
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              isPendingNow ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {isPendingNow ? 'Pending' : 'Paid'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {currentBill ? (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Due {new Date(currentBill.dueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded border border-indigo-100 font-medium">
                                ★ Current Month
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400 italic text-xs">No entry for current month yet</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {currencySymbol}{(currentBill?.amount || 0).toFixed(2)}
                        </span>
                        <div className="flex gap-1">
                          {currentBill && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(currentBill.id)}
                                disabled={loading}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  isPendingNow ? 'hover:bg-green-100' : 'hover:bg-yellow-100'
                                }`}
                                title={isPendingNow ? 'Mark as paid' : 'Mark as pending'}
                              >
                                {isPendingNow
                                  ? <CheckCircle className="h-5 w-5 text-green-600" />
                                  : <AlertCircle className="h-5 w-5 text-yellow-600" />
                                }
                              </button>
                              <button
                                onClick={() => startEdit(currentBill)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteBill(currentBill.id)}
                                disabled={loading}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Past history toggle */}
                    {pastBills.length > 0 && (
                      <button
                        onClick={() => toggleHistory(billName)}
                        className="mt-3 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <History className="h-3.5 w-3.5" />
                        {showHistory ? 'Hide' : 'Show'} history ({pastBills.length} months)
                      </button>
                    )}
                  </div>

                  {/* History rows */}
                  {showHistory && pastBills.length > 0 && (
                    <div className="border-t border-gray-100 px-5 py-3 space-y-2 bg-gray-50 rounded-b-lg">
                      {pastBills.map(b => (
                        <div key={b.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(b.dueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-800">{currencySymbol}{b.amount.toFixed(2)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              b.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {b.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                            <button
                              onClick={() => handleToggleStatus(b.id)}
                              disabled={loading}
                              className={`p-1 rounded transition-colors disabled:opacity-50 ${
                                b.status === 'pending' ? 'hover:bg-green-100' : 'hover:bg-yellow-100'
                              }`}
                              title={b.status === 'pending' ? 'Mark paid' : 'Mark pending'}
                            >
                              {b.status === 'pending'
                                ? <CheckCircle className="h-4 w-4 text-green-600" />
                                : <AlertCircle className="h-4 w-4 text-yellow-600" />
                              }
                            </button>
                            <button
                              onClick={() => handleDeleteBill(b.id)}
                              disabled={loading}
                              className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
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
        </div>
      )}

      {/* ── ONE-TIME BILLS ── */}
      {(pendingOneTime.length > 0 || paidOneTime.length > 0) && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">One-time Bills</h2>

          {pendingOneTime.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pending ({pendingOneTime.length})</h3>
              {pendingOneTime
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map(bill => {
                  const dueD = new Date(bill.dueDate + 'T00:00:00');
                  const daysUntilDue = Math.ceil((dueD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntilDue < 0;
                  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
                  return (
                    <div key={bill.id} className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                      isOverdue ? 'border-red-500' : isDueSoon ? 'border-yellow-500' : 'border-gray-300'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900">{bill.name}</h3>
                            <span className="text-xl font-bold text-gray-900">{currencySymbol}{bill.amount.toFixed(2)}</span>
                          </div>
                          <span className={`text-sm flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-yellow-600' : 'text-gray-500'
                          }`}>
                            <Calendar className="h-3.5 w-3.5" />
                            Due: {dueD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {isOverdue && ' (Overdue)'}
                            {isDueSoon && !isOverdue && ` (${daysUntilDue}d)`}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleToggleStatus(bill.id)} disabled={loading} className="p-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50" title="Mark paid">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </button>
                          <button onClick={() => startEdit(bill)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit2 className="h-4 w-4 text-gray-600" />
                          </button>
                          <button onClick={() => handleDeleteBill(bill.id)} disabled={loading} className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {paidOneTime.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Paid ({paidOneTime.length})</h3>
              {paidOneTime.map(bill => (
                <div key={bill.id} className="bg-white rounded-lg shadow-sm p-4 opacity-70 border-l-4 border-green-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{bill.name}</h3>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Paid
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{currencySymbol}{bill.amount.toFixed(2)}</span>
                      <button onClick={() => handleToggleStatus(bill.id)} disabled={loading} className="p-2 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50" title="Mark as pending">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </button>
                      <button onClick={() => handleDeleteBill(bill.id)} disabled={loading} className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {roomBills.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No bills added yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first bill using the button above</p>
        </div>
      )}

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ({currencySymbol})</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date {recurring && <span className="text-xs text-indigo-600 ml-1">(This month's due day)</span>}
                </label>
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
                  <span className="text-sm font-medium text-gray-700">Recurring Bill (Monthly)</span>
                </label>
                {recurring && dueDate && (() => {
                  const d = new Date(dueDate);
                  const isPast = d.getFullYear() < today.getFullYear() ||
                    (d.getFullYear() === today.getFullYear() && d.getMonth() < today.getMonth());
                  const monthsDiff = isPast
                    ? (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth())
                    : 0;
                  return isPast && monthsDiff > 0 ? (
                    <p className="text-xs text-indigo-600 mt-1 bg-indigo-50 px-3 py-1.5 rounded-lg">
                      ℹ️ {monthsDiff} missing month{monthsDiff > 1 ? 's' : ''} will be auto-generated as pending.
                    </p>
                  ) : null;
                })()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingBill ? handleUpdateBill : handleAddBill}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingBill ? 'Update Bill' : 'Add Bill')}
                </button>
                <button
                  onClick={() => { setShowAddBill(false); setEditingBill(null); resetForm(); }}
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
