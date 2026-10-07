-- ====================================================================
-- SUPABASE SCHEMA FOR SMART GROCERY APP
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Tabel Keranjang Belanja Aktif (Realtime 100%)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    qty NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    last_month_price NUMERIC DEFAULT 0,
    discount_type TEXT DEFAULT 'percent',
    discount_string TEXT DEFAULT '',
    discount_nominal NUMERIC DEFAULT 0,
    final_unit_price NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    savings_per_unit NUMERIC DEFAULT 0,
    total_savings NUMERIC DEFAULT 0,
    checked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Pengaturan Batas Anggaran (Budget Safety Cap)
CREATE TABLE IF NOT EXISTS public.budget_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_budget',
    budget_cap NUMERIC NOT NULL DEFAULT 500000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Master Database Harga Terakhir (Memori Referensi Otomatis)
CREATE TABLE IF NOT EXISTS public.price_master (
    name TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    last_price NUMERIC NOT NULL,
    last_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Riwayat Sesi Belanja Bulanan
CREATE TABLE IF NOT EXISTS public.shopping_sessions (
    id TEXT PRIMARY KEY,
    session_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    budget_cap NUMERIC NOT NULL,
    total_expense NUMERIC NOT NULL,
    total_original NUMERIC NOT NULL,
    total_savings NUMERIC NOT NULL,
    remaining_wallet NUMERIC NOT NULL,
    items JSONB NOT NULL
);

-- ====================================================================
-- AKTIFKAN SUPABASE REALTIME (100% Sinkronisasi Antar Device)
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_master;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) - Buka akses publik anonim untuk demo/testing
-- ====================================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for cart_items" 
ON public.cart_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read-write for budget_settings" 
ON public.budget_settings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read-write for price_master" 
ON public.price_master FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read-write for shopping_sessions" 
ON public.shopping_sessions FOR ALL USING (true) WITH CHECK (true);
