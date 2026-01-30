-- Login history for settings (Supabase)
CREATE TABLE IF NOT EXISTS public.login_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_time TIMESTAMPTZ NULL,
  session_duration_seconds INTEGER NULL
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON public.login_history(login_time DESC);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select login_history" ON public.login_history;
CREATE POLICY "Allow select login_history" ON public.login_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert login_history" ON public.login_history;
CREATE POLICY "Allow insert login_history" ON public.login_history FOR INSERT WITH CHECK (true);
