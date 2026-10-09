import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-base rounded-2xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-brand-navy text-white hover:bg-brand-midnight active:scale-[0.98] shadow-subtle border border-brand-navy/80 hover:border-brand-gold/50 font-semibold',
    secondary:
      'bg-brand-goldLight text-brand-navy hover:bg-brand-champagne/60 active:scale-[0.98] border border-brand-champagne font-semibold',
    outline:
      'bg-white text-brand-midnight hover:bg-brand-ivory border border-stone-200 hover:border-brand-gold/60 active:scale-[0.98] shadow-subtle font-medium',
    gold:
      'bg-gradient-to-r from-brand-gold to-amber-500 text-brand-midnight font-bold hover:brightness-105 active:scale-[0.98] shadow-gold border border-brand-champagne',
    danger:
      'bg-brand-errorText text-white hover:bg-red-700 active:scale-[0.98] shadow-sm font-semibold',
    ghost:
      'bg-transparent text-brand-slate hover:bg-brand-goldLight/60 hover:text-brand-navy active:scale-[0.98]',
  };

  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
