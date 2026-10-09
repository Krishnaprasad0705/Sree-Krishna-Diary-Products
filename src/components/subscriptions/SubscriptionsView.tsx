import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Edit,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Truck,
  Users,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';
import { formatCurrency, formatVolume } from '../../lib/calculations';

interface SubscriptionsViewProps {
  onNavigateCustomer: (customerId: string) => void;
  onOpenAddCustomer: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  onNavigateCustomer,
  onOpenAddCustomer
}) => {
  const {
    subscriptions,
    customers,
    updateSubscription,
    pauseSubscription,
    resumeSubscription,
    updateExpectedDailyQuantity,
    getCustomerBalance,
    settings
  } = useStore();
  const { showToast } = useToast();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [tempQty, setTempQty] = useState<number>(1000);

  const regularCustomers = customers.filter(c => c.category === 'REGULAR');

  const filteredSubs = subscriptions.filter(s => {
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus;
  });

  const handleSaveQuantity = (customerId: string) => {
    updateExpectedDailyQuantity(customerId, tempQty);
    setEditingSubId(null);
    showToast(`Updated expected daily quantity to ${formatVolume(tempQty)}`);
  };

  const handleTogglePause = (subId: string, currentStatus: string, custName: string) => {
    if (currentStatus === 'ACTIVE') {
      pauseSubscription(subId);
      showToast(`Subscription paused for ${custName}`, 'info');
    } else {
      resumeSubscription(subId);
      showToast(`Subscription resumed for ${custName}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Recurring Monthly Milk Deliveries
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Subscription Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure Model A (Actual delivery billing) or Model B (Fixed recurring billing). Daily deliveries & flexible payments adapt automatically.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={onOpenAddCustomer}>
          <Plus className="w-4 h-4 mr-2 text-brand-gold" />
          Add Subscriber
        </Button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold">Active Subscriptions</p>
            <p className="font-serif text-2xl font-bold text-brand-forest mt-0.5">
              {subscriptions.filter(s => s.status === 'ACTIVE').length} Active
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Repeat className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold">Paused Temporarily</p>
            <p className="font-serif text-2xl font-bold text-amber-800 mt-0.5">
              {subscriptions.filter(s => s.status === 'PAUSED').length} Paused
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Pause className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold">Total Expected Milk</p>
            <p className="font-serif text-2xl font-bold text-brand-emerald mt-0.5">
              {formatVolume(
                subscriptions
                  .filter(s => s.status === 'ACTIVE')
                  .reduce((sum, s) => sum + s.expectedDailyQuantityMl, 0)
              )}{' '}
              / day
            </p>
          </div>
          <div className="p-3 bg-brand-cream text-brand-forest rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        {(
          [
            { id: 'ALL', label: `All Subscribers (${subscriptions.length})` },
            { id: 'ACTIVE', label: `Active Only (${subscriptions.filter(s => s.status === 'ACTIVE').length})` },
            { id: 'PAUSED', label: `Paused (${subscriptions.filter(s => s.status === 'PAUSED').length})` },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === tab.id
                ? 'bg-brand-forest text-white shadow-sm font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl shadow-card border border-stone-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Subscriber</th>
                <th className="py-3.5 px-4">Billing Model</th>
                <th className="py-3.5 px-4">Expected Daily Milk</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Account Due</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSubs.map(sub => {
                const customer = customers.find(c => c.id === sub.customerId);
                if (!customer) return null;
                const balance = getCustomerBalance(customer.id);
                const isEditingThis = editingSubId === sub.id;

                return (
                  <tr key={sub.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Customer Info */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onNavigateCustomer(customer.id)}
                        className="text-left font-bold text-sm text-brand-emerald hover:text-brand-leaf hover:underline"
                      >
                        {customer.name}
                      </button>
                      <p className="text-[11px] text-stone-500">{customer.phone} • {customer.location}</p>
                    </td>

                    {/* Billing Model */}
                    <td className="py-3.5 px-4">
                      {sub.pricingModel === 'FIXED_RECURRING' ? (
                        <div>
                          <Badge variant="gold" size="sm">Fixed Monthly</Badge>
                          <p className="text-[11px] font-bold text-stone-700 mt-0.5">
                            {formatCurrency(sub.fixedMonthlyAmount || 0)} / mo
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Badge variant="emerald" size="sm">Actual Delivery</Badge>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            ₹{settings.defaultMilkRatePerLiter}/L base
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Expected Daily Qty with Fast Inline Editor */}
                    <td className="py-3.5 px-4">
                      {isEditingThis ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={tempQty}
                            onChange={e => setTempQty(parseInt(e.target.value))}
                            className="p-1.5 border border-brand-forest rounded-lg text-xs outline-none bg-white font-medium"
                          >
                            <option value={250}>250 ml</option>
                            <option value={500}>500 ml</option>
                            <option value={750}>750 ml</option>
                            <option value={1000}>1.0 Litre</option>
                            <option value={1500}>1.5 Litres</option>
                            <option value={2000}>2.0 Litres</option>
                            <option value={5000}>5.0 Litres</option>
                          </select>
                          <button
                            onClick={() => handleSaveQuantity(customer.id)}
                            className="px-2 py-1 bg-brand-forest text-white rounded text-[11px] font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSubId(null)}
                            className="text-stone-400 hover:text-stone-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800 text-xs">
                            {formatVolume(sub.expectedDailyQuantityMl)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingSubId(sub.id);
                              setTempQty(sub.expectedDailyQuantityMl);
                            }}
                            title="Edit standard daily quantity"
                            className="text-stone-400 hover:text-brand-forest"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Schedule */}
                    <td className="py-3.5 px-4 text-stone-600 font-medium">
                      {sub.schedule}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={sub.status === 'ACTIVE' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {sub.status}
                      </Badge>
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-4 font-serif font-bold text-xs">
                      <span className={balance > 0 ? 'text-amber-800' : balance < 0 ? 'text-emerald-700' : 'text-stone-600'}>
                        {formatCurrency(balance)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant={sub.status === 'ACTIVE' ? 'outline' : 'secondary'}
                          size="sm"
                          onClick={() => handleTogglePause(sub.id, sub.status, customer.name)}
                          className="text-xs py-1"
                        >
                          {sub.status === 'ACTIVE' ? (
                            <>
                              <Pause className="w-3 h-3 mr-1 text-amber-600" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1 text-emerald-600" /> Resume
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigateCustomer(customer.id)}
                          className="text-xs py-1"
                        >
                          Account &rarr;
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
