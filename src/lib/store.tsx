import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  StockMovement,
  InvoiceLineItem
} from '../types';
import {
  initialCustomers,
  initialSubscriptions,
  initialProducts,
  initialPriceHistory,
  initialDeliveryRecords,
  initialSales,
  initialPayments,
  initialInvoices,
  initialBusinessSettings,
  initialStockItems
} from './initialData';
import { calculateCustomerLedger, getLocalDateString } from './calculations';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import {
  fetchAllCloudData,
  uploadAllDataToCloud,
  cloudSync,
  transformCustomerFromDb,
  transformSubscriptionFromDb,
  transformProductFromDb,
  transformPriceHistoryFromDb,
  transformDeliveryFromDb,
  transformSaleFromDb,
  transformPaymentFromDb,
  transformInvoiceFromDb,
  transformStockItemFromDb,
  transformStockMovementFromDb,
  transformSettingsFromDb
} from './cloudSync';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error' | 'unconfigured';

interface StoreContextType {
  // State
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
  isAuthenticated: boolean;
  adminUser: { name: string; email: string; role: string } | null;

  // Cloud Sync State
  syncStatus: SyncStatus;
  isCloudConnected: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
  syncNow: () => Promise<void>;
  uploadLocalToCloud: () => Promise<{ success: boolean; count: number; error?: string }>;
  reconnectCloud: () => Promise<void>;

  // Auth methods
  login: (pinOrPass: string) => boolean;
  logout: () => void;

  // Customer methods
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  archiveCustomer: (id: string) => void;
  deleteCustomer: (id: string, force?: boolean) => { success: boolean; error?: string };

  // Subscription methods
  addSubscription: (sub: Omit<Subscription, 'id' | 'updatedAt'>) => Subscription;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  pauseSubscription: (id: string) => void;
  resumeSubscription: (id: string) => void;
  updateExpectedDailyQuantity: (customerId: string, newQuantityMl: number) => void;

  // Delivery methods
  recordDelivery: (delivery: Omit<DeliveryRecord, 'id' | 'recordedAt'>) => DeliveryRecord;
  recordBulkDeliveries: (records: Array<Omit<DeliveryRecord, 'id' | 'recordedAt'>>) => void;
  updateDelivery: (id: string, updates: Partial<DeliveryRecord>) => void;
  deleteDelivery: (id: string) => void;

  // Sale & Quick POS methods
  recordSale: (sale: Omit<Sale, 'id' | 'recordedAt'>) => Sale;
  deleteSale: (id: string) => void;

  // Payment methods
  recordPayment: (payment: Omit<Payment, 'id' | 'recordedAt'>) => Payment;
  deletePayment: (id: string) => void;

  // Invoice methods
  generateInvoice: (customerId: string, periodStart: string, periodEnd: string, notes?: string) => Invoice;
  generateBulkInvoices: (periodStart: string, periodEnd: string) => number;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  deleteInvoice: (id: string) => void;

  // Product & Price methods
  updateProductPrice: (productId: string, newPricePerLiter: number, reason?: string) => void;

  // Stock methods
  adjustStock: (productId: string, adjustmentLiters: number, type: StockMovement['type'], notes?: string) => void;

  // Settings & Management
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  resetToDefaultData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;

  // Helper getters
  getCustomerById: (id: string) => Customer | undefined;
  getSubscriptionByCustomerId: (customerId: string) => Subscription | undefined;
  getCustomerLedger: (customerId: string) => ReturnType<typeof calculateCustomerLedger> | null;
  getCustomerBalance: (customerId: string) => number;
}

const STORAGE_KEYS = {
  CUSTOMERS: 'skd_customers_v1',
  SUBSCRIPTIONS: 'skd_subscriptions_v1',
  PRODUCTS: 'skd_products_v1',
  PRICE_HISTORY: 'skd_price_history_v1',
  DELIVERIES: 'skd_deliveries_v1',
  SALES: 'skd_sales_v1',
  PAYMENTS: 'skd_payments_v1',
  INVOICES: 'skd_invoices_v1',
  STOCK_ITEMS: 'skd_stock_items_v1',
  STOCK_MOVEMENTS: 'skd_stock_movements_v1',
  SETTINGS: 'skd_settings_v1',
  AUTH: 'skd_auth_session_v1',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State Load with Fallback to local cache / seed data
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    return saved ? JSON.parse(saved) : initialSubscriptions;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRICE_HISTORY);
    return saved ? JSON.parse(saved) : initialPriceHistory;
  });

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    return saved ? JSON.parse(saved) : initialDeliveryRecords;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
    return saved ? JSON.parse(saved) : initialStockItems;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialBusinessSettings;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved).isAuth : true;
  });

  // Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isSupabaseConfigured() ? 'syncing' : 'unconfigured'
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isCloudConnected = syncStatus === 'connected';
  const realtimeChannelRef = useRef<any>(null);

  // 2. Local Persistence Side Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(priceHistory));
  }, [priceHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ isAuth: isAuthenticated }));
  }, [isAuthenticated]);

  // 3. Cloud Synchronization & Realtime Subscriptions
  const syncNow = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setSyncStatus('unconfigured');
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const cloudData = await fetchAllCloudData();
      if (!cloudData) {
        setSyncStatus('offline');
        return;
      }

      if (cloudData.isEmptyDatabase) {
        // Fresh database: Automatically migrate local data to cloud
        console.log('Detected empty cloud database. Performing automatic zero-loss migration...');
        const res = await uploadAllDataToCloud({
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
          settings
        });

        if (res.success) {
          setSyncStatus('connected');
          setLastSyncedAt(new Date().toLocaleTimeString());
        } else {
          setSyncStatus('error');
          setSyncError(res.error || 'Initial migration failed');
        }
      } else {
        // Cloud database has data: Reconcile and update local state
        setCustomers(cloudData.customers);
        setSubscriptions(cloudData.subscriptions);
        setProducts(cloudData.products);
        setPriceHistory(cloudData.priceHistory);
        setDeliveries(cloudData.deliveries);
        setSales(cloudData.sales);
        setPayments(cloudData.payments);
        setInvoices(cloudData.invoices);
        setStockItems(cloudData.stockItems);
        setStockMovements(cloudData.stockMovements);
        if (cloudData.settings) {
          setSettings(cloudData.settings);
        }

        setSyncStatus('connected');
        setLastSyncedAt(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.warn('Cloud sync error:', err);
      setSyncStatus('error');
      setSyncError(err?.message || 'Failed to sync with cloud database');
    }
  }, [customers, subscriptions, products, priceHistory, deliveries, sales, payments, invoices, stockItems, stockMovements, settings]);

  const uploadLocalToCloudAction = useCallback(async () => {
    setSyncStatus('syncing');
    const result = await uploadAllDataToCloud({
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
      settings
    });

    if (result.success) {
      setSyncStatus('connected');
      setLastSyncedAt(new Date().toLocaleTimeString());
    } else {
      setSyncStatus('error');
      setSyncError(result.error || 'Failed to upload local data');
    }
    return result;
  }, [customers, subscriptions, products, priceHistory, deliveries, sales, payments, invoices, stockItems, stockMovements, settings]);

  const reconnectCloud = useCallback(async () => {
    if (realtimeChannelRef.current) {
      try {
        const client = getSupabaseClient();
        if (client) client.removeChannel(realtimeChannelRef.current);
      } catch {}
    }
    await syncNow();
  }, [syncNow]);

  // Realtime subscription setup
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setSyncStatus('unconfigured');
      return;
    }

    // Initial sync
    syncNow();

    // Subscribe to multi-table realtime updates
    const channel = client
      .channel('skdp-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = transformCustomerFromDb(payload.new);
            setCustomers(prev => {
              const idx = prev.findIndex(c => c.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String(payload.old.id);
            setCustomers(prev => prev.filter(c => c.id !== deletedId));
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = transformSubscriptionFromDb(payload.new);
            setSubscriptions(prev => {
              const idx = prev.findIndex(s => s.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String(payload.old.id);
            setSubscriptions(prev => prev.filter(s => s.id !== deletedId));
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_records' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = transformDeliveryFromDb(payload.new);
            setDeliveries(prev => {
              const idx = prev.findIndex(d => d.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String(payload.old.id);
            setDeliveries(prev => prev.filter(d => d.id !== deletedId));
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = transformSaleFromDb(payload.new);
            setSales(prev => {
              const idx = prev.findIndex(s => s.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String(payload.old.id);
            setSales(prev => prev.filter(s => s.id !== deletedId));
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = transformPaymentFromDb(payload.new);
            setPayments(prev => {
              const idx = prev.findIndex(p => p.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String(payload.old.id);
            setPayments(prev => prev.filter(p => p.id !== deletedId));
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = transformInvoiceFromDb(payload.new);
            setInvoices(prev => {
              const idx = prev.findIndex(inv => inv.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String(payload.old.id);
            setInvoices(prev => prev.filter(inv => inv.id !== deletedId));
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = transformProductFromDb(payload.new);
            setProducts(prev => {
              const idx = prev.findIndex(p => p.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'business_settings' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = transformSettingsFromDb(payload.new);
            setSettings(updated);
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus('connected');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          setSyncStatus('offline');
        }
      });

    realtimeChannelRef.current = channel;

    return () => {
      if (channel) client.removeChannel(channel);
    };
  }, []);

  // 4. Auth Actions
  const login = (pinOrPass: string): boolean => {
    if (pinOrPass === '1234' || pinOrPass.toLowerCase() === 'admin' || pinOrPass.length >= 4) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Keep adminUser synced with settings.ownerName
  const adminUser = {
    name: settings.ownerName || 'S. Radhakrishnan',
    email: settings.email || 'owner@sreekrishnadairy.com',
    role: 'Business Owner / Admin'
  };

  // 5. Customer Actions
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    cloudSync.upsertCustomer(newCustomer);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    let updatedCustomer: Customer | undefined;
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === id) {
          updatedCustomer = { ...c, ...updates, updatedAt: new Date().toISOString() };
          return updatedCustomer;
        }
        return c;
      })
    );
    if (updatedCustomer) {
      cloudSync.upsertCustomer(updatedCustomer);
    }
  };

  const archiveCustomer = (id: string) => {
    updateCustomer(id, { status: 'ARCHIVED' });
    const sub = subscriptions.find(s => s.customerId === id);
    if (sub && sub.status === 'ACTIVE') {
      pauseSubscription(sub.id);
    }
  };

  const deleteCustomer = (id: string, force: boolean = true): { success: boolean; error?: string } => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSubscriptions(prev => prev.filter(s => s.customerId !== id));
    cloudSync.deleteCustomer(id);

    if (force) {
      setDeliveries(prev => prev.filter(d => d.customerId !== id));
      setPayments(prev => prev.filter(p => p.customerId !== id));
      setInvoices(prev => prev.filter(inv => inv.customerId !== id));
    }
    return { success: true };
  };

  // 6. Subscription Actions
  const addSubscription = (subData: Omit<Subscription, 'id' | 'updatedAt'>): Subscription => {
    const newSub: Subscription = {
      ...subData,
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      updatedAt: new Date().toISOString(),
    };
    setSubscriptions(prev => {
      const filtered = prev.filter(s => s.customerId !== subData.customerId);
      return [newSub, ...filtered];
    });
    cloudSync.upsertSubscription(newSub);
    return newSub;
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    let updatedSub: Subscription | undefined;
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id === id) {
          updatedSub = { ...s, ...updates, updatedAt: new Date().toISOString() };
          return updatedSub;
        }
        return s;
      })
    );
    if (updatedSub) {
      cloudSync.upsertSubscription(updatedSub);
    }
  };

  const pauseSubscription = (id: string) => {
    updateSubscription(id, { status: 'PAUSED' });
  };

  const resumeSubscription = (id: string) => {
    updateSubscription(id, { status: 'ACTIVE' });
  };

  const updateExpectedDailyQuantity = (customerId: string, newQuantityMl: number) => {
    const sub = subscriptions.find(s => s.customerId === customerId);
    if (sub) {
      updateSubscription(sub.id, { expectedDailyQuantityMl: newQuantityMl });
    }
  };

  // 7. Delivery Actions
  const recordDelivery = (deliveryData: Omit<DeliveryRecord, 'id' | 'recordedAt'>): DeliveryRecord => {
    const cust = customers.find(c => c.id === deliveryData.customerId);
    const newDelivery: DeliveryRecord = {
      ...deliveryData,
      customerName: cust?.name || deliveryData.customerName || 'Customer',
      id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recordedAt: new Date().toISOString(),
    };

    setDeliveries(prev => {
      const filtered = prev.filter(
        d => !(d.date === deliveryData.date && d.customerId === deliveryData.customerId)
      );
      return [newDelivery, ...filtered];
    });
    cloudSync.upsertDelivery(newDelivery);

    if (settings.enableStockTracking) {
      const totalVolumeLiters = (deliveryData.quantityMl + deliveryData.extraQuantityMl) / 1000;
      adjustStock('prod-milk', -totalVolumeLiters, 'DELIVERY_DEDUCTION', `Daily delivery for ${newDelivery.customerName}`);
    }

    return newDelivery;
  };

  const recordBulkDeliveries = (records: Array<Omit<DeliveryRecord, 'id' | 'recordedAt'>>) => {
    const createdRecords: DeliveryRecord[] = records.map(r => {
      const cust = customers.find(c => c.id === r.customerId);
      return {
        ...r,
        customerName: cust?.name || r.customerName || 'Customer',
        id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        recordedAt: new Date().toISOString()
      };
    });

    setDeliveries(prev => {
      const keys = new Set(createdRecords.map(cr => `${cr.date}_${cr.customerId}`));
      const kept = prev.filter(p => !keys.has(`${p.date}_${p.customerId}`));
      return [...createdRecords, ...kept];
    });
    cloudSync.upsertBulkDeliveries(createdRecords);
  };

  const updateDelivery = (id: string, updates: Partial<DeliveryRecord>) => {
    let updatedDel: DeliveryRecord | undefined;
    setDeliveries(prev =>
      prev.map(d => {
        if (d.id === id) {
          updatedDel = { ...d, ...updates };
          return updatedDel;
        }
        return d;
      })
    );
    if (updatedDel) {
      cloudSync.upsertDelivery(updatedDel);
    }
  };

  const deleteDelivery = (id: string) => {
    setDeliveries(prev => prev.filter(d => d.id !== id));
    cloudSync.deleteDelivery(id);
  };

  // 8. Sales & POS Actions
  const recordSale = (saleData: Omit<Sale, 'id' | 'recordedAt'>): Sale => {
    const saleId = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const recordedAt = new Date().toISOString();
    const saleDate = saleData.date || getLocalDateString();

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      date: saleDate,
      recordedAt,
    };

    setSales(prev => [newSale, ...prev]);
    cloudSync.upsertSale(newSale);

    if (settings.enableStockTracking && Array.isArray(saleData.items)) {
      saleData.items.forEach(item => {
        const liters = (Number(item.quantityMl) || 0) / 1000;
        if (liters > 0) {
          adjustStock(item.productId, -liters, 'SALES_DEDUCTION', `POS Sale #${newSale.id.slice(0, 6)} to ${newSale.customerName}`);
        }
      });
    }

    return newSale;
  };

  const deleteSale = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
    cloudSync.deleteSale(id);
  };

  // 9. Payment Actions
  const recordPayment = (paymentData: Omit<Payment, 'id' | 'recordedAt'>): Payment => {
    const cust = customers.find(c => c.id === paymentData.customerId);
    const newPayment: Payment = {
      ...paymentData,
      customerName: cust?.name || paymentData.customerName || 'Customer',
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recordedAt: new Date().toISOString(),
    };

    setPayments(prev => [newPayment, ...prev]);
    cloudSync.upsertPayment(newPayment);

    if (paymentData.invoiceId) {
      setInvoices(prev =>
        prev.map(inv => {
          if (inv.id === paymentData.invoiceId) {
            const newAllocated = inv.paymentsAllocated + paymentData.amount;
            const newRemaining = Math.max(0, inv.totalPayable - newAllocated);
            const updatedInv: Invoice = {
              ...inv,
              paymentsAllocated: newAllocated,
              remainingDue: newRemaining,
              status: newRemaining <= 0 ? 'PAID' : 'PARTIALLY_PAID'
            };
            cloudSync.upsertInvoice(updatedInv);
            return updatedInv;
          }
          return inv;
        })
      );
    }

    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    cloudSync.deletePayment(id);
  };

  // 10. Invoice Generation
  const generateInvoice = (
    customerId: string,
    periodStart: string,
    periodEnd: string,
    notes?: string
  ): Invoice => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) throw new Error('Customer not found');

    const sub = subscriptions.find(s => s.customerId === customerId);
    const isFixedSubscription = sub?.pricingModel === 'FIXED_RECURRING';

    const periodDeliveries = deliveries.filter(
      d => d.customerId === customerId && d.date >= periodStart && d.date <= periodEnd
    );

    const periodSales = sales.filter(
      s => s.customerId === customerId && s.date >= periodStart && s.date <= periodEnd
    );

    let subscriptionCharges = 0;
    let deliveryCharges = 0;
    let extraMilkCharges = 0;
    let gheeCharges = 0;
    const lineItems: InvoiceLineItem[] = [];

    if (isFixedSubscription) {
      const fixedAmount = sub?.fixedMonthlyAmount || 0;
      subscriptionCharges = fixedAmount;
      lineItems.push({
        id: `li-fixed-${Date.now()}`,
        description: `Fixed Monthly Subscription (${sub?.expectedDailyQuantityMl || 1000} ml/day)`,
        quantity: '1 Month',
        rate: fixedAmount,
        amount: fixedAmount,
        type: 'SUBSCRIPTION_FIXED'
      });

      periodDeliveries.forEach(del => {
        if (del.extraQuantityMl > 0) {
          const amt = (del.extraQuantityMl / 1000) * del.unitPricePerLiter;
          extraMilkCharges += amt;
          lineItems.push({
            id: `li-del-ex-${del.id}`,
            description: `Extra Milk on ${del.date} (${del.extraQuantityMl} ml)`,
            date: del.date,
            quantity: `${del.extraQuantityMl} ml`,
            rate: del.unitPricePerLiter,
            amount: amt,
            type: 'EXTRA_MILK'
          });
        }
      });
    } else {
      let totalStdMl = 0;
      let totalExtraMl = 0;
      let stdAmount = 0;
      let exAmount = 0;

      periodDeliveries.forEach(del => {
        const sAmt = (del.quantityMl / 1000) * del.unitPricePerLiter;
        const eAmt = (del.extraQuantityMl / 1000) * del.unitPricePerLiter;
        totalStdMl += del.quantityMl;
        totalExtraMl += del.extraQuantityMl;
        stdAmount += sAmt;
        exAmount += eAmt;
      });

      deliveryCharges = stdAmount;
      extraMilkCharges = exAmount;
      subscriptionCharges = stdAmount;

      if (totalStdMl > 0) {
        lineItems.push({
          id: `li-std-sum-${Date.now()}`,
          description: `Daily Milk Deliveries (${periodDeliveries.length} days recorded)`,
          quantity: `${(totalStdMl / 1000).toFixed(1)} Litres`,
          rate: settings.defaultMilkRatePerLiter,
          amount: stdAmount,
          type: 'DELIVERY'
        });
      }

      if (totalExtraMl > 0) {
        lineItems.push({
          id: `li-ex-sum-${Date.now()}`,
          description: `Additional Extra Milk Deliveries`,
          quantity: `${(totalExtraMl / 1000).toFixed(1)} Litres`,
          rate: settings.defaultMilkRatePerLiter,
          amount: exAmount,
          type: 'EXTRA_MILK'
        });
      }
    }

    periodSales.forEach(s => {
      s.items.forEach(item => {
        const isGhee = item.productName.toLowerCase().includes('ghee');
        if (isGhee) {
          gheeCharges += item.subtotal;
        } else {
          extraMilkCharges += item.subtotal;
        }
        lineItems.push({
          id: `li-sale-${s.id}-${item.productId}`,
          description: `${item.productName} (Sale on ${s.date})`,
          date: s.date,
          quantity: `${item.quantityMl} ml`,
          rate: item.unitPrice,
          amount: item.subtotal,
          type: isGhee ? 'GHEE' : 'EXTRA_MILK'
        });
      });
    });

    const periodPayments = payments.filter(
      p => p.customerId === customerId && p.date >= periodStart && p.date <= periodEnd
    );
    const paymentsAllocated = periodPayments.reduce((sum, p) => sum + p.amount, 0);

    const totalPayable = subscriptionCharges + extraMilkCharges + gheeCharges;
    const remainingDue = Math.max(0, totalPayable - paymentsAllocated);

    const invoiceNumber = `${settings.invoicePrefix}-${periodStart.replace(/-/g, '').slice(0, 6)}-${String(invoices.length + 1).padStart(3, '0')}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      invoiceNumber,
      customerId,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: `${cust.address}, ${cust.location}`,
      periodStart,
      periodEnd,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      previousBalance: cust.openingBalance,
      subscriptionCharges,
      deliveryCharges,
      extraMilkCharges,
      gheeCharges,
      adjustments: 0,
      totalPayable,
      paymentsAllocated,
      remainingDue,
      status: remainingDue <= 0 ? 'PAID' : paymentsAllocated > 0 ? 'PARTIALLY_PAID' : 'ISSUED',
      notes: notes || `Monthly milk & dairy statement for ${periodStart} to ${periodEnd}`,
      lineItems,
      generatedAt: new Date().toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    cloudSync.upsertInvoice(newInvoice);
    return newInvoice;
  };

  const generateBulkInvoices = (periodStart: string, periodEnd: string): number => {
    let count = 0;
    const activeSubCustomers = customers.filter(c => c.status === 'ACTIVE' && c.category === 'REGULAR');
    activeSubCustomers.forEach(c => {
      const existing = invoices.find(
        inv => inv.customerId === c.id && inv.periodStart === periodStart && inv.periodEnd === periodEnd
      );
      if (!existing) {
        generateInvoice(c.id, periodStart, periodEnd);
        count++;
      }
    });
    return count;
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    let updatedInv: Invoice | undefined;
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === id) {
          updatedInv = { ...inv, status };
          return updatedInv;
        }
        return inv;
      })
    );
    if (updatedInv) {
      cloudSync.upsertInvoice(updatedInv);
    }
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    cloudSync.deleteInvoice(id);
  };

  // 11. Product & Price Actions
  const updateProductPrice = (productId: string, newPricePerLiter: number, reason?: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const oldPrice = prod.currentPricePerLiter;
    if (oldPrice === newPricePerLiter) return;

    const historyEntry: PriceHistory = {
      id: `ph-${Date.now()}`,
      productId,
      productName: prod.name,
      oldPrice,
      newPrice: newPricePerLiter,
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: reason || 'Rate adjustment',
      recordedAt: new Date().toISOString()
    };

    setPriceHistory(prev => [historyEntry, ...prev]);
    cloudSync.upsertPriceHistory(historyEntry);

    let updatedProduct: Product | undefined;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const updatedPackages = p.packages.map(pkg => ({
            ...pkg,
            price: Math.round((pkg.volumeMl / 1000) * newPricePerLiter)
          }));
          updatedProduct = {
            ...p,
            currentPricePerLiter: newPricePerLiter,
            packages: updatedPackages
          };
          return updatedProduct;
        }
        return p;
      })
    );
    if (updatedProduct) {
      cloudSync.upsertProduct(updatedProduct);
    }

    if (prod.type === 'MILK') {
      updateSettings({ defaultMilkRatePerLiter: newPricePerLiter });
    } else if (prod.type === 'GHEE') {
      updateSettings({ defaultGheeRatePerLiter: newPricePerLiter });
    }
  };

  // 12. Stock Actions
  const adjustStock = (
    productId: string,
    adjustmentLiters: number,
    type: StockMovement['type'],
    notes?: string
  ) => {
    const prod = products.find(p => p.id === productId);
    const prodName = prod?.name || 'Dairy Product';

    let updatedStockItem: StockItem | undefined;
    setStockItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => {
          if (item.productId === productId) {
            updatedStockItem = {
              ...item,
              currentStockLiters: Math.max(0, item.currentStockLiters + adjustmentLiters),
              lastUpdated: new Date().toISOString()
            };
            return updatedStockItem;
          }
          return item;
        });
      } else {
        updatedStockItem = {
          id: `stock-${productId}`,
          productId,
          productName: prodName,
          currentStockLiters: Math.max(0, adjustmentLiters),
          lastUpdated: new Date().toISOString()
        };
        return [...prev, updatedStockItem];
      }
    });
    if (updatedStockItem) {
      cloudSync.upsertStockItem(updatedStockItem);
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId,
      productName: prodName,
      date: new Date().toISOString().split('T')[0],
      type,
      quantityLiters: adjustmentLiters,
      notes
    };

    setStockMovements(prev => [movement, ...prev]);
    cloudSync.upsertStockMovement(movement);
  };

  // 13. Settings & Backup
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    const nextSettings = { ...settings, ...newSettings };
    setSettings(nextSettings);
    cloudSync.upsertSettings(nextSettings);
  };

  const resetToDefaultData = () => {
    setCustomers(initialCustomers);
    setSubscriptions(initialSubscriptions);
    setProducts(initialProducts);
    setPriceHistory(initialPriceHistory);
    setDeliveries(initialDeliveryRecords);
    setSales(initialSales);
    setPayments(initialPayments);
    setInvoices(initialInvoices);
    setStockItems(initialStockItems);
    setStockMovements([]);
    setSettings(initialBusinessSettings);
    localStorage.clear();
  };

  const exportDataJSON = (): string => {
    const dump = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      businessName: settings.businessName,
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
      settings
    };
    return JSON.stringify(dump, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        setSubscriptions(data.subscriptions || []);
        setProducts(data.products || initialProducts);
        setPriceHistory(data.priceHistory || []);
        setDeliveries(data.deliveries || []);
        setSales(data.sales || []);
        setPayments(data.payments || []);
        setInvoices(data.invoices || []);
        if (data.settings) setSettings(data.settings);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // 14. Getters
  const getCustomerById = (id: string) => customers.find(c => c.id === id);
  const getSubscriptionByCustomerId = (customerId: string) => subscriptions.find(s => s.customerId === customerId);

  const getCustomerLedger = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return null;
    return calculateCustomerLedger(cust, subscriptions, deliveries, sales, payments, invoices);
  };

  const getCustomerBalance = (customerId: string): number => {
    const ledger = getCustomerLedger(customerId);
    return ledger ? ledger.currentBalance : 0;
  };

  return (
    <StoreContext.Provider
      value={{
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
        isAuthenticated,
        adminUser,
        syncStatus,
        isCloudConnected,
        lastSyncedAt,
        syncError,
        syncNow,
        uploadLocalToCloud: uploadLocalToCloudAction,
        reconnectCloud,
        login,
        logout,
        addCustomer,
        updateCustomer,
        archiveCustomer,
        deleteCustomer,
        addSubscription,
        updateSubscription,
        pauseSubscription,
        resumeSubscription,
        updateExpectedDailyQuantity,
        recordDelivery,
        recordBulkDeliveries,
        updateDelivery,
        deleteDelivery,
        recordSale,
        deleteSale,
        recordPayment,
        deletePayment,
        generateInvoice,
        generateBulkInvoices,
        updateInvoiceStatus,
        deleteInvoice,
        updateProductPrice,
        adjustStock,
        updateSettings,
        resetToDefaultData,
        exportDataJSON,
        importDataJSON,
        getCustomerById,
        getSubscriptionByCustomerId,
        getCustomerLedger,
        getCustomerBalance
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
