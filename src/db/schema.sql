-- ==============================================================================
-- SREE KRISHNA DAIRY PRODUCTS - PRODUCTION CLOUD DATABASE SCHEMA
-- Target Database: PostgreSQL 15+ / Supabase
-- Supports Multi-Device Realtime Synchronization & Offline Sync
-- ==============================================================================

-- 1. BUSINESS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS business_settings (
    id TEXT PRIMARY KEY DEFAULT 'skd_primary_business_settings',
    business_name VARCHAR(255) NOT NULL DEFAULT 'Sree Krishna Dairy Products',
    tagline VARCHAR(255) DEFAULT 'Pure, Fresh Farm Milk & Traditional Ghee',
    owner_name VARCHAR(255) DEFAULT 'S. Radhakrishnan',
    phone VARCHAR(30) NOT NULL DEFAULT '+91 98401 23456',
    alternate_phone VARCHAR(30),
    email VARCHAR(255) DEFAULT 'sreekrishnadairy@gmail.com',
    address TEXT NOT NULL DEFAULT 'No. 14, Main Road, Krishna Nagar',
    village_town VARCHAR(100) DEFAULT 'Kanchipuram',
    district_state VARCHAR(100) DEFAULT 'Tamil Nadu',
    pincode VARCHAR(20) DEFAULT '631501',
    upi_id VARCHAR(100) DEFAULT 'sreekrishnadairy@upi',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    invoice_prefix VARCHAR(20) DEFAULT 'SKD',
    default_milk_rate_per_liter NUMERIC(10, 2) DEFAULT 60.00,
    default_ghee_rate_per_liter NUMERIC(10, 2) DEFAULT 700.00,
    enable_stock_tracking BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    delivery_instructions TEXT,
    category VARCHAR(50) DEFAULT 'REGULAR', -- REGULAR or OCCASIONAL
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, ARCHIVED
    notes TEXT,
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- MILK, GHEE, OTHER
    unit VARCHAR(20) DEFAULT 'ml',
    current_price_per_liter NUMERIC(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    packages_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRICE HISTORY TABLE
CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    old_price NUMERIC(10, 2) NOT NULL,
    new_price NUMERIC(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    reason TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);

-- 5. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    pricing_model VARCHAR(50) DEFAULT 'ACTUAL_DELIVERY', -- ACTUAL_DELIVERY or FIXED_RECURRING
    expected_daily_quantity_ml INTEGER NOT NULL DEFAULT 1000, -- 1000ml = 1L
    fixed_monthly_amount NUMERIC(10, 2),
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, ENDED
    schedule VARCHAR(50) DEFAULT 'EVERYDAY', -- EVERYDAY, ALTERNATE, WEEKDAYS, CUSTOM
    start_date DATE NOT NULL,
    renewal_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);

-- 6. DAILY DELIVERY RECORDS
CREATE TABLE IF NOT EXISTS delivery_records (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    quantity_ml INTEGER NOT NULL DEFAULT 0,
    extra_quantity_ml INTEGER NOT NULL DEFAULT 0,
    unit_price_per_liter NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'DELIVERED', -- DELIVERED, SKIPPED, MODIFIED
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_date_customer ON delivery_records(date, customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_date ON delivery_records(date);
CREATE INDEX IF NOT EXISTS idx_delivery_customer ON delivery_records(customer_id);

-- 7. SALES & QUICK POS
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT,
    customer_name VARCHAR(255) NOT NULL,
    is_walk_in BOOLEAN DEFAULT FALSE,
    total_amount NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    final_amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PAID', -- PAID, PARTIALLY_PAID, UNPAID
    payment_method VARCHAR(50) DEFAULT 'CASH', -- CASH, UPI, BANK_TRANSFER, OTHER
    notes TEXT,
    items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH', -- CASH, UPI, BANK_TRANSFER, OTHER
    reference_no VARCHAR(100),
    invoice_id TEXT,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- 9. MONTHLY INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30),
    customer_address TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    previous_balance NUMERIC(12, 2) DEFAULT 0.00,
    subscription_charges NUMERIC(12, 2) DEFAULT 0.00,
    delivery_charges NUMERIC(12, 2) DEFAULT 0.00,
    extra_milk_charges NUMERIC(12, 2) DEFAULT 0.00,
    ghee_charges NUMERIC(12, 2) DEFAULT 0.00,
    adjustments NUMERIC(12, 2) DEFAULT 0.00,
    total_payable NUMERIC(12, 2) NOT NULL,
    payments_allocated NUMERIC(12, 2) DEFAULT 0.00,
    remaining_due NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ISSUED', -- DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE
    notes TEXT,
    line_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON invoices(period_start, period_end);

-- 10. STOCK ITEMS & MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_items (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    current_stock_liters NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL, -- OPENING, PROCUREMENT, SALES_DEDUCTION, DELIVERY_DEDUCTION, ADJUSTMENT
    quantity_liters NUMERIC(10, 2) NOT NULL,
    notes TEXT
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow full access to anon and authenticated roles with Supabase API keys
DO $$
BEGIN
    DROP POLICY IF EXISTS "Full access to business_settings" ON business_settings;
    DROP POLICY IF EXISTS "Full access to customers" ON customers;
    DROP POLICY IF EXISTS "Full access to products" ON products;
    DROP POLICY IF EXISTS "Full access to price_history" ON price_history;
    DROP POLICY IF EXISTS "Full access to subscriptions" ON subscriptions;
    DROP POLICY IF EXISTS "Full access to delivery_records" ON delivery_records;
    DROP POLICY IF EXISTS "Full access to sales" ON sales;
    DROP POLICY IF EXISTS "Full access to payments" ON payments;
    DROP POLICY IF EXISTS "Full access to invoices" ON invoices;
    DROP POLICY IF EXISTS "Full access to stock_items" ON stock_items;
    DROP POLICY IF EXISTS "Full access to stock_movements" ON stock_movements;
END $$;

CREATE POLICY "Full access to business_settings" ON business_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to customers" ON customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to price_history" ON price_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to subscriptions" ON subscriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to delivery_records" ON delivery_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to sales" ON sales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to payments" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to invoices" ON invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to stock_items" ON stock_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to stock_movements" ON stock_movements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 12. FULL REPLICA IDENTITY (Required for Supabase Realtime UPDATE & DELETE payloads)
ALTER TABLE business_settings REPLICA IDENTITY FULL;
ALTER TABLE customers REPLICA IDENTITY FULL;
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE price_history REPLICA IDENTITY FULL;
ALTER TABLE subscriptions REPLICA IDENTITY FULL;
ALTER TABLE delivery_records REPLICA IDENTITY FULL;
ALTER TABLE sales REPLICA IDENTITY FULL;
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE invoices REPLICA IDENTITY FULL;
ALTER TABLE stock_items REPLICA IDENTITY FULL;
ALTER TABLE stock_movements REPLICA IDENTITY FULL;

-- 13. ENABLE REALTIME PUBLICATION ON ALL TABLES
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE business_settings, customers, products, price_history, subscriptions, delivery_records, sales, payments, invoices, stock_items, stock_movements;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;
