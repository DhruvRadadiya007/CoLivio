import { useApp } from '../../context/AppContext';
import { UtensilsCrossed, CheckSquare, AlertCircle, DollarSign, Users } from 'lucide-react';
import { useNavigate } from 'react-router';

export const Dashboard = () => {
  const { currentRoom, meals, tasks, bills, expenses, personnel, attendance } = useApp();
  const navigate = useNavigate();

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
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">{currentRoom.members.length}</p>
            </div>
            <Users className="h-10 w-10 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{todayTasks.length}</p>
            </div>
            <CheckSquare className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-gray-900">{pendingBills.length}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Month Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalExpenses}</p>
            </div>
            <DollarSign className="h-10 w-10 text-yellow-500" />
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
              const assignedMember = currentRoom.members.find(m => m.userId === task.assignedTo);
              return (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{task.name}</p>
                    <p className="text-sm text-gray-600">Assigned to: {assignedMember?.name || 'Unknown'}</p>
                  </div>
                  <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                    Pending
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No tasks for today</p>
        )}
      </div>

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
                <p className="font-bold text-gray-900">₹{bill.amount}</p>
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
          {todayAttendance.length > 0 ? (
            <div className="space-y-3">
              {todayAttendance.map((att) => {
                const person = personnel.find(p => p.id === att.personnelId);
                return (
                  <div key={att.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{person?.name}</p>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      att.status === 'present' ? 'bg-green-100 text-green-800' :
                      att.status === 'absent' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {att.status.charAt(0).toUpperCase() + att.status.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No attendance marked today</p>
          )}
        </div>
      )}
    </div>
  );
};
