import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { taskAPI } from '../../services/api';
import { CheckSquare, Plus, Edit2, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const TaskManager = () => {
  const { currentRoom, tasks, refreshData } = useApp();
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly'>('none');
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const [loading, setLoading] = useState(false);

  const handleAddTask = async () => {
    if (!currentRoom || !taskName.trim() || assignedTo.length === 0 || !deadline) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await taskAPI.createTask({
        name: taskName,
        assignedTo: assignedTo.join(', '),
        deadline,
        status: 'pending',
        recurring,
        roomId: currentRoom.id,
      });
      
      await refreshData();
      setShowAddTask(false);
      resetForm();
      toast.success('Task added successfully!');
    } catch (error: any) {
      console.error('Add task error:', error);
      toast.error(error.message || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!currentRoom || !editingTask || !taskName.trim() || assignedTo.length === 0 || !deadline) return;

    setLoading(true);
    try {
      await taskAPI.updateTask(currentRoom.id, editingTask, {
        name: taskName,
        assignedTo: assignedTo.join(', '),
        deadline,
        recurring,
      });
      
      await refreshData();
      setEditingTask(null);
      setShowAddTask(false);
      resetForm();
      toast.success('Task updated successfully!');
    } catch (error: any) {
      console.error('Update task error:', error);
      toast.error(error.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (taskId: string) => {
    if (!currentRoom) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await taskAPI.updateTask(currentRoom.id, taskId, { status: newStatus });
      await refreshData();
    } catch (error: any) {
      console.error('Toggle task status error:', error);
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentRoom) return;

    setLoading(true);
    try {
      await taskAPI.deleteTask(currentRoom.id, taskId);
      await refreshData();
      toast.success('Task deleted!');
    } catch (error: any) {
      console.error('Delete task error:', error);
      toast.error(error.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (task: any) => {
    setEditingTask(task.id);
    setTaskName(task.name);
    setAssignedTo(task.assignedTo ? task.assignedTo.split(', ') : []);
    setDeadline(task.deadline);
    setRecurring(task.recurring);
    setShowAddTask(true);
  };

  const resetForm = () => {
    setTaskName('');
    setAssignedTo([]);
    setDeadline('');
    setRecurring('none');
  };

  if (!currentRoom) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Selected</h2>
        <p className="text-gray-600">Please create or join a room first</p>
      </div>
    );
  }

  const roomTasks = tasks.filter(t => t.roomId === currentRoom.id);
  const today = new Date().toISOString().split('T')[0];
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekDate = weekFromNow.toISOString().split('T')[0];

  const filteredTasks = roomTasks.filter(t => {
    if (filter === 'today') return t.deadline === today;
    if (filter === 'week') return t.deadline >= today && t.deadline <= weekDate;
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Assign and track household tasks</p>
        </div>
        <button
          onClick={() => {
            setShowAddTask(true);
            setEditingTask(null);
            resetForm();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'today'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'week'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          This Week
        </button>
      </div>

      {/* Pending Tasks */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pending ({pendingTasks.length})</h2>
        <div className="space-y-3">
          {pendingTasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No pending tasks</p>
            </div>
          ) : (
            pendingTasks.map(task => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleToggleStatus(task.id)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {task.deadline}
                        </span>
                        <div className="flex gap-1 flex-wrap items-center">
                          <span className="text-gray-500 mr-1">Assigned to:</span>
                          {task.assignedTo ? task.assignedTo.split(', ').map((name: string) => (
                            <span key={name} className="font-semibold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">{name}</span>
                          )) : <span className="text-gray-400">Unassigned</span>}
                        </div>
                        {task.recurring !== 'none' && (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-4 w-4" />
                            {task.recurring}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(task)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={loading}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Completed ({completedTasks.length})</h2>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div key={task.id} className="bg-gray-50 rounded-lg shadow-sm p-4 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => handleToggleStatus(task.id)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-through">{task.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {task.deadline}
                        </span>
                        <div className="flex gap-1 flex-wrap items-center">
                          <span className="text-gray-500 mr-1">Assigned to:</span>
                          {task.assignedTo ? task.assignedTo.split(', ').map((name: string) => (
                            <span key={name} className="font-semibold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">{name}</span>
                          )) : <span className="text-gray-400">Unassigned</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={loading}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Clean the kitchen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg max-h-32 overflow-y-auto min-h-[3rem]">
                  {currentRoom.members.map(member => (
                    <label key={member.userId} className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${
                      assignedTo.includes(member.name) 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={assignedTo.includes(member.name)}
                        onChange={(e) => {
                          if (e.target.checked) setAssignedTo([...assignedTo, member.name]);
                          else setAssignedTo(assignedTo.filter(n => n !== member.name));
                        }}
                      />
                      <span className="text-sm font-medium">{member.name}</span>
                    </label>
                  ))}
                  {currentRoom.members.length === 0 && (
                    <p className="text-sm text-gray-500 w-full text-center py-2">No members in room</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recurring</label>
                <select
                  value={recurring}
                  onChange={(e) => setRecurring(e.target.value as 'none' | 'daily' | 'weekly')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingTask ? handleUpdateTask : handleAddTask}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task')}
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setEditingTask(null);
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
