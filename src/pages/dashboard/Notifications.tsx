import { useState } from 'react';
import { motion } from 'framer-motion';

interface Notification {
  id: string;
  type: 'milestone' | 'satellite' | 'volunteer' | 'alert' | 'comment';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [emailDigest, setEmailDigest] = useState<'none' | 'daily' | 'weekly'>('daily');

  const filteredNotifications = notifications.filter(notif => {
    if (filterType !== 'all' && notif.type !== filterType) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return '🎯';
      case 'satellite':
        return '🛰️';
      case 'volunteer':
        return '👥';
      case 'alert':
        return '⚠️';
      case 'comment':
        return '💬';
      default:
        return '📢';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-black mb-2">Notifications</h2>
          <p className="text-gray-800 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={emailDigest}
            onChange={(e) => setEmailDigest(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-mtaji-primary bg-gray-800"
          >
            <option value="none">No Email Digest</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Digest</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-mtaji-primary text-white'
                : 'bg-white/10 text-gray-800 dark:text-gray-400 hover:bg-white/15'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('milestone')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filterType === 'milestone'
                ? 'bg-mtaji-primary text-white'
                : 'bg-white/10 text-gray-800 dark:text-gray-400 hover:bg-white/15'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setFilterType('satellite')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filterType === 'satellite'
                ? 'bg-mtaji-primary text-white'
                : 'bg-white/10 text-gray-800 dark:text-gray-400 hover:bg-white/15'
            }`}
          >
            Satellite Updates
          </button>
          <button
            onClick={() => setFilterType('volunteer')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filterType === 'volunteer'
                ? 'bg-mtaji-primary text-white'
                : 'bg-white/10 text-gray-800 dark:text-gray-400 hover:bg-white/15'
            }`}
          >
            Volunteers
          </button>
          <button
            onClick={() => setFilterType('alert')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filterType === 'alert'
                ? 'bg-mtaji-primary text-white'
                : 'bg-white/10 text-gray-800 dark:text-gray-400 hover:bg-white/15'
            }`}
          >
            Alerts
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-800 dark:text-gray-400 text-lg">No notifications</p>
            <p className="text-mtaji-medium-gray text-sm mt-2">
              You'll see updates about your projects here
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                markAsRead(notification.id);
                if (notification.actionUrl) {
                  window.location.href = notification.actionUrl;
                }
              }}
              className={`bg-white/10 backdrop-blur-lg border rounded-xl p-4 cursor-pointer transition-all ${
                notification.read
                  ? 'border-white/10 opacity-60'
                  : 'border-mtaji-primary/50 bg-mtaji-primary/5'
              } hover:border-mtaji-primary/70 hover:bg-white/15`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{notification.title}</h4>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-mtaji-primary rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-400 mb-2">{notification.message}</p>
                  <p className="text-xs text-mtaji-medium-gray">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Export Reports */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Export Progress Reports</h3>
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg font-semibold transition-colors">
            Export as PDF
          </button>
          <button className="px-6 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg font-semibold transition-colors">
            Export as Excel
          </button>
        </div>
      </div>
    </div>
  );
}
