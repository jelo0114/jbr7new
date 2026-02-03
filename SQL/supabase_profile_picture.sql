-- ============================================================================
-- JBR7 BAGS - Profile picture column (Supabase PostgreSQL)
-- ============================================================================
-- Run in Supabase SQL Editor if profile photo upload is used.
-- Ensures users.profile_picture exists for storing photo URL or data URL.
-- ============================================================================

-- Add column if it does not exist (PostgreSQL 9.5+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'profile_picture'
  ) THEN
    ALTER TABLE public.users ADD COLUMN profile_picture TEXT NULL;
  END IF;
END $$;

-- Ensure RLS allows UPDATE on users (required for profile photo save)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow update users" ON public.users;
CREATE POLICY "Allow update users" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
