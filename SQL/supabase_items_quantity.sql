-- Add quantity column to items table (for stock / explore + view page)
-- Run in Supabase Dashboard → SQL Editor

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE public.items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 99;
  END IF;
END $$;

-- Optional: set initial quantities for existing rows (default 99)
UPDATE public.items SET quantity = 99 WHERE quantity IS NULL;
