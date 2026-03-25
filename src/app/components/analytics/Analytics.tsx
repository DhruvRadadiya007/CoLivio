import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Analytics = () => {
  const { currentRoom, tasks, expenses, personnel, payments, bills } = useApp();

  if (!currentRoom) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Selected</h2>
        <p className="text-gray-600">Please create or join a room first</p>
      </div>
    );
  }

  // Task completion by member
  const tasksByMember = currentRoom.members.map(member => {
    const memberTasks = tasks.filter(t => t.roomId === currentRoom.id && t.assignedTo === member.userId);
    const completed = memberTasks.filter(t => t.status === 'completed').length;
    const pending = memberTasks.filter(t => t.status === 'pending').length;
    
    return {
      name: member.name,
      completed,
      pending,
      total: completed + pending,
    };
  });

  // Expenses by member
  const expensesByMember = currentRoom.members.map(member => {
    const paid = expenses
      .filter(e => e.roomId === currentRoom.id && e.paidBy === member.userId)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const owes = expenses
      .filter(e => e.roomId === currentRoom.id && e.splitAmong.includes(member.userId))
      .reduce((sum, e) => sum + (e.amount / e.splitAmong.length), 0);

    return {
      name: member.name,
      paid: Math.round(paid),
      owes: Math.round(owes),
      balance: Math.round(paid - owes),
    };
  });

  // Monthly expense trend (last 6 months)
  const monthlyExpenses = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const monthKey = date.toISOString().slice(0, 7);
    
    const total = expenses
      .filter(e => e.roomId === currentRoom.id && e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + e.amount, 0);

    monthlyExpenses.push({
      month,
      amount: Math.round(total),
    });
  }

  // Contribution fairness
  const totalPaid = expensesByMember.reduce((sum, m) => sum + m.paid, 0);
  const fairShareData = expensesByMember.map(member => ({
    name: member.name,
    contribution: totalPaid > 0 ? Math.round((member.paid / totalPaid) * 100) : 0,
  }));

  // Personnel expenses
  const getCurrentCycleStart = (joinDateStr: string | undefined) => {
    if (!joinDateStr) return new Date().toISOString().slice(0, 7);
    const today = new Date();
    const joinDay = parseInt(joinDateStr.split('-')[2], 10) || 1;
    let cycleMonth = today.getMonth();
    let cycleYear = today.getFullYear();
    if (today.getDate() < joinDay) {
      cycleMonth -= 1;
      if (cycleMonth < 0) { cycleMonth = 11; cycleYear -= 1; }
    }
    return `${cycleYear}-${String(cycleMonth + 1).padStart(2, '0')}-${String(joinDay).padStart(2, '0')}`;
  };

  const roomPersonnel = personnel.filter(p => p.roomId === currentRoom.id);
  const totalPersonnelCost = roomPersonnel.reduce((sum, p) => sum + p.monthlyCompensation, 0);
  const paidPersonnelCost = roomPersonnel
    .filter(p => {
      const cycleStart = getCurrentCycleStart(p.joiningDate);
      const payment = payments.find(
        pay => pay.personnelId === p.id && pay.month === cycleStart && pay.status === 'paid'
      );
      return payment;
    })
    .reduce((sum, p) => sum + p.monthlyCompensation, 0);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="pb-20 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Insights and fairness tracking</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-700">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₹{(
              expenses.filter(e => e.roomId === currentRoom.id).reduce((sum, e) => sum + e.amount, 0) +
              bills.filter(b => b.roomId === currentRoom.id && b.status === 'paid').reduce((sum, b) => sum + b.amount, 0) +
              payments.filter(p => p.roomId === currentRoom.id && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
            ).toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mt-1">All time (+Bills/Staff)</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-700">Tasks Completed</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {tasks.filter(t => t.roomId === currentRoom.id && t.status === 'completed').length}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            of {tasks.filter(t => t.roomId === currentRoom.id).length} total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-700">Personnel Cost</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{totalPersonnelCost}</p>
          <p className="text-sm text-gray-600 mt-1">Paid: ₹{paidPersonnelCost}</p>
        </div>
      </div>

      {/* Tasks Completion by Member */}
      {tasksByMember.some(m => m.total > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Task Completion by Member</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tasksByMember}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expenses by Member */}
      {expensesByMember.some(m => m.paid > 0 || m.owes > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Expense Contributions</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expensesByMember}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="paid" fill="#6366f1" name="Paid (₹)" />
              <Bar dataKey="owes" fill="#ec4899" name="Owes (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Expense Trend */}
      {monthlyExpenses.some(m => m.amount > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Expense Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8b5cf6" name="Amount (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Contribution Fairness */}
      {fairShareData.some(m => m.contribution > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contribution Fairness</h2>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fairShareData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, contribution }) => `${name}: ${contribution}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="contribution"
                  >
                    {fairShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-1/2 space-y-3">
              <p className="text-gray-600 mb-4">
                This chart shows each member's contribution to total expenses. A fair split would show equal percentages.
              </p>
              {expensesByMember.map((member, index) => (
                <div key={member.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{member.paid}</p>
                    <p className={`text-sm ${member.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {member.balance >= 0 ? '+' : ''}₹{member.balance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Imbalance Warning */}
      {expensesByMember.some(m => Math.abs(m.balance) > 1000) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-900">Expense Imbalance Detected</h3>
              <p className="text-yellow-800 mt-1">
                Some members have significantly higher or lower expense contributions. Consider settling balances for fairness.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!tasksByMember.some(m => m.total > 0) && 
       !expensesByMember.some(m => m.paid > 0) && 
       roomPersonnel.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-600">
            Start adding tasks, expenses, and personnel to see analytics
          </p>
        </div>
      )}
    </div>
  );
};
