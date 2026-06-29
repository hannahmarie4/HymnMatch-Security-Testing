import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import NotificationsDrawer from '../components/NotificationsDrawer';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900 text-slate-900 dark:text-slate-100 flex relative overflow-hidden transition-colors duration-300">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-20 left-64 w-96 h-96 bg-indigo-200/50 dark:bg-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-80 h-80 bg-pink-200/50 dark:bg-fuchsia-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-purple-200/50 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Mobile Glassmorphic Header */}
      <div className="lg:hidden w-full h-16 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-6 z-40 fixed top-0 left-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-600 flex items-center justify-center bg-purple-50 dark:bg-purple-900/30">
            <span className="text-purple-600 dark:text-purple-400 font-bold text-base">H</span>
          </div>
          <span className="text-slate-800 dark:text-white font-extrabold text-lg tracking-tight">HymnMatch</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          aria-label="Open Navigation"
        >
          <FiMenu size={22} />
        </button>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Fixed Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isNotificationsOpen={notificationsOpen}
        onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      {/* Left Edge Overlay Drawer for Notifications */}
      <NotificationsDrawer 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
        sidebarOpen={sidebarOpen} 
      />

      {/* Main Content Area (Responsive padding for mobile header offset) */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-0 lg:ml-64' : 'ml-0 lg:ml-20'} pt-24 px-6 pb-8 lg:p-8 relative z-10 transition-all duration-300 bg-slate-200/70 dark:bg-[#0b0f19] min-h-screen`}>
        <Outlet />
      </div>
    </div>
  );
}
