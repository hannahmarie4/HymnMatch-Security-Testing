import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBookmark, FiUser, FiBell, FiLogOut, FiMoon, FiSun, FiBookOpen, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import useTheme from '../hooks/useTheme';

export default function Sidebar({ isOpen = true, setIsOpen = () => {} }) {
  const { signOut, auditLogs, unreadCount, resetUnreadCount } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const navItems = [
    { name: 'Upload Reading', path: '/home', icon: <FiHome size={22} /> },
    { name: 'Readings', path: '/readings', icon: <FiBookOpen size={22} /> },
    { name: 'Saved Songs', path: '/saved', icon: <FiBookmark size={22} /> },
    { name: 'Profile & Settings', path: '/profile', icon: <FiUser size={22} /> },
  ];

  return (
    <div className={`h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col fixed left-0 top-0 shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-8 -right-3 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-md hover:text-purple-600 dark:hover:text-purple-400 z-50 hover:scale-110 transition-all cursor-pointer"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
      </button>

      {/* Logo */}
      <div className={`p-6 flex items-center ${isOpen ? 'space-x-3' : 'justify-center'}`}>
        <div className="w-10 h-10 rounded-full border-2 border-purple-600 flex items-center justify-center bg-purple-50 dark:bg-purple-900/30 flex-shrink-0">
          <span className="text-purple-600 dark:text-purple-400 font-bold text-xl">H</span>
        </div>
        <span className={`text-slate-800 dark:text-white font-extrabold text-xl tracking-tight transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'opacity-100 max-w-xs ml-3' : 'opacity-0 max-w-0 pointer-events-none'}`}>
          HymnMatch
        </span>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-6 space-y-2 ${isOpen ? 'px-4' : 'px-2'}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center rounded-2xl transition-all font-medium border border-transparent py-3 ${
                isOpen ? 'px-4 space-x-4 justify-start' : 'px-0 justify-center w-12 mx-auto'
              } ${
                isActive
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-100 dark:border-purple-800/50'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400'
              }`
            }
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 pointer-events-none'}`}>
              {item.name}
            </span>
          </NavLink>
        ))}
        
        {/* Notifications */}
        <button 
          onClick={() => {
            setShowNotificationsModal(true);
            resetUnreadCount();
          }}
          className={`flex items-center rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-medium border border-transparent py-3 ${
            isOpen ? 'w-full px-4 space-x-4 justify-start' : 'w-12 px-0 justify-center mx-auto'
          }`}
        >
          <div className="relative flex-shrink-0">
            <FiBell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 pointer-events-none'}`}>
            Notifications
          </span>
        </button>
      </nav>

      {/* Settings / Actions */}
      <div className={`border-t border-slate-100 dark:border-slate-800 space-y-2 ${isOpen ? 'p-4' : 'p-2 py-4'}`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-medium border border-transparent py-3 ${
            isOpen ? 'w-full px-4 space-x-4 justify-start' : 'w-12 px-0 justify-center mx-auto'
          }`}
        >
          <div className="flex-shrink-0">
            {isDarkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
          </div>
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 pointer-events-none'}`}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        
        <button
          onClick={() => signOut()}
          className={`flex items-center rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium border border-transparent py-3 ${
            isOpen ? 'w-full px-4 space-x-4 justify-start' : 'w-12 px-0 justify-center mx-auto'
          }`}
        >
          <div className="flex-shrink-0">
            <FiLogOut size={22} />
          </div>
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 pointer-events-none'}`}>
            Log out
          </span>
        </button>
      </div>

      {/* Notifications / Audit Logs Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative transform transition-all animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/85">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FiBell size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Activity History & Audit Logs</h2>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mt-0.5">Secure Log Entries</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotificationsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log) => {
                  let badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
                  if (log.action.includes('Login') || log.action.includes('Session')) {
                    badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
                  } else if (log.action.includes('Logout')) {
                    badgeColor = 'bg-red-50 text-red-750 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900/30';
                  } else if (log.action.includes('Security') || log.action.includes('Password') || log.action.includes('Update')) {
                    badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
                  } else if (log.action.includes('Save') || log.action.includes('Hymn')) {
                    badgeColor = 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400 border-pink-100 dark:border-pink-900/30';
                  }

                  return (
                    <div 
                      key={log.id} 
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/80 dark:border-slate-800/60 flex flex-col space-y-2 hover:border-purple-200 dark:hover:border-purple-900 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                          {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {log.details}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <p className="text-lg font-medium">No activity logged yet.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button 
                onClick={() => setShowNotificationsModal(false)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
