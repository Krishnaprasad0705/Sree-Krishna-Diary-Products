import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'gold' | 'emerald' | 'navy';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    success: 'bg-brand-success text-brand-successText border-emerald-200 font-semibold',
    warning: 'bg-brand-warning text-brand-warningText border-amber-200 font-semibold',
    error: 'bg-brand-error text-brand-errorText border-rose-200 font-semibold',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200 font-medium',
    gold: 'bg-brand-goldLight text-brand-midnight border-brand-gold/50 font-bold',
    navy: 'bg-brand-navy/10 text-brand-navy border-brand-navy/20 font-bold',
    emerald: 'bg-brand-navy/10 text-brand-navy border-brand-navy/20 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
