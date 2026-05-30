import { useLocation, Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

export default function VerifyAccount() {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md px-8 py-10 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 text-center">
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <FiMail size={40} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Verify your email
        </h1>
        
        <p className="text-slate-500 text-base leading-relaxed mb-8">
          We've sent an email to <span className="font-bold text-slate-800">{email}</span>. 
          Please click the link inside to verify your account.
        </p>

        <div className="space-y-4">
          <Link
            to="/login"
            className="w-full py-4 px-6 rounded-xl bg-purple-600 text-white font-bold text-base hover:bg-purple-700 shadow-md hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
          >
            Go to Login
          </Link>
          
          <Link
            to="/"
            className="w-full py-4 px-6 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-base hover:bg-slate-50 transition-all duration-200 flex items-center justify-center"
          >
            <FiArrowLeft className="mr-2" />
            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-400">
          Didn't receive the email? Check your spam folder or try signing in to resend the link.
        </p>
      </div>
    </div>
  );
}
