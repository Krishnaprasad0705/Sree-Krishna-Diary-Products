import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'gold' | 'neutral' | 'navy';
  };
  colorTheme?: 'emerald' | 'gold' | 'leaf' | 'charcoal' | 'warning' | 'error' | 'navy';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  colorTheme = 'navy',
  onClick,
  className = ''
}) => {
  const themeStyles = {
    navy: {
      bg: 'bg-white hover:border-brand-gold/60',
      iconBg: 'bg-brand-navy/10 text-brand-navy',
      border: 'border-stone-200/80',
    },
    emerald: {
      bg: 'bg-white hover:border-brand-gold/60',
      iconBg: 'bg-brand-navy/10 text-brand-navy',
      border: 'border-stone-200/80',
    },
    gold: {
      bg: 'bg-white hover:border-brand-gold',
      iconBg: 'bg-brand-goldLight text-brand-midnight border border-brand-champagne',
      border: 'border-stone-200/80',
    },
    leaf: {
      bg: 'bg-white hover:border-brand-navy/40',
      iconBg: 'bg-brand-navy/10 text-brand-navy',
      border: 'border-stone-200/80',
    },
    charcoal: {
      bg: 'bg-white hover:border-stone-400',
      iconBg: 'bg-stone-100 text-brand-midnight',
      border: 'border-stone-200/80',
    },
    warning: {
      bg: 'bg-white hover:border-amber-400',
      iconBg: 'bg-amber-50 text-amber-800',
      border: 'border-amber-200/60',
    },
    error: {
      bg: 'bg-white hover:border-rose-400',
      iconBg: 'bg-rose-50 text-brand-errorText',
      border: 'border-rose-200/60',
    }
  };

  const currentTheme = themeStyles[colorTheme] || themeStyles.navy;

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-3xl border shadow-card transition-all duration-200 ${
        currentTheme.bg
      } ${currentTheme.border} ${
        onClick ? 'cursor-pointer hover:shadow-elevated hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 pr-2">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-slate">{title}</p>
          <h4 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
            {value}
          </h4>
          {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl flex-shrink-0 ${currentTheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {badge && (
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
              badge.variant === 'success'
                ? 'bg-brand-success text-brand-successText'
                : badge.variant === 'warning'
                ? 'bg-brand-warning text-brand-warningText'
                : badge.variant === 'error'
                ? 'bg-brand-error text-brand-errorText'
                : badge.variant === 'gold'
                ? 'bg-brand-goldLight text-brand-midnight border border-brand-champagne'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {badge.text}
          </span>
          {onClick && (
            <span className="text-xs text-brand-navy font-bold flex items-center gap-0.5 hover:text-brand-gold transition-colors">
              View details &rarr;
            </span>
          )}
        </div>
      )}
    </div>
  );
};
