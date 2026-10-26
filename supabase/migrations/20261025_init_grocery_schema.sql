-- ====================================================================
-- FreshPrice: Grocery Shop Price Management Schema & Migration
-- Authoritative Database Schema for Categories, Products & Price History
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories (display_order ASC);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT '',
    quantity_value NUMERIC(10, 2) NOT NULL,
    quantity_unit TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    sku TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    last_price_changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for performance & searching
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_last_price_changed ON products (last_price_changed_at DESC);

-- 4. Create Price History Table
-- Retains complete snapshot history even if product is later deleted or renamed
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    brand_snapshot TEXT NOT NULL DEFAULT '',
    quantity_snapshot TEXT NOT NULL,
    previous_price NUMERIC(12, 2) NOT NULL,
    new_price NUMERIC(12, 2) NOT NULL,
    price_difference NUMERIC(12, 2) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    changed_by TEXT DEFAULT 'Shop Owner'
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history (product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON price_history (changed_at DESC);

-- 5. Atomic Price Update Function (Ensures single-transaction consistency)
CREATE OR REPLACE FUNCTION update_product_price(
    p_product_id UUID,
    p_new_price NUMERIC,
    p_changed_by TEXT DEFAULT 'Shop Owner'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product RECORD;
    v_diff NUMERIC;
    v_history_id UUID;
    v_now TIMESTAMPTZ := timezone('utc', now());
    v_qty_str TEXT;
BEGIN
    -- Lock product row for update
    SELECT * INTO v_product
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;

    -- If price is identical, do nothing (no false history records)
    IF v_product.price = p_new_price THEN
        RETURN jsonb_build_object(
            'success', true,
            'changed', false,
            'message', 'Price is unchanged. No history record created.'
        );
    END IF;

    v_diff := p_new_price - v_product.price;
    v_qty_str := v_product.quantity_value || ' ' || v_product.quantity_unit;

    -- 1. Update the product record
    UPDATE products
    SET 
        price = p_new_price,
        last_price_changed_at = v_now,
        updated_at = v_now
    WHERE id = p_product_id;

    -- 2. Insert into price_history
    INSERT INTO price_history (
        product_id,
        product_name_snapshot,
        brand_snapshot,
        quantity_snapshot,
        previous_price,
        new_price,
        price_difference,
        changed_at,
        changed_by
    ) VALUES (
        p_product_id,
        v_product.name,
        COALESCE(v_product.brand, ''),
        v_qty_str,
        v_product.price,
        p_new_price,
        v_diff,
        v_now,
        p_changed_by
    )
    RETURNING id INTO v_history_id;

    RETURN jsonb_build_object(
        'success', true,
        'changed', true,
        'product_id', p_product_id,
        'previous_price', v_product.price,
        'new_price', p_new_price,
        'difference', v_diff,
        'history_id', v_history_id,
        'timestamp', v_now
    );
END;
$$;

-- 6. Row Level Security (RLS) Setup
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated read policies
CREATE POLICY "Allow public read on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update/delete on categories" ON categories FOR ALL USING (true);

CREATE POLICY "Allow public read on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update/delete on products" ON products FOR ALL USING (true);

CREATE POLICY "Allow public read on price_history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on price_history" ON price_history FOR INSERT WITH CHECK (true);

-- 7. Realtime Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE price_history;

-- 8. Starter Seed Data (Standard 10 Categories)
INSERT INTO categories (id, name, display_order)
VALUES 
    ('11111111-1111-1111-1111-000000000001', 'Rice', 1),
    ('11111111-1111-1111-1111-000000000002', 'Soap', 2),
    ('11111111-1111-1111-1111-000000000003', 'Oil', 3),
    ('11111111-1111-1111-1111-000000000004', 'Flour', 4),
    ('11111111-1111-1111-1111-000000000005', 'Pulses and Dal', 5),
    ('11111111-1111-1111-1111-000000000006', 'Sugar and Salt', 6),
    ('11111111-1111-1111-1111-000000000007', 'Spices and Masala', 7),
    ('11111111-1111-1111-1111-000000000008', 'Snacks and Biscuits', 8),
    ('11111111-1111-1111-1111-000000000009', 'Beverages', 9),
    ('11111111-1111-1111-1111-000000000010', 'Other Grocery Items', 10)
ON CONFLICT (name) DO NOTHING;
