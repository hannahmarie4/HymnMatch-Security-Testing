import { Link } from 'react-router-dom';
import { FiMusic, FiArrowRight } from 'react-icons/fi';

export default function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-purple-900 relative overflow-hidden">
      {/* Decorative background blur shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto h-full space-y-10">
        {/* Logo and Icon */}
        <div className="space-y-6">
          <div className="mx-auto w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-900/50 border border-white/20 transform hover:scale-105 transition-transform duration-300">
            <FiMusic className="text-white text-4xl" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-sm">
              HymnMatch
            </h1>
            <p className="text-lg md:text-xl text-primary-100 font-medium max-w-md mx-auto leading-relaxed opacity-90">
              The AI-powered liturgical song recommender for your choir and parish.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-8 w-full max-w-sm">
          <Link 
            to="/register"
            className="group relative w-full flex items-center justify-center px-8 py-4 bg-white text-primary-900 rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <span>Get Started</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-primary-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
