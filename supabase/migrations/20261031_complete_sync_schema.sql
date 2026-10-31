-- ====================================================================
-- FreshPrice: Multi-Device Synchronization & Bilingual Schema
-- Run this in your Supabase Project SQL Editor to enable real-time sync across Laptop & Mobile
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create or Update Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    name_ta TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Upgrade existing categories table if columns are missing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ta TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories (display_order ASC);

-- 3. Create or Update Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name TEXT NOT NULL,
    name_ta TEXT,
    brand TEXT NOT NULL DEFAULT '',
    brand_ta TEXT,
    quantity_value NUMERIC(10, 2) NOT NULL,
    quantity_unit TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    sku TEXT,
    description TEXT,
    description_ta TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    last_price_changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Upgrade existing products table if columns are missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ta TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_ta TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ta TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_price_changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_last_price_changed ON products (last_price_changed_at DESC);

-- 4. Create or Update Price History Table
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    product_name_snapshot_ta TEXT,
    brand_snapshot TEXT NOT NULL DEFAULT '',
    quantity_snapshot TEXT NOT NULL,
    previous_price NUMERIC(12, 2) NOT NULL,
    new_price NUMERIC(12, 2) NOT NULL,
    price_difference NUMERIC(12, 2) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    changed_by TEXT DEFAULT 'Shop Owner'
);

-- Upgrade existing price_history table if columns are missing
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS product_name_snapshot_ta TEXT;

CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history (product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON price_history (changed_at DESC);

-- 5. Create or Update Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    shop_name TEXT NOT NULL DEFAULT 'Grocery Store',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    currency_code TEXT NOT NULL DEFAULT 'INR',
    default_voice_language TEXT NOT NULL DEFAULT 'en-IN',
    db_mode TEXT NOT NULL DEFAULT 'supabase',
    supabase_url TEXT,
    supabase_anon_key TEXT,
    user_role TEXT NOT NULL DEFAULT 'owner',
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO settings (id) VALUES ('shop') ON CONFLICT (id) DO NOTHING;

-- 6. Configure Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if present to prevent errors
DROP POLICY IF EXISTS "Allow public read on categories" ON categories;
DROP POLICY IF EXISTS "Allow public write on categories" ON categories;
DROP POLICY IF EXISTS "Allow public read on products" ON products;
DROP POLICY IF EXISTS "Allow public write on products" ON products;
DROP POLICY IF EXISTS "Allow public read on price_history" ON price_history;
DROP POLICY IF EXISTS "Allow public write on price_history" ON price_history;
DROP POLICY IF EXISTS "Allow shared settings access" ON settings;

-- Create clean permissive policies for the anon client
CREATE POLICY "Allow public read on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public write on categories" ON categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public write on products" ON products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on price_history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Allow public write on price_history" ON price_history FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow shared settings access" ON settings FOR ALL USING (true) WITH CHECK (true);

-- 7. Enable Realtime Publications for all tables
-- This ensures that when a price changes on laptop, mobile receives the push event immediately!
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'categories') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE categories;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'price_history') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE price_history;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'settings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE settings;
    END IF;
END
$$;

-- 8. Seed Standard Starter Categories with Tamil names
INSERT INTO categories (id, name, name_ta, display_order)
VALUES 
    ('11111111-1111-1111-1111-000000000001', 'Rice', 'அரிசி', 1),
    ('11111111-1111-1111-1111-000000000002', 'Soap', 'சோப்பு', 2),
    ('11111111-1111-1111-1111-000000000003', 'Oil', 'எண்ணெய்', 3),
    ('11111111-1111-1111-1111-000000000004', 'Flour', 'மாவு', 4),
    ('11111111-1111-1111-1111-000000000005', 'Pulses and Dal', 'பருப்பு வகைகள்', 5),
    ('11111111-1111-1111-1111-000000000006', 'Sugar and Salt', 'சர்க்கரை மற்றும் உப்பு', 6),
    ('11111111-1111-1111-1111-000000000007', 'Spices and Masala', 'மசாலா பொருட்கள்', 7),
    ('11111111-1111-1111-1111-000000000008', 'Snacks and Biscuits', 'சிற்றுண்டி மற்றும் பிஸ்கட்', 8),
    ('11111111-1111-1111-1111-000000000009', 'Beverages', 'பானங்கள்', 9),
    ('11111111-1111-1111-1111-000000000010', 'Other Grocery Items', 'பிற மளிகைப் பொருட்கள்', 10)
ON CONFLICT (name) DO UPDATE SET name_ta = EXCLUDED.name_ta;
