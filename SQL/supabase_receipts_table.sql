-- Supabase (PostgreSQL) receipts table
-- Run this in Supabase Dashboard → SQL Editor so receipts appear in Table Editor and the API stops returning 503.

-- Create receipts table if it doesn't exist (matches api/receipt.js fields)
CREATE TABLE IF NOT EXISTS public.receipts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  order_id BIGINT NULL,
  order_number TEXT NULL,
  payment_provider TEXT NULL,
  payment_provider_id TEXT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PHP',
  status TEXT NOT NULL DEFAULT 'succeeded',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_response TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON public.receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_number ON public.receipts(order_number);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON public.receipts(created_at DESC);

-- Allow API (anon key) to insert/select/update (adjust RLS as needed for your auth)
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Policy: allow all for anon and authenticated (so receipt save from frontend works)
-- Tighten this in production if you want users to only see their own receipts.
DROP POLICY IF EXISTS "Allow insert receipts" ON public.receipts;
CREATE POLICY "Allow insert receipts" ON public.receipts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select receipts" ON public.receipts;
CREATE POLICY "Allow select receipts" ON public.receipts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update receipts" ON public.receipts;
CREATE POLICY "Allow update receipts" ON public.receipts FOR UPDATE USING (true);
