import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  Plus,
  FileText,
  Clock,
  Archive,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Customer, Subscription } from '../../types';
import { useStore } from '../../lib/store';
import { Modal } from '../common/Modal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';
import { formatCurrency, formatVolume } from '../../lib/calculations';

interface CustomerProfileModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEditCustomer: (customer: Customer) => void;
  onQuickAction: (action: 'record_delivery' | 'record_payment' | 'generate_bill', customerId: string) => void;
}

type TabType = 'overview' | 'deliveries' | 'extras' | 'payments' | 'invoices' | 'ledger';

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customerId,
  isOpen,
  onClose,
  onEditCustomer,
  onQuickAction
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const {
    customers,
    subscriptions,
    deliveries,
    sales,
    payments,
    invoices,
    getCustomerLedger,
    archiveCustomer,
    deleteCustomer,
    updateSubscription,
    settings
  } = useStore();
  const { showToast } = useToast();

  if (!customerId) return null;
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return null;

  const subscription = subscriptions.find(s => s.customerId === customer.id);
  const ledger = getCustomerLedger(customer.id);
  const currentBalance = ledger ? ledger.currentBalance : 0;
  const isCredit = currentBalance < 0;

  // Filtered lists for tabs
  const customerDeliveries = deliveries
    .filter(d => d.customerId === customer.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const customerExtras = customerDeliveries.filter(d => d.extraQuantityMl > 0);
  const customerSales = sales.filter(s => s.customerId === customer.id);

  const customerPayments = payments
    .filter(p => p.customerId === customer.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const customerInvoices = invoices
    .filter(inv => inv.customerId === customer.id)
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart));

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleArchive = () => {
    archiveCustomer(customer.id);
    showToast(`Customer "${customer.name}" archived successfully`);
    onClose();
  };

  const handleConfirmDelete = () => {
    const res = deleteCustomer(customer.id, true);
    if (res.success) {
      showToast(`Customer "${customer.name}" deleted successfully`);
      onClose();
    } else {
      showToast(res.error || 'Failed to delete customer', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      subtitle={`Customer ID: ${customer.id.slice(0, 10)} • Added on ${new Date(customer.createdAt).toLocaleDateString('en-IN')}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Summary Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-brand-ivory border border-brand-cream/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={customer.category === 'REGULAR' ? 'emerald' : 'gold'} size="sm">
                {customer.category} Customer
              </Badge>
              <Badge
                variant={
                  customer.status === 'ACTIVE'
                    ? 'success'
                    : customer.status === 'ARCHIVED'
                    ? 'warning'
                    : 'neutral'
                }
                size="sm"
              >
                {customer.status}
              </Badge>
            </div>
            <p className="text-xs text-stone-600 flex items-center gap-1.5 mt-1">
              <Phone className="w-3.5 h-3.5 text-brand-leaf" />
              <span className="font-semibold text-stone-800">{customer.phone}</span>
              <span className="text-stone-400">•</span>
              <MapPin className="w-3.5 h-3.5 text-brand-leaf" />
              <span>{customer.location}</span>
            </p>
          </div>

          <div className="text-left sm:text-right bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-subtle min-w-[160px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
              Account Balance
            </span>
            <div
              className={`font-serif text-2xl font-bold ${
                isCredit ? 'text-emerald-700' : currentBalance > 0 ? 'text-amber-700' : 'text-stone-800'
              }`}
            >
              {formatCurrency(currentBalance)}
            </div>
            <span className="text-[10px] text-stone-500">
              {isCredit ? 'Advance Customer Credit' : currentBalance > 0 ? 'Outstanding Amount Due' : 'All Settled'}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onQuickAction('record_delivery', customer.id)}
          >
            <Truck className="w-3.5 h-3.5 mr-1.5 text-brand-gold" />
            Record Delivery
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => onQuickAction('record_payment', customer.id)}
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Record Payment
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction('generate_bill', customer.id)}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-brand-forest" />
            Create Bill
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditCustomer(customer)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit Profile
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            className="text-stone-500 hover:text-amber-700"
          >
            <Archive className="w-3.5 h-3.5 mr-1" />
            Archive
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-stone-200">
          <nav className="flex space-x-2 overflow-x-auto">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'deliveries', label: `Deliveries (${customerDeliveries.length})` },
                { id: 'extras', label: `Extra Milk (${customerExtras.length})` },
                { id: 'payments', label: `Payments (${customerPayments.length})` },
                { id: 'invoices', label: `Bills (${customerInvoices.length})` },
                { id: 'ledger', label: 'Financial Ledger' },
              ] as const
            ).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-2 px-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === t.id
                    ? 'border-brand-forest text-brand-forest font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[260px]">
          {/* 1. Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Contact & Address
                  </h4>
                  <p className="text-sm font-medium text-stone-800">{customer.address}</p>
                  <p className="text-xs text-stone-600">Location / Village: {customer.location}</p>
                  {customer.deliveryInstructions && (
                    <div className="mt-2 pt-2 border-t border-stone-200 text-xs text-brand-leaf font-medium">
                      Note: {customer.deliveryInstructions}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Subscription Details
                  </h4>
                  {subscription ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Pricing Model:</span>
                        <span className="font-bold text-stone-800">
                          {subscription.pricingModel === 'FIXED_RECURRING'
                            ? `Fixed Recurring (₹${subscription.fixedMonthlyAmount}/mo)`
                            : 'Actual Delivery Billing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Expected Daily Qty:</span>
                        <span className="font-bold text-brand-forest">
                          {formatVolume(subscription.expectedDailyQuantityMl)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Schedule:</span>
                        <span className="font-medium text-stone-800">{subscription.schedule}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Start Date:</span>
                        <span className="font-medium text-stone-800">{subscription.startDate}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">No active monthly subscription configured.</p>
                  )}
                </div>
              </div>

              {/* Ledger Summary Box */}
              <div className="p-4 rounded-2xl bg-brand-cream/40 border border-brand-cream flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Lifetime Account History
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Total Charges Recorded: <strong className="text-stone-800">{formatCurrency(ledger?.totalCharges || 0)}</strong> • Total Payments: <strong className="text-stone-800">{formatCurrency(ledger?.totalPayments || 0)}</strong>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('ledger')}>
                  View Statement &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* 2. Deliveries Tab */}
          {activeTab === 'deliveries' && (
            <div className="space-y-3">
              {customerDeliveries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Standard Qty</th>
                        <th className="py-2.5 px-3">Extra Qty</th>
                        <th className="py-2.5 px-3">Unit Rate</th>
                        <th className="py-2.5 px-3">Charge</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {customerDeliveries.map(d => (
                        <tr key={d.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-semibold text-stone-800">{d.date}</td>
                          <td className="py-2.5 px-3 font-medium text-stone-700">{formatVolume(d.quantityMl)}</td>
                          <td className="py-2.5 px-3">
                            {d.extraQuantityMl > 0 ? (
                              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                +{formatVolume(d.extraQuantityMl)}
                              </span>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">₹{d.unitPricePerLiter}/L</td>
                          <td className="py-2.5 px-3 font-bold text-brand-forest">{formatCurrency(d.totalAmount)}</td>
                          <td className="py-2.5 px-3 text-stone-500 truncate max-w-xs">{d.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-xs text-stone-500">No delivery records found.</p>
              )}
            </div>
          )}

          {/* 3. Extra Purchases Tab */}
          {activeTab === 'extras' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                Separately recorded additional milk and direct ghee purchases beyond standard subscription.
              </p>
              {customerExtras.length > 0 || customerSales.length > 0 ? (
                <div className="space-y-2">
                  {customerExtras.map(ex => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-800">{ex.date}</span>: Extra Milk ({formatVolume(ex.extraQuantityMl)})
                        {ex.notes && <p className="text-[11px] text-stone-500">{ex.notes}</p>}
                      </div>
                      <span className="font-bold text-amber-900 font-serif">
                        {formatCurrency((ex.extraQuantityMl / 1000) * ex.unitPricePerLiter)}
                      </span>
                    </div>
                  ))}

                  {customerSales.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-800">{s.date}</span>: Direct Purchase (
                        {s.items.map(i => i.productName).join(', ')})
                      </div>
                      <span className="font-bold text-emerald-900 font-serif">
                        {formatCurrency(s.finalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-xs text-stone-500">No extra purchases recorded.</p>
              )}
            </div>
          )}

          {/* 4. Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              {customerPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Reference / Receipt</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {customerPayments.map(p => (
                        <tr key={p.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-semibold text-stone-800">{p.date}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700 font-serif">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-stone-700">
                            <Badge variant="gold" size="sm">
                              {p.paymentMethod}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">{p.referenceNo || '—'}</td>
                          <td className="py-2.5 px-3 text-stone-500">{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-xs text-stone-500">No payments recorded yet.</p>
              )}
            </div>
          )}

          {/* 5. Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-3">
              {customerInvoices.length > 0 ? (
                <div className="space-y-2">
                  {customerInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-subtle text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{inv.invoiceNumber}</span>
                          <Badge
                            variant={
                              inv.status === 'PAID'
                                ? 'success'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {inv.status}
                          </Badge>
                        </div>
                        <p className="text-stone-500">
                          Period: {inv.periodStart} to {inv.periodEnd}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="font-serif font-bold text-sm text-stone-900">
                          Total: {formatCurrency(inv.totalPayable)}
                        </p>
                        <p className="text-[11px] text-amber-800 font-medium">
                          Due: {formatCurrency(inv.remainingDue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-xs text-stone-500">No monthly bills generated yet.</p>
              )}
            </div>
          )}

          {/* 6. Full Ledger Tab */}
          {activeTab === 'ledger' && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-600 flex justify-between items-center">
                <span>Complete chronological debit/credit ledger</span>
                <span className="font-bold text-stone-900">
                  Current Balance: {formatCurrency(currentBalance)}
                </span>
              </div>

              {ledger && ledger.entries.length > 0 ? (
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-stone-100 z-10">
                      <tr className="border-b border-stone-200 text-stone-600 font-bold uppercase">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Debit (+)</th>
                        <th className="py-2 px-3 text-right">Credit (-)</th>
                        <th className="py-2 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {ledger.entries.map(entry => (
                        <tr key={entry.id} className="hover:bg-stone-50/80">
                          <td className="py-2 px-3 font-semibold text-stone-800 whitespace-nowrap">{entry.date}</td>
                          <td className="py-2 px-3 text-stone-700">{entry.description}</td>
                          <td className="py-2 px-3 text-right font-medium text-amber-900">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-800">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-stone-900 font-serif whitespace-nowrap">
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-xs text-stone-500">No ledger entries found.</p>
              )}
            </div>
          )}
        </div>

        {/* Safeguard Footer */}
        <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete Customer
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete Customer: ${customer.name}`}
        message={`Are you sure you want to permanently delete "${customer.name}"? This will remove the customer profile, active subscriptions, and past delivery records from the directory.`}
        confirmText="Yes, Delete Customer"
        cancelText="Cancel"
        variant="danger"
      />
    </Modal>
  );
};
