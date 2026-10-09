import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Printer,
  Download,
  Trash2,
  Calendar,
  IndianRupee,
  Receipt
} from 'lucide-react';
import { Sale } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Logo } from '../brand/Logo';
import { useToast } from '../common/Toast';
import { formatCurrency, formatVolume } from '../../lib/calculations';

export const SalesHistoryView: React.FC = () => {
  const { sales, deleteSale, settings } = useStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales
      .filter(s => {
        const matchesSearch =
          s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Sale ID', 'Date', 'Customer Name', 'Items', 'Total Amount', 'Discount', 'Final Paid', 'Payment Method', 'Status'];
    const rows = filteredSales.map(s => [
      s.id,
      s.date,
      s.customerName,
      s.items.map(i => `${i.productName} (x${i.quantityMl}ml)`).join('; '),
      s.totalAmount,
      s.discount,
      s.finalAmount,
      s.paymentMethod,
      s.paymentStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SKD_Sales_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported sales report as CSV');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Receipt Modal */}
      <Modal
        isOpen={Boolean(receiptSale)}
        onClose={() => setReceiptSale(null)}
        title="Sale Receipt"
        subtitle={receiptSale ? `Receipt #${receiptSale.id.slice(0, 8).toUpperCase()}` : ''}
        maxWidth="md"
      >
        {receiptSale && (
          <div className="space-y-5">
            <div className="p-6 rounded-2xl bg-white border border-stone-200 text-stone-900 print-container">
              <div className="text-center pb-4 border-b border-dashed border-stone-300">
                <Logo size="sm" showText={true} theme="light" className="justify-center mb-2" />
                <p className="text-xs text-stone-600">{settings.address}</p>
                <p className="text-xs text-stone-500">Phone: {settings.phone} • UPI: {settings.upiId}</p>
              </div>

              <div className="py-3 text-xs border-b border-dashed border-stone-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Date:</span>
                  <span className="font-semibold">{receiptSale.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer:</span>
                  <span className="font-bold">{receiptSale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment:</span>
                  <span className="font-semibold">{receiptSale.paymentMethod} (PAID)</span>
                </div>
              </div>

              <div className="py-3 text-xs border-b border-dashed border-stone-300 space-y-2">
                {receiptSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-stone-800">{item.productName}</p>
                      <p className="text-[10px] text-stone-500">Qty: {formatVolume(item.quantityMl)}</p>
                    </div>
                    <span className="font-bold font-serif">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-xs space-y-1 font-semibold">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptSale.totalAmount)}</span>
                </div>
                {receiptSale.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(receiptSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-brand-emerald pt-2 border-t border-stone-200">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(receiptSale.finalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 no-print">
              <Button variant="outline" onClick={() => setReceiptSale(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1.5" />
                Print
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Point of Sale Ledger
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Sales History
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Complete transaction record of all counter walk-in and customer purchases.
          </p>
        </div>

        <Button variant="outline" size="md" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2 text-brand-forest" />
          Export CSV
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-subtle border border-stone-200/80 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search sales by customer name, sale ID, or payment mode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm outline-none"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl shadow-card border border-stone-200/80 overflow-hidden">
        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Sale Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Purchased Items</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Paid Mode</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-800">{sale.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      {sale.customerName}
                      {sale.isWalkIn && <span className="text-[10px] text-stone-400 block">Walk-in POS</span>}
                    </td>
                    <td className="py-3.5 px-4 text-stone-700">
                      {sale.items.map((it, idx) => (
                        <div key={idx} className="truncate max-w-xs">
                          • {it.productName} ({formatCurrency(it.subtotal)})
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold text-sm text-brand-emerald">
                      {formatCurrency(sale.finalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="gold" size="sm">
                        {sale.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptSale(sale)}
                          title="View Receipt"
                          className="p-1.5 text-stone-500 hover:text-brand-forest rounded-lg hover:bg-stone-100"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete sale transaction?')) {
                              deleteSale(sale.id);
                              showToast('Sale record deleted');
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
        ) : (
          <div className="p-12 text-center text-stone-400">
            <p className="text-sm">No sales found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
