import { NavLink } from 'react-router-dom';
import { FiHome, FiBookmark, FiUser, FiBell, FiLogOut, FiMoon, FiSun, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import useTheme from '../hooks/useTheme';

export default function Sidebar() {
  const { signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Home', path: '/home', icon: <FiHome size={22} /> },
    { name: 'Readings', path: '/readings', icon: <FiBookOpen size={22} /> },
    { name: 'Saved', path: '/saved', icon: <FiBookmark size={22} /> },
    { name: 'Profile', path: '/profile', icon: <FiUser size={22} /> },
  ];

  return (
    <div className="w-64 h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col fixed left-0 top-0 shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-50 transition-colors duration-300">
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-600 flex items-center justify-center bg-purple-50 dark:bg-purple-900/30">
          <span className="text-purple-600 dark:text-purple-400 font-bold text-xl">H</span>
        </div>
        <span className="text-slate-800 dark:text-white font-extrabold text-xl tracking-tight">HymnMatch</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all font-medium ${
                isActive
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-100 dark:border-purple-800/50'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 border border-transparent'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
        
        {/* Notifications */}
        <button className="w-full flex items-center space-x-4 px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-medium border border-transparent">
          <div className="relative">
            <FiBell size={22} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
          <span>Notifications</span>
        </button>
      </nav>

      {/* Settings / Actions */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-4 px-4 py-3 w-full rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-medium border border-transparent"
        >
          {isDarkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-4 px-4 py-3 w-full rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium border border-transparent"
        >
          <FiLogOut size={22} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
