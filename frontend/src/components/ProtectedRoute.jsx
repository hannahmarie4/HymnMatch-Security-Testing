import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================
// CONTROL #3: PROTECTED ROUTE ENFORCEMENT
// ============================================
// Threat: Session Hijacking / Unauthorized Access
// CIA Principle: Confidentiality
//
// Implementation:
// ProtectedRoute checks if user is authenticated
// before allowing access to sensitive pages.
// If unauthenticated, it safely redirects to /login.
//
// Usage: Wrap all private routes with <ProtectedRoute>
// Example in src/App.jsx:
// <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setIsRedirecting(true);
      // Securely redirect unauthorized access to login
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
