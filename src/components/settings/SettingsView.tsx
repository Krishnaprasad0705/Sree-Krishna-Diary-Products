import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  RefreshCw,
  Database,
  ShieldCheck,
  Building,
  Phone,
  MapPin,
  QrCode,
  Globe
} from 'lucide-react';
import { BusinessSettings } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { isSupabaseConfigured } from '../../lib/supabase';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDefaultData, exportDataJSON, importDataJSON } = useStore();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  React.useEffect(() => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            System & Brand Configuration
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Business Settings
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage dairy business profile, contact details for invoices, UPI QR, and data backups.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-stone-200/80">
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

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Shop / Dairy Farm Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Town / City
                </label>
                <input
                  type="text"
                  value={formData.villageTown}
                  onChange={e => handleChange('villageTown', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

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
                  Pincode
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

        {/* Database & Data Backup Tools (Right) */}
        <div className="space-y-6">
          {/* Supabase / Cloud Status */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 space-y-4">
            <h3 className="font-serif text-lg font-bold text-brand-emerald flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-forest" />
              Database Engine
            </h3>

            <div className="p-3.5 rounded-2xl bg-brand-cream/40 border border-brand-cream text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">Connection State:</span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {isSupabaseConfigured ? 'Supabase Cloud Connected' : 'Local Storage Engine Synced'}
                </span>
              </div>
              <p className="text-stone-600 text-[11px]">
                {isSupabaseConfigured
                  ? 'All records replicate to PostgreSQL backend in real-time.'
                  : 'Operating in self-contained local storage mode. To connect Supabase, configure VITE_SUPABASE_URL in .env.'}
              </p>
            </div>
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
