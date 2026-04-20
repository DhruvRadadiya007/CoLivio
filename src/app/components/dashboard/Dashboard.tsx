import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UtensilsCrossed, CheckSquare, AlertCircle, DollarSign, Euro, PoundSterling, IndianRupee, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { attendanceAPI } from '../../services/api';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { currentRoom, meals, tasks, bills, expenses, personnel, attendance, currency, refreshData } = useApp();
  const navigate = useNavigate();
  
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [loading, setLoading] = useState(false);

  const CurrencyIcon = currency === 'EUR' ? Euro : currency === 'GBP' ? PoundSterling : currency === 'INR' ? IndianRupee : DollarSign;
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  const handleMarkAttendance = async (personnelId: string, status: 'present' | 'absent' | 'leave', reason?: string) => {
    if (!currentRoom) return;

    if (status === 'leave' && reason === undefined && !showLeavePopup) {
      setSelectedPersonnelId(personnelId);
      setShowLeavePopup(true);
      return;
    }

    setLoading(true);
    try {
      await attendanceAPI.saveAttendance({
        personnelId,
        date: new Date().toISOString().split('T')[0],
        status,
        leaveReason: reason || undefined,
        roomId: currentRoom.id,
      });

      await refreshData();
      toast.success('Attendance marked successfully!');
      if (showLeavePopup) {
        setShowLeavePopup(false);
        setLeaveReason('');
        setSelectedPersonnelId(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  if (!currentRoom) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Yet</h2>
        <p className="text-gray-600 mb-6">Create or join a room to get started</p>
        <button
          onClick={() => navigate('/app/room')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Go to Room Management
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  const todayMeal = meals.find(m => m.roomId === currentRoom.id && m.day === dayName);
  const todayTasks = tasks.filter(t => 
    t.roomId === currentRoom.id && 
    t.deadline === today && 
    t.status === 'pending'
  );
  
  const upcomingTasks = tasks.filter(t => 
    t.roomId === currentRoom.id && 
    t.deadline > today && 
    t.status === 'pending'
  );
  const pendingBills = bills.filter(b => 
    b.roomId === currentRoom.id && 
    b.status === 'pending'
  );
  const thisMonthExpenses = expenses.filter(e => {
    const expenseMonth = new Date(e.date).getMonth();
    const currentMonth = new Date().getMonth();
    return e.roomId === currentRoom.id && expenseMonth === currentMonth;
  });
  const totalExpenses = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayAttendance = attendance.filter(a => 
    a.roomId === currentRoom.id && 
    a.date === today
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/app/room')}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500 cursor-pointer hover:bg-indigo-50 transition-all hover:-translate-y-1 hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">{currentRoom.members.length}</p>
            </div>
            <Users className="h-10 w-10 text-indigo-500" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/app/tasks')}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 cursor-pointer hover:bg-green-50 transition-all hover:-translate-y-1 hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{todayTasks.length}</p>
            </div>
            <CheckSquare className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/app/bills')}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500 cursor-pointer hover:bg-red-50 transition-all hover:-translate-y-1 hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-gray-900">{pendingBills.length}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/app/expenses')}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500 cursor-pointer hover:bg-yellow-50 transition-all hover:-translate-y-1 hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Month Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{currencySymbol}{totalExpenses}</p>
            </div>
            <CurrencyIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Today's Meal */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Today's Meals</h2>
        </div>
        {todayMeal ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-900 mb-1">Breakfast</p>
              <p className="text-gray-700">{todayMeal.breakfast || 'Not set'}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Lunch</p>
              <p className="text-gray-700">{todayMeal.lunch || 'Not set'}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-900 mb-1">Dinner</p>
              <p className="text-gray-700">{todayMeal.dinner || 'Not set'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No meal plan set for today</p>
        )}
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Today's Tasks</h2>
        </div>
        {todayTasks.length > 0 ? (
          <div className="space-y-3">
            {todayTasks.map((task) => {
              return (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{task.name}</p>
                    <div className="flex gap-1 flex-wrap items-center mt-2">
                      {task.assignedTo ? task.assignedTo.split(', ').map((name: string) => (
                        <span key={name} className="font-semibold text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">{name}</span>
                      )) : <span className="text-gray-400 text-sm">Unassigned</span>}
                    </div>
                  </div>
                  <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-medium shadow-sm">
                    Pending
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 bg-gray-50 p-4 rounded-lg text-center">No tasks for today</p>
        )}
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="h-6 w-6 text-indigo-400" />
          <h2 className="text-xl font-bold text-gray-900">Upcoming Tasks</h2>
        </div>
        <div className="space-y-3">
          {upcomingTasks.map((task) => {
            return (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{task.name}</p>
                  <p className="text-xs text-indigo-600 mt-1 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded">Due: {task.deadline}</p>
                  <div className="flex gap-1 flex-wrap items-center mt-2">
                    {task.assignedTo ? task.assignedTo.split(', ').map((name: string) => (
                      <span key={name} className="font-semibold text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">{name}</span>
                    )) : <span className="text-gray-400 text-sm">Unassigned</span>}
                  </div>
                </div>
                <span className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-full font-medium shadow-sm">
                  Upcoming
                </span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Pending Bills */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Pending Bills</h2>
        </div>
        {pendingBills.length > 0 ? (
          <div className="space-y-3">
            {pendingBills.slice(0, 5).map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{bill.name}</p>
                  <p className="text-sm text-gray-600">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                </div>
                <p className="font-bold text-gray-900">{currencySymbol}{bill.amount}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending bills</p>
        )}
      </div>

      {/* Attendance Summary */}
      {personnel.filter(p => p.roomId === currentRoom.id).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Attendance</h2>
          {personnel.filter(p => p.roomId === currentRoom.id).length > 0 ? (
            <div className="space-y-3">
              {personnel.filter(p => p.roomId === currentRoom.id).map((person) => {
                const att = todayAttendance.find(a => a.personnelId === person.id);
                return (
                  <div key={person.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{person.name}</p>
                    {att ? (
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        att.status === 'present' ? 'bg-green-100 text-green-800' :
                        att.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {att.status.charAt(0).toUpperCase() + att.status.slice(1)}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleMarkAttendance(person.id, 'present')} disabled={loading} className="px-3 py-1 text-sm bg-green-100 text-green-800 hover:bg-green-200 rounded-lg font-medium hidden sm:block">Present</button>
                        <button onClick={() => handleMarkAttendance(person.id, 'present')} disabled={loading} className="px-2 py-1 sm:hidden text-green-600 bg-green-100 rounded hover:bg-green-200 cursor-pointer font-bold" title="Present">✓</button>
                        
                        <button onClick={() => handleMarkAttendance(person.id, 'absent')} disabled={loading} className="px-3 py-1 text-sm bg-red-100 text-red-800 hover:bg-red-200 rounded-lg font-medium hidden sm:block">Absent</button>
                        <button onClick={() => handleMarkAttendance(person.id, 'absent')} disabled={loading} className="px-2 py-1 sm:hidden text-red-600 bg-red-100 rounded hover:bg-red-200 cursor-pointer font-bold" title="Absent">✗</button>
                        
                        <button onClick={() => handleMarkAttendance(person.id, 'leave')} disabled={loading} className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-lg font-medium hidden sm:block">Leave</button>
                        <button onClick={() => handleMarkAttendance(person.id, 'leave')} disabled={loading} className="px-2 py-1 sm:hidden text-yellow-600 bg-yellow-100 rounded hover:bg-yellow-200 cursor-pointer font-bold" title="Leave">L</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No personnel in room</p>
          )}
        </div>
      )}

      {/* Leave Reason Modal */}
      {showLeavePopup && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Leave Reason</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Medical, Personal, etc."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleMarkAttendance(selectedPersonnelId!, 'leave', leaveReason)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Submit'}
                </button>
                <button
                  onClick={() => {
                    setShowLeavePopup(false);
                    setLeaveReason('');
                    setSelectedPersonnelId(null);
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
