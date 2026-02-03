-- ============================================================================
-- JBR7 BAGS - Profile picture (DB column + Storage)
-- ============================================================================
-- 1. Run this SQL in Supabase SQL Editor.
-- 2. Create Storage bucket in Dashboard: Storage → New bucket → name "avatars"
--    → set to PUBLIC so profile image URLs work. No extra policies required
--    if using the API with SUPABASE_SERVICE_ROLE_KEY for uploads.
-- ============================================================================

-- profile_picture stores the Supabase Storage public URL (short string), not base64.
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
