import React, { useState } from 'react';
import { Logo } from '../brand/Logo';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  Settings,
  X
} from 'lucide-react';
import { Button } from '../common/Button';
import { useStore } from '../../lib/store';
import { isSupabaseConfigured, saveSupabaseCredentials, getSupabaseConfig } from '../../lib/supabase';

interface LoginScreenProps {
  onLogin?: (pinOrPass: string) => boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { loginWithEmail, signUpOwnerAccount, loginWithPin, syncStatus } = useStore();

  const isCloudDbConfigured = isSupabaseConfigured();
  const [activeTab, setActiveTab] = useState<'email' | 'pin' | 'setup'>(
    isCloudDbConfigured ? 'email' : 'pin'
  );

  // Email/Pass state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('S. Radhakrishnan');
  const [showPassword, setShowPassword] = useState(false);

  // PIN state
  const [pin, setPin] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cloud Config Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const currentConfig = getSupabaseConfig();
  const [configUrl, setConfigUrl] = useState(currentConfig.url);
  const [configKey, setConfigKey] = useState(currentConfig.anonKey);
  const [configStatus, setConfigStatus] = useState('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl.trim() || !configKey.trim()) {
      setConfigStatus('Please fill in both URL and Key');
      return;
    }
    saveSupabaseCredentials(configUrl.trim(), configKey.trim());
    window.location.reload();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both admin email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await loginWithEmail(email, password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid email or password. If this is your first time, use "First-Time Owner Setup".');
    }
  };

  const handleOwnerSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter owner email and a secure password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await signUpOwnerAccount(email, password, fullName);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('Owner account registered successfully! You can now log in.');
      setActiveTab('email');
    } else {
      setError(res.error || 'Failed to initialize owner account');
    }
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter your 4-digit security PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      let success = false;
      if (loginWithPin) {
        success = loginWithPin(pin);
      } else if (onLogin) {
        success = onLogin(pin);
      }

      if (!success) {
        setError('Incorrect PIN. (Default owner PIN is: 1234)');
        setIsLoading(false);
      }
    }, 300);
  };

  const handleQuickDemoPin = () => {
    setPin('1234');
    setIsLoading(true);
    setTimeout(() => {
      if (loginWithPin) {
        loginWithPin('1234');
      } else if (onLogin) {
        onLogin('1234');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-midnight via-brand-navy to-brand-midnight flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-brand-gold/30 relative overflow-hidden">
      {/* Decorative Gold Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Official Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="p-3 bg-brand-midnight/80 rounded-full mb-3 border-2 border-brand-gold/50 shadow-gold">
            <Logo size="xl" showText={false} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Sree Krishna Dairy
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mt-1.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Official Admin Management Platform</span>
          </p>
          <p className="text-xs text-brand-champagne/80 mt-1.5 max-w-xs leading-relaxed">
            Pure Farm Milk &amp; Traditional Ghee • Multi-Device Synchronized Ledger
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-elevated border border-brand-champagne/60">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'email' || activeTab === 'setup'
                  ? 'bg-brand-navy text-white shadow-card'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-brand-gold" />
              <span>Admin Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('pin');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'pin'
                  ? 'bg-brand-navy text-white shadow-card'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Security PIN</span>
            </button>
          </div>

          {/* Cloud Database Status & Quick Setup Pill */}
          <div className="mb-4 flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCloudDbConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-medium text-stone-600">
                {isCloudDbConfigured ? 'Supabase Cloud Synced' : 'Offline / Local Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="text-brand-navy hover:text-brand-midnight font-bold flex items-center gap-1 hover:underline"
            >
              <Settings className="w-3 h-3" />
              <span>{isCloudDbConfigured ? 'Cloud Config' : 'Connect Cloud'}</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* Tab 1: Supabase Cloud Email & Password Authentication */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-midnight mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="owner@sreekrishnadairy.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-brand-ivory border border-stone-200 rounded-xl text-xs font-medium text-brand-midnight focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-midnight mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-brand-ivory border border-stone-200 rounded-xl text-xs font-medium text-brand-midnight focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-card mt-2"
                loading={isLoading}
              >
                <span>Sign In with Cloud Account</span>
                <ArrowRight className="w-4 h-4 ml-2 text-brand-gold" />
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('setup');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-bold text-brand-forest hover:text-brand-emerald hover:underline transition-all"
                >
                  First-time owner? Click here to setup owner account &rarr;
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: First-Time Owner Account Setup */}
          {activeTab === 'setup' && (
            <form onSubmit={handleOwnerSetup} className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>First-Time Owner Setup:</strong> This registers the business owner credentials in Supabase Auth. Public registration is restricted.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-midnight mb-1.5">
                  Business Owner Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="S. Radhakrishnan"
                    className="w-full pl-10 pr-4 py-2.5 bg-brand-ivory border border-stone-200 rounded-xl text-xs font-medium text-brand-midnight"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-midnight mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="owner@sreekrishnadairy.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-brand-ivory border border-stone-200 rounded-xl text-xs font-medium text-brand-midnight"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-midnight mb-1.5">
                  Secure Password (min 6 chars)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-brand-ivory border border-stone-200 rounded-xl text-xs font-medium text-brand-midnight"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-card mt-2"
                loading={isLoading}
              >
                <span>Create Admin Account</span>
                <CheckCircle2 className="w-4 h-4 ml-2 text-brand-gold" />
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('email');
                    setError('');
                  }}
                  className="text-xs font-bold text-stone-600 hover:underline"
                >
                  Already registered? Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Security PIN (Offline / Fallback Access) */}
          {activeTab === 'pin' && (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-midnight mb-1.5">
                  Owner Security PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={pin}
                    onChange={e => {
                      setPin(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter 4-digit PIN (e.g. 1234)"
                    className="w-full pl-10 pr-4 py-3 bg-brand-ivory border border-stone-200 rounded-2xl text-brand-midnight font-bold tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-card"
                loading={isLoading}
              >
                <span>Unlock Local Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-2 text-brand-gold" />
              </Button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-stone-400">Quick Login</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleQuickDemoPin}
                className="w-full border border-brand-gold/60 text-brand-midnight text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                <span>One-Click Owner Demo PIN (1234)</span>
              </Button>
            </form>
          )}

          {/* Security Guarantee */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-center gap-2 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Authenticated Admin Session • Row-Level Security Protected</span>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-6 text-center text-xs text-brand-champagne/60 space-y-1">
          <p>© {new Date().getFullYear()} Sree Krishna Dairy Products (SKDP). All rights reserved.</p>
          <p>Kanchipuram, Tamil Nadu, India</p>
        </div>
      </div>

      {/* Cloud DB Credentials Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative">
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-brand-navy/10 rounded-2xl text-brand-navy">
                <Cloud className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-midnight">Supabase Cloud Database</h3>
                <p className="text-xs text-stone-500">Enter project credentials for multi-device real-time sync</p>
              </div>
            </div>

            {configStatus && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                {configStatus}
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  value={configUrl}
                  onChange={e => setConfigUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Anon Public Key
                </label>
                <textarea
                  required
                  rows={3}
                  value={configKey}
                  onChange={e => setConfigKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold shadow-card"
                >
                  Save &amp; Reload App
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
