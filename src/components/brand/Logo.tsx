import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'dark',
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base font-semibold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl font-bold',
    '2xl': 'text-3xl font-bold'
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
    '2xl': 'text-base'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Authentic Official Logo Image */}
      <div className={`relative flex-shrink-0 ${iconSizes[size]} transition-transform duration-300 hover:scale-105 rounded-full overflow-hidden shadow-gold border border-brand-gold/40`}>
        <img
          src="/logo.png"
          alt="Sree Krishna Dairy Products Logo"
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback gracefully to /skdp-logo.png if needed
            (e.target as HTMLImageElement).src = '/skdp-logo.png';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-serif tracking-tight font-bold ${
                theme === 'dark' ? 'text-white' : 'text-brand-navy'
              } ${titleSizes[size]}`}
            >
              Sree Krishna
            </span>
            <span className="text-brand-midnight text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-brand-gold to-amber-400 border border-brand-champagne shadow-sm">
              SKDP
            </span>
          </div>
          <span
            className={`font-sans tracking-wider uppercase font-semibold text-[10px] ${
              theme === 'dark' ? 'text-brand-champagne' : 'text-brand-slate'
            } ${subtitleSizes[size]}`}
          >
            Dairy Products • Purity & Trust
          </span>
        </div>
      )}
    </div>
  );
};
