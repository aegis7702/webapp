import { useState } from 'react';
import { X, AlertTriangle, AlertCircle, ChevronLeft } from 'lucide-react';
import { Notification } from '../../../types/notification';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationPanel({ notifications, onClose, onMarkAsRead }: NotificationPanelProps) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleBack = () => {
    setSelectedNotification(null);
  };

  // Detail view
  if (selectedNotification) {
    return (
      <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
        {/* Header */}
        <div className="border-b border-stone-200 px-6 py-4 flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h1 className="text-lg font-semibold text-stone-900 flex-1">Notification</h1>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6">
            {/* Severity indicator */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 ${
              selectedNotification.severity === 'critical'
                ? 'bg-red-50 border border-red-200'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              {selectedNotification.severity === 'critical' ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <span className={`text-xs font-semibold ${
                selectedNotification.severity === 'critical' ? 'text-red-900' : 'text-amber-900'
              }`}>
                {selectedNotification.severity === 'critical' ? 'Critical Alert' : 'Warning'}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-stone-900 mb-2">
              {selectedNotification.title}
            </h2>

            {/* Timestamp */}
            <p className="text-xs text-stone-500 mb-6">
              {formatTimestamp(selectedNotification.timestamp)}
            </p>

            {/* Full message */}
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="prose prose-sm max-w-none">
                {selectedNotification.fullMessage.split('\n').map((paragraph, index) => (
                  <p key={index} className="text-sm text-stone-700 leading-relaxed mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Notifications</h1>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
        >
          <X className="w-5 h-5 text-stone-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-900 mb-1">No notifications</p>
              <p className="text-xs text-stone-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="mt-4">
              <div className="bg-white border-y border-stone-200 divide-y divide-stone-200">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full px-6 py-4 flex items-start gap-3 hover:bg-stone-50 transition-colors text-left"
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.severity === 'critical'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}>
                      {notification.severity === 'critical' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 mb-1 line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-stone-600 line-clamp-2 mb-1">
                        {notification.preview}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
