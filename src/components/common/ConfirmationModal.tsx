import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-midnight/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-elevated border border-brand-champagne/60 transition-all animate-scale-in my-8"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl flex-shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 flex-1">
              <h3 className="font-serif text-lg font-bold text-brand-navy">{title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={variant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {variant === 'danger' && <Trash2 className="w-3.5 h-3.5 mr-1" />}
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
