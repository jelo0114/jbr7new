-- Points & Coupons (Supabase)
-- Logic: every order +60 pts, every review +20 pts. Claim: 300→10% off, 700→20%, 1000→40%, 1500→50%.

-- Reward tiers (points required → discount %)
CREATE TABLE IF NOT EXISTS public.reward_tiers (
  id BIGSERIAL PRIMARY KEY,
  points_required INTEGER NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User coupons (claimed rewards; one row per claimed coupon)
CREATE TABLE IF NOT EXISTS public.user_coupons (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  points_spent INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  order_id BIGINT NULL,
  order_number TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON public.user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_used ON public.user_coupons(user_id, used);

ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select reward_tiers" ON public.reward_tiers;
CREATE POLICY "Allow select reward_tiers" ON public.reward_tiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select user_coupons" ON public.user_coupons;
CREATE POLICY "Allow select user_coupons" ON public.user_coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert user_coupons" ON public.user_coupons;
CREATE POLICY "Allow insert user_coupons" ON public.user_coupons FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update user_coupons" ON public.user_coupons;
CREATE POLICY "Allow update user_coupons" ON public.user_coupons FOR UPDATE USING (true);

-- Seed reward tiers: 300→10%, 700→20%, 1000→40%, 1500→50%
INSERT INTO public.reward_tiers (points_required, discount_percent, label) VALUES
  (300, 10, '10% Off'),
  (700, 20, '20% Off'),
  (1000, 40, '40% Off'),
  (1500, 50, '50% Off')
ON CONFLICT (points_required) DO UPDATE SET discount_percent = EXCLUDED.discount_percent, label = EXCLUDED.label;
