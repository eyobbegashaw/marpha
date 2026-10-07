import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, RefreshCw, AlertTriangle, PackageX, Sparkles, X } from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import { useTranslation } from '../../i18n/I18nContext';
import { Button } from './Button';
import { clsx } from 'clsx';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  is_read: boolean;
  is_resolved: boolean;
  action_link?: string;
  created_at: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tab, setTab] = useState<'UNREAD' | 'RESOLVED' | 'ALL'>('UNREAD');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get<NotificationItem[]>('/api/v1/notifications', {
        isResolved: tab === 'RESOLVED' ? true : tab === 'UNREAD' ? false : undefined,
      });
      if (res.data) setNotifications(res.data);
    } catch (e) {
      console.warn('Could not fetch notifications', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [tab]);

  const unreadCount = notifications.filter((n) => !n.is_read && !n.is_resolved).length;

  const markAsRead = async (id: string) => {
    try {
      await ApiClient.patch(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const markAsResolved = async (id: string) => {
    try {
      await ApiClient.patch(`/api/v1/notifications/${id}/resolve`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_resolved: true, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <PackageX className="w-4 h-4 text-rose-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors focus:ring-2 focus:ring-primary"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-96 bg-surface rounded-2xl sm:rounded-xl shadow-soft-xl border border-surface-border overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-subtle">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-text-primary">{t('notif.title', 'Operational Alerts')}</h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={loadNotifications}
                className="p-1 rounded text-text-muted hover:text-text-primary"
                title="Refresh"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin')} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-surface-border bg-surface text-xs font-medium">
            <button
              onClick={() => setTab('UNREAD')}
              className={clsx(
                'flex-1 py-2.5 text-center transition-colors border-b-2',
                tab === 'UNREAD'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              )}
            >
              {t('notif.unread', 'Active')} ({unreadCount})
            </button>
            <button
              onClick={() => setTab('RESOLVED')}
              className={clsx(
                'flex-1 py-2.5 text-center transition-colors border-b-2',
                tab === 'RESOLVED'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              )}
            >
              {t('notif.resolved', 'Resolved')}
            </button>
          </div>

          {/* List */}
          <div className="p-2 overflow-y-auto space-y-2 divide-y divide-surface-border/50 max-h-96">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                <CheckCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p>All operational alerts are clear!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={clsx(
                    'p-3 rounded-lg text-xs space-y-1.5 transition-colors',
                    !n.is_read ? 'bg-primary-light/40' : 'hover:bg-surface-subtle'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getSeverityIcon(n.severity)}
                      <span className="font-semibold text-text-primary">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-text-secondary leading-relaxed">{n.message}</p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-[11px] text-text-muted hover:text-primary font-medium"
                      >
                        {t('notif.markRead', 'Mark Read')}
                      </button>
                    )}
                    {!n.is_resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] py-1 px-2.5 h-6"
                        icon={<Check className="w-3 h-3 text-emerald-600" />}
                        onClick={() => markAsResolved(n.id)}
                      >
                        {t('notif.resolveAction', 'Resolve')}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
