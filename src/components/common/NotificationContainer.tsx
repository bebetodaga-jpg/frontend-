import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import type { NotificationType } from '../../context/NotificationContext';

const iconMap: Record<NotificationType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<NotificationType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/40',
    border: 'border-green-200 dark:border-green-700',
    icon: 'text-green-500 dark:text-green-400',
    text: 'text-green-800 dark:text-green-100',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/40',
    border: 'border-red-200 dark:border-red-700',
    icon: 'text-red-500 dark:text-red-400',
    text: 'text-red-800 dark:text-red-100',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/40',
    border: 'border-yellow-200 dark:border-yellow-700',
    icon: 'text-yellow-500 dark:text-yellow-400',
    text: 'text-yellow-800 dark:text-yellow-100',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/40',
    border: 'border-blue-200 dark:border-blue-700',
    icon: 'text-blue-500 dark:text-blue-400',
    text: 'text-blue-800 dark:text-blue-100',
  },
};

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-70 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type];
        const colors = colorMap[notification.type];

        return (
          <div
            key={notification.id}
            className={`${colors.bg} ${colors.border} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in`}
          >
            <Icon className={colors.icon} size={20} />
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${colors.text}`}>{notification.title}</p>
              {notification.message && (
                <p className={`text-sm ${colors.text} opacity-80 mt-1`}>{notification.message}</p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`${colors.text} opacity-60 hover:opacity-100`}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
