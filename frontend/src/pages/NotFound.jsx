import { Link } from 'react-router-dom';
import { FiMusic } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] px-4 text-center">
      <div className="mb-6 mx-auto w-16 h-16 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center border border-[#B8860B]/20">
        <FiMusic size={32} className="text-[#B8860B]" />
      </div>
      
      <h1 className="text-8xl font-bold text-[#1A1A2E] mb-2 tracking-tighter">
        404
      </h1>
      
      <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">
        Page Not Found
      </h2>
      
      <p className="text-slate-500 font-medium max-w-[320px] mx-auto mb-8 leading-relaxed">
        Oops! The page you are looking for does not exist or you do not have permission to access it.
      </p>
      
      <Link 
        to={user ? "/home" : "/login"}
        className="px-8 py-3 bg-[#B8860B] hover:bg-[#997300] text-white font-bold rounded-full transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-[#B8860B]/20"
      >
        Go Back to {user ? "Home" : "Login"}
      </Link>
    </div>
  );
}
