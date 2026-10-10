import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Info } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onStay: () => void;
  onExit: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onStay,
  onExit
}) => {
  const [attemptedExit, setAttemptedExit] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAttemptedExit(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onStay();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  const handleExitClick = () => {
    setAttemptedExit(true);
    try {
      window.close();
    } catch {
      // Browsers restrict closing tabs not opened by script
    }
    onExit();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-midnight/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onStay}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="w-full max-w-sm transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl border border-brand-gold/40 transition-all animate-scale-in my-8 p-6 space-y-5"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Icon & Brand */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
              <LogOut className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-brand-midnight">
                Want to exit?
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Are you sure you want to leave Sree Krishna Dairy Products?
              </p>
            </div>
          </div>

          {attemptedExit ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                Your browser prevents closing tabs automatically. You can now safely close this browser tab or press your device&apos;s Home button.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-brand-ivory border border-stone-200/70 text-center">
              <p className="text-[11px] text-stone-500">
                Your registered customers, delivery records, and sales remain safely preserved.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onStay}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-brand-navy hover:bg-brand-midnight text-white transition-all active:scale-95 shadow-card flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Stay</span>
            </button>

            <button
              onClick={handleExitClick}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
