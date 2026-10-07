import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let listeners: ToastListener[] = [];
let toastsState: ToastItem[] = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toastsState]));
};

export const toast = {
  show: (type: ToastType, message: string, title?: string, duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, type, message, title, duration };
    toastsState = [...toastsState, newToast];
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },

  success: (message: string, title?: string, duration?: number) => {
    return toast.show('success', message, title || 'Success', duration);
  },

  error: (message: string, title?: string, duration?: number) => {
    return toast.show('error', message, title || 'Error', duration);
  },

  warning: (message: string, title?: string, duration?: number) => {
    return toast.show('warning', message, title || 'Warning', duration);
  },

  info: (message: string, title?: string, duration?: number) => {
    return toast.show('info', message, title || 'Info', duration);
  },

  dismiss: (id: string) => {
    toastsState = toastsState.filter((t) => t.id !== id);
    notifyListeners();
  },

  clearAll: () => {
    toastsState = [];
    notifyListeners();
  },
};

export const useToast = () => {
  return toast;
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>(toastsState);

  useEffect(() => {
    const listener: ToastListener = (updated) => {
      setToasts(updated);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none sm:max-w-md"
    >
      {toasts.map((item) => {
        const isSuccess = item.type === 'success';
        const isError = item.type === 'error';
        const isWarning = item.type === 'warning';

        return (
          <div
            key={item.id}
            role="status"
            className={clsx(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-soft-xl border bg-surface transition-all duration-200 animate-in slide-in-from-bottom-5 fade-in',
              isSuccess && 'border-emerald-300/80 bg-white ring-1 ring-emerald-500/20 text-slate-800',
              isError && 'border-rose-300/80 bg-white ring-1 ring-rose-500/20 text-slate-800',
              isWarning && 'border-amber-300/80 bg-white ring-1 ring-amber-500/20 text-slate-800',
              item.type === 'info' && 'border-blue-300/80 bg-white ring-1 ring-blue-500/20 text-slate-800'
            )}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {item.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-0.5">
              {item.title && (
                <h4
                  className={clsx(
                    'text-xs font-bold leading-tight',
                    isSuccess && 'text-emerald-900',
                    isError && 'text-rose-900',
                    isWarning && 'text-amber-900',
                    item.type === 'info' && 'text-blue-900'
                  )}
                >
                  {item.title}
                </h4>
              )}
              <p className="text-xs text-text-secondary leading-relaxed break-words">{item.message}</p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => toast.dismiss(item.id)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors shrink-0 -mr-1 -mt-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
