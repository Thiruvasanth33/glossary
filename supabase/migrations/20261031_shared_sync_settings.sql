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

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow shared settings access" ON settings;
CREATE POLICY "Allow shared settings access" ON settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO settings (id) VALUES ('shop') ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE settings;
  END IF;
END
$$;
