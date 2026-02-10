-- items_updating.sql
-- Helper script for ensuring the items table supports admin \"Update all\"
-- Run this in Supabase Dashboard → SQL Editor (PostgreSQL).

-- Ensure quantity column exists (used by admin and explore/view)
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 99;

-- Ensure rating and review_count have sensible defaults (optional)
ALTER TABLE public.items
ALTER COLUMN rating SET DEFAULT 0.00,
ALTER COLUMN review_count SET DEFAULT 0;

-- Normalize any NULL quantities to default
UPDATE public.items SET quantity = 99 WHERE quantity IS NULL;

