import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Trash2,
  Printer,
  FileText,
  Clock,
  ArrowDownLeft,
  Filter
} from 'lucide-react';
import { Payment, PaymentMethod } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Logo } from '../brand/Logo';
import { useToast } from '../common/Toast';
import { formatCurrency } from '../../lib/calculations';

interface PaymentsViewProps {
  initialCustomerId?: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ initialCustomerId }) => {
  const {
    payments,
    customers,
    invoices,
    recordPayment,
    deletePayment,
    getCustomerBalance,
    settings
  } = useStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [amount, setAmount] = useState<number>(500);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [allocatedInvoiceId, setAllocatedInvoiceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Receipt Modal State
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => {
        const matchesSearch =
          (p.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.referenceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
        return matchesSearch && matchesMethod;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, searchQuery, methodFilter]);

  const customerInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return invoices.filter(inv => inv.customerId === selectedCustomerId && inv.status !== 'PAID');
  }, [selectedCustomerId, invoices]);

  const handleOpenAdd = (custId?: string) => {
    const id = custId || customers[0]?.id || '';
    setSelectedCustomerId(id);
    const balance = getCustomerBalance(id);
    setAmount(balance > 0 ? balance : 500);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setReferenceNo('');
    setAllocatedInvoiceId('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || amount <= 0) {
      showToast('Please select a customer and enter a valid payment amount', 'error');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);

    const created = recordPayment({
      date,
      customerId: selectedCustomerId,
      customerName: customer?.name || 'Customer',
      amount,
      paymentMethod,
      referenceNo,
      invoiceId: allocatedInvoiceId || undefined,
      notes
    });

    showToast(`Recorded payment of ${formatCurrency(amount)} from ${customer?.name}`);
    setIsModalOpen(false);
    setReceiptPayment(created);
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Payment Receipt Modal */}
      <Modal
        isOpen={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        title="Payment Voucher"
        subtitle={receiptPayment ? `Voucher ID: ${receiptPayment.id.slice(0, 8).toUpperCase()}` : ''}
        maxWidth="md"
      >
        {receiptPayment && (
          <div className="space-y-5">
            <div className="p-6 rounded-2xl bg-white border border-stone-200 text-stone-900 print-container">
              <div className="text-center pb-4 border-b border-dashed border-stone-300">
                <Logo size="sm" showText={true} theme="light" className="justify-center mb-2" />
                <p className="text-xs text-stone-600">{settings.address}</p>
                <p className="text-xs text-stone-500">Phone: {settings.phone} • UPI: {settings.upiId}</p>
              </div>

              <div className="py-4 text-xs space-y-2 border-b border-dashed border-stone-300">
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Date:</span>
                  <span className="font-bold">{receiptPayment.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Received From:</span>
                  <span className="font-bold text-brand-emerald">{receiptPayment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Mode:</span>
                  <span className="font-semibold">{receiptPayment.paymentMethod}</span>
                </div>
                {receiptPayment.referenceNo && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Reference / Txn ID:</span>
                    <span className="font-mono text-stone-700">{receiptPayment.referenceNo}</span>
                  </div>
                )}
                {receiptPayment.notes && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Remarks:</span>
                    <span>{receiptPayment.notes}</span>
                  </div>
                )}
              </div>

              <div className="py-4 text-center bg-brand-cream/30 rounded-xl my-4">
                <span className="text-xs uppercase font-bold text-stone-500">Amount Received</span>
                <div className="font-serif text-3xl font-bold text-brand-forest mt-1">
                  {formatCurrency(receiptPayment.amount)}
                </div>
              </div>

              <p className="text-center text-[10px] text-stone-400">
                Official payment acknowledgement generated by Sree Krishna Dairy.
              </p>
            </div>

            <div className="flex justify-end gap-3 no-print">
              <Button variant="outline" onClick={() => setReceiptPayment(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1.5" />
                Print Voucher
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment"
        subtitle="Support flexible payment dates, partial payments, and advance credit"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                const bal = getCustomerBalance(e.target.value);
                if (bal > 0) setAmount(bal);
              }}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
            >
              {customers.map(c => {
                const bal = getCustomerBalance(c.id);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.location}) — Due: {formatCurrency(bal)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-serif font-bold text-brand-forest"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Payment Mode
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'] as PaymentMethod[]).map(pm => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    paymentMethod === pm
                      ? 'bg-brand-forest text-white shadow-sm ring-2 ring-brand-forest'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {pm === 'BANK_TRANSFER' ? 'Bank Txn' : pm}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Reference / UPI Txn No
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                placeholder="e.g. UPI/261007/984021"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Allocate to Specific Bill
              </label>
              <select
                value={allocatedInvoiceId}
                onChange={e => setAllocatedInvoiceId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              >
                <option value="">General Account Ledger Credit</option>
                {customerInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} (Due: {formatCurrency(inv.remainingDue)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Monthly milk settlement on 7th"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Flexible Cash & UPI Settlements
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Payments & Customer Ledger
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Accept payments on any date. Partial amounts reduce balance; overpayments automatically become advance credit.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => handleOpenAdd()}>
          <Plus className="w-4 h-4 mr-2 text-brand-gold" />
          Record Payment
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold">Total Collected</p>
            <p className="font-serif text-2xl font-bold text-brand-forest mt-0.5">
              {formatCurrency(totalCollected)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold">Total Payments</p>
            <p className="font-serif text-2xl font-bold text-stone-800 mt-0.5">
              {payments.length} Transactions
            </p>
          </div>
          <div className="p-3 bg-brand-cream text-brand-forest rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold">Supported Modes</p>
            <p className="text-xs font-semibold text-stone-700 mt-1">
              UPI • Cash • NEFT/IMPS • Cheque
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-subtle border border-stone-200/80 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search payments by customer name, ref number, or remarks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'UPI', 'CASH', 'BANK_TRANSFER'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                methodFilter === m
                  ? 'bg-brand-forest text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl shadow-card border border-stone-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Reference No</th>
                <th className="py-3.5 px-4">Notes / Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.map(pay => (
                <tr key={pay.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-stone-800">{pay.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-stone-900">{pay.customerName}</td>
                  <td className="py-3.5 px-4 font-serif font-bold text-sm text-emerald-800">
                    {formatCurrency(pay.amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="gold" size="sm">
                      {pay.paymentMethod}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-600">{pay.referenceNo || '—'}</td>
                  <td className="py-3.5 px-4 text-stone-500 truncate max-w-xs">{pay.notes || '—'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setReceiptPayment(pay)}
                        title="View Voucher"
                        className="p-1.5 text-stone-500 hover:text-brand-forest rounded-lg hover:bg-stone-100"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete payment record? Ledger balance will automatically recalculate.')) {
                            deletePayment(pay.id);
                            showToast('Payment record removed');
                          }
                        }}
                        title="Delete record"
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
