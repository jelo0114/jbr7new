-- ============================================================================
-- JBR7 BAGS - COMPLETE SUPABASE (PostgreSQL) MIGRATION
-- ============================================================================
-- Run this entire script in Supabase Dashboard → SQL Editor
-- This will create all tables needed for the JBR7 Bags e-commerce system
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Auto-update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture TEXT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select users" ON public.users;
CREATE POLICY "Allow select users" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert users" ON public.users;
CREATE POLICY "Allow insert users" ON public.users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update users" ON public.users;
CREATE POLICY "Allow update users" ON public.users FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete users" ON public.users;
CREATE POLICY "Allow delete users" ON public.users FOR DELETE USING (true);

-- ============================================================================
-- 1b. PROFILE PICTURE (ensure column + RLS for existing DBs / Storage URL)
-- ============================================================================
-- profile_picture stores Supabase Storage public URL. Create Storage bucket
-- "avatars" (public) in Dashboard if using profile photo upload.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'profile_picture'
  ) THEN
    ALTER TABLE public.users ADD COLUMN profile_picture TEXT NULL;
  END IF;
END $$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow update users" ON public.users;
CREATE POLICY "Allow update users" ON public.users FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================================
-- 2. SHIPPING ADDRESSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  address_type VARCHAR(20) NOT NULL DEFAULT 'home' CHECK (address_type IN ('home', 'office')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Name fields
  first_name VARCHAR(100) NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  recipient_name VARCHAR(255) NULL,
  company_name VARCHAR(255) NULL,
  
  -- Contact
  mobile_number VARCHAR(20) NULL,
  alternate_number VARCHAR(20) NULL,
  office_phone VARCHAR(20) NULL,
  email_address VARCHAR(255) NULL,
  
  -- Address fields
  house_unit_number VARCHAR(50) NULL,
  building_name VARCHAR(255) NULL,
  floor_unit_number VARCHAR(50) NULL,
  street_name VARCHAR(255) NULL,
  subdivision_village VARCHAR(255) NULL,
  barangay VARCHAR(100) NULL,
  city_municipality VARCHAR(100) NULL,
  province_state VARCHAR(100) NULL,
  postal_zip_code VARCHAR(20) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
  
  -- Additional info
  landmark_delivery_notes TEXT NULL,
  office_hours VARCHAR(255) NULL,
  additional_instructions TEXT NULL,
  
  -- Location
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  formatted_address TEXT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON public.shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_type ON public.shipping_addresses(address_type);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON public.shipping_addresses(is_default);

DROP TRIGGER IF EXISTS shipping_addresses_set_updated_at ON public.shipping_addresses;
CREATE TRIGGER shipping_addresses_set_updated_at
  BEFORE UPDATE ON public.shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select shipping_addresses" ON public.shipping_addresses;
CREATE POLICY "Allow select shipping_addresses" ON public.shipping_addresses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert shipping_addresses" ON public.shipping_addresses;
CREATE POLICY "Allow insert shipping_addresses" ON public.shipping_addresses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update shipping_addresses" ON public.shipping_addresses;
CREATE POLICY "Allow update shipping_addresses" ON public.shipping_addresses FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete shipping_addresses" ON public.shipping_addresses;
CREATE POLICY "Allow delete shipping_addresses" ON public.shipping_addresses FOR DELETE USING (true);

-- ============================================================================
-- 3. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_number VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'processing',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  items_json JSONB NULL,
  
  -- Status tracking
  status_updated_at TIMESTAMPTZ NULL,
  shipped_at TIMESTAMPTZ NULL,
  delivered_at TIMESTAMPTZ NULL,
  
  -- Order details
  payment_method VARCHAR(64) NULL,
  courier_service VARCHAR(64) NULL,
  customer_email VARCHAR(255) NULL,
  customer_phone VARCHAR(64) NULL,
  can_cancel_after TIMESTAMPTZ NULL,
  shipping_address_id BIGINT NULL REFERENCES public.shipping_addresses(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select orders" ON public.orders;
CREATE POLICY "Allow select orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert orders" ON public.orders;
CREATE POLICY "Allow insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete orders" ON public.orders;
CREATE POLICY "Allow delete orders" ON public.orders FOR DELETE USING (true);

-- ============================================================================
-- 4. ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  item_image VARCHAR(512) NULL,
  item_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size VARCHAR(128) NULL,
  color VARCHAR(128) NULL,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Status tracking per item
  status VARCHAR(32) NOT NULL DEFAULT 'processing',
  status_updated_at TIMESTAMPTZ NULL,
  shipped_at TIMESTAMPTZ NULL,
  delivered_at TIMESTAMPTZ NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

DROP TRIGGER IF EXISTS order_items_set_updated_at ON public.order_items;
CREATE TRIGGER order_items_set_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select order_items" ON public.order_items;
CREATE POLICY "Allow select order_items" ON public.order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert order_items" ON public.order_items;
CREATE POLICY "Allow insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update order_items" ON public.order_items;
CREATE POLICY "Allow update order_items" ON public.order_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete order_items" ON public.order_items;
CREATE POLICY "Allow delete order_items" ON public.order_items FOR DELETE USING (true);

-- ============================================================================
-- 5. SAVED ITEMS TABLE (Wishlist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.saved_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id VARCHAR(128) NOT NULL,
  title VARCHAR(255) NULL,
  price DECIMAL(10,2) NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON public.saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_id ON public.saved_items(item_id);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select saved_items" ON public.saved_items;
CREATE POLICY "Allow select saved_items" ON public.saved_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert saved_items" ON public.saved_items;
CREATE POLICY "Allow insert saved_items" ON public.saved_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update saved_items" ON public.saved_items;
CREATE POLICY "Allow update saved_items" ON public.saved_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete saved_items" ON public.saved_items;
CREATE POLICY "Allow delete saved_items" ON public.saved_items FOR DELETE USING (true);

-- ============================================================================
-- 6. USER PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  default_payment VARCHAR(50) NULL,
  default_courier VARCHAR(50) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

DROP TRIGGER IF EXISTS user_preferences_set_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select user_preferences" ON public.user_preferences;
CREATE POLICY "Allow select user_preferences" ON public.user_preferences FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert user_preferences" ON public.user_preferences;
CREATE POLICY "Allow insert user_preferences" ON public.user_preferences FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update user_preferences" ON public.user_preferences;
CREATE POLICY "Allow update user_preferences" ON public.user_preferences FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete user_preferences" ON public.user_preferences;
CREATE POLICY "Allow delete user_preferences" ON public.user_preferences FOR DELETE USING (true);

-- ============================================================================
-- 7. NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  order_status BOOLEAN DEFAULT TRUE,
  cart_reminder BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select notification_preferences" ON public.notification_preferences;
CREATE POLICY "Allow select notification_preferences" ON public.notification_preferences FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert notification_preferences" ON public.notification_preferences;
CREATE POLICY "Allow insert notification_preferences" ON public.notification_preferences FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update notification_preferences" ON public.notification_preferences;
CREATE POLICY "Allow update notification_preferences" ON public.notification_preferences FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete notification_preferences" ON public.notification_preferences;
CREATE POLICY "Allow delete notification_preferences" ON public.notification_preferences FOR DELETE USING (true);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('order_status', 'cart_reminder')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select notifications" ON public.notifications;
CREATE POLICY "Allow select notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update notifications" ON public.notifications;
CREATE POLICY "Allow update notifications" ON public.notifications FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete notifications" ON public.notifications;
CREATE POLICY "Allow delete notifications" ON public.notifications FOR DELETE USING (true);

-- ============================================================================
-- 9. LOGIN HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.login_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
DROP POLICY IF EXISTS "Allow update login_history" ON public.login_history;
CREATE POLICY "Allow update login_history" ON public.login_history FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete login_history" ON public.login_history;
CREATE POLICY "Allow delete login_history" ON public.login_history FOR DELETE USING (true);

-- ============================================================================
-- 10. REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_title TEXT NOT NULL,
  item_id TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5),
  comment TEXT NULL,
  product_image TEXT NULL,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpfulness_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL,
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON public.reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_title ON public.reviews(product_title);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select reviews" ON public.reviews;
CREATE POLICY "Allow select reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert reviews" ON public.reviews;
CREATE POLICY "Allow insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update reviews" ON public.reviews;
CREATE POLICY "Allow update reviews" ON public.reviews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete reviews" ON public.reviews;
CREATE POLICY "Allow delete reviews" ON public.reviews FOR DELETE USING (true);

-- ============================================================================
-- 11. USER ACTIVITIES TABLE (Rewards/Points tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_activities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(64) NOT NULL,
  description TEXT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select user_activities" ON public.user_activities;
CREATE POLICY "Allow select user_activities" ON public.user_activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert user_activities" ON public.user_activities;
CREATE POLICY "Allow insert user_activities" ON public.user_activities FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update user_activities" ON public.user_activities;
CREATE POLICY "Allow update user_activities" ON public.user_activities FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete user_activities" ON public.user_activities;
CREATE POLICY "Allow delete user_activities" ON public.user_activities FOR DELETE USING (true);

-- ============================================================================
-- 12. ITEMS TABLE (Product Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.items (
  id BIGSERIAL PRIMARY KEY,
  item_id VARCHAR(128) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(512) NULL,
  category VARCHAR(128) NULL,
  rating DECIMAL(3,2) NULL DEFAULT 0.00,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_items_item_id ON public.items(item_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_rating ON public.items(rating);

DROP TRIGGER IF EXISTS items_set_updated_at ON public.items;
CREATE TRIGGER items_set_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select items" ON public.items;
CREATE POLICY "Allow select items" ON public.items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert items" ON public.items;
CREATE POLICY "Allow insert items" ON public.items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update items" ON public.items;
CREATE POLICY "Allow update items" ON public.items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete items" ON public.items;
CREATE POLICY "Allow delete items" ON public.items FOR DELETE USING (true);

-- ============================================================================
-- 13. RECEIPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id BIGINT NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT NULL,
  payment_provider TEXT NULL,
  payment_provider_id TEXT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PHP',
  status TEXT NOT NULL DEFAULT 'succeeded',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refunded_at TIMESTAMPTZ NULL,
  refund_amount DECIMAL(12,2) NULL,
  raw_response TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON public.receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_number ON public.receipts(order_number);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON public.receipts(created_at DESC);

DROP TRIGGER IF EXISTS receipts_set_updated_at ON public.receipts;
CREATE TRIGGER receipts_set_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select receipts" ON public.receipts;
CREATE POLICY "Allow select receipts" ON public.receipts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert receipts" ON public.receipts;
CREATE POLICY "Allow insert receipts" ON public.receipts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update receipts" ON public.receipts;
CREATE POLICY "Allow update receipts" ON public.receipts FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete receipts" ON public.receipts;
CREATE POLICY "Allow delete receipts" ON public.receipts FOR DELETE USING (true);

-- ============================================================================
-- 14. REWARD TIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reward_tiers (
  id BIGSERIAL PRIMARY KEY,
  points_required INTEGER NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select reward_tiers" ON public.reward_tiers;
CREATE POLICY "Allow select reward_tiers" ON public.reward_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert reward_tiers" ON public.reward_tiers;
CREATE POLICY "Allow insert reward_tiers" ON public.reward_tiers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update reward_tiers" ON public.reward_tiers;
CREATE POLICY "Allow update reward_tiers" ON public.reward_tiers FOR UPDATE USING (true);

-- ============================================================================
-- 15. USER COUPONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_coupons (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  order_id BIGINT NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON public.user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_used ON public.user_coupons(user_id, used);

ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select user_coupons" ON public.user_coupons;
CREATE POLICY "Allow select user_coupons" ON public.user_coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert user_coupons" ON public.user_coupons;
CREATE POLICY "Allow insert user_coupons" ON public.user_coupons FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update user_coupons" ON public.user_coupons;
CREATE POLICY "Allow update user_coupons" ON public.user_coupons FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete user_coupons" ON public.user_coupons;
CREATE POLICY "Allow delete user_coupons" ON public.user_coupons FOR DELETE USING (true);

-- ============================================================================
-- SEED DATA: REWARD TIERS
-- ============================================================================
INSERT INTO public.reward_tiers (points_required, discount_percent, label) VALUES
  (300, 10, '10% Off'),
  (700, 20, '20% Off'),
  (1000, 40, '40% Off'),
  (1500, 50, '50% Off')
ON CONFLICT (points_required) DO UPDATE SET 
  discount_percent = EXCLUDED.discount_percent, 
  label = EXCLUDED.label;

-- ============================================================================
-- SEED DATA: ITEMS CATALOG
-- ============================================================================
INSERT INTO public.items (item_id, title, description, price, image, category) VALUES
  ('eco-colored-tote', 'Eco Colored Tote Bag', 'Tote Bag Katsa White, Black and Colored — lightweight, durable, and perfect for everyday use.', 55.00, 'Tote Bag/Colored.png', 'jute-tote'),
  ('riki-tall-bag', 'Riki Tall Bag', 'Size: 29x22 x 1.5 inches', 850.00, 'Riki Bag/Riki.jpg', 'riki'),
  ('ringlight-bag', 'Ring Light Bag', 'Spacious duffel with premium materials, perfect for weekend getaways', 500.00, 'RingLight/Ringlight.jpg', 'ringlight'),
  ('plain-brass-backpack', 'Plain Brass Cotton Back Pack', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'One/ph-11134207-7ras8-m9txs8bfjp3gc0.jpg', 'backpack'),
  ('two-colored-backpack', 'Two Colored Brass Cotton Back Pack', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Two Color/ph-11134207-7rasg-m9ty0a4dge0z1e.jpg', 'backpack'),
  ('vanity-mirror-bag', 'Vanity Mirror Bag', 'Durable canvas tote with reinforced handles and internal pockets', 400.00, 'Mirror Bag/68ba1e35671d997f6eb3ed1c376a4b27.jpg', 'vanity'),
  ('envelope-bag', 'Envelope Bags', 'Size 15*12.5inches', 70.00, 'Envelope Bag/ablue.png', 'envelop-module'),
  ('boys-kiddie-bag', 'Boys Kiddie Bag', 'Sizes: S, M, L', 140.00, 'Boys Kiddie Bag/BOYS.jpg', 'boys-kiddie'),
  ('girls-kiddie-bag', 'Girls Kiddie Bag', 'Sizes: S, M, L', 140.00, 'Girls Kiddie Bag/GIRL.jpg', 'girls-kiddie'),
  ('katrina-plain', 'Katrina Plain', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Katrina Plain/Copy of Green Grey Simple Modern New Arrival Instagram Post (1).png', 'backpack'),
  ('katrina-two-colors', 'Katrina Two Colors', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Katrina Two Colors/1.png', 'backpack'),
  ('module-bag', 'Module Bag', 'Size 15*12.5*3.5 inches Fabric Used: Poly Rubber and PVC Transparent', 90.00, 'Module/ph-11134207-7r98r-lxmbqd55abtt7c.avif', 'envelop-module')
ON CONFLICT (item_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image = EXCLUDED.image,
  category = EXCLUDED.category;

-- ============================================================================
-- 16. ADMIN USERS TABLE (for admin login - separate from store users)
-- ============================================================================
-- Same as SQL/supabase_admin.sql (standalone script).
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

-- Seed default admin (email: admin@jbr7.com, password: admin123)
INSERT INTO public.admin_users (email, password_hash, name) VALUES
  ('admin@jbr7.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'JBR7 Admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- DONE! All tables created successfully.
-- ============================================================================
-- Tables created:
--   1. users              - User accounts (profile_picture in schema)
--   1b. profile_picture   - Column + RLS for users (Storage URL; bucket "avatars")
--   2. shipping_addresses - User shipping addresses (home/office)
--   3. orders             - User orders
--   4. order_items        - Items within orders
--   5. saved_items        - Wishlist/saved items
--   6. user_preferences   - Default payment/courier preferences
--   7. notification_preferences - Notification settings
--   8. notifications      - User notifications
--   9. login_history      - Login audit trail
--  10. reviews            - Product reviews
--  11. user_activities    - Points/rewards activity log
--  12. items              - Product catalog
--  13. receipts           - Payment receipts
--  14. reward_tiers       - Points-to-discount tier config
--  15. user_coupons       - Claimed reward coupons
--  16. admin_users        - Admin login (admin@jbr7.com / admin123)
-- ============================================================================
