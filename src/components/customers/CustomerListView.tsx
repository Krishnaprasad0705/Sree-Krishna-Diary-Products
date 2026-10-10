import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  MapPin,
  Truck,
  CreditCard,
  ChevronRight,
  Archive,
  ArrowUpDown,
  FileText,
  UserCheck,
  UserMinus,
  Trash2
} from 'lucide-react';
import { Customer, CustomerCategory, CustomerStatus } from '../../types';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { CustomerProfileModal } from './CustomerProfileModal';
import { CustomerFormModal } from './CustomerFormModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useToast } from '../common/Toast';
import { formatCurrency, formatVolume } from '../../lib/calculations';

interface CustomerListViewProps {
  initialSelectedCustomerId?: string;
  selectedCustomerId?: string | null;
  onSelectCustomer?: (customerId: string | null) => void;
  onQuickAction: (action: 'record_delivery' | 'record_payment' | 'generate_bill', customerId?: string) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  initialSelectedCustomerId,
  selectedCustomerId: controlledSelectedCustomerId,
  onSelectCustomer,
  onQuickAction
}) => {
  const { customers, subscriptions, getCustomerBalance, deleteCustomer } = useStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CustomerCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerStatus>('ACTIVE');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'recent'>('name');

  const [internalSelectedCustomerId, setInternalSelectedCustomerId] = useState<string | null>(
    initialSelectedCustomerId || null
  );

  const activeSelectedCustomerId =
    controlledSelectedCustomerId !== undefined
      ? controlledSelectedCustomerId
      : internalSelectedCustomerId;

  const handleSelectCustomer = (id: string | null) => {
    if (onSelectCustomer) {
      onSelectCustomer(id);
    } else {
      setInternalSelectedCustomerId(id);
    }
  };

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          c.location.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'balance') return getCustomerBalance(b.id) - getCustomerBalance(a.id);
        if (sortBy === 'recent') return b.createdAt.localeCompare(a.createdAt);
        return 0;
      });
  }, [customers, searchQuery, categoryFilter, statusFilter, sortBy, getCustomerBalance]);

  const handleOpenAdd = () => {
    setCustomerToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modals */}
      <CustomerProfileModal
        customerId={activeSelectedCustomerId}
        isOpen={Boolean(activeSelectedCustomerId)}
        onClose={() => handleSelectCustomer(null)}
        onEditCustomer={c => {
          handleSelectCustomer(null);
          handleOpenEdit(c);
        }}
        onQuickAction={(action, id) => {
          handleSelectCustomer(null);
          onQuickAction(action, id);
        }}
      />

      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        customerToEdit={customerToEdit}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-card border border-stone-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Customer Directory & Accounts
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald">
            Customer Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Total {customers.length} customers registered • Manage monthly subscriptions, ledger history, and addresses.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2 text-brand-gold" />
          Add New Customer
        </Button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-subtle border border-stone-200/80 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone number, location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-stone-400 px-1 hidden sm:inline">Type:</span>
            {(
              [
                { id: 'ALL', label: 'All Types' },
                { id: 'REGULAR', label: 'Regular Subs' },
                { id: 'OCCASIONAL', label: 'Occasional' },
              ] as const
            ).map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-brand-forest text-white shadow-sm font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-stone-400 px-1 hidden sm:inline">Status:</span>
            {(
              [
                { id: 'ACTIVE', label: 'Active' },
                { id: 'INACTIVE', label: 'Inactive' },
                { id: 'ARCHIVED', label: 'Archived' },
                { id: 'ALL', label: 'All' },
              ] as const
            ).map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === st.id
                    ? 'bg-brand-gold text-brand-charcoal font-bold shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 outline-none"
            >
              <option value="name">Name (A-Z)</option>
              <option value="balance">Highest Due Balance</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const sub = subscriptions.find(s => s.customerId === customer.id);
            const balance = getCustomerBalance(customer.id);
            const isCredit = balance < 0;

            return (
              <div
                key={customer.id}
                className="bg-white rounded-3xl p-5 shadow-card border border-stone-200/80 hover:border-brand-leaf/50 transition-all flex flex-col justify-between group cursor-pointer"
                onClick={() => handleSelectCustomer(customer.id)}
              >
                <div>
                  {/* Top Bar: Name & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-brand-emerald group-hover:text-brand-leaf transition-colors line-clamp-1">
                          {customer.name}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{customer.phone}</span>
                      </p>
                    </div>

                    <Badge
                      variant={customer.category === 'REGULAR' ? 'emerald' : 'gold'}
                      size="sm"
                    >
                      {customer.category === 'REGULAR' ? 'Sub' : 'Occasional'}
                    </Badge>
                  </div>

                  {/* Address / Location */}
                  <div className="mt-3 text-xs text-stone-600 flex items-start gap-1.5 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                    <MapPin className="w-3.5 h-3.5 text-brand-leaf flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {customer.address}, {customer.location}
                    </span>
                  </div>

                  {/* Subscription details pill */}
                  {sub && (
                    <div className="mt-2.5 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-brand-cream/30 border border-brand-cream/80 text-brand-charcoal">
                      <span className="text-[11px] text-stone-500">Plan:</span>
                      <span className="font-bold text-brand-forest">
                        {formatVolume(sub.expectedDailyQuantityMl)} / day (
                        {sub.pricingModel === 'FIXED_RECURRING' ? 'Fixed' : 'Daily'}
                        )
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Balance & Actions */}
                <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Balance
                    </span>
                    <span
                      className={`font-serif text-base font-bold ${
                        isCredit
                          ? 'text-emerald-700'
                          : balance > 0
                          ? 'text-amber-800'
                          : 'text-stone-700'
                      }`}
                    >
                      {formatCurrency(balance)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onQuickAction('record_delivery', customer.id)}
                      title="Record Delivery"
                      className="p-2 rounded-xl bg-brand-navy/10 hover:bg-brand-navy hover:text-white text-brand-navy transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onQuickAction('record_payment', customer.id)}
                      title="Record Payment"
                      className="p-2 rounded-xl bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-900 transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCustomerToDelete(customer)}
                      title="Delete Customer"
                      className="p-2 rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSelectCustomer(customer.id)}
                      title="Open Profile"
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-700 mb-1">No customers match your search</h3>
          <p className="text-xs text-stone-500 mb-4">Try clearing your filters or add a new customer.</p>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1 text-brand-gold" />
            Add Customer
          </Button>
        </div>
      )}

      {/* Dedicated In-App Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={() => {
          if (customerToDelete) {
            deleteCustomer(customerToDelete.id, true);
            showToast(`Customer "${customerToDelete.name}" deleted successfully`);
            setCustomerToDelete(null);
          }
        }}
        title={`Delete Customer: ${customerToDelete?.name || ''}`}
        message={`Are you sure you want to delete "${customerToDelete?.name}"? This action will permanently remove the customer, their active subscriptions, and past delivery records from the directory.`}
        confirmText="Yes, Delete Customer"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
