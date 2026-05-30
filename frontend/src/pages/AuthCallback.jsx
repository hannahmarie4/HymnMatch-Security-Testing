import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

// ============================================
// Auth Callback Page
// Issue #5: Handle email verification after user clicks link
// ============================================

export default function AuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Handle the callback from email verification link
    const handleCallback = async () => {
      try {
        // Get the hash from URL (#access_token=...)
        const hash = window.location.hash;
        
        if (!hash || !hash.includes('access_token')) {
          setError('Invalid verification link. Please try again.');
          setLoading(false);
          return;
        }

        // Supabase automatically handles the token exchange
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Email verified, redirect to login or home
          setTimeout(() => {
            navigate('/home', { replace: true });
          }, 2000);
        } else {
          setError('Verification failed. Please try again.');
          setLoading(false);
        }
      } catch (err) {
        setError('An error occurred during verification.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-700">
            Verifying your email...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Verification Failed
          </h1>
          <p className="text-slate-600 mb-6">
            {error}
          </p>
          <a 
            href="/register"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return null;
}
