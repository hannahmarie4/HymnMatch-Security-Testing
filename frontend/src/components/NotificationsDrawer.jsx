import { useState } from 'react';
import { FiX, FiCheck, FiInfo, FiLayers, FiShield, FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function NotificationsDrawer({ isOpen, onClose, sidebarOpen }) {
  const { auditLogs, unreadCount, resetUnreadCount } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  // Generate mock user avatars/initials and types for a rich premium dashboard look
  const getNotificationIconAndStyle = (action) => {
    if (action.includes('Login') || action.includes('Session')) {
      return {
        initials: 'SYS',
        avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
        actionIcon: <FiShield className="text-emerald-400" size={12} />,
        textColor: 'text-emerald-250',
      };
    } else if (logActionContains(action, 'Save') || logActionContains(action, 'Hymn')) {
      return {
        initials: 'MU',
        avatarBg: 'bg-gradient-to-tr from-pink-600 to-rose-500',
        actionIcon: <FiHeart className="text-pink-400" size={12} />,
        textColor: 'text-pink-200',
      };
    } else if (logActionContains(action, 'Liturgical') || logActionContains(action, 'Analysis')) {
      return {
        initials: 'AI',
        avatarBg: 'bg-gradient-to-tr from-purple-600 to-indigo-500',
        actionIcon: <FiLayers className="text-purple-400" size={12} />,
        textColor: 'text-purple-200',
      };
    } else {
      return {
        initials: 'USR',
        avatarBg: 'bg-gradient-to-tr from-violet-600 to-indigo-600',
        actionIcon: <FiInfo className="text-violet-400" size={12} />,
        textColor: 'text-violet-200',
      };
    }
  };

  function logActionContains(action, term) {
    return action.toLowerCase().includes(term.toLowerCase());
  }

  // Map database audit logs to notifications
  // We will also synthesize unread flags. Let's make the first N notifications "unread" if unreadCount > 0.
  const notifications = auditLogs.map((log, index) => {
    const isUnread = index < unreadCount;
    const styleInfo = getNotificationIconAndStyle(log.action);
    const dateObj = new Date(log.timestamp);
    
    // Determine group: New, Today, Earlier
    const now = new Date();
    const isToday = dateObj.toDateString() === now.toDateString();
    
    let group = 'Earlier';
    if (isToday) {
      if (isUnread) {
        group = 'New';
      } else {
        group = 'Today';
      }
    }

    return {
      id: log.id,
      action: log.action,
      details: log.details,
      timestamp: dateObj,
      timeStr: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      isUnread,
      group,
      ...styleInfo
    };
  });

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.isUnread;
    return true;
  });

  // Group notifications chronologically
  const groups = {
    'New': filteredNotifications.filter(n => n.group === 'New'),
    'Today': filteredNotifications.filter(n => n.group === 'Today'),
    'Earlier': filteredNotifications.filter(n => n.group === 'Earlier')
  };

  return (
    <>
      {/* ── Backdrop Overlay Mask with Blur ── */}
      <div
        className={`fixed inset-0 z-35 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Left-Aligned Notification Drawer ── */}
      <div
        style={{
          left: isOpen 
            ? (sidebarOpen ? '256px' : '80px') 
            : '-420px'
        }}
        className={`fixed top-0 bottom-0 z-40 w-[380px] sm:w-[420px] bg-[#120b24]/95 dark:bg-[#0c071a]/98 border-r border-violet-900/40 shadow-2xl flex flex-col transition-all duration-300 ease-out`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-violet-900/30 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-widest text-violet-400 uppercase">
              Notifications
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xl font-extrabold text-white">Recent Activity</span>
              {unreadCount > 0 && (
                <span className="bg-violet-600 text-violet-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={resetUnreadCount}
                title="Mark all as read"
                className="p-2 rounded-xl bg-violet-900/25 hover:bg-violet-900/40 text-violet-300 hover:text-white transition-all border border-violet-850/40"
              >
                <FiCheck size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-violet-900/25 hover:bg-violet-900/40 text-violet-400 hover:text-white transition-all border border-violet-850/40"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="px-6 py-4 border-b border-violet-900/20 bg-[#170e2d]/40 flex items-center space-x-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              filter === 'all'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-700/30'
                : 'bg-violet-950/40 text-violet-400 hover:text-violet-200 border border-violet-900/30'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center space-x-1.5 ${
              filter === 'unread'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-700/30'
                : 'bg-violet-950/40 text-violet-400 hover:text-violet-200 border border-violet-900/30'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Alerts Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-violet-900/50 scrollbar-track-transparent">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-violet-950/40 border border-violet-900/30 flex items-center justify-center text-violet-400">
                <FiInfo size={22} />
              </div>
              <div>
                <p className="text-violet-200 font-bold">No Notifications Found</p>
                <p className="text-violet-400/60 text-xs mt-1">There are no logs matching the filter.</p>
              </div>
            </div>
          ) : (
            Object.entries(groups).map(([groupName, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={groupName} className="space-y-3">
                  <h3 className="text-[10px] font-bold tracking-widest text-violet-400/60 uppercase pl-1">
                    {groupName}
                  </h3>
                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative p-4 rounded-2xl transition-all border flex items-start space-x-3.5 ${
                          item.isUnread
                            ? 'bg-[#1e133a]/80 border-violet-700/40 shadow-lg shadow-violet-950/40 hover:bg-[#251749]/90 hover:border-violet-600/50'
                            : 'bg-[#150d29]/40 border-violet-900/20 hover:bg-[#1b1035]/60 hover:border-violet-800/30'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-md relative ${item.avatarBg}`}>
                          {item.initials}
                          {/* Mini Action Badge icon */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-violet-900/40 flex items-center justify-center">
                            {item.actionIcon}
                          </div>
                        </div>

                        {/* Content text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-violet-300 tracking-wide uppercase">
                              {item.action}
                            </span>
                            <span className="text-[10px] text-violet-400/60 font-semibold whitespace-nowrap">
                              {item.timeStr}
                            </span>
                          </div>
                          <p className="text-sm text-violet-100 font-medium mt-1 leading-relaxed">
                            {item.details}
                          </p>
                          <span className="text-[10px] text-violet-400/50 font-bold block mt-1.5">
                            {item.dateStr}
                          </span>
                        </div>

                        {/* Unread dot indicator */}
                        {item.isUnread && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] flex-shrink-0 mt-1.5 animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom stats/footer */}
        <div className="p-4 bg-[#0e081c] border-t border-violet-900/30 text-center">
          <p className="text-[10px] text-violet-400/40 font-semibold tracking-wider uppercase">
            HymnMatch Security Audit System
          </p>
        </div>
      </div>
    </>
  );
}
