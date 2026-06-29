import { NavLink } from 'react-router-dom';
import { FiHome, FiBookmark, FiUser, FiBell, FiLogOut, FiMoon, FiSun, FiBookOpen, FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import useTheme from '../hooks/useTheme';

export default function Sidebar({ 
  isOpen = true, 
  setIsOpen = () => {}, 
  isNotificationsOpen = false, 
  onToggleNotifications = () => {},
  mobileOpen = false,
  setMobileOpen = () => {}
}) {
  const { signOut, unreadCount } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Upload Reading', path: '/home', icon: <FiHome size={22} /> },
    { name: 'Readings', path: '/readings', icon: <FiBookOpen size={22} /> },
    { name: 'Saved Songs', path: '/saved', icon: <FiBookmark size={22} /> },
    { name: 'Liturgical Calendar', path: '/liturgical-calendar', icon: <FiCalendar size={22} /> },
    { name: 'Profile & Settings', path: '/profile', icon: <FiUser size={22} /> },
  ];

  return (
    <div className={`h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col fixed left-0 top-0 shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex absolute top-8 -right-3 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 items-center justify-center text-slate-500 dark:text-slate-400 shadow-md hover:text-purple-600 dark:hover:text-purple-400 z-50 hover:scale-110 transition-all cursor-pointer"
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

      <nav className={`flex-1 py-6 space-y-2 ${isOpen ? 'px-4' : 'px-2'}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setMobileOpen(false)}
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
            onToggleNotifications();
            setMobileOpen(false);
          }}
          className={`flex items-center rounded-2xl transition-all font-medium border py-3 ${
            isOpen ? 'w-full px-4 space-x-4 justify-start' : 'w-12 px-0 justify-center mx-auto'
          } ${
            isNotificationsOpen
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800/50'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 border-transparent'
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
          onClick={() => {
            toggleTheme();
            setMobileOpen(false);
          }}
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
          onClick={() => {
            signOut();
            setMobileOpen(false);
          }}
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
    </div>
  );
}
