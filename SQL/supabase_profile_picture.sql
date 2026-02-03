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

-- Optional: index not needed for TEXT column used as URL storage
