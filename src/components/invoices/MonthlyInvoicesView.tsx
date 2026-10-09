import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Trash2,
  ArrowDownToLine,
  IndianRupee,
  Share2
} from 'lucide-react';
import { Invoice } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Logo } from '../brand/Logo';
import { useToast } from '../common/Toast';
import { formatCurrency } from '../../lib/calculations';

interface MonthlyInvoicesViewProps {
  initialCustomerId?: string;
}

export const MonthlyInvoicesView: React.FC<MonthlyInvoicesViewProps> = ({ initialCustomerId }) => {
  const {
    invoices,
    customers,
    generateInvoice,
    generateBulkInvoices,
    updateInvoiceStatus,
    deleteInvoice,
    settings
  } = useStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Single Generate Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [periodStart, setPeriodStart] = useState<string>('2026-09-01');
  const [periodEnd, setPeriodEnd] = useState<string>('2026-09-30');
  const [notes, setNotes] = useState<string>('');

  // Bulk Generate Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Active Printable Invoice Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const matchesSearch =
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.customerPhone || '').includes(searchQuery);
        const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  }, [invoices, searchQuery, statusFilter]);

  const handleOpenGenerate = (custId?: string) => {
    setSelectedCustomerId(custId || customers.find(c => c.category === 'REGULAR')?.id || '');
    setPeriodStart('2026-10-01');
    setPeriodEnd('2026-10-31');
    setNotes('');
    setIsGenerateModalOpen(true);
  };

  const handleGenerateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return;
    }

    try {
      const generated = generateInvoice(selectedCustomerId, periodStart, periodEnd, notes);
      showToast(`Generated invoice ${generated.invoiceNumber}`);
      setIsGenerateModalOpen(false);
      setPreviewInvoice(generated);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate invoice', 'error');
    }
  };

  const handleRunBulk = () => {
    const count = generateBulkInvoices(periodStart, periodEnd);
    showToast(`Generated ${count} monthly invoices for active subscribers!`);
    setIsBulkModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Printable Invoice Modal */}
      <Modal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title="Monthly Bill Preview"
        subtitle={previewInvoice ? previewInvoice.invoiceNumber : ''}
        maxWidth="3xl"
      >
        {previewInvoice && (
          <div className="space-y-6">
            {/* Printable Container */}
            <div
              className="p-8 rounded-3xl bg-white border border-stone-200 text-stone-900 shadow-sm print-container"
              id="printable-invoice"
            >
              {/* Invoice Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-stone-200">
                <div className="space-y-1">
                  <Logo size="md" showText={true} theme="light" />
                  <p className="text-xs text-stone-600 mt-2">{settings.address}</p>
                  <p className="text-xs text-stone-500">
                    Phone: {settings.phone} • Email: {settings.email}
                  </p>
                  <p className="text-xs text-stone-500">UPI ID for payments: <strong className="text-brand-forest">{settings.upiId}</strong></p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <span className="font-serif text-2xl font-bold text-brand-emerald block">
                    MONTHLY STATEMENT
                  </span>
                  <p className="text-xs font-mono font-bold text-stone-700">
                    Invoice No: {previewInvoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-stone-500">Date of Issue: {previewInvoice.issueDate}</p>
                  <p className="text-xs text-amber-800 font-semibold">Due Date: {previewInvoice.dueDate}</p>
                </div>
              </div>

              {/* Bill To & Billing Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-stone-200 text-xs">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Billed To</span>
                  <p className="font-bold text-sm text-stone-900">{previewInvoice.customerName}</p>
                  <p className="text-stone-600">{previewInvoice.customerAddress}</p>
                  {previewInvoice.customerPhone && (
                    <p className="text-stone-500">Phone: {previewInvoice.customerPhone}</p>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Billing Period</span>
                  <p className="font-bold text-sm text-stone-900">
                    {previewInvoice.periodStart} to {previewInvoice.periodEnd}
                  </p>
                  <p className="text-stone-500">
                    Status: <strong className="uppercase text-brand-forest">{previewInvoice.status}</strong>
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-200 text-stone-600 font-bold uppercase">
                      <th className="py-2.5 px-2">Description</th>
                      <th className="py-2.5 px-2 text-center">Quantity / Days</th>
                      <th className="py-2.5 px-2 text-right">Unit Rate</th>
                      <th className="py-2.5 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {previewInvoice.lineItems.map(li => (
                      <tr key={li.id}>
                        <td className="py-2.5 px-2 font-medium text-stone-800">
                          {li.description}
                          {li.date && <span className="text-stone-400 text-[10px] block">Date: {li.date}</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center text-stone-600">{li.quantity}</td>
                        <td className="py-2.5 px-2 text-right text-stone-600">
                          {li.rate > 0 ? `₹${li.rate}` : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-serif font-bold text-stone-900">
                          {formatCurrency(li.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="pt-4 border-t-2 border-stone-200 flex flex-col sm:flex-row justify-between gap-6">
                <div className="text-xs text-stone-500 max-w-xs space-y-2">
                  <p className="font-bold text-stone-700">Payment Instructions:</p>
                  <p>
                    Please settle via UPI ({settings.upiId}) or Cash to the delivery agent. Thank you for your continued patronage.
                  </p>
                  {previewInvoice.notes && (
                    <p className="italic text-stone-600 bg-brand-cream/30 p-2 rounded-lg">
                      Note: {previewInvoice.notes}
                    </p>
                  )}
                </div>

                <div className="w-full sm:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Period Total Charges:</span>
                    <span className="font-serif font-semibold">
                      {formatCurrency(previewInvoice.totalPayable)}
                    </span>
                  </div>

                  {previewInvoice.previousBalance !== 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Previous Carried Balance:</span>
                      <span className="font-serif font-semibold">
                        {formatCurrency(previewInvoice.previousBalance)}
                      </span>
                    </div>
                  )}

                  {previewInvoice.paymentsAllocated > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Payments Received:</span>
                      <span className="font-serif font-bold">
                        -{formatCurrency(previewInvoice.paymentsAllocated)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t-2 border-stone-300 text-sm font-bold text-brand-emerald">
                    <span>Net Balance Due:</span>
                    <span className="font-serif text-lg">
                      {formatCurrency(previewInvoice.remainingDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print & Action Controls */}
            <div className="flex justify-between items-center no-print pt-2">
              <div className="flex items-center gap-2">
                <select
                  value={previewInvoice.status}
                  onChange={e => {
                    updateInvoiceStatus(previewInvoice.id, e.target.value as any);
                    setPreviewInvoice(prev => (prev ? { ...prev, status: e.target.value as any } : null));
                    showToast(`Updated status to ${e.target.value}`);
                  }}
                  className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl font-bold"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ISSUED">Issued</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setPreviewInvoice(null)}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print A4 Invoice
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Single Bill Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Monthly Bill"
        subtitle="Snapshot delivered milk quantities, extras, ghee, and payments"
        maxWidth="md"
      >
        <form onSubmit={handleGenerateSingle} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Period Start
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Period End
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Statement Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. October monthly dairy statement"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Generate & Preview
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Generate Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Batch Generate Invoices for All Subscribers"
        subtitle="Generates monthly statements for all active regular customers in one action"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-600">
            This will calculate monthly subscription charges, recorded daily deliveries, and extra milk portions for all active regular customers for the chosen period.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Period Start
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Period End
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRunBulk}>
              Run Batch Generation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Monthly Billing & Invoicing
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Invoices & Statements
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Immutable snapshots of deliveries, extra milk, ghee purchases, and payments allocated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => setIsBulkModalOpen(true)}>
            <Layers className="w-4 h-4 mr-1.5 text-brand-gold" />
            Batch Bill All
          </Button>
          <Button variant="primary" size="md" onClick={() => handleOpenGenerate()}>
            <Plus className="w-4 h-4 mr-1.5 text-brand-gold" />
            Create Bill
          </Button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl shadow-card border border-stone-200/80 overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search invoice number or customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === st ? 'bg-brand-forest text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Remaining Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">{inv.customerName}</td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {inv.periodStart} to {inv.periodEnd}
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold text-xs text-stone-900">
                      {formatCurrency(inv.totalPayable)}
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold text-xs text-emerald-700">
                      {formatCurrency(inv.paymentsAllocated)}
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold text-xs text-amber-800">
                      {formatCurrency(inv.remainingDue)}
                    </td>
                    <td className="py-3.5 px-4">
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
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setPreviewInvoice(inv)}
                          className="text-xs px-2.5 py-1"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          View / Print
                        </Button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                              deleteInvoice(inv.id);
                              showToast('Invoice deleted');
                            }
                          }}
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
        ) : (
          <div className="p-12 text-center text-stone-400">
            <FileText className="w-12 h-12 mx-auto mb-2 text-stone-300" />
            <p className="text-sm font-medium text-stone-600">No invoices match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
};
