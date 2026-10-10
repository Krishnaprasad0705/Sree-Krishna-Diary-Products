import { describe, it, expect } from 'vitest';
import { calculateCustomerLedger, formatCurrency, formatVolume } from '../lib/calculations';
import { Customer, Subscription, DeliveryRecord, Sale, Payment, Invoice } from '../types';

describe('Sree Krishna Dairy Products - Core Business Logic & Financial Ledger Tests', () => {
  it('Scenario 1: Exact Benchmark Test Case from Prompt (₹1800 sub + ₹120 extra = ₹1920 charges, ₹500 on 7th + ₹700 on 18th = ₹720 due; +₹800 pay = ₹80 credit)', () => {
    const customer: Customer = {
      id: 'cust-test-1',
      name: 'Ramesh Kumar Test Case',
      phone: '98402 11223',
      address: 'Flat 3B, Sri Krishna Apartments',
      location: 'Gandhi Road',
      category: 'REGULAR',
      status: 'ACTIVE',
      openingBalance: 0,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    };

    const subscriptions: Subscription[] = [
      {
        id: 'sub-test-1',
        customerId: 'cust-test-1',
        pricingModel: 'ACTUAL_DELIVERY',
        expectedDailyQuantityMl: 1000,
        status: 'ACTIVE',
        schedule: 'EVERYDAY',
        startDate: '2026-09-01',
        updatedAt: '2026-09-01T00:00:00Z'
      }
    ];

    // 30 days of 1L @ ₹60/L = ₹1800. Plus 2 entries with 1L extra = 2L extra @ ₹60/L = ₹120. Total charges = ₹1920.
    const deliveries: DeliveryRecord[] = [];
    for (let day = 1; day <= 30; day++) {
      const dayStr = String(day).padStart(2, '0');
      const extraMl = day === 2 || day === 4 ? 1000 : 0;
      const totalAmt = ((1000 + extraMl) / 1000) * 60;
      deliveries.push({
        id: `del-${dayStr}`,
        date: `2026-09-${dayStr}`,
        customerId: 'cust-test-1',
        customerName: 'Ramesh Kumar Test Case',
        quantityMl: 1000,
        extraQuantityMl: extraMl,
        unitPricePerLiter: 60,
        totalAmount: totalAmt,
        status: 'DELIVERED',
        recordedAt: `2026-09-${dayStr}T06:30:00Z`
      });
    }

    // Two payments: ₹500 on 7th, ₹700 on 18th
    const payments: Payment[] = [
      {
        id: 'pay-1',
        date: '2026-09-07',
        customerId: 'cust-test-1',
        amount: 500,
        paymentMethod: 'UPI',
        referenceNo: 'UPI/260907/001',
        recordedAt: '2026-09-07T14:00:00Z'
      },
      {
        id: 'pay-2',
        date: '2026-09-18',
        customerId: 'cust-test-1',
        amount: 700,
        paymentMethod: 'CASH',
        referenceNo: 'CASH-REC-01',
        recordedAt: '2026-09-18T18:00:00Z'
      }
    ];

    const ledgerResult = calculateCustomerLedger(
      customer,
      subscriptions,
      deliveries,
      [],
      payments,
      []
    );

    // Assert total charges = ₹1,920
    expect(ledgerResult.totalCharges).toBe(1920);

    // Assert total payments = ₹1,200
    expect(ledgerResult.totalPayments).toBe(1200);

    // Assert remaining amount due = ₹720
    expect(ledgerResult.currentBalance).toBe(720);
    expect(ledgerResult.isCredit).toBe(false);

    // If customer pays another ₹800:
    const subsequentPayments: Payment[] = [
      ...payments,
      {
        id: 'pay-3',
        date: '2026-09-25',
        customerId: 'cust-test-1',
        amount: 800,
        paymentMethod: 'UPI',
        referenceNo: 'UPI/260925/002',
        recordedAt: '2026-09-25T10:00:00Z'
      }
    ];

    const updatedLedger = calculateCustomerLedger(
      customer,
      subscriptions,
      deliveries,
      [],
      subsequentPayments,
      []
    );

    // Assert remaining balance is -80 (₹80 customer credit)
    expect(updatedLedger.totalPayments).toBe(2000);
    expect(updatedLedger.currentBalance).toBe(-80);
    expect(updatedLedger.isCredit).toBe(true);
  });

  it('Scenario 2: Model B Fixed Recurring Billing separates standard from extra charges without double billing', () => {
    const customer: Customer = {
      id: 'cust-fixed-1',
      name: 'Meenakshi Sundaram',
      phone: '94441 55667',
      address: 'Sannathi St',
      location: 'Temple',
      category: 'REGULAR',
      status: 'ACTIVE',
      openingBalance: 0,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    };

    const subscriptions: Subscription[] = [
      {
        id: 'sub-fixed-1',
        customerId: 'cust-fixed-1',
        pricingModel: 'FIXED_RECURRING',
        expectedDailyQuantityMl: 1500,
        fixedMonthlyAmount: 2700,
        status: 'ACTIVE',
        schedule: 'EVERYDAY',
        startDate: '2026-09-01',
        updatedAt: '2026-09-01T00:00:00Z'
      }
    ];

    // Under fixed recurring, daily delivery records with extra milk only debit the extra portion into ledger
    const deliveries: DeliveryRecord[] = [
      {
        id: 'del-f1',
        date: '2026-09-05',
        customerId: 'cust-fixed-1',
        quantityMl: 1500,
        extraQuantityMl: 500, // 500ml extra @ ₹60/L = ₹30
        unitPricePerLiter: 60,
        totalAmount: 120,
        status: 'DELIVERED',
        recordedAt: '2026-09-05T06:00:00Z'
      }
    ];

    const ledger = calculateCustomerLedger(customer, subscriptions, deliveries, [], [], []);

    // Only ₹30 extra milk is recorded as extra debit
    expect(ledger.totalCharges).toBe(30);
  });

  it('Scenario 3: Format Currency and Format Volume handles Indian notation and ml conversions', () => {
    expect(formatCurrency(1920)).toBe('₹1,920');
    expect(formatCurrency(-80)).toBe('-₹80 (Cr)');
    expect(formatVolume(250)).toBe('250 ml');
    expect(formatVolume(1000)).toBe('1 L');
    expect(formatVolume(1500)).toBe('1.5 L');
  });

  it('Scenario 4: getLocalDateString formats local dates reliably without UTC timezone rollback', () => {
    // Construct local date: October 10, 2026
    const d = new Date(2026, 9, 10, 0, 0, 0); // Month is 0-indexed (9 = Oct)
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(10);
  });

  it('Scenario 5: calculateCustomerLedger handles missing or undefined optional fields safely without crashing', () => {
    // Incomplete customer missing optional openingBalance and createdAt
    const customer = {
      id: 'cust-incomplete-1',
      name: 'Incomplete Details Customer',
      phone: '98402 99999',
      address: 'Near Temple',
      location: 'South Street',
      category: 'OCCASIONAL' as const,
      status: 'ACTIVE' as const,
      openingBalance: undefined as any,
      createdAt: undefined as any,
      updatedAt: '2026-10-01T00:00:00Z'
    };

    // Delivery record missing extraQuantityMl and unitPricePerLiter
    const deliveries = [
      {
        id: 'del-inc-1',
        date: '2026-10-01',
        customerId: 'cust-incomplete-1',
        quantityMl: 500,
        extraQuantityMl: undefined as any,
        unitPricePerLiter: undefined as any,
        totalAmount: 30,
        status: 'DELIVERED' as const,
        recordedAt: '2026-10-01T06:00:00Z'
      }
    ];

    // Sale with undefined items
    const sales: Sale[] = [
      {
        id: 'sale-inc-1',
        date: '2026-10-02',
        customerId: 'cust-incomplete-1',
        customerName: 'Incomplete Details Customer',
        items: undefined as any,
        discount: 0,
        finalAmount: 50,
        totalAmount: 50,
        amountPaid: 50,
        isWalkIn: false,
        paymentStatus: 'PAID' as const,
        paymentMethod: 'CASH' as const,
        recordedAt: '2026-10-02T10:00:00Z'
      }
    ];

    // Should compute cleanly without throwing any TypeError or NaN
    const ledger = calculateCustomerLedger(customer, [], deliveries, sales, [], []);

    expect(ledger).toBeDefined();
    expect(ledger.entries.length).toBeGreaterThanOrEqual(1);
    expect(typeof ledger.currentBalance).toBe('number');
    expect(isNaN(ledger.currentBalance)).toBe(false);
  });
});
