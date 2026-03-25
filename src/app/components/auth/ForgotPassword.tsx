import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/api';
import { toast } from 'sonner';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        // Check if it's an SMTP configuration error
        if (resetError.message.includes('SMTP') || resetError.message.includes('email')) {
          setError('Email server not configured. Please see the setup guide.');
          toast.error('Email server not configured');
        } else {
          throw resetError;
        }
      } else {
        setSent(true);
        toast.success('Password reset link sent to your email');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email');
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your email</h2>
        <p className="text-gray-600 mb-6">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Click the link in the email to reset your password.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-indigo-600">CoLivio</h1>
      </div>
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="h-5 w-5" />
        Back to login
      </Link>

      {error && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Email Server Not Configured</p>
              <p className="text-sm text-amber-700 mt-1">
                To enable password reset, you need to configure an email server in Supabase.
              </p>
              <p className="text-xs text-amber-600 mt-2">
                See <strong>/EMAIL_SETUP_GUIDE.md</strong> for instructions.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h2>
      <p className="text-gray-600 mb-6">
        Enter your email and we'll send you a reset link
      </p>
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
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
};
