import React, { useState, useEffect, useCallback } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { ToastProvider } from './components/common/Toast';
import { LoginScreen } from './components/auth/LoginScreen';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ExitConfirmationModal } from './components/common/ExitConfirmationModal';

// Modules
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerListView } from './components/customers/CustomerListView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { DailyDeliveriesView } from './components/deliveries/DailyDeliveriesView';
import { QuickSalePOS } from './components/pos/QuickSalePOS';
import { PaymentsView } from './components/payments/PaymentsView';
import { MonthlyInvoicesView } from './components/invoices/MonthlyInvoicesView';
import { ProductsView } from './components/products/ProductsView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { ReportsView } from './components/reports/ReportsView';
import { StockView } from './components/stock/StockView';
import { SettingsView } from './components/settings/SettingsView';

// Modals
import { CustomerFormModal } from './components/customers/CustomerFormModal';

const VALID_TABS = [
  'dashboard',
  'customers',
  'subscriptions',
  'deliveries',
  'pos',
  'payments',
  'invoices',
  'products',
  'sales',
  'reports',
  'stock',
  'settings'
] as const;

interface ParsedRoute {
  tab: string;
  customerId?: string;
}

const parseHashRoute = (): ParsedRoute => {
  try {
    const rawHash = window.location.hash.replace(/^#\/?/, '');
    if (!rawHash) return { tab: 'dashboard' };

    const [pathPart, queryPart] = rawHash.split('?');
    const tab = VALID_TABS.includes(pathPart as any) ? pathPart : 'dashboard';
    const params = new URLSearchParams(queryPart || '');
    const customerId = params.get('customer') || undefined;

    return { tab, customerId };
  } catch {
    return { tab: 'dashboard' };
  }
};

const MainAppContent: React.FC = () => {
  const { isAuthenticated, login } = useStore();
  const [currentTab, setCurrentTab] = useState<string>(() => parseHashRoute().tab);
  const [focusedCustomerId, setFocusedCustomerId] = useState<string | undefined>(
    () => parseHashRoute().customerId
  );
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState<boolean>(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);

  // Sync browser back/forward buttons and initial history states
  useEffect(() => {
    const initial = parseHashRoute();
    setCurrentTab(initial.tab);
    setFocusedCustomerId(initial.customerId);

    // Initialize root history sentinel for Home exit interception
    if (!window.history.state) {
      if (initial.tab === 'dashboard' && !initial.customerId) {
        window.history.replaceState({ tab: 'dashboard', isHomeRoot: true }, '', '#dashboard');
        window.history.pushState({ tab: 'dashboard', isHomeActive: true }, '', '#dashboard');
      } else {
        const hash = initial.customerId
          ? `#${initial.tab}?customer=${encodeURIComponent(initial.customerId)}`
          : `#${initial.tab}`;
        window.history.replaceState(
          { tab: initial.tab, customerId: initial.customerId },
          '',
          hash
        );
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      const route = parseHashRoute();

      // Check if Back was pressed on root Home screen
      if (state?.isHomeRoot || (!state && route.tab === 'dashboard')) {
        setIsExitModalOpen(true);
        return;
      }

      setIsExitModalOpen(false);
      setCurrentTab(route.tab);
      setFocusedCustomerId(route.customerId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = useCallback((tab: string, entityId?: string) => {
    setCurrentTab(tab);
    setFocusedCustomerId(entityId);
    setIsExitModalOpen(false);

    const hash = entityId
      ? `#${tab}?customer=${encodeURIComponent(entityId)}`
      : `#${tab}`;

    if (window.location.hash !== hash) {
      window.history.pushState({ tab, customerId: entityId }, '', hash);
    }
  }, []);

  const handleSelectCustomer = useCallback((customerId: string | null) => {
    if (customerId) {
      setFocusedCustomerId(customerId);
      const hash = `#customers?customer=${encodeURIComponent(customerId)}`;
      if (window.location.hash !== hash) {
        window.history.pushState({ tab: 'customers', customerId }, '', hash);
      }
    } else {
      if (window.location.hash.includes('customer=')) {
        window.history.back();
      } else {
        setFocusedCustomerId(undefined);
      }
    }
  }, []);

  const handleStay = () => {
    setIsExitModalOpen(false);
    // Re-push active home state so subsequent back taps intercept again
    window.history.pushState({ tab: 'dashboard', isHomeActive: true }, '', '#dashboard');
  };

  const handleExit = () => {
    try {
      window.close();
    } catch {
      // Browser restriction
    }
    try {
      window.history.go(-1);
    } catch {
      // Browser restriction
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  const handleQuickAction = (
    action: 'add_customer' | 'record_delivery' | 'quick_sale' | 'record_payment' | 'generate_bill',
    targetCustomerId?: string
  ) => {
    if (action === 'add_customer') {
      setIsAddCustomerModalOpen(true);
    } else if (action === 'record_delivery') {
      handleNavigate('deliveries', targetCustomerId);
    } else if (action === 'quick_sale') {
      handleNavigate('pos');
    } else if (action === 'record_payment') {
      handleNavigate('payments', targetCustomerId);
    } else if (action === 'generate_bill') {
      handleNavigate('invoices', targetCustomerId);
    }
  };

  return (
    <ErrorBoundary>
      <AppLayout
        currentTab={currentTab}
        onTabChange={handleNavigate}
        onQuickAction={handleQuickAction}
      >
        <CustomerFormModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
        />

        <ExitConfirmationModal
          isOpen={isExitModalOpen}
          onStay={handleStay}
          onExit={handleExit}
        />

        {currentTab === 'dashboard' && (
          <DashboardView onNavigate={handleNavigate} onQuickAction={handleQuickAction} />
        )}

        {currentTab === 'customers' && (
          <CustomerListView
            initialSelectedCustomerId={focusedCustomerId}
            selectedCustomerId={focusedCustomerId}
            onSelectCustomer={handleSelectCustomer}
            onQuickAction={handleQuickAction}
          />
        )}

        {currentTab === 'subscriptions' && (
          <SubscriptionsView
            onNavigateCustomer={id => {
              handleNavigate('customers', id);
            }}
            onOpenAddCustomer={() => setIsAddCustomerModalOpen(true)}
          />
        )}

        {currentTab === 'deliveries' && (
          <DailyDeliveriesView initialCustomerId={focusedCustomerId} />
        )}

        {currentTab === 'pos' && <QuickSalePOS />}

        {currentTab === 'payments' && (
          <PaymentsView initialCustomerId={focusedCustomerId} />
        )}

        {currentTab === 'invoices' && (
          <MonthlyInvoicesView initialCustomerId={focusedCustomerId} />
        )}

        {currentTab === 'products' && <ProductsView />}

        {currentTab === 'sales' && <SalesHistoryView />}

        {currentTab === 'reports' && <ReportsView />}

        {currentTab === 'stock' && <StockView />}

        {currentTab === 'settings' && <SettingsView />}
      </AppLayout>
    </ErrorBoundary>
  );
};

export const App: React.FC = () => {
  return (
    <StoreProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </StoreProvider>
  );
};

export default App;
