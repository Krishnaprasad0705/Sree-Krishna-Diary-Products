import { Customer, Subscription, DeliveryRecord, Sale, Payment, Invoice, LedgerEntry, BusinessSettings } from '../types';

/**
 * Format a Date object to YYYY-MM-DD in local time without UTC offset distortion.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates an immutable, chronological ledger of all debits and credits for a customer.
 * Maintains the exact running balance:
 * Positive = Customer owes money
 * Negative = Customer has credit / advance balance
 */
export function calculateCustomerLedger(
  customer: Customer,
  subscriptions: Subscription[] = [],
  deliveries: DeliveryRecord[] = [],
  sales: Sale[] = [],
  payments: Payment[] = [],
  invoices: Invoice[] = []
): {
  entries: LedgerEntry[];
  totalCharges: number;
  totalPayments: number;
  currentBalance: number;
  isCredit: boolean;
} {
  if (!customer) {
    return {
      entries: [],
      totalCharges: 0,
      totalPayments: 0,
      currentBalance: 0,
      isCredit: false
    };
  }

  const customerId = customer.id;
  const entries: LedgerEntry[] = [];

  // 1. Opening balance
  const openingBal = Number(customer.openingBalance) || 0;
  if (openingBal !== 0) {
    const openDate = (customer.createdAt || '').includes('T')
      ? customer.createdAt.split('T')[0]
      : customer.createdAt || getLocalDateString();

    entries.push({
      id: `open-${customer.id}`,
      date: openDate,
      customerId,
      type: 'OPENING_BALANCE',
      description: 'Opening Balance Carried Forward',
      debit: openingBal > 0 ? openingBal : 0,
      credit: openingBal < 0 ? Math.abs(openingBal) : 0,
      runningBalance: openingBal,
      recordedAt: customer.createdAt || new Date().toISOString()
    });
  }

  // 2. Deliveries for this customer
  const custDeliveries = (deliveries || []).filter(d => d && d.customerId === customerId);
  const sub = (subscriptions || []).find(s => s && s.customerId === customerId);
  const isFixedSubscription = sub?.pricingModel === 'FIXED_RECURRING';

  custDeliveries.forEach(del => {
    const qtyMl = Number(del.quantityMl) || 0;
    const extraQtyMl = Number(del.extraQuantityMl) || 0;
    const unitPrice = Number(del.unitPricePerLiter) || 60;
    const delDate = del.date || getLocalDateString();
    const recordedAt = del.recordedAt || new Date().toISOString();

    // If fixed subscription model, standard quantity is covered by monthly fixed charge;
    // but extra milk is ALWAYS charged separately as a debit.
    if (isFixedSubscription) {
      if (extraQtyMl > 0) {
        const extraCharge = (extraQtyMl / 1000) * unitPrice;
        entries.push({
          id: `del-extra-${del.id}`,
          date: delDate,
          customerId,
          type: 'CHARGE_EXTRA',
          description: `Extra Milk Delivery (${extraQtyMl} ml @ ₹${unitPrice}/L)`,
          debit: extraCharge,
          credit: 0,
          runningBalance: 0,
          referenceId: del.id,
          recordedAt
        });
      }
    } else {
      // Actual delivery model: Standard delivery + extra milk
      if (qtyMl > 0) {
        const standardCharge = (qtyMl / 1000) * unitPrice;
        entries.push({
          id: `del-std-${del.id}`,
          date: delDate,
          customerId,
          type: 'CHARGE_DELIVERY',
          description: `Daily Milk Delivery (${qtyMl} ml @ ₹${unitPrice}/L)`,
          debit: standardCharge,
          credit: 0,
          runningBalance: 0,
          referenceId: del.id,
          recordedAt
        });
      }
      if (extraQtyMl > 0) {
        const extraCharge = (extraQtyMl / 1000) * unitPrice;
        entries.push({
          id: `del-extra-${del.id}`,
          date: delDate,
          customerId,
          type: 'CHARGE_EXTRA',
          description: `Extra Milk Delivery (${extraQtyMl} ml @ ₹${unitPrice}/L)`,
          debit: extraCharge,
          credit: 0,
          runningBalance: 0,
          referenceId: del.id,
          recordedAt
        });
      }
    }
  });

  // 3. Sales / Occasional / Ghee purchases attached to this customer
  const custSales = (sales || []).filter(s => s && s.customerId === customerId);
  custSales.forEach(sale => {
    const saleDate = sale.date || getLocalDateString();
    const recordedAt = sale.recordedAt || new Date().toISOString();
    const items = Array.isArray(sale.items) ? sale.items : [];

    items.forEach((item, idx) => {
      const prodName = item.productName || 'Dairy Product';
      const isGhee = prodName.toLowerCase().includes('ghee');
      const subtotal = Number(item.subtotal) || 0;
      entries.push({
        id: `sale-item-${sale.id}-${idx}`,
        date: saleDate,
        customerId,
        type: isGhee ? 'CHARGE_GHEE' : 'CHARGE_EXTRA',
        description: `Direct Purchase: ${prodName}`,
        debit: subtotal,
        credit: 0,
        runningBalance: 0,
        referenceId: sale.id,
        recordedAt
      });
    });

    // If customer paid at point of sale, record the payment credit
    const paid = Number(sale.amountPaid) || 0;
    if (paid > 0) {
      entries.push({
        id: `sale-pay-${sale.id}`,
        date: saleDate,
        customerId,
        type: 'PAYMENT',
        description: `Payment at POS (${sale.paymentMethod || 'CASH'}) - Sale #${(sale.id || '').slice(0, 8)}`,
        debit: 0,
        credit: paid,
        runningBalance: 0,
        referenceId: sale.id,
        recordedAt
      });
    }
  });

  // 4. Payments received
  const custPayments = (payments || []).filter(p => p && p.customerId === customerId);
  custPayments.forEach(pay => {
    const payDate = pay.date || getLocalDateString();
    const payAmount = Number(pay.amount) || 0;
    const recordedAt = pay.recordedAt || new Date().toISOString();

    entries.push({
      id: `pay-${pay.id}`,
      date: payDate,
      customerId,
      type: 'PAYMENT',
      description: `Payment Received via ${pay.paymentMethod || 'CASH'}${pay.referenceNo ? ` [Ref: ${pay.referenceNo}]` : ''}${pay.notes ? ` - ${pay.notes}` : ''}`,
      debit: 0,
      credit: payAmount,
      runningBalance: 0,
      referenceId: pay.id,
      recordedAt
    });
  });

  // Sort chronological
  entries.sort((a, b) => {
    const cmp = (a.date || '').localeCompare(b.date || '');
    if (cmp !== 0) return cmp;
    return (a.recordedAt || '').localeCompare(b.recordedAt || '');
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
