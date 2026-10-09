import React, { useState } from 'react';
import { Logo } from '../brand/Logo';
import { ShieldCheck, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

interface LoginScreenProps {
  onLogin: (pinOrPass: string) => boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter your owner security PIN');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = onLogin(pin);
      if (!success) {
        setError('Incorrect PIN. (Default test PIN is: 1234)');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    setPin('1234');
    setIsLoading(true);
    setTimeout(() => {
      onLogin('1234');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-midnight via-brand-navy to-brand-midnight flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-brand-gold/30 relative overflow-hidden">
      {/* Decorative Gold Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Official Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-3 bg-brand-midnight/80 rounded-full mb-4 border-2 border-brand-gold/50 shadow-gold">
            <Logo size="xl" showText={false} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Sree Krishna Dairy
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mt-1.5 flex items-center gap-1.5">
            <span>Official Admin Management Platform</span>
          </p>
          <p className="text-xs text-brand-champagne/80 mt-2 max-w-xs leading-relaxed">
            Pure Farm Milk & Traditional Ghee • Subscriptions, Daily Deliveries & Ledger.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-elevated border border-brand-champagne/60">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-midnight mb-2">
                Owner Security PIN / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-slate">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={e => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter 4-digit PIN (e.g. 1234)"
                  className="w-full pl-11 pr-4 py-3 bg-brand-ivory border border-stone-200 rounded-2xl text-brand-midnight font-bold focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-all"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs font-medium text-brand-errorText mt-2">{error}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-card"
              loading={isLoading}
            >
              <span>Unlock Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-2 text-brand-gold" />
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink mx-4 text-[11px] uppercase font-bold text-stone-400">or</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleQuickDemoLogin}
              className="w-full border border-brand-gold/60 text-brand-midnight"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
              <span>One-Click Owner Demo Login (PIN: 1234)</span>
            </Button>
          </form>

          {/* Security Guarantee */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-brand-slate">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Secure Admin Session • Private Business Ledger</span>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-6 text-center text-xs text-brand-champagne/60 space-y-1">
          <p>© {new Date().getFullYear()} Sree Krishna Dairy Products (SKDP). All rights reserved.</p>
          <p>Kanchipuram, Tamil Nadu, India</p>
        </div>
      </div>
    </div>
  );
};
