import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral' | {
    value: number | string;
    isPositive: boolean;
    period?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  trend,
  icon,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-surface border-surface-border text-text-primary',
    primary: 'bg-primary-light/50 border-primary/20 text-primary-dark',
    warning: 'bg-amber-50/60 border-amber-200 text-amber-900',
    danger: 'bg-rose-50/60 border-rose-200 text-rose-900',
    success: 'bg-emerald-50/60 border-emerald-200 text-emerald-900',
  };

  const iconBgStyles = {
    default: 'bg-surface-muted text-text-secondary',
    primary: 'bg-primary text-white',
    warning: 'bg-amber-500 text-white',
    danger: 'bg-rose-500 text-white',
    success: 'bg-emerald-500 text-white',
  };

  const renderTrend = () => {
    if (change) {
      const isUp = trend === 'up';
      const isDown = trend === 'down';
      return (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          {isUp && <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          {isDown && <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          <span className={clsx('font-medium', isUp ? 'text-emerald-700' : isDown ? 'text-rose-700' : 'text-slate-500')}>
            {change}
          </span>
        </div>
      );
    }

    if (typeof trend === 'object' && trend !== null) {
      return (
        <div className="mt-3 pt-3 border-t border-surface-border/60 flex items-center gap-1.5 text-xs">
          {trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          )}
          <span className={clsx('font-medium', trend.isPositive ? 'text-emerald-700' : 'text-rose-700')}>
            {trend.value}
          </span>
          {trend.period && <span className="text-text-muted">{trend.period}</span>}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={clsx(
        'p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        {icon && (
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>

      {renderTrend()}
    </div>
  );
};
