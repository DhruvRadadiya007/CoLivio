import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Briefcase, Plus, Edit2, Trash2, Calendar, DollarSign, Euro, PoundSterling, IndianRupee, Users } from 'lucide-react';
import { toast } from 'sonner';
import { personnelAPI, attendanceAPI, paymentAPI } from '../../services/api';

export const PersonnelManager = () => {
  const { currentRoom, personnel, attendance, payments, refreshData, currency } = useApp();
  
  const CurrencyIcon = currency === 'EUR' ? Euro : currency === 'GBP' ? PoundSterling : currency === 'INR' ? IndianRupee : DollarSign;
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  const [view, setView] = useState<'list' | 'attendance' | 'payment'>('list');
  const [showAddPersonnel, setShowAddPersonnel] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [monthlyCompensation, setMonthlyCompensation] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [leaveReason, setLeaveReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);

  useEffect(() => {
    if (showAttendance && selectedPersonnel && currentRoom) {
      const existing = attendance.find(
        a => a.personnelId === selectedPersonnel && a.date === attendanceDate && a.roomId === currentRoom.id
      );
      if (existing) {
        setAttendanceStatus(existing.status as any);
        setLeaveReason(existing.leaveReason || '');
      } else {
        setAttendanceStatus('present');
        setLeaveReason('');
      }
    }
  }, [selectedPersonnel, attendanceDate, showAttendance, attendance, currentRoom]);

  const handleAddPersonnel = async () => {
    if (!currentRoom || !name.trim() || !role.trim() || !monthlyCompensation) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await personnelAPI.createPersonnel({
        name,
        role,
        monthlyCompensation: parseFloat(monthlyCompensation),
        joiningDate,
        roomId: currentRoom.id,
      });

      await refreshData();
      setShowAddPersonnel(false);
      resetForm();
      toast.success('Personnel added successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePersonnel = async () => {
    if (!currentRoom || !editingPersonnel || !name.trim() || !role.trim() || !monthlyCompensation) return;

    setLoading(true);
    try {
      await personnelAPI.updatePersonnel(currentRoom.id, editingPersonnel, {
        name,
        role,
        monthlyCompensation: parseFloat(monthlyCompensation),
        joiningDate
      });

      await refreshData();
      setEditingPersonnel(null);
      setShowAddPersonnel(false);
      resetForm();
      toast.success('Personnel updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePersonnel = async (personnelId: string) => {
    if (!currentRoom) return;
    setLoading(true);
    try {
      await personnelAPI.deletePersonnel(currentRoom.id, personnelId);
      await refreshData();
      toast.success('Personnel removed!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!currentRoom || !selectedPersonnel) {
      toast.error('Please select personnel');
      return;
    }

    const existingAttendance = attendance.find(
      a => a.personnelId === selectedPersonnel && a.date === attendanceDate && a.roomId === currentRoom.id
    );

    setLoading(true);
    try {
      await attendanceAPI.saveAttendance({
        id: existingAttendance?.id,
        personnelId: selectedPersonnel,
        date: attendanceDate,
        status: attendanceStatus,
        leaveReason: attendanceStatus === 'leave' ? leaveReason : undefined,
        roomId: currentRoom.id,
      });

      await refreshData();
      setShowAttendance(false);
      setEditingAttendanceId(null);
      resetAttendanceForm();
      toast.success(editingAttendanceId ? 'Attendance updated!' : 'Attendance marked successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    setLoading(true);
    try {
      await attendanceAPI.deleteAttendance(id);
      await refreshData();
      toast.success('Attendance record deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete attendance');
    } finally {
      setLoading(false);
    }
  };

  const startEditAttendance = (att: any) => {
    setEditingAttendanceId(att.id);
    setSelectedPersonnel(att.personnelId);
    setAttendanceDate(att.date);
    setAttendanceStatus(att.status);
    setLeaveReason(att.leaveReason || '');
    setShowAttendance(true);
  };

  const handleMarkPayment = async (personnelId: string, cycleStart: string) => {
    if (!currentRoom) return;

    const person = personnel.find(p => p.id === personnelId);
    if (!person) return;

    const existingPayment = payments.find(
      p => p.personnelId === personnelId && p.month === cycleStart && p.roomId === currentRoom.id
    );

    setLoading(true);
    try {
      if (existingPayment) {
        await paymentAPI.deletePayment(existingPayment.id);
        await refreshData();
        toast.success('Payment unmarked — moved back to pending!');
      } else {
        await paymentAPI.savePayment({
          personnelId,
          month: cycleStart,
          amount: person.monthlyCompensation,
          roomId: currentRoom.id,
        });
        await refreshData();
        toast.success('Payment marked as paid!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (person: any) => {
    setEditingPersonnel(person.id);
    setName(person.name);
    setRole(person.role);
    setMonthlyCompensation(person.monthlyCompensation.toString());
    setJoiningDate(person.joiningDate || new Date().toISOString().split('T')[0]);
    setShowAddPersonnel(true);
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setMonthlyCompensation('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
  };

  const resetAttendanceForm = () => {
    setSelectedPersonnel(null);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setAttendanceStatus('present');
    setLeaveReason('');
    setEditingAttendanceId(null);
  };

  if (!currentRoom) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Selected</h2>
        <p className="text-gray-600">Please create or join a room first</p>
      </div>
    );
  }

  const getCurrentCycleStart = (joinDateStr: string | undefined) => {
    if (!joinDateStr) return new Date().toISOString().slice(0, 7);
    const today = new Date();
    const joinDateParts = joinDateStr.split('-');
    const joinDay = parseInt(joinDateParts[2], 10) || 1;
    let cycleMonth = today.getMonth();
    let cycleYear = today.getFullYear();
    if (today.getDate() < joinDay) {
      cycleMonth -= 1;
      if (cycleMonth < 0) { cycleMonth = 11; cycleYear -= 1; }
    }
    return `${cycleYear}-${String(cycleMonth + 1).padStart(2, '0')}-${String(joinDay).padStart(2, '0')}`;
  };

  // Generate ALL monthly cycles from joining date to today (newest first)
  const getAllCycles = (joinDateStr: string | undefined): string[] => {
    if (!joinDateStr) return [];
    const joinDate = new Date(joinDateStr + 'T00:00:00');
    if (isNaN(joinDate.getTime())) return [];
    const joinDay = joinDate.getDate();
    const today = new Date();
    const currentCycle = getCurrentCycleStart(joinDateStr);

    const cycles: string[] = [];
    let yr = joinDate.getFullYear();
    let mo = joinDate.getMonth();

    while (true) {
      const lastDay = new Date(yr, mo + 1, 0).getDate();
      const day = Math.min(joinDay, lastDay);
      const cycleKey = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cycles.push(cycleKey);

      // Stop after we've added the current cycle
      if (cycleKey === currentCycle) break;

      mo++;
      if (mo > 11) { mo = 0; yr++; }

      // Safety: don't go past today
      if (yr > today.getFullYear() + 1) break;
    }

    return cycles.reverse(); // newest first
  };

  const roomPersonnel = personnel.filter(p => p.roomId === currentRoom.id);

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Personnel</h1>
          <p className="text-gray-600 mt-1">Manage service staff and attendance</p>
        </div>
        <div className="flex gap-2">
          {view === 'list' && (
            <button
              onClick={() => {
                setShowAddPersonnel(true);
                setEditingPersonnel(null);
                resetForm();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add Personnel</span>
            </button>
          )}
          {view === 'attendance' && (
            <button
              onClick={() => setShowAttendance(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Mark Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            view === 'list'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="h-5 w-5 inline mr-2" />
          Personnel List
        </button>
        <button
          onClick={() => setView('attendance')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            view === 'attendance'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="h-5 w-5 inline mr-2" />
          Attendance
        </button>
        <button
          onClick={() => setView('payment')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            view === 'payment'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CurrencyIcon className="h-5 w-5 inline mr-2" />
          Payments
        </button>
      </div>

      {/* Personnel List View */}
      {view === 'list' && (
        <div className="space-y-4">
          {roomPersonnel.length > 0 ? (
            roomPersonnel.map(person => {
              const currentMonthStr = new Date().toISOString().slice(0, 7);
              const cycleStart = getCurrentCycleStart(person.joiningDate);
              const monthAttendance = attendance.filter(
                a => a.personnelId === person.id && a.date.startsWith(currentMonthStr)
              );
              const presentDays = monthAttendance.filter(a => a.status === 'present').length;
              const monthPayment = payments.find(
                p => p.personnelId === person.id && p.month === cycleStart
              );

              return (
                <div key={person.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{person.name}</h3>
                      <p className="text-gray-600 mt-1">{person.role}</p>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Salary</p>
                          <p className="text-lg font-bold text-gray-900">{currencySymbol}{person.monthlyCompensation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Present Days (This Month)</p>
                          <p className="text-lg font-bold text-gray-900">{presentDays}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Payment Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            monthPayment?.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {monthPayment?.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(person)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeletePersonnel(person.id)}
                        disabled={loading}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No service personnel added yet</p>
            </div>
          )}
        </div>
      )}

      {/* Attendance View */}
      {view === 'attendance' && (
        <div className="space-y-4">
          {roomPersonnel.map(person => {
            const personAttendance = attendance
              .filter(a => a.personnelId === person.id && a.roomId === currentRoom.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <div key={person.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{person.name} <span className="text-gray-500 font-normal text-sm">— {person.role}</span></h3>
                  <span className="text-sm text-gray-500">{personAttendance.length} records</span>
                </div>
                {personAttendance.length > 0 ? (
                  <div className="space-y-2">
                    {personAttendance.map(att => (
                      <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 text-sm font-medium">{new Date(att.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {(att.status === 'leave' || att.status === 'absent') && att.leaveReason && (
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 hidden sm:block max-w-[160px] truncate">
                              {att.leaveReason}
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium min-w-[72px] text-center ${
                            att.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : att.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {att.status.charAt(0).toUpperCase() + att.status.slice(1)}
                          </span>
                          {/* Edit & Delete — always visible */}
                          <button
                            onClick={() => startEditAttendance(att)}
                            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Edit attendance"
                          >
                            <Edit2 className="h-4 w-4 text-indigo-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttendance(att.id)}
                            disabled={loading}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete attendance"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">No attendance records yet</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment View */}
      {view === 'payment' && (
        <div className="space-y-6">
          {roomPersonnel.map(person => {
            const currentCycle = getCurrentCycleStart(person.joiningDate);
            const allCycles = getAllCycles(person.joiningDate);

            // Compute cycle end date for display
            const cycleLabel = (cycleStart: string) => {
              const d = new Date(cycleStart + 'T00:00:00');
              const end = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate() - 1);
              return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            };

            const pendingCount = allCycles.filter(cs =>
              !payments.some(p => p.personnelId === person.id && p.month === cs && p.roomId === currentRoom.id)
            ).length;

            return (
              <div key={person.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
                      <p className="text-gray-500 text-sm mt-0.5">{person.role}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{currencySymbol}{person.monthlyCompensation}/mo</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        pendingCount === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pendingCount === 0 ? 'All Paid' : `${pendingCount} Pending`}
                      </span>
                      <span className="text-xs text-gray-400">Joined {new Date(person.joiningDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* All cycles list */}
                {allCycles.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {allCycles.map((cycleStart, idx) => {
                      const paymentRecord = payments.find(
                        p => p.personnelId === person.id && p.month === cycleStart && p.roomId === currentRoom.id
                      );
                      const isPaid = !!paymentRecord;
                      const isCurrent = cycleStart === currentCycle;

                      return (
                        <div
                          key={cycleStart}
                          className={`flex items-center justify-between px-6 py-4 ${
                            isCurrent ? 'bg-indigo-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isPaid ? 'bg-green-500' : 'bg-yellow-400'
                            }`} />
                            <div>
                              <span className="text-sm font-medium text-gray-800">
                                {cycleLabel(cycleStart)}
                              </span>
                              {isCurrent && (
                                <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">
                                  ★ Current
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-900">{currencySymbol}{person.monthlyCompensation}</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isPaid ? 'Paid' : 'Pending'}
                            </span>
                            <button
                              onClick={() => handleMarkPayment(person.id, cycleStart)}
                              disabled={loading}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                isPaid
                                  ? 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-800'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {isPaid ? 'Unmark' : 'Mark Paid'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6 text-sm">No payment cycles yet</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Personnel Modal */}
      {showAddPersonnel && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingPersonnel ? 'Edit Personnel' : 'Add Service Personnel'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Cook, Cleaner, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Compensation (₹)</label>
                <input
                  type="number"
                  value={monthlyCompensation}
                  onChange={(e) => setMonthlyCompensation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Payment cycle start applies from this date.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingPersonnel ? handleUpdatePersonnel : handleAddPersonnel}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingPersonnel ? 'Update Personnel' : 'Add Personnel')}
                </button>
                <button
                  onClick={() => {
                    setShowAddPersonnel(false);
                    setEditingPersonnel(null);
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

      {/* Mark / Edit Attendance Modal */}
      {showAttendance && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingAttendanceId ? 'Edit Attendance' : 'Mark Attendance'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Personnel</label>
                <select
                  value={selectedPersonnel || ''}
                  onChange={(e) => setSelectedPersonnel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Choose personnel</option>
                  {roomPersonnel.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name} - {person.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              {attendanceStatus === 'leave' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Reason</label>
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Medical, Personal, etc."
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleMarkAttendance}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Mark Attendance'}
                </button>
                <button
                  onClick={() => {
                    setShowAttendance(false);
                    resetAttendanceForm();
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
