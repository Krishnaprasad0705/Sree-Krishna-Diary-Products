import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Truck,
  Package,
  CreditCard,
  Users,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Calendar as CalendarIcon,
  Plus,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useStore } from '../../lib/store';
import { MetricCard } from '../common/MetricCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatCurrency, formatVolume, getLocalDateString } from '../../lib/calculations';

interface DashboardViewProps {
  onNavigate: (tab: string, entityId?: string) => void;
  onQuickAction: (action: 'add_customer' | 'record_delivery' | 'quick_sale' | 'record_payment' | 'generate_bill') => void;
}

type TimeFilter = 'today' | 'yesterday' | '7days' | 'thisMonth' | 'lastMonth';

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onQuickAction }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('thisMonth');
  const {
    customers,
    subscriptions,
    deliveries,
    sales,
    payments,
    invoices,
    getCustomerBalance,
    settings
  } = useStore();

  const todayStr = getLocalDateString();

  // Helper date filtering using accurate local dates without UTC timezone shift
  const filteredData = useMemo(() => {
    const now = new Date();
    let startStr = '';
    let endStr = getLocalDateString(now);

    if (timeFilter === 'today') {
      startStr = getLocalDateString(now);
      endStr = getLocalDateString(now);
    } else if (timeFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startStr = getLocalDateString(yesterday);
      endStr = getLocalDateString(yesterday);
    } else if (timeFilter === '7days') {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 6);
      startStr = getLocalDateString(d7);
      endStr = getLocalDateString(now);
    } else if (timeFilter === 'thisMonth') {
      startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endStr = getLocalDateString(now);
    } else if (timeFilter === 'lastMonth') {
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      startStr = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}-01`;
      endStr = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;
    }

    const filteredDeliveries = (deliveries || []).filter(d => d && d.date >= startStr && d.date <= endStr);
    const filteredSales = (sales || []).filter(s => s && s.date >= startStr && s.date <= endStr);
    const filteredPayments = (payments || []).filter(p => p && p.date >= startStr && p.date <= endStr);

    return {
      deliveries: filteredDeliveries,
      sales: filteredSales,
      payments: filteredPayments,
      startStr,
      endStr
    };
  }, [timeFilter, deliveries, sales, payments]);

  // Calculations
  const stats = useMemo(() => {
    // 1. Delivery volume
    const totalMilkMl = filteredData.deliveries.reduce((sum, d) => sum + (Number(d.quantityMl) || 0) + (Number(d.extraQuantityMl) || 0), 0);
    const totalDeliveryCharges = filteredData.deliveries.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);

    // 2. Sales revenue
    const totalSalesRev = filteredData.sales.reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0);
    let gheeSalesMl = 0;
    let gheeSalesAmount = 0;
    filteredData.sales.forEach(s => {
      (s.items || []).forEach(item => {
        if ((item.productName || '').toLowerCase().includes('ghee')) {
          gheeSalesMl += Number(item.quantityMl) || 0;
          gheeSalesAmount += Number(item.subtotal) || 0;
        }
      });
    });

    // 3. Payments collected (direct customer settlements + POS counter sales collections)
    const directPayments = filteredData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const posPayments = filteredData.sales.reduce((sum, s) => {
      const paid = Number(s.amountPaid);
      if (!isNaN(paid) && paid > 0) return sum + paid;
      if (s.paymentStatus === 'PAID') return sum + (Number(s.finalAmount) || 0);
      return sum;
    }, 0);
    const totalPaymentsCollected = directPayments + posPayments;

    // 4. Overall Outstanding Receivables across all customers
    let totalReceivables = 0;
    let totalCredits = 0;
    const customersWithBalance: Array<{ customer: typeof customers[0]; balance: number }> = [];

    customers.forEach(c => {
      const bal = getCustomerBalance(c.id);
      if (bal > 0) {
        totalReceivables += bal;
        customersWithBalance.push({ customer: c, balance: bal });
      } else if (bal < 0) {
        totalCredits += Math.abs(bal);
      }
    });

    customersWithBalance.sort((a, b) => b.balance - a.balance);

    // 5. Active Subscriptions
    const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
    const pausedSubs = subscriptions.filter(s => s.status === 'PAUSED');

    // 6. Today's Delivery completion
    const todayDeliveries = deliveries.filter(d => d.date === todayStr);
    const completedCustomerIds = new Set(todayDeliveries.map(d => d.customerId));
    const activeSubCustomers = customers.filter(c => c.status === 'ACTIVE' && c.category === 'REGULAR');
    const pendingToday = activeSubCustomers.filter(c => !completedCustomerIds.has(c.id));

    return {
      totalMilkMl,
      totalDeliveryCharges,
      totalSalesRev,
      totalRevenue: totalDeliveryCharges + totalSalesRev,
      gheeSalesMl,
      gheeSalesAmount,
      totalPaymentsCollected,
      totalReceivables,
      totalCredits,
      customersWithBalance,
      activeSubsCount: activeSubs.length,
      pausedSubsCount: pausedSubs.length,
      todayDeliveredCount: todayDeliveries.length,
      todayPendingCount: pendingToday.length,
      pendingTodayList: pendingToday
    };
  }, [filteredData, customers, subscriptions, deliveries, getCustomerBalance, todayStr]);

  // Chart Data: Last 7 Days Revenue Trend
  const dailyTrendData = useMemo(() => {
    const days: Record<string, { date: string; displayDate: string; milkSales: number; gheeSales: number; payments: number }> = {};
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateString(d);
      const display = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      days[dStr] = { date: dStr, displayDate: display, milkSales: 0, gheeSales: 0, payments: 0 };
    }

    (deliveries || []).forEach(del => {
      if (del && days[del.date]) {
        days[del.date].milkSales += Number(del.totalAmount) || 0;
      }
    });

    (sales || []).forEach(sale => {
      if (sale && days[sale.date]) {
        (sale.items || []).forEach(item => {
          if ((item.productName || '').toLowerCase().includes('ghee')) {
            days[sale.date].gheeSales += Number(item.subtotal) || 0;
          } else {
            days[sale.date].milkSales += Number(item.subtotal) || 0;
          }
        });
        const paid = Number(sale.amountPaid);
        if (!isNaN(paid) && paid > 0) {
          days[sale.date].payments += paid;
        } else if (sale.paymentStatus === 'PAID') {
          days[sale.date].payments += Number(sale.finalAmount) || 0;
        }
      }
    });

    (payments || []).forEach(pay => {
      if (pay && days[pay.date]) {
        days[pay.date].payments += Number(pay.amount) || 0;
      }
    });

    return Object.values(days);
  }, [deliveries, sales, payments]);

  const pieProductData = [
    { name: 'Fresh Milk', value: stats.totalDeliveryCharges, color: '#172B55' },
    { name: 'Traditional Ghee', value: stats.gheeSalesAmount || 350, color: '#E4C66A' },
    { name: 'Paneer & Others', value: 85, color: '#526482' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner with Greeting & Time Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Executive Dairy Summary
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Business Overview
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time financial metrics, daily milk deliveries, and customer balances.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl border border-stone-200/60 overflow-x-auto">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
            ] as const
          ).map(f => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                timeFilter === f.id
                  ? 'bg-white text-brand-forest shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sales Recorded"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`${formatVolume(stats.totalMilkMl)} milk delivered`}
          icon={TrendingUp}
          colorTheme="emerald"
          badge={{ text: 'Charges Recorded', variant: 'success' }}
          onClick={() => onNavigate('sales')}
        />

        <MetricCard
          title="Payments Collected"
          value={formatCurrency(stats.totalPaymentsCollected)}
          subtitle="Cash, UPI & Bank settlements"
          icon={CreditCard}
          colorTheme="gold"
          badge={{ text: 'Actual Cash Flow', variant: 'gold' }}
          onClick={() => onNavigate('payments')}
        />

        <MetricCard
          title="Outstanding Balances"
          value={formatCurrency(stats.totalReceivables)}
          subtitle={`${stats.customersWithBalance.length} customers with pending balance`}
          icon={AlertCircle}
          colorTheme="warning"
          badge={{ text: 'Receivables', variant: 'warning' }}
          onClick={() => onNavigate('customers')}
        />

        <MetricCard
          title="Active Subscriptions"
          value={`${stats.activeSubsCount} Subscribers`}
          subtitle={`${stats.todayDeliveredCount} deliveries completed today`}
          icon={Truck}
          colorTheme="leaf"
          badge={{ text: 'Daily Regulars', variant: 'success' }}
          onClick={() => onNavigate('subscriptions')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue & Collection Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-emerald">
                Daily Revenue & Collections Trend
              </h3>
              <p className="text-xs text-stone-500">
                Comparing daily recorded sales vs cash/UPI collected
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-brand-forest"></span>
                <span className="text-stone-600 font-medium">Milk Sales</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-brand-gold"></span>
                <span className="text-stone-600 font-medium">Payments</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMilk" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#172B55" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#172B55" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPay" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#E4C66A" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#E4C66A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1e7d5" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="milkSales" name="Sales Recorded" stroke="#172B55" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMilk)" />
                <Area type="monotone" dataKey="payments" name="Payments Collected" stroke="#E4C66A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPay)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Revenue Breakdown */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-emerald mb-1">
              Revenue by Product
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Breakdown of Milk vs Traditional Ghee sales
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieProductData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieProductData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-stone-100 text-xs">
            {pieProductData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-stone-700 font-medium">{item.name}</span>
                </span>
                <span className="font-bold text-stone-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Today's Delivery Action + Highest Pending Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Delivery Tracking Card */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-brand-emerald">
                  Today's Morning Deliveries
                </h3>
                <Badge variant="emerald" size="sm">
                  {stats.todayDeliveredCount} Completed
                </Badge>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {stats.todayPendingCount > 0
                  ? `${stats.todayPendingCount} regular subscribers remaining today`
                  : 'All scheduled morning deliveries completed!'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('deliveries')}
            >
              Open Tracker &rarr;
            </Button>
          </div>

          {stats.pendingTodayList.length > 0 ? (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {stats.pendingTodayList.slice(0, 5).map(cust => {
                const sub = subscriptions.find(s => s.customerId === cust.id);
                return (
                  <div
                    key={cust.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-brand-ivory/60 border border-stone-200/60 hover:border-brand-leaf/40 transition-all"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{cust.name}</p>
                      <p className="text-xs text-stone-500">
                        {cust.location} • Standard: {formatVolume(sub?.expectedDailyQuantityMl || 1000)}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onQuickAction('record_delivery')}
                      className="text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Record 1-Tap
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center bg-brand-success/30 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-900">All Today's Deliveries Recorded!</p>
              <p className="text-xs text-emerald-700 mt-1">
                You can record extra milk purchases or bulk entries anytime.
              </p>
            </div>
          )}
        </div>

        {/* Outstanding Balances & Follow-ups */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-emerald">
                Customers with Outstanding Due
              </h3>
              <p className="text-xs text-stone-500">
                Sorted by highest pending account balance
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('customers')}
            >
              All Customers &rarr;
            </Button>
          </div>

          {stats.customersWithBalance.length > 0 ? (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {stats.customersWithBalance.slice(0, 5).map(({ customer, balance }) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/40 border border-amber-200/60 hover:border-amber-400 transition-all"
                >
                  <div
                    onClick={() => onNavigate('customers', customer.id)}
                    className="cursor-pointer"
                  >
                    <p className="text-sm font-semibold text-stone-900 hover:text-brand-forest">
                      {customer.name}
                    </p>
                    <p className="text-xs text-stone-500">{customer.phone} • {customer.location}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-amber-900 font-serif">
                      {formatCurrency(balance)}
                    </span>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => onQuickAction('record_payment')}
                      className="text-xs px-2.5 py-1"
                    >
                      Collect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-stone-50 rounded-2xl">
              <p className="text-sm font-medium text-stone-600">No outstanding customer balances.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
