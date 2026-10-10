-- ==============================================================================
-- SREE KRISHNA DAIRY PRODUCTS (SKDP)
-- REPEATABLE SECURITY MIGRATION: STRICT OWNER-ONLY RLS & ADMIN AUTHORIZATION
-- Target: PostgreSQL 15+ / Supabase SQL Editor
-- This migration is completely safe to run repeatedly (idempotent).
-- ==============================================================================

-- 1. ENSURE ALL CORE TABLES EXIST
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

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    delivery_instructions TEXT,
    category VARCHAR(50) DEFAULT 'REGULAR',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    unit VARCHAR(20) DEFAULT 'ml',
    current_price_per_liter NUMERIC(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    packages_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    pricing_model VARCHAR(50) DEFAULT 'ACTUAL_DELIVERY',
    expected_daily_quantity_ml INTEGER NOT NULL DEFAULT 1000,
    fixed_monthly_amount NUMERIC(10, 2),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    schedule VARCHAR(50) DEFAULT 'EVERYDAY',
    start_date DATE NOT NULL,
    renewal_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_records (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    expected_quantity_ml INTEGER NOT NULL,
    delivered_quantity_ml INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'DELIVERED',
    unit_price_per_liter NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_by VARCHAR(255) DEFAULT 'Radhakrishnan'
);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'ml',
    price_per_liter NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_milk_liters NUMERIC(10, 2) DEFAULT 0.00,
    milk_amount NUMERIC(12, 2) DEFAULT 0.00,
    extra_sales_amount NUMERIC(12, 2) DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL,
    previous_balance NUMERIC(12, 2) DEFAULT 0.00,
    payments_received NUMERIC(12, 2) DEFAULT 0.00,
    total_payable NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'UNPAID',
    items_json JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS stock_items (
    product_id TEXT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    current_stock_liters NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity_liters NUMERIC(10, 2) NOT NULL,
    notes TEXT
);

-- 2. DEDICATED APP_ADMINS TABLE (Tracks authorized SKDP owners only)
CREATE TABLE IF NOT EXISTS app_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'OWNER',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SECURITY DEFINER AUTHORIZATION FUNCTIONS
CREATE OR REPLACE FUNCTION is_skdp_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_admins WHERE id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION initialize_owner_account()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If no owner exists in app_admins yet, register the current caller
  IF (SELECT COUNT(*) FROM app_admins) = 0 THEN
    INSERT INTO app_admins (id, email, role)
    VALUES (auth.uid(), auth.jwt() ->> 'email', 'OWNER')
    ON CONFLICT (id) DO NOTHING;
    RETURN TRUE;
  -- If caller is already an owner, confirm
  ELSIF EXISTS (SELECT 1 FROM app_admins WHERE id = auth.uid()) THEN
    RETURN TRUE;
  -- Otherwise, registration is closed
  ELSE
    RAISE EXCEPTION 'SKDP Owner already registered. Public registration is closed.';
  END IF;
END;
$$;

-- 4. ENABLE RLS ON ALL TABLES
ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;
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

-- 5. SAFELY CLEAN UP ANY OLD OR PERMISSIVE POLICIES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 6. CREATE STRICT OWNER-ONLY POLICIES
-- app_admins: authenticated owners can read their own admin entry
CREATE POLICY "owner_read_admin_self" ON app_admins
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- All business data tables: ACCESSIBLE EXCLUSIVELY TO REGISTERED SKDP OWNER
CREATE POLICY "owner_only_business_settings" ON business_settings FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_customers" ON customers FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_products" ON products FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_price_history" ON price_history FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_subscriptions" ON subscriptions FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_delivery_records" ON delivery_records FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_sales" ON sales FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_payments" ON payments FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_invoices" ON invoices FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_stock_items" ON stock_items FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());
CREATE POLICY "owner_only_stock_movements" ON stock_movements FOR ALL TO authenticated USING (is_skdp_owner()) WITH CHECK (is_skdp_owner());

-- 7. REPLICA IDENTITY FULL (Required for Realtime payload integrity)
ALTER TABLE app_admins REPLICA IDENTITY FULL;
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

-- 8. REALTIME PUBLICATION
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE business_settings, customers, products, price_history, subscriptions, delivery_records, sales, payments, invoices, stock_items, stock_movements;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;
