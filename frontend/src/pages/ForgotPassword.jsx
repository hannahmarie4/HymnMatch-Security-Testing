import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md px-8 py-10 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
        
        {!isSuccess && (
          <Link to="/login" className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-6">
            <FiArrowLeft className="mr-2" />
            <span className="font-medium text-sm">Back to login</span>
          </Link>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Forgot Password
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Enter your email address and we will send you a link to reset your password.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-600 transition-colors">
                  <FiMail size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  className={`w-full pl-12 pr-4 py-3 bg-slate-50 border ${error ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-yellow-500/20'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-yellow-500 transition-all placeholder:text-slate-400`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                />
              </div>
              {error && <p className="text-red-500 text-xs font-medium pl-1 mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-6 rounded-xl bg-yellow-500 text-white font-bold text-base hover:bg-yellow-600 shadow-md hover:shadow-yellow-500/30 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="bg-green-50 text-green-800 p-5 rounded-2xl border border-green-200 text-sm font-medium leading-relaxed">
              If an account exists for this email, you will receive a HymnMatch password reset link shortly. Please check your inbox.
            </div>
            
            <Link
              to="/login"
              className="w-full py-3 px-6 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
