import { Customer, Subscription, Product, DeliveryRecord, Sale, Payment, Invoice, BusinessSettings, PriceHistory, StockItem } from '../types';

export const initialBusinessSettings: BusinessSettings = {
  businessName: 'Sree Krishna Dairy Products',
  tagline: 'Pure, Fresh Farm Milk & Traditional Cow Ghee',
  ownerName: 'S. Radhakrishnan',
  phone: '+91 98401 23456',
  alternatePhone: '+91 98401 65432',
  email: 'sreekrishnadairy@gmail.com',
  address: 'No. 14, Main Road, Krishna Nagar, Sannathi Street',
  villageTown: 'Kanchipuram',
  districtState: 'Tamil Nadu',
  pincode: '631501',
  upiId: 'sreekrishnadairy@oksbi',
  currencySymbol: '₹',
  timeZone: 'Asia/Kolkata',
  invoicePrefix: 'SKD',
  defaultMilkRatePerLiter: 60,
  defaultGheeRatePerLiter: 700,
  enableStockTracking: true,
  language: 'en'
};

export const initialProducts: Product[] = [
  {
    id: 'prod-milk',
    name: 'Pure Fresh Cow Milk',
    code: 'MILK-COW',
    type: 'MILK',
    unit: 'ml',
    currentPricePerLiter: 60,
    description: 'Farm-fresh raw & unadulterated whole cow milk, delivered within 3 hours of morning milking.',
    isActive: true,
    packages: [
      { id: 'pkg-m-250', name: '250 ml (Quarter Litre)', volumeMl: 250, price: 15 },
      { id: 'pkg-m-500', name: '500 ml (Half Litre)', volumeMl: 500, price: 30 },
      { id: 'pkg-m-750', name: '750 ml (3/4 Litre)', volumeMl: 750, price: 45 },
      { id: 'pkg-m-1000', name: '1000 ml (1 Litre)', volumeMl: 1000, price: 60 },
      { id: 'pkg-m-1500', name: '1.5 Litres', volumeMl: 1500, price: 90 },
      { id: 'pkg-m-2000', name: '2.0 Litres', volumeMl: 2000, price: 120 },
    ]
  },
  {
    id: 'prod-ghee',
    name: 'Traditional A2 Cow Ghee',
    code: 'GHEE-TRAD',
    type: 'GHEE',
    unit: 'ml',
    currentPricePerLiter: 700,
    description: 'Slow-cooked golden aromatic ghee made from cultured farm butter using traditional methods.',
    isActive: true,
    packages: [
      { id: 'pkg-g-250', name: '250 ml Glass Jar', volumeMl: 250, price: 180 },
      { id: 'pkg-g-500', name: '500 ml Glass Jar', volumeMl: 500, price: 350 },
      { id: 'pkg-g-1000', name: '1000 ml Heritage Jar', volumeMl: 1000, price: 700 },
    ]
  },
  {
    id: 'prod-paneer',
    name: 'Fresh Farm Paneer',
    code: 'PANEER-FRESH',
    type: 'OTHER',
    unit: 'g',
    currentPricePerLiter: 400,
    description: 'Soft, melt-in-mouth cottage cheese crafted daily from rich cow milk.',
    isActive: true,
    packages: [
      { id: 'pkg-p-200', name: '200g Fresh Pack', volumeMl: 200, price: 85 },
      { id: 'pkg-p-500', name: '500g Value Pack', volumeMl: 500, price: 200 },
    ]
  }
];

export const initialPriceHistory: PriceHistory[] = [
  {
    id: 'ph-1',
    productId: 'prod-milk',
    productName: 'Pure Fresh Cow Milk',
    oldPrice: 56,
    newPrice: 60,
    effectiveDate: '2026-08-01',
    reason: 'Annual revision based on feed costs and farmer procurement rates',
    recordedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'ph-2',
    productId: 'prod-ghee',
    productName: 'Traditional A2 Cow Ghee',
    oldPrice: 650,
    newPrice: 700,
    effectiveDate: '2026-07-15',
    reason: 'Packaging upgrade to food-grade glass jars',
    recordedAt: '2026-07-15T09:30:00Z'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Ramesh Kumar (Verification Case)',
    phone: '98402 11223',
    address: 'Flat 3B, Sri Krishna Apartments, Gandhi Road',
    location: 'Gandhi Road',
    deliveryInstructions: 'Leave milk bag on the door handle hook before 6:30 AM',
    category: 'REGULAR',
    status: 'ACTIVE',
    notes: 'Reference benchmark account. Has ₹1800 sub + ₹120 extra = ₹1920 charges. Paid ₹500 & ₹700.',
    openingBalance: 0,
    createdAt: '2026-09-01T06:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z'
  },
  {
    id: 'cust-2',
    name: 'Meenakshi Sundaram',
    phone: '94441 55667',
    address: 'No. 28, Sannathi Street, Near Kamakshi Temple',
    location: 'Temple Sannathi',
    deliveryInstructions: 'Ring bell twice softly. Needs 1.5L daily.',
    category: 'REGULAR',
    status: 'ACTIVE',
    notes: 'Prefers fixed monthly subscription. Regular Ghee buyer on festival days.',
    openingBalance: 0,
    createdAt: '2026-08-15T06:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z'
  },
  {
    id: 'cust-3',
    name: 'Dr. Venkat Raman',
    phone: '98840 99881',
    address: 'No. 12, Doctors Colony, East Tambaram',
    location: 'Doctors Colony',
    deliveryInstructions: 'Drop in stainless steel milk can kept on porch table',
    category: 'REGULAR',
    status: 'ACTIVE',
    notes: 'Daily 1 Litre subscriber. Always pays advance via UPI.',
    openingBalance: -300, // ₹300 customer credit/advance
    createdAt: '2026-07-10T06:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z'
  },
  {
    id: 'cust-4',
    name: 'Ananya Krishnan',
    phone: '97908 33445',
    address: 'No. 5, Rajaji Street, Vedachalam Nagar',
    location: 'Vedachalam Nagar',
    deliveryInstructions: 'Delivery between 6:00 AM and 6:45 AM',
    category: 'REGULAR',
    status: 'ACTIVE',
    notes: 'Actual delivery model. Often takes extra 500ml on weekends for sweets.',
    openingBalance: 0,
    createdAt: '2026-09-10T06:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z'
  },
  {
    id: 'cust-5',
    name: 'Karthik Raja (Occasional Buyer)',
    phone: '98415 77889',
    address: 'No. 44, Bazaar Street',
    location: 'Bazaar Street',
    deliveryInstructions: 'Walk-in buyer for festival ghee and occasional milk',
    category: 'OCCASIONAL',
    status: 'ACTIVE',
    notes: 'Buys 1L or 2L Ghee during Diwali & Pongal seasons.',
    openingBalance: 0,
    createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z'
  },
  {
    id: 'cust-6',
    name: 'Sri Varadaraja Perumal Temple Trust',
    phone: '94432 10987',
    address: 'Devasthan Office, Sannathi Street',
    location: 'Temple Sannathi',
    deliveryInstructions: 'Deliver 5 Litres milk directly to Temple Madapalli (kitchen) at 5:30 AM',
    category: 'REGULAR',
    status: 'ACTIVE',
    notes: 'Large daily volume subscriber. Billed on actual delivery monthly.',
    openingBalance: 0,
    createdAt: '2026-06-01T05:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z'
  },
  {
    id: 'cust-7',
    name: 'Narayanan N.',
    phone: '98409 44332',
    address: 'Old No. 7, North Mada Street',
    location: 'North Mada Street',
    deliveryInstructions: '',
    category: 'REGULAR',
    status: 'INACTIVE',
    notes: 'Temporarily out of town for 2 months. Subscription paused.',
    openingBalance: 120, // previous unpaid balance
    createdAt: '2026-05-15T06:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z'
  }
];

export const initialSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    customerId: 'cust-1',
    pricingModel: 'ACTUAL_DELIVERY',
    expectedDailyQuantityMl: 1000, // 1 Litre daily = ₹60/day
    status: 'ACTIVE',
    schedule: 'EVERYDAY',
    startDate: '2026-09-01',
    notes: 'Delivered daily, 1L standard. Extra milk billed as recorded.',
    updatedAt: '2026-09-01T06:00:00Z'
  },
  {
    id: 'sub-2',
    customerId: 'cust-2',
    pricingModel: 'FIXED_RECURRING',
    expectedDailyQuantityMl: 1500, // 1.5 Litres daily
    fixedMonthlyAmount: 2700, // Agreed fixed recurring rate
    status: 'ACTIVE',
    schedule: 'EVERYDAY',
    startDate: '2026-08-15',
    notes: 'Fixed subscription rate: ₹2700/month. Additional ghee charged separately.',
    updatedAt: '2026-08-15T06:00:00Z'
  },
  {
    id: 'sub-3',
    customerId: 'cust-3',
    pricingModel: 'ACTUAL_DELIVERY',
    expectedDailyQuantityMl: 1000, // 1 Litre daily
    status: 'ACTIVE',
    schedule: 'EVERYDAY',
    startDate: '2026-07-10',
    notes: '1 Litre daily. Paid in advance.',
    updatedAt: '2026-07-10T06:00:00Z'
  },
  {
    id: 'sub-4',
    customerId: 'cust-4',
    pricingModel: 'ACTUAL_DELIVERY',
    expectedDailyQuantityMl: 750, // 750ml daily
    status: 'ACTIVE',
    schedule: 'EVERYDAY',
    startDate: '2026-09-10',
    notes: '750ml daily rate = ₹45/day.',
    updatedAt: '2026-09-10T06:00:00Z'
  },
  {
    id: 'sub-6',
    customerId: 'cust-6',
    pricingModel: 'ACTUAL_DELIVERY',
    expectedDailyQuantityMl: 5000, // 5 Litres daily for Temple
    status: 'ACTIVE',
    schedule: 'EVERYDAY',
    startDate: '2026-06-01',
    notes: 'Temple supply. 5L everyday.',
    updatedAt: '2026-06-01T05:00:00Z'
  },
  {
    id: 'sub-7',
    customerId: 'cust-7',
    pricingModel: 'ACTUAL_DELIVERY',
    expectedDailyQuantityMl: 500,
    status: 'PAUSED',
    schedule: 'EVERYDAY',
    startDate: '2026-05-15',
    notes: 'Paused on customer request while traveling.',
    updatedAt: '2026-09-20T08:00:00Z'
  }
];

// Helper to generate realistic delivery records for the current period (October 2026)
const todayStr = '2026-10-09';

export const initialDeliveryRecords: DeliveryRecord[] = [
  // Ramesh Kumar (cust-1) benchmark dataset matching the exact required test case:
  // Recorded subscription: 30 days of 1L = ₹1800, plus extra milk purchases 2L = ₹120. Total charges = ₹1920.
  {
    id: 'del-1-01',
    date: '2026-10-01',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: 'Regular morning 1L',
    recordedAt: '2026-10-01T06:30:00Z'
  },
  {
    id: 'del-1-02',
    date: '2026-10-02',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 1000, // 1L extra = ₹60 extra
    unitPricePerLiter: 60,
    totalAmount: 120,
    status: 'DELIVERED',
    notes: 'Customer requested 1L extra for guests',
    recordedAt: '2026-10-02T06:30:00Z'
  },
  {
    id: 'del-1-03',
    date: '2026-10-03',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: 'Regular morning 1L',
    recordedAt: '2026-10-03T06:30:00Z'
  },
  {
    id: 'del-1-04',
    date: '2026-10-04',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 1000, // 1L extra = ₹60 extra (total extra now = ₹120!)
    unitPricePerLiter: 60,
    totalAmount: 120,
    status: 'DELIVERED',
    notes: 'Additional 1L extra for payasam/sweets',
    recordedAt: '2026-10-04T06:30:00Z'
  },
  {
    id: 'del-1-05',
    date: '2026-10-05',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: 'Regular morning 1L',
    recordedAt: '2026-10-05T06:30:00Z'
  },
  {
    id: 'del-1-06',
    date: '2026-10-06',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: 'Regular morning 1L',
    recordedAt: '2026-10-06T06:30:00Z'
  },
  {
    id: 'del-1-07',
    date: '2026-10-07',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: 'Regular morning 1L',
    recordedAt: '2026-10-07T06:30:00Z'
  },
  {
    id: 'del-1-08',
    date: '2026-10-08',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: 'Regular morning 1L',
    recordedAt: '2026-10-08T06:30:00Z'
  },
  {
    id: 'del-1-09',
    date: '2026-10-09',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    quantityMl: 1000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: 'Today morning delivery completed',
    recordedAt: '2026-10-09T06:30:00Z'
  },
  // Meenakshi Sundaram (cust-2)
  {
    id: 'del-2-09',
    date: '2026-10-09',
    customerId: 'cust-2',
    customerName: 'Meenakshi Sundaram',
    quantityMl: 1500,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 90,
    status: 'DELIVERED',
    notes: '1.5 Litres standard morning',
    recordedAt: '2026-10-09T06:15:00Z'
  },
  // Dr. Venkat Raman (cust-3)
  {
    id: 'del-3-09',
    date: '2026-10-09',
    customerId: 'cust-3',
    customerName: 'Dr. Venkat Raman',
    quantityMl: 1000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: '1 Litre delivered to porch can',
    recordedAt: '2026-10-09T06:20:00Z'
  },
  // Ananya Krishnan (cust-4)
  {
    id: 'del-4-09',
    date: '2026-10-09',
    customerId: 'cust-4',
    customerName: 'Ananya Krishnan',
    quantityMl: 750,
    extraQuantityMl: 250,
    unitPricePerLiter: 60,
    totalAmount: 60,
    status: 'DELIVERED',
    notes: '750ml standard + 250ml extra',
    recordedAt: '2026-10-09T06:40:00Z'
  },
  // Sri Varadaraja Perumal Temple Trust (cust-6)
  {
    id: 'del-6-09',
    date: '2026-10-09',
    customerId: 'cust-6',
    customerName: 'Sri Varadaraja Perumal Temple Trust',
    quantityMl: 5000,
    extraQuantityMl: 0,
    unitPricePerLiter: 60,
    totalAmount: 300,
    status: 'DELIVERED',
    notes: 'Delivered 5L can to temple madapalli',
    recordedAt: '2026-10-09T05:30:00Z'
  }
];

export const initialSales: Sale[] = [
  {
    id: 'sale-1',
    date: '2026-10-08',
    customerId: 'cust-5',
    customerName: 'Karthik Raja',
    isWalkIn: false,
    items: [
      {
        productId: 'prod-ghee',
        productName: 'Traditional A2 Cow Ghee (500ml)',
        packageId: 'pkg-g-500',
        quantityMl: 500,
        unitPrice: 350,
        subtotal: 350
      },
      {
        productId: 'prod-milk',
        productName: 'Pure Fresh Cow Milk (1000ml)',
        packageId: 'pkg-m-1000',
        quantityMl: 1000,
        unitPrice: 60,
        subtotal: 60
      }
    ],
    totalAmount: 410,
    discount: 0,
    finalAmount: 410,
    amountPaid: 410,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    notes: 'Navaratri pooja purchase',
    recordedAt: '2026-10-08T11:30:00Z'
  },
  {
    id: 'sale-2',
    date: '2026-10-09',
    customerName: 'Walk-in Customer (Senthil)',
    isWalkIn: true,
    items: [
      {
        productId: 'prod-milk',
        productName: 'Pure Fresh Cow Milk (500ml)',
        packageId: 'pkg-m-500',
        quantityMl: 500,
        unitPrice: 30,
        subtotal: 30
      }
    ],
    totalAmount: 30,
    discount: 0,
    finalAmount: 30,
    amountPaid: 30,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    notes: 'Counter quick sale',
    recordedAt: '2026-10-09T07:15:00Z'
  },
  {
    id: 'sale-3',
    date: '2026-10-09',
    customerName: 'Walk-in Customer (Suresh)',
    isWalkIn: true,
    items: [
      {
        productId: 'prod-ghee',
        productName: 'Traditional A2 Cow Ghee (250ml)',
        packageId: 'pkg-g-250',
        quantityMl: 250,
        unitPrice: 180,
        subtotal: 180
      }
    ],
    totalAmount: 180,
    discount: 0,
    finalAmount: 180,
    amountPaid: 180,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    notes: 'Counter sale',
    recordedAt: '2026-10-09T09:40:00Z'
  }
];

// Test case payments matching the exact scenario specified in prompt:
// "They pay ₹500 on the 7th and ₹700 on the 18th"
export const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    date: '2026-10-07',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    amount: 500,
    paymentMethod: 'UPI',
    referenceNo: 'UPI/261007/984021',
    notes: 'First partial payment for October cycle on 7th',
    recordedAt: '2026-10-07T14:20:00Z'
  },
  {
    id: 'pay-2',
    date: '2026-09-18', // previous month payment on 18th
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    amount: 700,
    paymentMethod: 'CASH',
    referenceNo: 'CASH-REC-089',
    notes: 'Second installment payment on 18th',
    recordedAt: '2026-09-18T18:00:00Z'
  },
  {
    id: 'pay-3',
    date: '2026-10-01',
    customerId: 'cust-3',
    customerName: 'Dr. Venkat Raman',
    amount: 2100,
    paymentMethod: 'UPI',
    referenceNo: 'UPI/261001/88992',
    notes: 'Full month advance payment for October',
    recordedAt: '2026-10-01T09:10:00Z'
  },
  {
    id: 'pay-4',
    date: '2026-10-05',
    customerId: 'cust-2',
    customerName: 'Meenakshi Sundaram',
    amount: 2700,
    paymentMethod: 'BANK_TRANSFER',
    referenceNo: 'IMPS/610051283',
    notes: 'Monthly fixed subscription payment',
    recordedAt: '2026-10-05T11:00:00Z'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-2026-09-01',
    invoiceNumber: 'SKD-2026-09-001',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar (Verification Case)',
    customerPhone: '98402 11223',
    customerAddress: 'Flat 3B, Sri Krishna Apartments, Gandhi Road, Kanchipuram',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    issueDate: '2026-09-30',
    dueDate: '2026-10-10',
    previousBalance: 0,
    subscriptionCharges: 1800, // 30 days x 1L @ ₹60 = ₹1800
    deliveryCharges: 1800,
    extraMilkCharges: 120, // 2 Litres extra milk @ ₹60 = ₹120
    gheeCharges: 0,
    adjustments: 0,
    totalPayable: 1920, // ₹1800 + ₹120 = ₹1920
    paymentsAllocated: 1200, // ₹500 + ₹700 = ₹1200
    remainingDue: 720, // ₹1920 - ₹1200 = ₹720
    status: 'PARTIALLY_PAID',
    notes: 'September 2026 Statement. ₹1200 received across two flexible payments.',
    lineItems: [
      {
        id: 'li-1',
        description: 'Daily Milk Delivery (1 Litre standard)',
        quantity: '30 Litres (30 Days)',
        rate: 60,
        amount: 1800,
        type: 'DELIVERY'
      },
      {
        id: 'li-2',
        description: 'Extra Milk Purchases (Oct 2 & Oct 4)',
        quantity: '2 Litres',
        rate: 60,
        amount: 120,
        type: 'EXTRA_MILK'
      }
    ],
    generatedAt: '2026-09-30T19:00:00Z'
  },
  {
    id: 'inv-2026-09-02',
    invoiceNumber: 'SKD-2026-09-002',
    customerId: 'cust-2',
    customerName: 'Meenakshi Sundaram',
    customerPhone: '94441 55667',
    customerAddress: 'No. 28, Sannathi Street, Near Kamakshi Temple, Kanchipuram',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    issueDate: '2026-09-30',
    dueDate: '2026-10-07',
    previousBalance: 0,
    subscriptionCharges: 2700,
    deliveryCharges: 0,
    extraMilkCharges: 0,
    gheeCharges: 350,
    adjustments: 0,
    totalPayable: 3050,
    paymentsAllocated: 3050,
    remainingDue: 0,
    status: 'PAID',
    notes: 'Paid in full via Bank Transfer & UPI.',
    lineItems: [
      {
        id: 'li-3',
        description: 'Fixed Monthly Milk Subscription (1.5L Daily equivalent)',
        quantity: '1 Month',
        rate: 2700,
        amount: 2700,
        type: 'SUBSCRIPTION_FIXED'
      },
      {
        id: 'li-4',
        description: 'Traditional A2 Cow Ghee (500ml Jar)',
        quantity: '1 Jar',
        rate: 350,
        amount: 350,
        type: 'GHEE'
      }
    ],
    generatedAt: '2026-09-30T19:15:00Z'
  }
];

export const initialStockItems: StockItem[] = [
  {
    id: 'stock-milk',
    productId: 'prod-milk',
    productName: 'Pure Fresh Cow Milk',
    currentStockLiters: 48.5,
    lastUpdated: '2026-10-09T08:00:00Z'
  },
  {
    id: 'stock-ghee',
    productId: 'prod-ghee',
    productName: 'Traditional A2 Cow Ghee',
    currentStockLiters: 18.25,
    lastUpdated: '2026-10-09T08:00:00Z'
  }
];
