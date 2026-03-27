import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Mail, Lock, UserPlus, AlertCircle, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';

export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailConfirmWarning, setShowEmailConfirmWarning] = useState(false);
  const { setUser } = useApp();
  const navigate = useNavigate();

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain a number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setLoading(true);
    setShowEmailConfirmWarning(false);

    try {
      console.log('Creating account for:', email);
      await authAPI.signup(email, password, name);
      console.log('Account created, signing in...');
      
      // Sign in the user
      const { user: signedInUser } = await authAPI.signin(email, password);
      console.log('Signed in successfully:', signedInUser);
      
      setUser(signedInUser);
      toast.success('Account created successfully!');
      navigate('/app/room');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Failed to create account';
      
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email confirmation')) {
        setShowEmailConfirmWarning(true);
        errorMessage = 'Email confirmation is enabled. Please follow the instructions below to disable it.';
      } else if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
      </div>
      
      {showEmailConfirmWarning && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 mb-2">Email Confirmation Required</p>
              <p className="text-sm text-amber-800 mb-3">
                Supabase is configured to require email confirmation. To use CoLivio without an email server, please disable this setting:
              </p>
              
              <div className="bg-white rounded p-3 mb-3 text-sm space-y-2">
                <p className="font-medium text-gray-900">Quick Fix Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Open <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1">Supabase Dashboard <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Go to <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong></li>
                  <li>Toggle OFF: <strong>"Confirm email"</strong></li>
                  <li>Click <strong>Save</strong></li>
                  <li>Return here and try signing up again</li>
                </ol>
              </div>
              
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> This is normal for development. Production apps would have an email service configured.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>
        </div>
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
          <p className="text-xs text-gray-500 mt-1">
            Min 8 characters, 1 uppercase, 1 number
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <UserPlus className="h-5 w-5" />
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p className="text-center text-gray-600 mt-6">
        Already have an account?{' '}
        <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Login
        </Link>
      </p>
    </div>
  );
};