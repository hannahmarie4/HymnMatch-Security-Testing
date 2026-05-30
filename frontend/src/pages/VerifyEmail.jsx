import { useLocation } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// ============================================
// Email Verification Page
// Issue #5: User must verify email before login
// ============================================

export default function VerifyEmail() {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="w-full max-w-md px-8 py-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <FiMail size={32} className="text-purple-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
            Verify Your Email
          </h1>
          <p className="text-slate-600 font-medium">
            We've sent a verification link to:
          </p>
          <p className="text-lg font-semibold text-purple-600 mt-2">
            {email}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-blue-800 font-medium">
            ✓ Check your email inbox (and spam folder)
          </p>
          <p className="text-sm text-blue-800 font-medium mt-2">
            ✓ Click the verification link to confirm your email
          </p>
          <p className="text-sm text-blue-800 font-medium mt-2">
            ✓ After verification, you can sign in
          </p>
        </div>

        <p className="text-center text-slate-600 text-sm mb-6">
          Verification link expires in 24 hours
        </p>

        <Link 
          to="/login"
          className="flex items-center justify-center w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
