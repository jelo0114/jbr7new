-- ============================================================================
-- JBR7 BAGS - ADMIN USERS (Supabase PostgreSQL)
-- ============================================================================
-- Run in Supabase SQL Editor to create admin login.
-- Default admin: admin@jbr7.com / admin123 (change after first login!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select admin_users" ON public.admin_users;
CREATE POLICY "Allow select admin_users" ON public.admin_users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert admin_users" ON public.admin_users;
CREATE POLICY "Allow insert admin_users" ON public.admin_users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update admin_users" ON public.admin_users;
CREATE POLICY "Allow update admin_users" ON public.admin_users FOR UPDATE USING (true);

-- Seed default admin (password: admin123)
-- SHA256('admin123') = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO public.admin_users (email, password_hash, name) VALUES
  ('admin@jbr7.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'JBR7 Admin')
ON CONFLICT (email) DO NOTHING;
