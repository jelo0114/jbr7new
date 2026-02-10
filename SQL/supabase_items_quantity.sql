-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 99;

-- Optional: set initial quantities for existing rows (default 99)
UPDATE public.items SET quantity = 99 WHERE quantity IS NULL;
