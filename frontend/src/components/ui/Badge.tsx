import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export type StockStatusType =
  | 'AVAILABLE'
  | 'SHELF_LOW'
  | 'SHELF_EMPTY'
  | 'WAREHOUSE_LOW'
  | 'COMPLETELY_OUT_OF_STOCK'
  | 'EXPIRING_SOON'
  | 'QUARANTINED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DRAFT'
  | 'ORDERED'
  | 'RECEIVED';

export interface BadgeProps {
  status?: StockStatusType | string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, label, className, size = 'md', children }) => {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    if (variant) {
      switch (variant) {
        case 'primary':
          return {
            text: children || label || 'Primary',
            style: 'bg-primary/10 text-primary border-primary/20',
            icon: null,
          };
        case 'success':
          return {
            text: children || label || 'Active',
            style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
          };
        case 'warning':
          return {
            text: children || label || 'Warning',
            style: 'bg-amber-50 text-amber-700 border-amber-200',
            icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          };
        case 'danger':
          return {
            text: children || label || 'Critical',
            style: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
            icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
          };
        case 'info':
          return {
            text: children || label || 'Info',
            style: 'bg-blue-50 text-blue-700 border-blue-200',
            icon: <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
          };
        case 'neutral':
        default:
          return {
            text: children || label || 'Neutral',
            style: 'bg-slate-100 text-slate-700 border-slate-200',
            icon: null,
          };
      }
    }

    switch (status) {
      case 'AVAILABLE':
        return {
          text: children || label || t('status.available', 'In Stock (Shelf)'),
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        };
      case 'SHELF_LOW':
        return {
          text: children || label || t('status.shelfLow', 'Shelf Low'),
          style: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
        };
      case 'SHELF_EMPTY':
        return {
          text: children || label || t('status.shelfEmpty', 'Shelf Empty — Refill Required'),
          style: 'bg-yellow-50 text-yellow-800 border-yellow-300 font-semibold',
          icon: <AlertCircle className="w-3.5 h-3.5 text-yellow-700 shrink-0" />,
        };
      case 'WAREHOUSE_LOW':
        return {
          text: children || label || t('status.warehouseLow', 'Warehouse Low'),
          style: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
        };
      case 'COMPLETELY_OUT_OF_STOCK':
        return {
          text: children || label || t('status.outOfStock', 'Completely Out of Stock'),
          style: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
        };
      case 'EXPIRING_SOON':
        return {
          text: children || label || t('status.expiringSoon', 'Expiring Soon'),
          style: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
        };
      case 'QUARANTINED':
        return {
          text: children || label || t('status.quarantined', 'Quarantined'),
          style: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-gray-600 shrink-0" />,
        };
      case 'RECEIVED':
        return {
          text: children || label || 'Received',
          style: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
        };
      case 'ORDERED':
        return {
          text: children || label || 'Ordered',
          style: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
        };
      default:
        return {
          text: children || label || String(status || 'Default'),
          style: 'bg-surface-muted text-text-secondary border-surface-border',
          icon: null,
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        sizeStyles,
        config.style,
        className
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
};
