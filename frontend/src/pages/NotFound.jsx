import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

// ============================================
// SECURITY FIX: 404 Not Found Page
// Issue #3: Show error before redirecting to login
// ============================================

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect to login after 5 seconds
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center px-6">
        <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
          404
        </h1>
        <p className="text-3xl font-bold text-slate-800 mt-4 mb-2">
          Page Not Found
        </p>
        <p className="text-lg text-slate-600 mb-8">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleBackClick}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            <FiArrowLeft className="inline mr-2" />
            Go Back
          </button>
          <div className="text-slate-500 font-medium">
            Redirecting to login in 5 seconds...
          </div>
        </div>
      </div>
    </div>
  );
}
