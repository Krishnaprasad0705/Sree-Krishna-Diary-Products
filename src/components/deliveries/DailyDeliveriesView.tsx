import React, { useState, useMemo } from 'react';
import {
  Truck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  Edit2,
  Trash2,
  Users,
  Sparkles,
  Milk,
  Layers
} from 'lucide-react';
import { DeliveryRecord } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { formatCurrency, formatVolume } from '../../lib/calculations';

interface DailyDeliveriesViewProps {
  initialCustomerId?: string;
}

export const DailyDeliveriesView: React.FC<DailyDeliveriesViewProps> = ({ initialCustomerId }) => {
  const {
    customers,
    subscriptions,
    deliveries,
    recordDelivery,
    recordBulkDeliveries,
    updateDelivery,
    deleteDelivery,
    settings
  } = useStore();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Single delivery modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [quantityMl, setQuantityMl] = useState<number>(1000);
  const [extraQuantityMl, setExtraQuantityMl] = useState<number>(0);
  const [unitRate, setUnitRate] = useState<number>(settings.defaultMilkRatePerLiter);
  const [notes, setNotes] = useState('');

  // Bulk mode modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkEntries, setBulkEntries] = useState<Record<string, { stdMl: number; extraMl: number; skip: boolean }>>({});

  // Active regular customers
  const regularCustomers = useMemo(() => {
    return customers.filter(c => c.status === 'ACTIVE' && c.category === 'REGULAR');
  }, [customers]);

  // Deliveries for selected date
  const dateDeliveries = useMemo(() => {
    return deliveries
      .filter(d => d.date === selectedDate)
      .sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));
  }, [deliveries, selectedDate]);

  const deliveredCustomerIds = useMemo(() => {
    return new Set(dateDeliveries.map(d => d.customerId));
  }, [dateDeliveries]);

  // Pending for selected date
  const pendingCustomers = useMemo(() => {
    return regularCustomers.filter(c => !deliveredCustomerIds.has(c.id));
  }, [regularCustomers, deliveredCustomerIds]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Open single delivery modal for a customer
  const handleOpenRecordSingle = (customerId?: string) => {
    const custId = customerId || regularCustomers[0]?.id || '';
    setSelectedCustomerId(custId);

    const sub = subscriptions.find(s => s.customerId === custId);
    setQuantityMl(sub?.expectedDailyQuantityMl || 1000);
    setExtraQuantityMl(0);
    setUnitRate(settings.defaultMilkRatePerLiter);
    setNotes('');
    setIsRecordModalOpen(true);
  };

  // 1-Tap Quick Submit from customer card
  const handleQuickOneTap = (customer: typeof regularCustomers[0]) => {
    const sub = subscriptions.find(s => s.customerId === customer.id);
    const stdQty = sub?.expectedDailyQuantityMl || 1000;
    const totalMl = stdQty;
    const totalAmount = (totalMl / 1000) * settings.defaultMilkRatePerLiter;

    recordDelivery({
      date: selectedDate,
      customerId: customer.id,
      customerName: customer.name,
      quantityMl: stdQty,
      extraQuantityMl: 0,
      unitPricePerLiter: settings.defaultMilkRatePerLiter,
      totalAmount,
      status: 'DELIVERED',
      notes: '1-Tap Recorded'
    });

    showToast(`Recorded ${formatVolume(stdQty)} for ${customer.name}`);
  };

  // Submit single delivery
  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const totalMl = quantityMl + extraQuantityMl;
    const totalAmount = (totalMl / 1000) * unitRate;

    recordDelivery({
      date: selectedDate,
      customerId: selectedCustomerId,
      customerName: customer?.name || 'Customer',
      quantityMl,
      extraQuantityMl,
      unitPricePerLiter: unitRate,
      totalAmount,
      status: 'DELIVERED',
      notes
    });

    showToast(`Delivery recorded for ${customer?.name}`);
    setIsRecordModalOpen(false);
  };

  // Open Bulk Entry Dialog
  const handleOpenBulk = () => {
    const initialMap: Record<string, { stdMl: number; extraMl: number; skip: boolean }> = {};
    regularCustomers.forEach(c => {
      const sub = subscriptions.find(s => s.customerId === c.id);
      const existing = dateDeliveries.find(d => d.customerId === c.id);

      initialMap[c.id] = {
        stdMl: existing ? existing.quantityMl : sub?.expectedDailyQuantityMl || 1000,
        extraMl: existing ? existing.extraQuantityMl : 0,
        skip: existing?.status === 'SKIPPED' || sub?.status === 'PAUSED'
      };
    });
    setBulkEntries(initialMap);
    setIsBulkModalOpen(true);
  };

  // Save Bulk Entries
  const handleSaveBulk = () => {
    const recordsToSave: Array<Omit<DeliveryRecord, 'id' | 'recordedAt'>> = [];

    regularCustomers.forEach(c => {
      const entry = bulkEntries[c.id];
      if (entry && !entry.skip) {
        const totalMl = entry.stdMl + entry.extraMl;
        const totalAmount = (totalMl / 1000) * settings.defaultMilkRatePerLiter;

        recordsToSave.push({
          date: selectedDate,
          customerId: c.id,
          customerName: c.name,
          quantityMl: entry.stdMl,
          extraQuantityMl: entry.extraMl,
          unitPricePerLiter: settings.defaultMilkRatePerLiter,
          totalAmount,
          status: 'DELIVERED',
          notes: 'Batch Bulk Recorded'
        });
      }
    });

    recordBulkDeliveries(recordsToSave);
    showToast(`Successfully batch recorded ${recordsToSave.length} deliveries!`);
    setIsBulkModalOpen(false);
  };

  // Summary stats for selected date
  const totalLitersOnDate = dateDeliveries.reduce((sum, d) => sum + d.quantityMl + d.extraQuantityMl, 0);
  const totalAmountOnDate = dateDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Single Delivery Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Milk Delivery"
        subtitle={`Date: ${selectedDate}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveDelivery} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                const sub = subscriptions.find(s => s.customerId === e.target.value);
                if (sub) setQuantityMl(sub.expectedDailyQuantityMl);
              }}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-forest/20"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.location}) - {c.category}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Preset Buttons for Standard Quantity */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Standard Subscription Milk Quantity
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[250, 500, 750, 1000, 1500, 2000].map(vol => (
                <button
                  type="button"
                  key={vol}
                  onClick={() => setQuantityMl(vol)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                    quantityMl === vol
                      ? 'bg-brand-forest text-white shadow-sm ring-2 ring-brand-forest'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {formatVolume(vol)}
                </button>
              ))}
            </div>
          </div>

          {/* Extra Milk Input (Separately Identifiable) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                Additional / Extra Milk (Optional)
              </label>
              <span className="text-[11px] text-amber-700 font-medium">Billed separately</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 250, 500, 1000].map(vol => (
                <button
                  type="button"
                  key={vol}
                  onClick={() => setExtraQuantityMl(vol)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    extraQuantityMl === vol
                      ? 'bg-amber-700 text-white font-bold'
                      : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {vol === 0 ? 'None' : `+${formatVolume(vol)}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Rate per Litre (₹)
              </label>
              <input
                type="number"
                value={unitRate}
                onChange={e => setUnitRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Total Charge (₹)
              </label>
              <div className="px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm font-serif font-bold text-brand-forest">
                {formatCurrency(((quantityMl + extraQuantityMl) / 1000) * unitRate)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Delivered 6:15 AM, extra for festival"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Delivery
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Entry Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Batch Record All Morning Deliveries"
        subtitle={`Batch entry for ${selectedDate} • Quickly verify subscriber list and quantities`}
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500">
            Standard quantities are pre-filled based on each customer's active subscription. Adjust extras or toggle skip if a customer didn't take milk today.
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100">
            {regularCustomers.map(c => {
              const entry = bulkEntries[c.id] || { stdMl: 1000, extraMl: 0, skip: false };
              return (
                <div
                  key={c.id}
                  className={`pt-2.5 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 rounded-xl transition-colors ${
                    entry.skip ? 'bg-stone-100 opacity-60' : 'hover:bg-brand-ivory/50'
                  }`}
                >
                  <div className="min-w-[180px]">
                    <p className="font-bold text-xs text-stone-900">{c.name}</p>
                    <p className="text-[11px] text-stone-500">{c.location}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Standard qty selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-stone-400">Std:</span>
                      <select
                        disabled={entry.skip}
                        value={entry.stdMl}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setBulkEntries(prev => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], stdMl: val }
                          }));
                        }}
                        className="px-2 py-1 text-xs border border-stone-200 rounded-lg bg-white"
                      >
                        <option value={250}>250 ml</option>
                        <option value={500}>500 ml</option>
                        <option value={750}>750 ml</option>
                        <option value={1000}>1.0 L</option>
                        <option value={1500}>1.5 L</option>
                        <option value={2000}>2.0 L</option>
                        <option value={5000}>5.0 L</option>
                      </select>
                    </div>

                    {/* Extra ml selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-stone-400">Extra:</span>
                      <select
                        disabled={entry.skip}
                        value={entry.extraMl}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setBulkEntries(prev => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], extraMl: val }
                          }));
                        }}
                        className="px-2 py-1 text-xs border border-amber-200 rounded-lg bg-amber-50 text-amber-900 font-semibold"
                      >
                        <option value={0}>0 ml</option>
                        <option value={250}>+250 ml</option>
                        <option value={500}>+500 ml</option>
                        <option value={1000}>+1.0 L</option>
                      </select>
                    </div>

                    {/* Skip checkbox */}
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.skip}
                        onChange={e => {
                          const checked = e.target.checked;
                          setBulkEntries(prev => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], skip: checked }
                          }));
                        }}
                        className="rounded text-rose-600"
                      />
                      <span>Skip</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveBulk}>
              Save Batch Deliveries
            </Button>
          </div>
        </div>
      </Modal>

      {/* Top Banner with Date Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Morning Delivery Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Daily Milk Delivery Tracker
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Fast 1-tap logging, bulk batch submission, and extra milk tracking.
          </p>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center gap-2 bg-brand-ivory p-1.5 rounded-2xl border border-stone-200/80">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 shadow-subtle"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-bold text-brand-emerald shadow-subtle outline-none"
          />

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 shadow-subtle"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSetToday}
            className="px-3 py-1.5 rounded-xl bg-brand-forest text-white text-xs font-bold hover:bg-brand-emerald shadow-subtle transition-all"
          >
            Today
          </button>
        </div>
      </div>

      {/* Date Metrics Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle">
          <span className="text-xs font-bold text-stone-500 uppercase">Deliveries Done</span>
          <p className="font-serif text-2xl font-bold text-brand-forest mt-0.5">
            {dateDeliveries.length} / {regularCustomers.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle">
          <span className="text-xs font-bold text-stone-500 uppercase">Milk Volume</span>
          <p className="font-serif text-2xl font-bold text-brand-emerald mt-0.5">
            {formatVolume(totalLitersOnDate)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle">
          <span className="text-xs font-bold text-stone-500 uppercase">Total Day Value</span>
          <p className="font-serif text-2xl font-bold text-amber-800 mt-0.5">
            {formatCurrency(totalAmountOnDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleOpenRecordSingle()}
            className="w-full h-full text-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-1 text-brand-gold" />
            Add Entry
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleOpenBulk}
            className="w-full h-full text-xs font-bold border border-brand-gold/50 text-brand-forest"
          >
            <Layers className="w-4 h-4 mr-1 text-brand-gold" />
            Bulk Batch
          </Button>
        </div>
      </div>

      {/* Pending Regulars Section (Quick Action Cards) */}
      {pendingCustomers.length > 0 && (
        <div className="bg-brand-cream/30 rounded-3xl p-5 border border-brand-cream space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-brand-emerald flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-leaf" />
              Pending Today's Deliveries ({pendingCustomers.length})
            </h3>
            <span className="text-xs text-stone-500">Tap to record immediately</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pendingCustomers.map(cust => {
              const sub = subscriptions.find(s => s.customerId === cust.id);
              const expQty = sub?.expectedDailyQuantityMl || 1000;

              return (
                <div
                  key={cust.id}
                  className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-subtle flex items-center justify-between hover:border-brand-leaf/60 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-xs text-stone-900 truncate">{cust.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {cust.location} • {formatVolume(expQty)}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickOneTap(cust)}
                    className="text-xs px-2.5 py-1 whitespace-nowrap flex-shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Record
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recorded Deliveries Table */}
      <div className="bg-white rounded-3xl shadow-card border border-stone-200/80 overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-emerald">
            Recorded Deliveries on {selectedDate}
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {dateDeliveries.length} entries recorded
          </span>
        </div>

        {dateDeliveries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Standard Qty</th>
                  <th className="py-3 px-4">Extra Qty</th>
                  <th className="py-3 px-4">Total Qty</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Total Charge</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {dateDeliveries.map(del => (
                  <tr key={del.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {del.customerName}
                    </td>
                    <td className="py-3 px-4 text-stone-700 font-medium">
                      {formatVolume(del.quantityMl)}
                    </td>
                    <td className="py-3 px-4">
                      {del.extraQuantityMl > 0 ? (
                        <Badge variant="warning" size="sm">
                          +{formatVolume(del.extraQuantityMl)}
                        </Badge>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-forest">
                      {formatVolume(del.quantityMl + del.extraQuantityMl)}
                    </td>
                    <td className="py-3 px-4 text-stone-600">₹{del.unitPricePerLiter}/L</td>
                    <td className="py-3 px-4 font-serif font-bold text-xs text-stone-900">
                      {formatCurrency(del.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-stone-500 truncate max-w-xs">{del.notes || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete delivery record for ${del.customerName}?`)) {
                            deleteDelivery(del.id);
                            showToast('Delivery record deleted');
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-stone-400">
            <Truck className="w-12 h-12 mx-auto mb-2 text-stone-300" />
            <p className="text-sm font-medium text-stone-600">No delivery records on {selectedDate}</p>
            <p className="text-xs mt-1">Use the 1-Tap quick recorder or Bulk Batch to log morning deliveries.</p>
          </div>
        )}
      </div>
    </div>
  );
};
