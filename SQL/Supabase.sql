CREATE TYPE address_type_enum AS ENUM ('home', 'office');
CREATE TYPE notification_type_enum AS ENUM ('order_status', 'cart_reminder');

-- 1) USERS
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  username      VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  points        INTEGER NOT NULL DEFAULT 0
);

-- 2) ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number      VARCHAR(64) NOT NULL,
  status            VARCHAR(32) NOT NULL DEFAULT 'processing',
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  shipping          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  items_json        JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_updated_at TIMESTAMPTZ,
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  payment_method    VARCHAR(64),
  courier_service   VARCHAR(64),
  customer_email    VARCHAR(255),
  customer_phone    VARCHAR(64),
  can_cancel_after  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);

-- 3) ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id                BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name         VARCHAR(255) NOT NULL,
  item_image        VARCHAR(512),
  item_price        NUMERIC(10,2) NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1,
  size              VARCHAR(128),
  color             VARCHAR(128),
  line_total        NUMERIC(10,2) NOT NULL,
  status            VARCHAR(32) NOT NULL DEFAULT 'processing',
  status_updated_at TIMESTAMPTZ,
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- 4) SAVED ITEMS
CREATE TABLE IF NOT EXISTS saved_items (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    VARCHAR(128),
  title      VARCHAR(255),
  price      NUMERIC(10,2),
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_items (user_id);

-- 5) SHIPPING ADDRESSES
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_type     address_type_enum NOT NULL DEFAULT 'home',
  is_default       BOOLEAN NOT NULL DEFAULT FALSE,
  first_name       VARCHAR(100),
  middle_name      VARCHAR(100),
  last_name        VARCHAR(100),
  recipient_name   VARCHAR(255),
  company_name     VARCHAR(255),
  mobile_number    VARCHAR(20),
  alternate_number VARCHAR(20),
  office_phone     VARCHAR(20),
  email_address    VARCHAR(255),
  house_unit_number   VARCHAR(50),
  building_name       VARCHAR(255),
  floor_unit_number   VARCHAR(50),
  street_name         VARCHAR(255),
  subdivision_village VARCHAR(255),
  barangay            VARCHAR(100),
  city_municipality   VARCHAR(100),
  province_state      VARCHAR(100),
  postal_zip_code     VARCHAR(20),
  country             VARCHAR(100) NOT NULL DEFAULT 'Philippines',
  landmark_delivery_notes TEXT,
  office_hours            VARCHAR(255),
  additional_instructions TEXT,
  latitude          NUMERIC(10,8),
  longitude         NUMERIC(11,8),
  formatted_address TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ship_user    ON shipping_addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_ship_type    ON shipping_addresses (address_type);
CREATE INDEX IF NOT EXISTS idx_ship_default ON shipping_addresses (is_default);

-- 6) USER PREFERENCES
CREATE TABLE IF NOT EXISTS user_preferences (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  default_payment VARCHAR(50),
  default_courier VARCHAR(50),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_pref_user ON user_preferences (user_id);

-- 7) NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS notification_preferences (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  order_status  BOOLEAN DEFAULT TRUE,
  cart_reminder BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 8) NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type  notification_type_enum NOT NULL,
  title              VARCHAR(255) NOT NULL,
  message            TEXT NOT NULL,
  is_read            BOOLEAN DEFAULT FALSE,
  related_id         BIGINT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_read    ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_type         ON notifications (notification_type);
CREATE INDEX IF NOT EXISTS idx_created      ON notifications (created_at);

-- 9) LOGIN HISTORY
CREATE TABLE IF NOT EXISTS login_history (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address       VARCHAR(45),
  user_agent       VARCHAR(512),
  login_time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_time      TIMESTAMPTZ,
  session_duration INTEGER
);

CREATE INDEX IF NOT EXISTS idx_login_user ON login_history (user_id);
CREATE INDEX IF NOT EXISTS idx_login_time ON login_history (login_time);

-- 10) REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_title VARCHAR(255) NOT NULL,
  item_id       VARCHAR(128) NOT NULL,
  rating        NUMERIC(3,1) NOT NULL,
  comment       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item    ON reviews (item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_title   ON reviews (product_title);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews (created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_rating  ON reviews (rating);

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_range;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_rating_range
  CHECK (rating >= 0.5 AND rating <= 5.0);

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS unique_user_product;

ALTER TABLE reviews
  ADD CONSTRAINT unique_user_product
  UNIQUE (user_id, item_id);

-- 11) USER ACTIVITIES (REWARDS)
CREATE TABLE IF NOT EXISTS user_activities (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type  VARCHAR(64) NOT NULL,
  description    TEXT,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ua_user    ON user_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_ua_type    ON user_activities (activity_type);
CREATE INDEX IF NOT EXISTS idx_ua_created ON user_activities (created_at);

-- 12) ITEMS CATALOG
CREATE TABLE IF NOT EXISTS items (
  id           BIGSERIAL PRIMARY KEY,
  item_id      VARCHAR(128) NOT NULL UNIQUE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL,
  image        VARCHAR(512),
  category     VARCHAR(128),
  rating       NUMERIC(3,2) DEFAULT 0.00,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_rating   ON items (rating);

-- 13) SEED ITEMS FOR EXPLORE PAGE
INSERT INTO items (item_id, title, description, price, image, category)
VALUES
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
ON CONFLICT (item_id) DO UPDATE
SET
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  image       = EXCLUDED.image,
  category    = EXCLUDED.category;  