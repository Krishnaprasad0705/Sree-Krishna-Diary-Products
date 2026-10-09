import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  IndianRupee,
  Truck,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';
import { formatCurrency, formatVolume } from '../../lib/calculations';

export const ReportsView: React.FC = () => {
  const { customers, deliveries, sales, payments, invoices, getCustomerBalance, settings } = useStore();
  const { showToast } = useToast();

  const [dateRange, setDateRange] = useState<'thisMonth' | 'lastMonth' | 'all'>('thisMonth');

  // Customer Aging / Receivables calculation
  const customerAging = useMemo(() => {
    return customers
      .map(c => {
        const balance = getCustomerBalance(c.id);
        const custDeliveries = deliveries.filter(d => d.customerId === c.id);
        const totalMilkMl = custDeliveries.reduce((sum, d) => sum + d.quantityMl + d.extraQuantityMl, 0);
        const custPayments = payments.filter(p => p.customerId === c.id);
        const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);

        return {
          customer: c,
          balance,
          totalMilkMl,
          totalPaid,
          status: balance > 0 ? 'DUE' : balance < 0 ? 'ADVANCE' : 'CLEAR'
        };
      })
      .sort((a, b) => b.balance - a.balance);
  }, [customers, deliveries, payments, getCustomerBalance]);

  const totalOutstanding = customerAging.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
  const totalAdvances = customerAging.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);
  const totalDeliveriesLiters = deliveries.reduce((sum, d) => sum + d.quantityMl + d.extraQuantityMl, 0) / 1000;
  const totalCollections = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleExportSummaryCSV = () => {
    const headers = ['Customer Name', 'Category', 'Phone', 'Location', 'Delivered Milk (L)', 'Total Payments (Rs)', 'Current Balance (Rs)', 'Status'];
    const rows = customerAging.map(item => [
      item.customer.name,
      item.customer.category,
      item.customer.phone,
      item.customer.location,
      (item.totalMilkMl / 1000).toFixed(1),
      item.totalPaid,
      item.balance,
      item.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SKD_Business_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Business Report as CSV');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Financial & Volume Analytics
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Business Reports & Ledger Audit
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Customer receivables aging, lifetime delivery volumes, and cash reconciliation.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleExportSummaryCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-brand-gold" />
          Export Full Report (CSV)
        </Button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle">
          <span className="text-xs font-bold text-stone-500 uppercase">Total Receivables</span>
          <p className="font-serif text-2xl font-bold text-amber-800 mt-0.5">
            {formatCurrency(totalOutstanding)}
          </p>
          <span className="text-[10px] text-stone-400">Total customer pending balance</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle">
          <span className="text-xs font-bold text-stone-500 uppercase">Customer Advance Credit</span>
          <p className="font-serif text-2xl font-bold text-emerald-700 mt-0.5">
            {formatCurrency(totalAdvances)}
          </p>
          <span className="text-[10px] text-stone-400">Prepaid advance balances</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle">
          <span className="text-xs font-bold text-stone-500 uppercase">Total Milk Delivered</span>
          <p className="font-serif text-2xl font-bold text-brand-emerald mt-0.5">
            {totalDeliveriesLiters.toFixed(1)} Litres
          </p>
          <span className="text-[10px] text-stone-400">Across all recorded deliveries</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-subtle">
          <span className="text-xs font-bold text-stone-500 uppercase">Total Cash Collections</span>
          <p className="font-serif text-2xl font-bold text-brand-forest mt-0.5">
            {formatCurrency(totalCollections)}
          </p>
          <span className="text-[10px] text-stone-400">Recorded payments</span>
        </div>
      </div>

      {/* Customer Receivables & Performance Table */}
      <div className="bg-white rounded-3xl shadow-card border border-stone-200/80 overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-emerald">
            Customer Statement Summary
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {customerAging.length} active customer accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Delivered Milk</th>
                <th className="py-3.5 px-4">Total Paid</th>
                <th className="py-3.5 px-4">Current Account Balance</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customerAging.map(item => (
                <tr key={item.customer.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-stone-900">{item.customer.name}</td>
                  <td className="py-3.5 px-4 text-stone-600">
                    <Badge variant={item.customer.category === 'REGULAR' ? 'emerald' : 'gold'} size="sm">
                      {item.customer.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-stone-600">{item.customer.location}</td>
                  <td className="py-3.5 px-4 font-semibold text-stone-800">
                    {formatVolume(item.totalMilkMl)}
                  </td>
                  <td className="py-3.5 px-4 font-serif font-bold text-emerald-800">
                    {formatCurrency(item.totalPaid)}
                  </td>
                  <td className="py-3.5 px-4 font-serif font-bold text-sm">
                    <span
                      className={
                        item.balance > 0
                          ? 'text-amber-800'
                          : item.balance < 0
                          ? 'text-emerald-700'
                          : 'text-stone-600'
                      }
                    >
                      {formatCurrency(item.balance)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        item.status === 'CLEAR'
                          ? 'neutral'
                          : item.status === 'ADVANCE'
                          ? 'success'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
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
