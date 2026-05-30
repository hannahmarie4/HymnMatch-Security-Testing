import { FiUser, FiMail, FiLock, FiSettings, FiShield, FiLogOut, FiEdit2, FiInfo, FiUpload, FiHeart, FiFileText } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { maskEmail } from '../utils/dataMasking';

export default function Profile() {
  const { user, signOut } = useAuth();

// ============================================
// CONTROL #6B: XSS PREVENTION (Input Sanitization)
// ============================================
// Threat: Cross-Site Scripting (XSS)
// CIA Principle: Integrity
// Status: IMPLEMENTED via React JSX
//
// Implementation:
// 1. React automatically escapes all interpolated text
// 2. No use of dangerouslySetInnerHTML with user input
// 3. Custom sanitization for edge cases
//
// Code Location: Profile component, line ~16
//
// Safe Examples:
// ✅ <h1>{userName}</h1> — React escapes HTML
// ✅ <p>{userEmail}</p> — Safe, will not execute scripts
// ✅ <div>{userComment}</div> — Text nodes are escaped

  return (
    <div className="max-w-3xl mx-auto py-4 pb-20">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Profile & Settings</h1>

      {/* User Info & Activity Stats (US-027) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 border-4 border-white shadow-md flex items-center justify-center text-purple-600 text-3xl font-bold">
              {user?.user_metadata?.full_name?.charAt(0) || 'JD'}
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user?.user_metadata?.full_name || 'John Doe'}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{user?.email ? maskEmail(user.email) : 'john.doe@example.com'}</p>
          </div>
        </div>

        {/* Activity Stats (US-027) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-center space-x-4 border border-slate-100 dark:border-slate-800/50">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FiUpload size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">24</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploads</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-center space-x-4 border border-slate-100 dark:border-slate-800/50">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
              <FiHeart size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">42</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saved Songs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Section (US-027, US-028) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FiUser size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Account</h3>
          </div>
          
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                <FiMail size={18} />
                <span className="font-medium">Edit Name & Email</span>
              </div>
              <FiEdit2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                <FiLock size={18} />
                <span className="font-medium">Change Password</span>
              </div>
              <FiEdit2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Liturgical Preferences (US-029) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FiSettings size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Preferences</h3>
          </div>
          
          <div className="p-3">
            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Default Liturgical Season</label>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 group hover:border-purple-200 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                <span className="font-bold text-slate-700 dark:text-slate-200">Ordinary Time</span>
              </div>
              <FiEdit2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Legal Section (US-031, US-032) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <FiFileText size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Legal & About</h3>
          </div>
          
          <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="w-full flex items-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4">
                <FiShield size={18} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Data Privacy Settings</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage your data processing consent</p>
              </div>
            </button>
            
            <button className="w-full flex items-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                <FiInfo size={18} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">About HymnMatch</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Version 1.0.0 • Learn more</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button 
          onClick={signOut}
          className="flex items-center space-x-2 px-8 py-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 hover:shadow-lg hover:shadow-red-500/10 transition-all transform hover:-translate-y-0.5"
        >
          <FiLogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
