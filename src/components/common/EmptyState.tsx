import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white/60 border-2 border-dashed border-stone-200/80 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-cream/60 flex items-center justify-center text-brand-forest mb-4 shadow-subtle">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-serif text-xl font-semibold text-brand-emerald mb-1.5">{title}</h3>
      <p className="text-sm text-stone-500 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
