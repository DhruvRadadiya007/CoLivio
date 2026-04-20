import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { roomAPI } from '../../services/api';
import { Users, Plus, UserPlus, Shield, UserMinus, LogOut, Copy, Check, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export const RoomManagement = () => {
  const { user, currentRoom, setCurrentRoom, setUser, refreshData } = useApp();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !user) return;

    setLoading(true);
    try {
      const room = await roomAPI.createRoom(roomName);
      setCurrentRoom(room);
      setUser({ ...user, roomId: room.id, role: 'admin' });
      setShowCreateRoom(false);
      setRoomName('');
      toast.success('Room created successfully!');
      navigate('/app');
    } catch (error: any) {
      console.error('Create room error:', error);
      toast.error(error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!inviteCode.trim() || !user) return;

    setLoading(true);
    try {
      const room = await roomAPI.joinRoom(inviteCode.toUpperCase());
      setCurrentRoom(room);
      setUser({ ...user, roomId: room.id, role: 'member' });
      setShowJoinRoom(false);
      setInviteCode('');
      toast.success('Joined room successfully!');
      navigate('/app');
    } catch (error: any) {
      console.error('Join room error:', error);
      toast.error(error.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom || !user) return;

    const userMember = currentRoom.members.find(m => m.userId === user.id);
    const adminCount = currentRoom.members.filter(m => m.role === 'admin').length;

    if (userMember?.role === 'admin' && adminCount <= 1) {
      toast.error('Cannot leave as the only Room Creator. Promote another member first or delete the room.');
      return;
    }

    setLoading(true);
    try {
      await roomAPI.leaveRoom(currentRoom.id);
      setCurrentRoom(null);
      setUser({ ...user, roomId: undefined, role: undefined });
      toast.success('Left room successfully');
    } catch (error: any) {
      console.error('Leave room error:', error);
      toast.error(error.message || 'Failed to leave room');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoomName = async () => {
    if (!currentRoom || !newRoomName.trim()) return;
    setLoading(true);
    try {
      await roomAPI.updateRoomName(currentRoom.id, newRoomName);
      setCurrentRoom({ ...currentRoom, name: newRoomName });
      setIsEditingRoomName(false);
      toast.success('Room name updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update room name');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!currentRoom || deleteConfirmationText !== currentRoom.name) {
      toast.error('Please type the exact room name to confirm');
      return;
    }
    setLoading(true);
    try {
      await roomAPI.deleteRoom(currentRoom.id);
      setCurrentRoom(null);
      setUser({ ...user!, roomId: undefined, role: undefined });
      toast.success('Room deleted successfully');
      setShowDeleteConfirm(false);
      navigate('/app');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (memberId: string) => {
    if (!currentRoom) return;
    setLoading(true);
    try {
      await roomAPI.makeMemberAdmin(currentRoom.id, memberId);
      const updatedMembers = currentRoom.members.map(m => 
        m.userId === memberId ? { ...m, role: 'admin' as const } : m
      );
      setCurrentRoom({ ...currentRoom, members: updatedMembers });
      toast.success('Member promoted to Room Creator');
    } catch (error: any) {
      toast.error(error.message || 'Failed to promote member');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Invite code copied!');
    }
  };

  const isRoomCreator = currentRoom?.members.find(m => m.userId === user?.id)?.role === 'admin';

  if (!currentRoom) {
    return (
      <div className="pb-20 lg:pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Room Management</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Yet</h2>
          <p className="text-gray-600 mb-6">Create a new room or join an existing one to get started with CoLivio</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowCreateRoom(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Room
            </button>
            <button
              onClick={() => setShowJoinRoom(true)}
              className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Join Room
            </button>
          </div>
        </div>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Room</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="My Awesome Flat"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateRoom(false);
                      setRoomName('');
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

        {/* Join Room Modal */}
        {showJoinRoom && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Join Existing Room</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invite Code</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                    placeholder="ABC123"
                    maxLength={8}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleJoinRoom}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Joining...' : 'Join'}
                  </button>
                  <button
                    onClick={() => {
                      setShowJoinRoom(false);
                      setInviteCode('');
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
  }

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
        {isRoomCreator && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
          >
            <Trash2 className="h-5 w-5" />
            <span className="hidden sm:inline">Delete Room</span>
          </button>
        )}
      </div>

      {/* Room Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {isEditingRoomName ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={newRoomName} 
                onChange={e => setNewRoomName(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={handleUpdateRoomName} disabled={loading} className="px-3 py-1 bg-indigo-600 text-white rounded-lg">Save</button>
              <button onClick={() => setIsEditingRoomName(false)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900">{currentRoom.name}</h2>
              <button onClick={() => { setNewRoomName(currentRoom.name); setIsEditingRoomName(true); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <Edit2 className="h-4 w-4 text-gray-600" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Invite Code</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-mono font-bold text-indigo-600">{currentRoom.inviteCode}</p>
              <button
                onClick={copyInviteCode}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-600" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Share this code with your roommates</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Members</p>
            <p className="text-2xl font-bold text-gray-900">{currentRoom.members.length}</p>
          </div>
        </div>
        <button
          onClick={handleLeaveRoom}
          disabled={loading}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          {loading ? 'Leaving...' : 'Leave Room'}
        </button>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Members</h3>
        <div className="space-y-3">
          {currentRoom.members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {member.name}
                    {member.userId === user?.id && <span className="text-sm text-gray-500 ml-2">(You)</span>}
                  </p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  member.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {member.role === 'admin' ? 'Room Creator' : 'Member'}
                </span>
                {isRoomCreator && member.role !== 'admin' && (
                  <button onClick={() => handleMakeAdmin(member.userId)} disabled={loading} className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-sm font-medium ml-2 transition-colors">
                    Make Room Creator
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Room Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Room?</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All tasks, expenses, and data associated with this room will be permanently deleted.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold">{currentRoom.name}</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={currentRoom.name}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteRoom}
                disabled={loading || deleteConfirmationText !== currentRoom.name}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Room'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmationText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};