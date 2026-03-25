import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authAPI, roomAPI } from '../../services/api';
import { toast } from 'sonner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setCurrentRoom } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Signing in:', email);
      const { user } = await authAPI.signin(email, password);
      console.log('Sign in successful:', user);

      setUser(user);
      
      // Check if user has a room
      if (user.roomId) {
        try {
          const room = await roomAPI.getRoom(user.roomId);
          setCurrentRoom(room);
          
          // Get user role from room members
          const member = room.members.find((m: any) => m.userId === user.id);
          if (member) {
            setUser({ ...user, role: member.role });
          }
          
          navigate('/app');
        } catch (error) {
          console.error('Error loading room:', error);
          navigate('/app/room');
        }
      } else {
        navigate('/app/room');
      }
      
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">CoLivio</h1>
        <h2 className="text-2xl font-bold text-gray-800">Login</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn className="h-5 w-5" />
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center text-gray-600 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
};