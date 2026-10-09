import React, { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { ToastProvider, useToast } from './components/common/Toast';
import { LoginScreen } from './components/auth/LoginScreen';
import { AppLayout } from './components/layout/AppLayout';

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

const MainAppContent: React.FC = () => {
  const { isAuthenticated, login } = useStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [focusedCustomerId, setFocusedCustomerId] = useState<string | undefined>(undefined);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState<boolean>(false);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  const handleNavigate = (tab: string, entityId?: string) => {
    setCurrentTab(tab);
    if (entityId) {
      setFocusedCustomerId(entityId);
    }
  };

  const handleQuickAction = (
    action: 'add_customer' | 'record_delivery' | 'quick_sale' | 'record_payment' | 'generate_bill',
    targetCustomerId?: string
  ) => {
    if (action === 'add_customer') {
      setIsAddCustomerModalOpen(true);
    } else if (action === 'record_delivery') {
      setFocusedCustomerId(targetCustomerId);
      setCurrentTab('deliveries');
    } else if (action === 'quick_sale') {
      setCurrentTab('pos');
    } else if (action === 'record_payment') {
      setFocusedCustomerId(targetCustomerId);
      setCurrentTab('payments');
    } else if (action === 'generate_bill') {
      setFocusedCustomerId(targetCustomerId);
      setCurrentTab('invoices');
    }
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onTabChange={handleNavigate}
      onQuickAction={handleQuickAction}
    >
      <CustomerFormModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
      />

      {currentTab === 'dashboard' && (
        <DashboardView onNavigate={handleNavigate} onQuickAction={handleQuickAction} />
      )}

      {currentTab === 'customers' && (
        <CustomerListView
          initialSelectedCustomerId={focusedCustomerId}
          onQuickAction={handleQuickAction}
        />
      )}

      {currentTab === 'subscriptions' && (
        <SubscriptionsView
          onNavigateCustomer={id => {
            setFocusedCustomerId(id);
            setCurrentTab('customers');
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
