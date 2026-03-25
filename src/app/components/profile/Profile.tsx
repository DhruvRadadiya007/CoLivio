import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { authAPI } from '../../services/api';
import { User, Mail, Camera, Save } from 'lucide-react';
import { toast } from 'sonner';

export const Profile = () => {
  const { user, setUser, currentRoom, currency, setCurrency } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (user) {
      try {
        await authAPI.updateUser({ name });
        
        const updatedUser = { ...user, name };
        setUser(updatedUser);
        
        // Update user in localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex((u: any) => u.id === user.id);
        if (index !== -1) {
          users[index] = { ...users[index], name };
          localStorage.setItem('users', JSON.stringify(users));
        }
        
        toast.success('Profile updated successfully');
        setEditing(false);
      } catch (error: any) {
        toast.error(error.message || 'Failed to update profile');
      }
    }
  };

  const userRole = currentRoom?.members.find(m => m.userId === user?.id)?.role;

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-indigo-600" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors">
              <Camera className="h-4 w-4 text-white" />
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">Click camera to upload new picture</p>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{user?.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">{user?.email}</span>
            </div>
          </div>

          {currentRoom && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{currentRoom.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    userRole === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : ''}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency Display Preference</label>
                <select
                  value={currency}
                  onChange={async (e) => {
                    const newCurrency = e.target.value;
                    setCurrency(newCurrency);
                    try {
                      await authAPI.updateUser({ currency: newCurrency });
                      toast.success('Currency preference saved!');
                    } catch (error) {
                      toast.error('Failed to save currency');
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Changes the currency symbol across the app.</p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Save className="h-5 w-5" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(user?.name || '');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
