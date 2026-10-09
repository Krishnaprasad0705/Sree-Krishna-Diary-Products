import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Repeat,
  Truck,
  ShoppingCart,
  CreditCard,
  FileText,
  Package,
  History,
  BarChart3,
  Settings,
  Search,
  Plus,
  Menu,
  X,
  Database,
  Calendar,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Milk,
  Boxes
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useStore } from '../../lib/store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { GlobalSearchModal } from './GlobalSearchModal';

interface AppLayoutProps {
  currentTab: string;
  onTabChange: (tab: string, entityId?: string) => void;
  onQuickAction: (action: 'add_customer' | 'record_delivery' | 'quick_sale' | 'record_payment' | 'generate_bill') => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onTabChange,
  onQuickAction,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const { adminUser, logout, settings } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'deliveries', label: 'Daily Deliveries', icon: Truck },
    { id: 'pos', label: 'Quick Sale', icon: ShoppingCart },
    { id: 'payments', label: 'Payments & Ledger', icon: CreditCard },
    { id: 'invoices', label: 'Monthly Bills', icon: FileText },
    { id: 'products', label: 'Products & Prices', icon: Package },
    { id: 'sales', label: 'Sales History', icon: History },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'stock', label: 'Stock & Inventory', icon: Boxes },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col md:flex-row font-sans selection:bg-brand-gold/30">
      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={(tab, id) => {
          onTabChange(tab, id);
        }}
      />

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-brand-midnight text-white shadow-card border-b border-brand-gold/30 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-xl text-brand-champagne hover:bg-white/10"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Logo size="sm" showText={true} theme="dark" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2 rounded-xl bg-white/10 text-brand-champagne hover:bg-white/20 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="p-2 rounded-xl bg-brand-gold text-brand-midnight hover:brightness-105 font-bold transition-transform active:scale-95 flex items-center gap-1 shadow-gold text-xs"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (Deep Midnight Navy with Gold Active states) */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-midnight text-white flex-shrink-0 border-r border-brand-navy/60 select-none no-print">
        {/* Brand Banner */}
        <div className="p-5 border-b border-brand-navy/80 flex items-center justify-between">
          <Logo size="md" showText={true} theme="dark" />
        </div>

        {/* Global Search Trigger Bar */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-brand-navy/60 hover:bg-brand-navy text-stone-300 text-xs border border-brand-gold/20 hover:border-brand-gold/50 transition-all shadow-inner group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-brand-gold" />
              <span>Search everything...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-brand-midnight rounded text-brand-gold border border-brand-gold/30">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-brand-midnight shadow-gold font-bold scale-[1.02] border border-brand-champagne'
                    : 'text-stone-300 hover:bg-brand-navy/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-midnight' : 'text-brand-gold'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-midnight opacity-80" />}
              </button>
            );
          })}
        </nav>

        {/* Database & Admin Footer */}
        <div className="p-4 border-t border-brand-navy/80 space-y-3 bg-brand-navy/30">
          <div className="flex items-center justify-between text-[11px] text-stone-300">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-brand-gold" />
              {isSupabaseConfigured ? 'Cloud Supabase' : 'Local Storage Engine'}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-navy text-brand-gold border border-brand-gold/30">
              Live & Synced
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-brand-navy/60">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-brand-gold/20 border border-brand-gold/60 flex items-center justify-center text-brand-gold font-bold text-xs shadow-gold">
                SK
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{adminUser?.name || settings.ownerName || 'Admin'}</p>
                <p className="text-[10px] text-brand-champagne/70 truncate">{settings.phone}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout session"
              className="p-1.5 text-stone-400 hover:text-rose-300 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-brand-midnight/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-brand-midnight text-white shadow-2xl animate-fade-in z-10 border-r border-brand-gold/30">
            <div className="p-4 border-b border-brand-navy flex items-center justify-between">
              <Logo size="sm" showText={true} theme="dark" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-brand-champagne hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-brand-gold text-brand-midnight shadow-gold font-bold'
                        : 'text-stone-300 hover:bg-brand-navy'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-midnight' : 'text-brand-gold'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-brand-navy">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{adminUser?.name || settings.ownerName || 'Admin'}</p>
                  <p className="text-[10px] text-brand-champagne/70">{settings.phone}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-2.5 py-1 text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Desktop App Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20 shadow-subtle no-print">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-navy capitalize">
                {navItems.find(n => n.id === currentTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-xs text-brand-slate font-medium">
                {settings.businessName} • {settings.villageTown}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Date Pill */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-goldLight border border-brand-gold/40 text-xs font-bold text-brand-midnight shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>{currentDateFormatted}</span>
            </div>

            {/* Quick Action Trigger Button */}
            <div className="relative">
              <button
                onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-midnight text-white text-xs font-bold tracking-wide transition-all shadow-subtle active:scale-95 border border-brand-gold/30 hover:border-brand-gold"
              >
                <Plus className="w-4 h-4 text-brand-gold" />
                <span>Quick Actions</span>
              </button>

              {quickMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setQuickMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-elevated border border-stone-200/80 py-2 z-40 animate-scale-in">
                    <button
                      onClick={() => {
                        onQuickAction('record_delivery');
                        setQuickMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-stone-700 hover:bg-brand-goldLight flex items-center gap-2.5"
                    >
                      <Truck className="w-4 h-4 text-brand-navy" />
                      Record Daily Delivery
                    </button>
                    <button
                      onClick={() => {
                        onQuickAction('quick_sale');
                        setQuickMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-stone-700 hover:bg-brand-goldLight flex items-center gap-2.5"
                    >
                      <ShoppingCart className="w-4 h-4 text-amber-600" />
                      Walk-in / Occasional Sale
                    </button>
                    <button
                      onClick={() => {
                        onQuickAction('add_customer');
                        setQuickMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-stone-700 hover:bg-brand-goldLight flex items-center gap-2.5"
                    >
                      <Users className="w-4 h-4 text-brand-navy" />
                      Add New Customer
                    </button>
                    <button
                      onClick={() => {
                        onQuickAction('record_payment');
                        setQuickMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-stone-700 hover:bg-brand-goldLight flex items-center gap-2.5"
                    >
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      Record Flexible Payment
                    </button>
                    <div className="border-t border-stone-100 my-1"></div>
                    <button
                      onClick={() => {
                        onQuickAction('generate_bill');
                        setQuickMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-brand-navy hover:bg-brand-goldLight flex items-center gap-2.5"
                    >
                      <FileText className="w-4 h-4 text-brand-navy" />
                      Generate Monthly Bill
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 px-2 py-1.5 flex items-center justify-around shadow-elevated no-print">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold ${
            currentTab === 'dashboard' ? 'text-brand-navy font-bold' : 'text-stone-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => onTabChange('customers')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold ${
            currentTab === 'customers' ? 'text-brand-navy font-bold' : 'text-stone-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Customers</span>
        </button>
        <button
          onClick={() => onQuickAction('quick_sale')}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-brand-navy text-white shadow-card border-2 border-brand-gold"
        >
          <ShoppingCart className="w-5 h-5 text-brand-gold" />
        </button>
        <button
          onClick={() => onTabChange('deliveries')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold ${
            currentTab === 'deliveries' ? 'text-brand-navy font-bold' : 'text-stone-500'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>Deliveries</span>
        </button>
        <button
          onClick={() => onTabChange('invoices')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold ${
            currentTab === 'invoices' ? 'text-brand-navy font-bold' : 'text-stone-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Bills</span>
        </button>
      </div>
    </div>
  );
};
