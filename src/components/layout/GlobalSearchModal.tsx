import React, { useState, useMemo } from 'react';
import { Search, User, FileText, IndianRupee, ArrowRight, X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatCurrency } from '../../lib/calculations';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, entityId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const { customers, invoices, sales } = useStore();

  const filteredResults = useMemo(() => {
    if (!query.trim()) return { customers: [], invoices: [], sales: [] };
    const q = query.toLowerCase().trim();

    const matchedCustomers = customers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.location.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedInvoices = invoices.filter(
      inv => inv.invoiceNumber.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedSales = sales.filter(
      s => s.customerName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    ).slice(0, 5);

    return {
      customers: matchedCustomers,
      invoices: matchedInvoices,
      sales: matchedSales
    };
  }, [query, customers, invoices, sales]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative mx-auto max-w-2xl transform divide-y divide-stone-100 overflow-hidden rounded-2xl bg-white shadow-elevated ring-1 ring-black/5 transition-all animate-scale-in">
        <div className="relative flex items-center px-4">
          <Search className="h-5 w-5 text-stone-400" />
          <input
            type="text"
            className="h-14 w-full border-0 bg-transparent pl-3 pr-4 text-stone-900 placeholder:text-stone-400 focus:ring-0 sm:text-base outline-none"
            placeholder="Search customers, phone numbers, invoices, transactions..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {query.trim() === '' ? (
          <div className="p-6 text-center text-sm text-stone-500">
            <p className="font-medium text-stone-700 mb-2">Quick Navigation Shortcuts</p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              <button
                onClick={() => { onNavigate('customers'); onClose(); }}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-700 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" /> All Customers
              </button>
              <button
                onClick={() => { onNavigate('deliveries'); onClose(); }}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-700 flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Today's Deliveries
              </button>
              <button
                onClick={() => { onNavigate('pos'); onClose(); }}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-700 flex items-center gap-1.5"
              >
                <IndianRupee className="w-3.5 h-3.5" /> Quick Sale POS
              </button>
              <button
                onClick={() => { onNavigate('invoices'); onClose(); }}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-700 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Monthly Bills
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto p-3 space-y-4">
            {/* Customers Result */}
            {filteredResults.customers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-3 mb-1.5">Customers</h4>
                {filteredResults.customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers', c.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-forest/10 flex items-center justify-center text-brand-forest">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{c.name}</p>
                        <p className="text-xs text-stone-500">{c.phone} • {c.location}</p>
                      </div>
                    </div>
                    <span className="text-xs text-brand-leaf font-medium">View Profile &rarr;</span>
                  </div>
                ))}
              </div>
            )}

            {/* Invoices Result */}
            {filteredResults.invoices.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-3 mb-1.5">Invoices & Statements</h4>
                {filteredResults.invoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onNavigate('invoices', inv.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-gold/15 flex items-center justify-center text-yellow-800">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{inv.invoiceNumber} — {inv.customerName}</p>
                        <p className="text-xs text-stone-500">Period: {inv.periodStart} to {inv.periodEnd} • Due: {formatCurrency(inv.remainingDue)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-brand-leaf font-medium">Open &rarr;</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sales Result */}
            {filteredResults.sales.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-3 mb-1.5">Recent Sales</h4>
                {filteredResults.sales.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onNavigate('sales', s.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{s.customerName} — {formatCurrency(s.finalAmount)}</p>
                        <p className="text-xs text-stone-500">{s.date} • {s.items.length} item(s) • {s.paymentStatus}</p>
                      </div>
                    </div>
                    <span className="text-xs text-brand-leaf font-medium">Details &rarr;</span>
                  </div>
                ))}
              </div>
            )}

            {filteredResults.customers.length === 0 &&
              filteredResults.invoices.length === 0 &&
              filteredResults.sales.length === 0 && (
                <div className="py-12 text-center text-stone-400">
                  <p>No results found for "{query}"</p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
