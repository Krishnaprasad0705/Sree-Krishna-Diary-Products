import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  RefreshCw,
  Database,
  Building,
  Phone,
  MapPin,
  QrCode,
  Globe,
  Cloud,
  CloudOff,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Server,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { BusinessSettings } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import {
  getSupabaseConfig,
  saveSupabaseCredentials,
  testSupabaseConnection
} from '../../lib/supabase';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDefaultData,
    exportDataJSON,
    importDataJSON,
    syncStatus,
    isCloudConnected,
    lastSyncedAt,
    syncError,
    syncNow,
    uploadLocalToCloud,
    customers,
    subscriptions,
    deliveries,
    sales,
    payments,
    invoices
  } = useStore();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Cloud Config State
  const initialConfig = getSupabaseConfig();
  const [urlInput, setUrlInput] = useState(initialConfig.url);
  const [anonKeyInput, setAnonKeyInput] = useState(initialConfig.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleChange = (field: keyof BusinessSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    showToast('Business settings saved successfully!');
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sree_Krishna_Dairy_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded full business backup JSON');
  };

  const handleImportSubmit = () => {
    if (!jsonInput.trim()) return;
    const success = importDataJSON(jsonInput);
    if (success) {
      showToast('Successfully restored business backup!');
      setIsImporting(false);
      setJsonInput('');
    } else {
      showToast('Invalid backup JSON format', 'error');
    }
  };

  const handleFactoryReset = () => {
    if (
      window.confirm(
        'Reset to default benchmark dataset? This will restore Ramesh Kumar test cases and fresh sample deliveries.'
      )
    ) {
      resetToDefaultData();
      showToast('Reset to default benchmark data successfully');
    }
  };

  const handleConnectCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !anonKeyInput.trim()) {
      showToast('Please provide both Supabase Project URL and Anon Key', 'error');
      return;
    }

    setIsTesting(true);
    saveSupabaseCredentials(urlInput.trim(), anonKeyInput.trim());

    const testRes = await testSupabaseConnection();
    setIsTesting(false);

    if (testRes.success) {
      showToast(`Connected to Supabase Cloud! Latency: ${testRes.latencyMs}ms`);
      await syncNow();
    } else {
      showToast(`Connection failed: ${testRes.error}`, 'error');
    }
  };

  const handleDisconnectCloud = () => {
    if (window.confirm('Disconnect Supabase Cloud sync? The application will continue using local browser storage.')) {
      saveSupabaseCredentials('', '');
      setUrlInput('');
      setAnonKeyInput('');
      showToast('Disconnected from Supabase Cloud');
      window.location.reload();
    }
  };

  const handleUploadLocalDataToCloud = async () => {
    setIsUploadingCloud(true);
    const res = await uploadLocalToCloud();
    setIsUploadingCloud(false);

    if (res.success) {
      showToast(`Successfully uploaded ${res.count} records to Supabase Cloud!`);
    } else {
      showToast(`Upload failed: ${res.error}`, 'error');
    }
  };

  const handleCopySqlSchema = () => {
    const sqlSchema = `-- ==============================================================================
-- SREE KRISHNA DAIRY PRODUCTS - PRODUCTION CLOUD DATABASE SCHEMA
-- Target Database: PostgreSQL 15+ / Supabase
-- Supports Multi-Device Realtime Synchronization & Offline Sync
-- ==============================================================================

CREATE TABLE IF NOT EXISTS business_settings (
    id TEXT PRIMARY KEY DEFAULT 'skd_primary_business_settings',
    business_name VARCHAR(255) NOT NULL DEFAULT 'Sree Krishna Dairy Products',
    tagline VARCHAR(255) DEFAULT 'Pure, Fresh Farm Milk & Traditional Ghee',
    owner_name VARCHAR(255) DEFAULT 'S. Radhakrishnan',
    phone VARCHAR(30) NOT NULL DEFAULT '+91 98401 23456',
    alternate_phone VARCHAR(30),
    email VARCHAR(255) DEFAULT 'sreekrishnadairy@gmail.com',
    address TEXT NOT NULL DEFAULT 'No. 14, Main Road, Krishna Nagar',
    village_town VARCHAR(100) DEFAULT 'Kanchipuram',
    district_state VARCHAR(100) DEFAULT 'Tamil Nadu',
    pincode VARCHAR(20) DEFAULT '631501',
    upi_id VARCHAR(100) DEFAULT 'sreekrishnadairy@upi',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    invoice_prefix VARCHAR(20) DEFAULT 'SKD',
    default_milk_rate_per_liter NUMERIC(10, 2) DEFAULT 60.00,
    default_ghee_rate_per_liter NUMERIC(10, 2) DEFAULT 700.00,
    enable_stock_tracking BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    delivery_instructions TEXT,
    category VARCHAR(50) DEFAULT 'REGULAR',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    unit VARCHAR(20) DEFAULT 'ml',
    current_price_per_liter NUMERIC(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    packages_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    old_price NUMERIC(10, 2) NOT NULL,
    new_price NUMERIC(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    reason TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    pricing_model VARCHAR(50) DEFAULT 'ACTUAL_DELIVERY',
    expected_daily_quantity_ml INTEGER NOT NULL DEFAULT 1000,
    fixed_monthly_amount NUMERIC(10, 2),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    schedule VARCHAR(50) DEFAULT 'EVERYDAY',
    start_date DATE NOT NULL,
    renewal_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_records (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    quantity_ml INTEGER NOT NULL DEFAULT 0,
    extra_quantity_ml INTEGER NOT NULL DEFAULT 0,
    unit_price_per_liter NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'DELIVERED',
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT,
    customer_name VARCHAR(255) NOT NULL,
    is_walk_in BOOLEAN DEFAULT FALSE,
    total_amount NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    final_amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PAID',
    payment_method VARCHAR(50) DEFAULT 'CASH',
    notes TEXT,
    items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    reference_no VARCHAR(100),
    invoice_id TEXT,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30),
    customer_address TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    previous_balance NUMERIC(12, 2) DEFAULT 0.00,
    subscription_charges NUMERIC(12, 2) DEFAULT 0.00,
    delivery_charges NUMERIC(12, 2) DEFAULT 0.00,
    extra_milk_charges NUMERIC(12, 2) DEFAULT 0.00,
    ghee_charges NUMERIC(12, 2) DEFAULT 0.00,
    adjustments NUMERIC(12, 2) DEFAULT 0.00,
    total_payable NUMERIC(12, 2) NOT NULL,
    payments_allocated NUMERIC(12, 2) DEFAULT 0.00,
    remaining_due NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ISSUED',
    notes TEXT,
    line_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_items (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    current_stock_liters NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity_liters NUMERIC(10, 2) NOT NULL,
    notes TEXT
);

-- RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins only for business_settings" ON business_settings FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for customers" ON customers FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for products" ON products FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for price_history" ON price_history FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for subscriptions" ON subscriptions FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for delivery_records" ON delivery_records FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for sales" ON sales FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for payments" ON payments FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for invoices" ON invoices FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for stock_items" ON stock_items FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated admins only for stock_movements" ON stock_movements FOR ALL TO authenticated USING (auth.role() = 'authenticated');

ALTER TABLE business_settings REPLICA IDENTITY FULL;
ALTER TABLE customers REPLICA IDENTITY FULL;
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE price_history REPLICA IDENTITY FULL;
ALTER TABLE subscriptions REPLICA IDENTITY FULL;
ALTER TABLE delivery_records REPLICA IDENTITY FULL;
ALTER TABLE sales REPLICA IDENTITY FULL;
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE invoices REPLICA IDENTITY FULL;
ALTER TABLE stock_items REPLICA IDENTITY FULL;
ALTER TABLE stock_movements REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE business_settings, customers, products, price_history, subscriptions, delivery_records, sales, payments, invoices, stock_items, stock_movements;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;`;

    navigator.clipboard.writeText(sqlSchema);
    setHasCopiedSql(true);
    showToast('SQL Schema copied to clipboard! Paste it into Supabase SQL Editor.');
    setTimeout(() => setHasCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            System & Brand Configuration
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Business Settings & Cloud Sync
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage dairy profile, UPI QR for billing, and cross-device cloud synchronization.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
              isCloudConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : syncStatus === 'syncing'
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : syncStatus === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-stone-100 text-stone-700 border-stone-300'
            }`}
          >
            {isCloudConnected ? (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>Cloud Synced ⚡</span>
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>Syncing Cloud...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Sync Error</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-stone-500" />
                <span>Local Storage Mode</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-stone-200/80">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h3 className="font-serif text-lg font-bold text-brand-emerald flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-forest" />
                Business Profile & Invoice Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={e => handleChange('businessName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={e => handleChange('ownerName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Primary Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="text"
                    value={formData.alternatePhone || ''}
                    onChange={e => handleChange('alternatePhone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Village / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.villageTown}
                    onChange={e => handleChange('villageTown', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Farm / Business Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    District & State
                  </label>
                  <input
                    type="text"
                    value={formData.districtState}
                    onChange={e => handleChange('districtState', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={e => handleChange('pincode', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    UPI ID for Customer QR Payments
                  </label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={e => handleChange('upiId', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Invoice Number Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.invoicePrefix}
                    onChange={e => handleChange('invoicePrefix', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end">
                <Button type="submit" variant="primary" size="md">
                  <Save className="w-4 h-4 mr-2" />
                  Save Business Settings
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Cloud Database Sync & Migration Tools */}
        <div className="space-y-6">
          {/* Cloud Database Integration Card */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-brand-emerald flex items-center gap-2">
                <Cloud className="w-5 h-5 text-brand-forest" />
                Cross-Device Cloud Sync
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isCloudConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isCloudConnected ? 'Realtime Active' : 'Offline / Local'}
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Connect your PostgreSQL cloud database (Supabase) to automatically synchronize all customer profiles, deliveries, sales, and invoices in real-time across your phone and PC.
            </p>

            {/* Connection Metrics */}
            <div className="p-3.5 rounded-2xl bg-brand-cream/40 border border-brand-cream text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-500">Database Engine:</span>
                <span className="font-bold text-stone-800">
                  {isCloudConnected ? 'PostgreSQL (Supabase Cloud)' : 'Browser Local Storage'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-500">Last Synced:</span>
                <span className="font-bold text-stone-800">
                  {lastSyncedAt ? `${lastSyncedAt}` : 'Not synced yet'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-500">Synced Records:</span>
                <span className="font-bold text-brand-forest">
                  {customers.length} Customers • {deliveries.length} Deliveries • {sales.length} Sales
                </span>
              </div>
              {syncError && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{syncError}</span>
                </div>
              )}
            </div>

            {/* Supabase Credentials Form */}
            <form onSubmit={handleConnectCloud} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Supabase Project URL</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-brand-forest hover:underline flex items-center gap-0.5"
                  >
                    Supabase Console <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Supabase Anon Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  value={anonKeyInput}
                  onChange={e => setAnonKeyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isTesting}
                  className="w-full text-xs flex items-center justify-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Connecting...' : 'Connect & Sync'}</span>
                </Button>

                {isCloudConnected ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectCloud}
                    className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <CloudOff className="w-3.5 h-3.5 mr-1" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full text-xs"
                  >
                    Setup Guide
                  </Button>
                )}
              </div>
            </form>

            {/* Action Tools */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => syncNow()}
                className="w-full text-xs font-bold text-brand-navy border border-brand-gold/40 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-brand-gold" />
                <span>Sync Now (Fetch Cloud Data)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingCloud || !isCloudConnected}
                onClick={handleUploadLocalDataToCloud}
                className="w-full text-xs font-bold text-brand-forest border border-emerald-300 hover:bg-emerald-50 flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isUploadingCloud ? 'Migrating Data...' : 'Upload Local Data to Cloud'}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopySqlSchema}
                className="w-full text-xs text-stone-600 hover:text-stone-900 flex items-center justify-center gap-1.5"
              >
                {hasCopiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopiedSql ? 'Schema Copied!' : 'Copy Supabase SQL Schema'}</span>
              </Button>
            </div>

            {/* Supabase Step-by-Step Guide */}
            {showGuide && (
              <div className="mt-3 p-4 bg-brand-midnight text-stone-200 rounded-2xl text-xs space-y-2.5 animate-scale-in">
                <p className="font-bold text-brand-champagne flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-brand-gold" /> Quick 2-Minute Supabase Cloud Setup:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-300 leading-relaxed">
                  <li>Create a free account and project on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-brand-gold underline">supabase.com</a>.</li>
                  <li>Click <strong>SQL Editor</strong> &rarr; <strong>New Query</strong>, paste the schema by clicking &quot;Copy Supabase SQL Schema&quot; above, and click <strong>RUN</strong>.</li>
                  <li>Go to <strong>Project Settings</strong> &rarr; <strong>API</strong>, copy the <em>Project URL</em> and <em>anon public key</em> into the inputs above.</li>
                  <li>Click <strong>Connect &amp; Sync</strong>! All devices will now access the exact same live business records in real time.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Backup & JSON Export/Import */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 space-y-4">
            <h3 className="font-serif text-lg font-bold text-brand-emerald">Data Backup & Export</h3>
            <p className="text-xs text-stone-500">
              Download complete business records (customers, delivery ledger, invoices, pricing) in JSON format.
            </p>

            <div className="space-y-2.5">
              <Button variant="outline" size="sm" onClick={handleDownloadBackup} className="w-full">
                <Download className="w-4 h-4 mr-2 text-brand-forest" />
                Download JSON Backup
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsImporting(!isImporting)}
                className="w-full border border-brand-gold/40 text-brand-forest"
              >
                <Upload className="w-4 h-4 mr-2 text-brand-gold" />
                Restore from Backup JSON
              </Button>

              {isImporting && (
                <div className="pt-2 space-y-2">
                  <textarea
                    rows={4}
                    placeholder="Paste backup JSON string here..."
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                  <Button variant="primary" size="sm" onClick={handleImportSubmit} className="w-full">
                    Confirm Restore
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFactoryReset}
                className="w-full text-xs text-rose-600 hover:bg-rose-50"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Reset to Sample Benchmark Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
