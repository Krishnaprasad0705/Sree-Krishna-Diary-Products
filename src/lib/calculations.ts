import { Customer, Subscription, DeliveryRecord, Sale, Payment, Invoice, LedgerEntry, BusinessSettings } from '../types';

/**
 * Generates an immutable, chronological ledger of all debits and credits for a customer.
 * Maintains the exact running balance:
 * Positive = Customer owes money
 * Negative = Customer has credit / advance balance
 */
export function calculateCustomerLedger(
  customer: Customer,
  subscriptions: Subscription[],
  deliveries: DeliveryRecord[],
  sales: Sale[],
  payments: Payment[],
  invoices: Invoice[]
): {
  entries: LedgerEntry[];
  totalCharges: number;
  totalPayments: number;
  currentBalance: number;
  isCredit: boolean;
} {
  const customerId = customer.id;
  const entries: LedgerEntry[] = [];

  // 1. Opening balance
  if (customer.openingBalance !== 0) {
    entries.push({
      id: `open-${customer.id}`,
      date: customer.createdAt.split('T')[0],
      customerId,
      type: 'OPENING_BALANCE',
      description: 'Opening Balance Carried Forward',
      debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
      credit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
      runningBalance: customer.openingBalance,
      recordedAt: customer.createdAt
    });
  }

  // 2. Deliveries for this customer
  const custDeliveries = deliveries.filter(d => d.customerId === customerId);
  const sub = subscriptions.find(s => s.customerId === customerId);
  const isFixedSubscription = sub?.pricingModel === 'FIXED_RECURRING';

  custDeliveries.forEach(del => {
    // If fixed subscription model, standard quantity is covered by monthly fixed charge;
    // but extra milk is ALWAYS charged separately as a debit.
    if (isFixedSubscription) {
      if (del.extraQuantityMl > 0) {
        const extraCharge = (del.extraQuantityMl / 1000) * del.unitPricePerLiter;
        entries.push({
          id: `del-extra-${del.id}`,
          date: del.date,
          customerId,
          type: 'CHARGE_EXTRA',
          description: `Extra Milk Delivery (${del.extraQuantityMl} ml @ ₹${del.unitPricePerLiter}/L)`,
          debit: extraCharge,
          credit: 0,
          runningBalance: 0,
          referenceId: del.id,
          recordedAt: del.recordedAt
        });
      }
    } else {
      // Actual delivery model: Standard delivery + extra milk
      if (del.quantityMl > 0) {
        const standardCharge = (del.quantityMl / 1000) * del.unitPricePerLiter;
        entries.push({
          id: `del-std-${del.id}`,
          date: del.date,
          customerId,
          type: 'CHARGE_DELIVERY',
          description: `Daily Milk Delivery (${del.quantityMl} ml @ ₹${del.unitPricePerLiter}/L)`,
          debit: standardCharge,
          credit: 0,
          runningBalance: 0,
          referenceId: del.id,
          recordedAt: del.recordedAt
        });
      }
      if (del.extraQuantityMl > 0) {
        const extraCharge = (del.extraQuantityMl / 1000) * del.unitPricePerLiter;
        entries.push({
          id: `del-extra-${del.id}`,
          date: del.date,
          customerId,
          type: 'CHARGE_EXTRA',
          description: `Extra Milk Delivery (${del.extraQuantityMl} ml @ ₹${del.unitPricePerLiter}/L)`,
          debit: extraCharge,
          credit: 0,
          runningBalance: 0,
          referenceId: del.id,
          recordedAt: del.recordedAt
        });
      }
    }
  });

  // 3. Sales / Occasional / Ghee purchases attached to this customer
  const custSales = sales.filter(s => s.customerId === customerId);
  custSales.forEach(sale => {
    sale.items.forEach((item, idx) => {
      const isGhee = item.productName.toLowerCase().includes('ghee');
      entries.push({
        id: `sale-item-${sale.id}-${idx}`,
        date: sale.date,
        customerId,
        type: isGhee ? 'CHARGE_GHEE' : 'CHARGE_EXTRA',
        description: `Direct Purchase: ${item.productName}`,
        debit: item.subtotal,
        credit: 0,
        runningBalance: 0,
        referenceId: sale.id,
        recordedAt: sale.recordedAt
      });
    });

    // If customer paid at point of sale, record the payment credit
    if (sale.amountPaid > 0) {
      entries.push({
        id: `sale-pay-${sale.id}`,
        date: sale.date,
        customerId,
        type: 'PAYMENT',
        description: `Payment at POS (${sale.paymentMethod}) - Sale #${sale.id.slice(0, 8)}`,
        debit: 0,
        credit: sale.amountPaid,
        runningBalance: 0,
        referenceId: sale.id,
        recordedAt: sale.recordedAt
      });
    }
  });

  // 4. Payments received
  const custPayments = payments.filter(p => p.customerId === customerId);
  custPayments.forEach(pay => {
    entries.push({
      id: `pay-${pay.id}`,
      date: pay.date,
      customerId,
      type: 'PAYMENT',
      description: `Payment Received via ${pay.paymentMethod}${pay.referenceNo ? ` [Ref: ${pay.referenceNo}]` : ''}${pay.notes ? ` - ${pay.notes}` : ''}`,
      debit: 0,
      credit: pay.amount,
      runningBalance: 0,
      referenceId: pay.id,
      recordedAt: pay.recordedAt
    });
  });

  // Sort chronological
  entries.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return a.recordedAt.localeCompare(b.recordedAt);
  });

  // Compute running balance
  let running = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    totalDebit += entry.debit;
    totalCredit += entry.credit;
    running = running + entry.debit - entry.credit;
    entry.runningBalance = running;
  }

  return {
    entries,
    totalCharges: Math.round(totalDebit * 100) / 100,
    totalPayments: Math.round(totalCredit * 100) / 100,
    currentBalance: Math.round(running * 100) / 100,
    isCredit: running < 0
  };
}

/**
 * Format currency in Indian Rupees format (e.g. ₹1,920.00)
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(abs);

  if (amount < 0) {
    return `-${symbol}${formatted} (Cr)`;
  }
  return `${symbol}${formatted}`;
}

/**
 * Format volume in ml or Litres
 */
export function formatVolume(volumeMl: number): string {
  if (volumeMl >= 1000) {
    const liters = volumeMl / 1000;
    return Number.isInteger(liters) ? `${liters} L` : `${liters.toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  return `${volumeMl} ml`;
}
