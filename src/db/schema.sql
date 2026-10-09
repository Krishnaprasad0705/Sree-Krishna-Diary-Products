-- ==============================================================================
-- SREE KRISHNA DAIRY PRODUCTS - PRODUCTION DATABASE SCHEMA
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL DEFAULT 'Sree Krishna Dairy Products',
    tagline VARCHAR(255) DEFAULT 'Pure, Fresh Farm Milk & Traditional Ghee',
    owner_name VARCHAR(255) DEFAULT 'S. Radhakrishnan',
    phone VARCHAR(20) NOT NULL DEFAULT '+91 98401 23456',
    alternate_phone VARCHAR(20) DEFAULT '+91 98401 65432',
    email VARCHAR(255) DEFAULT 'sreekrishnadairy@gmail.com',
    address TEXT NOT NULL DEFAULT 'No. 14, Main Road, Krishna Nagar',
    village_town VARCHAR(100) DEFAULT 'Kanchipuram',
    district_state VARCHAR(100) DEFAULT 'Tamil Nadu',
    pincode VARCHAR(10) DEFAULT '631501',
    upi_id VARCHAR(100) DEFAULT 'sreekrishnadairy@upi',
    currency_symbol VARCHAR(5) DEFAULT '₹',
    time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    invoice_prefix VARCHAR(10) DEFAULT 'SKD',
    default_milk_rate_per_liter NUMERIC(10, 2) DEFAULT 60.00,
    default_ghee_rate_per_liter NUMERIC(10, 2) DEFAULT 700.00,
    enable_stock_tracking BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TYPE customer_category_type AS ENUM ('REGULAR', 'OCCASIONAL');
CREATE TYPE customer_status_type AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    delivery_instructions TEXT,
    category customer_category_type DEFAULT 'REGULAR',
    status customer_status_type DEFAULT 'ACTIVE',
    notes TEXT,
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- 3. PRODUCTS & PACKAGES
CREATE TYPE product_type_enum AS ENUM ('MILK', 'GHEE', 'OTHER');

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type product_type_enum NOT NULL,
    unit VARCHAR(20) DEFAULT 'ml',
    current_price_per_liter NUMERIC(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    volume_ml INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

-- 4. PRICE HISTORY TABLE
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    old_price NUMERIC(10, 2) NOT NULL,
    new_price NUMERIC(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    reason TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBSCRIPTIONS TABLE
CREATE TYPE pricing_model_type AS ENUM ('ACTUAL_DELIVERY', 'FIXED_RECURRING');
CREATE TYPE subscription_status_type AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');
CREATE TYPE delivery_schedule_type AS ENUM ('EVERYDAY', 'ALTERNATE', 'WEEKDAYS', 'CUSTOM');

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    pricing_model pricing_model_type DEFAULT 'ACTUAL_DELIVERY',
    expected_daily_quantity_ml INTEGER NOT NULL DEFAULT 1000, -- 1000ml = 1L
    fixed_monthly_amount NUMERIC(10, 2), -- populated when FIXED_RECURRING
    status subscription_status_type DEFAULT 'ACTIVE',
    schedule delivery_schedule_type DEFAULT 'EVERYDAY',
    start_date DATE NOT NULL,
    renewal_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);

-- 6. DAILY DELIVERY RECORDS
CREATE TABLE IF NOT EXISTS delivery_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    quantity_ml INTEGER NOT NULL DEFAULT 0,
    extra_quantity_ml INTEGER NOT NULL DEFAULT 0,
    unit_price_per_liter NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'DELIVERED',
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_date_customer ON delivery_records(date, customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_date ON delivery_records(date);
CREATE INDEX IF NOT EXISTS idx_delivery_customer ON delivery_records(customer_id);

-- 7. SALES & OCCASIONAL SALES
CREATE TYPE payment_status_type AS ENUM ('PAID', 'PARTIALLY_PAID', 'UNPAID');
CREATE TYPE payment_method_type AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER');

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    is_walk_in BOOLEAN DEFAULT FALSE,
    total_amount NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    final_amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    payment_status payment_status_type DEFAULT 'PAID',
    payment_method payment_method_type DEFAULT 'CASH',
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity_ml INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method payment_method_type DEFAULT 'CASH',
    reference_no VARCHAR(100),
    invoice_id UUID,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- 9. MONTHLY INVOICES TABLE
CREATE TYPE invoice_status_type AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
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
    status invoice_status_type DEFAULT 'ISSUED',
    notes TEXT,
    line_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON invoices(period_start, period_end);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admin full access
CREATE POLICY "Admins have full access to business_settings" ON business_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to product_packages" ON product_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to price_history" ON price_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to subscriptions" ON subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to delivery_records" ON delivery_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to sales" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to sale_line_items" ON sale_line_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins have full access to invoices" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
