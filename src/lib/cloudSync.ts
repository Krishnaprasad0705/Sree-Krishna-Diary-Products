import {
  Customer,
  Subscription,
  Product,
  PriceHistory,
  DeliveryRecord,
  Sale,
  Payment,
  Invoice,
  BusinessSettings,
  StockItem,
  StockMovement
} from '../types';
import { getSupabaseClient } from './supabase';

// ============================================================================
// DATA TRANSFORMERS (TypeScript camelCase <-> PostgreSQL snake_case)
// ============================================================================

export const transformCustomerToDb = (c: Customer) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  address: c.address,
  location: c.location,
  delivery_instructions: c.deliveryInstructions || null,
  category: c.category,
  status: c.status,
  notes: c.notes || null,
  opening_balance: Number(c.openingBalance) || 0,
  created_at: c.createdAt || new Date().toISOString(),
  updated_at: c.updatedAt || new Date().toISOString()
});

export const transformCustomerFromDb = (row: any): Customer => ({
  id: String(row.id),
  name: String(row.name || ''),
  phone: String(row.phone || ''),
  address: String(row.address || ''),
  location: String(row.location || ''),
  deliveryInstructions: row.delivery_instructions || undefined,
  category: row.category === 'OCCASIONAL' ? 'OCCASIONAL' : 'REGULAR',
  status: row.status === 'INACTIVE' ? 'INACTIVE' : row.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
  notes: row.notes || undefined,
  openingBalance: Number(row.opening_balance) || 0,
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString()
});

export const transformSubscriptionToDb = (s: Subscription) => ({
  id: s.id,
  customer_id: s.customerId,
  pricing_model: s.pricingModel,
  expected_daily_quantity_ml: Number(s.expectedDailyQuantityMl) || 1000,
  fixed_monthly_amount: s.fixedMonthlyAmount !== undefined ? Number(s.fixedMonthlyAmount) : null,
  status: s.status,
  schedule: s.schedule,
  start_date: s.startDate,
  renewal_date: s.renewalDate || null,
  notes: s.notes || null,
  updated_at: s.updatedAt || new Date().toISOString()
});

export const transformSubscriptionFromDb = (row: any): Subscription => ({
  id: String(row.id),
  customerId: String(row.customer_id),
  pricingModel: row.pricing_model === 'FIXED_RECURRING' ? 'FIXED_RECURRING' : 'ACTUAL_DELIVERY',
  expectedDailyQuantityMl: Number(row.expected_daily_quantity_ml) || 1000,
  fixedMonthlyAmount: row.fixed_monthly_amount !== null && row.fixed_monthly_amount !== undefined ? Number(row.fixed_monthly_amount) : undefined,
  status: row.status === 'PAUSED' ? 'PAUSED' : row.status === 'ENDED' ? 'ENDED' : 'ACTIVE',
  schedule: row.schedule || 'EVERYDAY',
  startDate: row.start_date || new Date().toISOString().split('T')[0],
  renewalDate: row.renewal_date || undefined,
  notes: row.notes || undefined,
  updatedAt: row.updated_at || new Date().toISOString()
});

export const transformProductToDb = (p: Product) => ({
  id: p.id,
  name: p.name,
  code: p.code,
  type: p.type,
  unit: p.unit,
  current_price_per_liter: Number(p.currentPricePerLiter) || 0,
  description: p.description || null,
  is_active: p.isActive,
  packages_json: p.packages || []
});

export const transformProductFromDb = (row: any): Product => ({
  id: String(row.id),
  name: String(row.name || ''),
  code: String(row.code || ''),
  type: row.type || 'MILK',
  unit: row.unit || 'ml',
  currentPricePerLiter: Number(row.current_price_per_liter) || 0,
  packages: Array.isArray(row.packages_json) ? row.packages_json : Array.isArray(row.packages) ? row.packages : [],
  description: row.description || undefined,
  isActive: Boolean(row.is_active ?? true)
});

export const transformPriceHistoryToDb = (ph: PriceHistory) => ({
  id: ph.id,
  product_id: ph.productId,
  product_name: ph.productName,
  old_price: Number(ph.oldPrice) || 0,
  new_price: Number(ph.newPrice) || 0,
  effective_date: ph.effectiveDate,
  reason: ph.reason || null,
  recorded_at: ph.recordedAt || new Date().toISOString()
});

export const transformPriceHistoryFromDb = (row: any): PriceHistory => ({
  id: String(row.id),
  productId: String(row.product_id),
  productName: String(row.product_name || ''),
  oldPrice: Number(row.old_price) || 0,
  newPrice: Number(row.new_price) || 0,
  effectiveDate: String(row.effective_date || ''),
  reason: row.reason || undefined,
  recordedAt: row.recorded_at || new Date().toISOString()
});

export const transformDeliveryToDb = (d: DeliveryRecord) => ({
  id: d.id,
  date: d.date,
  customer_id: d.customerId,
  customer_name: d.customerName || null,
  quantity_ml: Number(d.quantityMl) || 0,
  extra_quantity_ml: Number(d.extraQuantityMl) || 0,
  unit_price_per_liter: Number(d.unitPricePerLiter) || 60,
  total_amount: Number(d.totalAmount) || 0,
  status: d.status || 'DELIVERED',
  notes: d.notes || null,
  recorded_at: d.recordedAt || new Date().toISOString()
});

export const transformDeliveryFromDb = (row: any): DeliveryRecord => ({
  id: String(row.id),
  date: String(row.date || ''),
  customerId: String(row.customer_id),
  customerName: row.customer_name || undefined,
  quantityMl: Number(row.quantity_ml) || 0,
  extraQuantityMl: Number(row.extra_quantity_ml) || 0,
  unitPricePerLiter: Number(row.unit_price_per_liter) || 60,
  totalAmount: Number(row.total_amount) || 0,
  status: row.status === 'SKIPPED' ? 'SKIPPED' : row.status === 'MODIFIED' ? 'MODIFIED' : 'DELIVERED',
  notes: row.notes || undefined,
  recordedAt: row.recorded_at || new Date().toISOString()
});

export const transformSaleToDb = (s: Sale) => ({
  id: s.id,
  date: s.date,
  customer_id: s.customerId || null,
  customer_name: s.customerName,
  is_walk_in: Boolean(s.isWalkIn),
  total_amount: Number(s.totalAmount) || 0,
  discount: Number(s.discount) || 0,
  final_amount: Number(s.finalAmount) || 0,
  amount_paid: Number(s.amountPaid) || 0,
  payment_status: s.paymentStatus || 'PAID',
  payment_method: s.paymentMethod || 'CASH',
  notes: s.notes || null,
  items_json: s.items || [],
  recorded_at: s.recordedAt || new Date().toISOString()
});

export const transformSaleFromDb = (row: any): Sale => ({
  id: String(row.id),
  date: String(row.date || ''),
  customerId: row.customer_id ? String(row.customer_id) : undefined,
  customerName: String(row.customer_name || 'Walk-in Customer'),
  isWalkIn: Boolean(row.is_walk_in),
  items: Array.isArray(row.items_json) ? row.items_json : Array.isArray(row.items) ? row.items : [],
  totalAmount: Number(row.total_amount) || 0,
  discount: Number(row.discount) || 0,
  finalAmount: Number(row.final_amount) || Number(row.total_amount) || 0,
  amountPaid: Number(row.amount_paid) || 0,
  paymentStatus: row.payment_status === 'UNPAID' ? 'UNPAID' : row.payment_status === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'PAID',
  paymentMethod: row.payment_method || 'CASH',
  notes: row.notes || undefined,
  recordedAt: row.recorded_at || new Date().toISOString()
});

export const transformPaymentToDb = (p: Payment) => ({
  id: p.id,
  date: p.date,
  customer_id: p.customerId,
  customer_name: p.customerName || null,
  amount: Number(p.amount) || 0,
  payment_method: p.paymentMethod || 'CASH',
  reference_no: p.referenceNo || null,
  invoice_id: p.invoiceId || null,
  notes: p.notes || null,
  recorded_at: p.recordedAt || new Date().toISOString()
});

export const transformPaymentFromDb = (row: any): Payment => ({
  id: String(row.id),
  date: String(row.date || ''),
  customerId: String(row.customer_id),
  customerName: row.customer_name || undefined,
  amount: Number(row.amount) || 0,
  paymentMethod: row.payment_method || 'CASH',
  referenceNo: row.reference_no || undefined,
  invoiceId: row.invoice_id || undefined,
  notes: row.notes || undefined,
  recordedAt: row.recorded_at || new Date().toISOString()
});

export const transformInvoiceToDb = (inv: Invoice) => ({
  id: inv.id,
  invoice_number: inv.invoiceNumber,
  customer_id: inv.customerId,
  customer_name: inv.customerName,
  customer_phone: inv.customerPhone || null,
  customer_address: inv.customerAddress || null,
  period_start: inv.periodStart,
  period_end: inv.periodEnd,
  issue_date: inv.issueDate,
  due_date: inv.dueDate,
  previous_balance: Number(inv.previousBalance) || 0,
  subscription_charges: Number(inv.subscriptionCharges) || 0,
  delivery_charges: Number(inv.deliveryCharges) || 0,
  extra_milk_charges: Number(inv.extraMilkCharges) || 0,
  ghee_charges: Number(inv.gheeCharges) || 0,
  adjustments: Number(inv.adjustments) || 0,
  total_payable: Number(inv.totalPayable) || 0,
  payments_allocated: Number(inv.paymentsAllocated) || 0,
  remaining_due: Number(inv.remainingDue) || 0,
  status: inv.status || 'ISSUED',
  notes: inv.notes || null,
  line_items_json: inv.lineItems || [],
  generated_at: inv.generatedAt || new Date().toISOString()
});

export const transformInvoiceFromDb = (row: any): Invoice => ({
  id: String(row.id),
  invoiceNumber: String(row.invoice_number || ''),
  customerId: String(row.customer_id),
  customerName: String(row.customer_name || ''),
  customerPhone: row.customer_phone || undefined,
  customerAddress: row.customer_address || undefined,
  periodStart: String(row.period_start || ''),
  periodEnd: String(row.period_end || ''),
  issueDate: String(row.issue_date || ''),
  dueDate: String(row.due_date || ''),
  previousBalance: Number(row.previous_balance) || 0,
  subscriptionCharges: Number(row.subscription_charges) || 0,
  deliveryCharges: Number(row.delivery_charges) || 0,
  extraMilkCharges: Number(row.extra_milk_charges) || 0,
  gheeCharges: Number(row.ghee_charges) || 0,
  adjustments: Number(row.adjustments) || 0,
  totalPayable: Number(row.total_payable) || 0,
  paymentsAllocated: Number(row.payments_allocated) || 0,
  remainingDue: Number(row.remaining_due) || 0,
  status: row.status || 'ISSUED',
  notes: row.notes || undefined,
  lineItems: Array.isArray(row.line_items_json) ? row.line_items_json : Array.isArray(row.lineItems) ? row.lineItems : [],
  generatedAt: row.generated_at || new Date().toISOString()
});

export const transformStockItemToDb = (item: StockItem) => ({
  id: item.id,
  product_id: item.productId,
  product_name: item.productName,
  current_stock_liters: Number(item.currentStockLiters) || 0,
  last_updated: item.lastUpdated || new Date().toISOString()
});

export const transformStockItemFromDb = (row: any): StockItem => ({
  id: String(row.id),
  productId: String(row.product_id),
  productName: String(row.product_name || ''),
  currentStockLiters: Number(row.current_stock_liters) || 0,
  lastUpdated: row.last_updated || new Date().toISOString()
});

export const transformStockMovementToDb = (m: StockMovement) => ({
  id: m.id,
  product_id: m.productId,
  product_name: m.productName,
  date: m.date,
  type: m.type,
  quantity_liters: Number(m.quantityLiters) || 0,
  notes: m.notes || null
});

export const transformStockMovementFromDb = (row: any): StockMovement => ({
  id: String(row.id),
  productId: String(row.product_id),
  productName: String(row.product_name || ''),
  date: String(row.date || ''),
  type: row.type || 'ADJUSTMENT',
  quantityLiters: Number(row.quantity_liters) || 0,
  notes: row.notes || undefined
});

export const transformSettingsToDb = (s: BusinessSettings) => ({
  id: 'skd_primary_business_settings',
  business_name: s.businessName,
  tagline: s.tagline || '',
  owner_name: s.ownerName,
  phone: s.phone,
  alternate_phone: s.alternatePhone || null,
  email: s.email || null,
  address: s.address,
  village_town: s.villageTown,
  district_state: s.districtState,
  pincode: s.pincode,
  upi_id: s.upiId,
  currency_symbol: s.currencySymbol || '₹',
  time_zone: s.timeZone || 'Asia/Kolkata',
  invoice_prefix: s.invoicePrefix || 'SKD',
  default_milk_rate_per_liter: Number(s.defaultMilkRatePerLiter) || 60,
  default_ghee_rate_per_liter: Number(s.defaultGheeRatePerLiter) || 700,
  enable_stock_tracking: Boolean(s.enableStockTracking),
  language: s.language || 'en'
});

export const transformSettingsFromDb = (row: any): BusinessSettings => ({
  businessName: String(row.business_name || 'Sree Krishna Dairy Products'),
  tagline: String(row.tagline || 'Pure, Fresh Farm Milk & Traditional Ghee'),
  ownerName: String(row.owner_name || 'S. Radhakrishnan'),
  phone: String(row.phone || '+91 98401 23456'),
  alternatePhone: row.alternate_phone || undefined,
  email: row.email || undefined,
  address: String(row.address || 'No. 14, Main Road, Krishna Nagar'),
  villageTown: String(row.village_town || 'Kanchipuram'),
  districtState: String(row.district_state || 'Tamil Nadu'),
  pincode: String(row.pincode || '631501'),
  upiId: String(row.upi_id || 'sreekrishnadairy@upi'),
  currencySymbol: String(row.currency_symbol || '₹'),
  timeZone: String(row.time_zone || 'Asia/Kolkata'),
  invoicePrefix: String(row.invoice_prefix || 'SKD'),
  defaultMilkRatePerLiter: Number(row.default_milk_rate_per_liter) || 60,
  defaultGheeRatePerLiter: Number(row.default_ghee_rate_per_liter) || 700,
  enableStockTracking: Boolean(row.enable_stock_tracking),
  language: row.language === 'ta' ? 'ta' : 'en'
});

// ============================================================================
// FULL CLOUD FETCH & SYNC HELPERS
// ============================================================================

export interface CloudFetchResult {
  customers: Customer[];
  subscriptions: Subscription[];
  products: Product[];
  priceHistory: PriceHistory[];
  deliveries: DeliveryRecord[];
  sales: Sale[];
  payments: Payment[];
  invoices: Invoice[];
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  settings?: BusinessSettings;
  isEmptyDatabase: boolean;
}

export const fetchAllCloudData = async (): Promise<CloudFetchResult | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [
      customersRes,
      subscriptionsRes,
      productsRes,
      priceHistoryRes,
      deliveriesRes,
      salesRes,
      paymentsRes,
      invoicesRes,
      stockItemsRes,
      stockMovementsRes,
      settingsRes
    ] = await Promise.all([
      client.from('customers').select('*').order('created_at', { ascending: false }),
      client.from('subscriptions').select('*'),
      client.from('products').select('*'),
      client.from('price_history').select('*').order('recorded_at', { ascending: false }),
      client.from('delivery_records').select('*').order('date', { ascending: false }),
      client.from('sales').select('*').order('recorded_at', { ascending: false }),
      client.from('payments').select('*').order('recorded_at', { ascending: false }),
      client.from('invoices').select('*').order('generated_at', { ascending: false }),
      client.from('stock_items').select('*'),
      client.from('stock_movements').select('*').order('date', { ascending: false }),
      client.from('business_settings').select('*').limit(1)
    ]);

    // Check for schema/query errors
    if (customersRes.error) throw new Error(`Customers table error: ${customersRes.error.message}`);

    const customers = (customersRes.data || []).map(transformCustomerFromDb);
    const subscriptions = (subscriptionsRes.data || []).map(transformSubscriptionFromDb);
    const products = (productsRes.data || []).map(transformProductFromDb);
    const priceHistory = (priceHistoryRes.data || []).map(transformPriceHistoryFromDb);
    const deliveries = (deliveriesRes.data || []).map(transformDeliveryFromDb);
    const sales = (salesRes.data || []).map(transformSaleFromDb);
    const payments = (paymentsRes.data || []).map(transformPaymentFromDb);
    const invoices = (invoicesRes.data || []).map(transformInvoiceFromDb);
    const stockItems = (stockItemsRes.data || []).map(transformStockItemFromDb);
    const stockMovements = (stockMovementsRes.data || []).map(transformStockMovementFromDb);
    const settings = settingsRes.data && settingsRes.data.length > 0
      ? transformSettingsFromDb(settingsRes.data[0])
      : undefined;

    const isEmptyDatabase = customers.length === 0 && products.length === 0;

    return {
      customers,
      subscriptions,
      products,
      priceHistory,
      deliveries,
      sales,
      payments,
      invoices,
      stockItems,
      stockMovements,
      settings,
      isEmptyDatabase
    };
  } catch (err) {
    console.error('Failed to fetch data from Supabase:', err);
    throw err;
  }
};

// ============================================================================
// ZERO-LOSS DATA MIGRATION (Upload Local State to Supabase Cloud)
// ============================================================================

export const uploadAllDataToCloud = async (localData: {
  customers: Customer[];
  subscriptions: Subscription[];
  products: Product[];
  priceHistory: PriceHistory[];
  deliveries: DeliveryRecord[];
  sales: Sale[];
  payments: Payment[];
  invoices: Invoice[];
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  settings: BusinessSettings;
}): Promise<{ success: boolean; count: number; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Supabase client not configured' };
  }

  try {
    let totalSynced = 0;

    // 1. Settings
    if (localData.settings) {
      await client.from('business_settings').upsert(transformSettingsToDb(localData.settings));
      totalSynced++;
    }

    // 2. Customers
    if (localData.customers.length > 0) {
      const dbCusts = localData.customers.map(transformCustomerToDb);
      await client.from('customers').upsert(dbCusts);
      totalSynced += dbCusts.length;
    }

    // 3. Products
    if (localData.products.length > 0) {
      const dbProds = localData.products.map(transformProductToDb);
      await client.from('products').upsert(dbProds);
      totalSynced += dbProds.length;
    }

    // 4. Price History
    if (localData.priceHistory.length > 0) {
      const dbPriceHist = localData.priceHistory.map(transformPriceHistoryToDb);
      await client.from('price_history').upsert(dbPriceHist);
      totalSynced += dbPriceHist.length;
    }

    // 5. Subscriptions
    if (localData.subscriptions.length > 0) {
      const dbSubs = localData.subscriptions.map(transformSubscriptionToDb);
      await client.from('subscriptions').upsert(dbSubs);
      totalSynced += dbSubs.length;
    }

    // 6. Deliveries
    if (localData.deliveries.length > 0) {
      const dbDels = localData.deliveries.map(transformDeliveryToDb);
      await client.from('delivery_records').upsert(dbDels);
      totalSynced += dbDels.length;
    }

    // 7. Sales
    if (localData.sales.length > 0) {
      const dbSales = localData.sales.map(transformSaleToDb);
      await client.from('sales').upsert(dbSales);
      totalSynced += dbSales.length;
    }

    // 8. Payments
    if (localData.payments.length > 0) {
      const dbPays = localData.payments.map(transformPaymentToDb);
      await client.from('payments').upsert(dbPays);
      totalSynced += dbPays.length;
    }

    // 9. Invoices
    if (localData.invoices.length > 0) {
      const dbInvs = localData.invoices.map(transformInvoiceToDb);
      await client.from('invoices').upsert(dbInvs);
      totalSynced += dbInvs.length;
    }

    // 10. Stock Items & Movements
    if (localData.stockItems.length > 0) {
      const dbStock = localData.stockItems.map(transformStockItemToDb);
      await client.from('stock_items').upsert(dbStock);
      totalSynced += dbStock.length;
    }
    if (localData.stockMovements.length > 0) {
      const dbMoves = localData.stockMovements.map(transformStockMovementToDb);
      await client.from('stock_movements').upsert(dbMoves);
      totalSynced += dbMoves.length;
    }

    return { success: true, count: totalSynced };
  } catch (err: any) {
    console.error('Failed to upload data to Supabase:', err);
    return { success: false, count: 0, error: err?.message || 'Database sync error' };
  }
};

// ============================================================================
// GRANULAR MUTATIONS TO SUPABASE (Fire & Forget with Error Log)
// ============================================================================

export const cloudSync = {
  upsertCustomer: async (c: Customer) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('customers').upsert(transformCustomerToDb(c));
    } catch (err) {
      console.warn('Failed cloud upsert for customer:', err);
    }
  },
  deleteCustomer: async (customerId: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('customers').delete().eq('id', customerId);
    } catch (err) {
      console.warn('Failed cloud delete for customer:', err);
    }
  },
  upsertSubscription: async (s: Subscription) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('subscriptions').upsert(transformSubscriptionToDb(s));
    } catch (err) {
      console.warn('Failed cloud upsert for subscription:', err);
    }
  },
  deleteSubscription: async (subscriptionId: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('subscriptions').delete().eq('id', subscriptionId);
    } catch (err) {
      console.warn('Failed cloud delete for subscription:', err);
    }
  },
  upsertDelivery: async (d: DeliveryRecord) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('delivery_records').upsert(transformDeliveryToDb(d));
    } catch (err) {
      console.warn('Failed cloud upsert for delivery:', err);
    }
  },
  upsertBulkDeliveries: async (dels: DeliveryRecord[]) => {
    const client = getSupabaseClient();
    if (!client || dels.length === 0) return;
    try {
      await client.from('delivery_records').upsert(dels.map(transformDeliveryToDb));
    } catch (err) {
      console.warn('Failed cloud upsert for bulk deliveries:', err);
    }
  },
  deleteDelivery: async (deliveryId: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('delivery_records').delete().eq('id', deliveryId);
    } catch (err) {
      console.warn('Failed cloud delete for delivery:', err);
    }
  },
  upsertSale: async (s: Sale) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('sales').upsert(transformSaleToDb(s));
    } catch (err) {
      console.warn('Failed cloud upsert for sale:', err);
    }
  },
  deleteSale: async (saleId: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('sales').delete().eq('id', saleId);
    } catch (err) {
      console.warn('Failed cloud delete for sale:', err);
    }
  },
  upsertPayment: async (p: Payment) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('payments').upsert(transformPaymentToDb(p));
    } catch (err) {
      console.warn('Failed cloud upsert for payment:', err);
    }
  },
  deletePayment: async (paymentId: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('payments').delete().eq('id', paymentId);
    } catch (err) {
      console.warn('Failed cloud delete for payment:', err);
    }
  },
  upsertInvoice: async (inv: Invoice) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('invoices').upsert(transformInvoiceToDb(inv));
    } catch (err) {
      console.warn('Failed cloud upsert for invoice:', err);
    }
  },
  deleteInvoice: async (invoiceId: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('invoices').delete().eq('id', invoiceId);
    } catch (err) {
      console.warn('Failed cloud delete for invoice:', err);
    }
  },
  upsertProduct: async (p: Product) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('products').upsert(transformProductToDb(p));
    } catch (err) {
      console.warn('Failed cloud upsert for product:', err);
    }
  },
  upsertPriceHistory: async (ph: PriceHistory) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('price_history').upsert(transformPriceHistoryToDb(ph));
    } catch (err) {
      console.warn('Failed cloud upsert for price history:', err);
    }
  },
  upsertStockItem: async (item: StockItem) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('stock_items').upsert(transformStockItemToDb(item));
    } catch (err) {
      console.warn('Failed cloud upsert for stock item:', err);
    }
  },
  upsertStockMovement: async (m: StockMovement) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('stock_movements').upsert(transformStockMovementToDb(m));
    } catch (err) {
      console.warn('Failed cloud upsert for stock movement:', err);
    }
  },
  upsertSettings: async (s: BusinessSettings) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('business_settings').upsert(transformSettingsToDb(s));
    } catch (err) {
      console.warn('Failed cloud upsert for settings:', err);
    }
  }
};
