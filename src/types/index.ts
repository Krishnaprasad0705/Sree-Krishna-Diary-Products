export type CustomerCategory = 'REGULAR' | 'OCCASIONAL';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type PricingModel = 'ACTUAL_DELIVERY' | 'FIXED_RECURRING';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';
export type DeliverySchedule = 'EVERYDAY' | 'ALTERNATE' | 'WEEKDAYS' | 'CUSTOM';

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  location: string; // Village, street or landmark
  deliveryInstructions?: string;
  category: CustomerCategory;
  status: CustomerStatus;
  notes?: string;
  openingBalance: number; // Positive = owes money, negative = credit/advance
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  pricingModel: PricingModel;
  expectedDailyQuantityMl: number; // stored in ml (e.g. 1000 for 1L)
  fixedMonthlyAmount?: number; // only if pricingModel is FIXED_RECURRING
  status: SubscriptionStatus;
  schedule: DeliverySchedule;
  startDate: string;
  renewalDate?: string;
  notes?: string;
  updatedAt: string;
}

export interface ProductPackage {
  id: string;
  name: string;
  volumeMl: number; // e.g. 250, 500, 750, 1000
  price: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  type: 'MILK' | 'GHEE' | 'OTHER';
  unit: 'ml' | 'g' | 'unit';
  currentPricePerLiter: number; // Base rate per 1000ml or 1000g
  packages: ProductPackage[];
  description?: string;
  isActive: boolean;
}

export interface PriceHistory {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  effectiveDate: string;
  reason?: string;
  recordedAt: string;
}

export interface DeliveryRecord {
  id: string;
  date: string; // YYYY-MM-DD
  customerId: string;
  customerName?: string;
  quantityMl: number; // normal subscription portion
  extraQuantityMl: number; // separate additional milk
  unitPricePerLiter: number;
  totalAmount: number; // (quantityMl + extraQuantityMl) / 1000 * unitPricePerLiter
  status: 'DELIVERED' | 'SKIPPED' | 'MODIFIED';
  notes?: string;
  recordedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  packageId?: string;
  quantityMl: number; // or count
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string;
  customerId?: string;
  customerName: string;
  isWalkIn: boolean;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedAt: string;
}

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  customerId: string;
  customerName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  invoiceId?: string; // Optional allocation to a specific bill
  notes?: string;
  recordedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  date?: string;
  quantity: string;
  rate: number;
  amount: number;
  type: 'SUBSCRIPTION_FIXED' | 'DELIVERY' | 'EXTRA_MILK' | 'GHEE' | 'ADJUSTMENT' | 'PREVIOUS_BALANCE';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  issueDate: string;
  dueDate: string;
  previousBalance: number;
  subscriptionCharges: number;
  deliveryCharges: number;
  extraMilkCharges: number;
  gheeCharges: number;
  adjustments: number;
  totalPayable: number;
  paymentsAllocated: number;
  remainingDue: number; // totalPayable - paymentsAllocated
  status: InvoiceStatus;
  notes?: string;
  lineItems: InvoiceLineItem[];
  generatedAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  customerId: string;
  type: 'CHARGE_SUBSCRIPTION' | 'CHARGE_DELIVERY' | 'CHARGE_EXTRA' | 'CHARGE_GHEE' | 'PAYMENT' | 'ADJUSTMENT_CREDIT' | 'ADJUSTMENT_DEBIT' | 'OPENING_BALANCE';
  description: string;
  debit: number; // increases what customer owes
  credit: number; // decreases what customer owes (payments, credit notes)
  runningBalance: number;
  referenceId?: string;
  recordedAt: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  villageTown: string;
  districtState: string;
  pincode: string;
  upiId: string;
  currencySymbol: string;
  timeZone: string;
  invoicePrefix: string;
  defaultMilkRatePerLiter: number;
  defaultGheeRatePerLiter: number;
  enableStockTracking: boolean;
  language: 'en' | 'ta';
}

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  currentStockLiters: number;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  date: string;
  type: 'OPENING' | 'PROCUREMENT' | 'SALES_DEDUCTION' | 'DELIVERY_DEDUCTION' | 'ADJUSTMENT';
  quantityLiters: number;
  notes?: string;
}
