-- FULL_SQL_CODE.sql
-- Creates jbr7_db and all core tables with user_id-based isolation

-- 1) DATABASE + USERS
CREATE DATABASE IF NOT EXISTS jbr7_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE jbr7_db;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  points        INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0;
UPDATE users SET points = 0 WHERE points IS NULL;


-- 2) ORDERS + ORDER ITEMS (PER USER)
CREATE TABLE IF NOT EXISTS orders (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED NOT NULL,
  order_number     VARCHAR(64) NOT NULL,
  status           VARCHAR(32) NOT NULL DEFAULT 'processing',
  subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  items_json       JSON NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  status_updated_at TIMESTAMP NULL DEFAULT NULL,
  shipped_at        TIMESTAMP NULL DEFAULT NULL,
  delivered_at      TIMESTAMP NULL DEFAULT NULL,
  payment_method    VARCHAR(64) NULL DEFAULT NULL,
  courier_service   VARCHAR(64) NULL DEFAULT NULL,
  customer_email    VARCHAR(255) NULL DEFAULT NULL,
  customer_phone    VARCHAR(64) NULL DEFAULT NULL,
  can_cancel_after  TIMESTAMP NULL DEFAULT NULL,

  PRIMARY KEY (id),
  INDEX idx_orders_user (user_id),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id          INT UNSIGNED NOT NULL,
  item_name         VARCHAR(255) NOT NULL,
  item_image        VARCHAR(512) NULL,
  item_price        DECIMAL(10,2) NOT NULL,
  quantity          INT UNSIGNED NOT NULL DEFAULT 1,
  size              VARCHAR(128) NULL,
  color             VARCHAR(128) NULL,
  line_total        DECIMAL(10,2) NOT NULL,
  status            VARCHAR(32) NOT NULL DEFAULT 'processing',
  status_updated_at TIMESTAMP NULL DEFAULT NULL,
  shipped_at        TIMESTAMP NULL DEFAULT NULL,
  delivered_at      TIMESTAMP NULL DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3) SAVED ITEMS (PER USER)
CREATE TABLE IF NOT EXISTS saved_items (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  item_id    VARCHAR(128) NOT NULL,
  title      VARCHAR(255) NULL,
  price      DECIMAL(10,2) NULL,
  metadata   JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_saved_user (user_id),
  CONSTRAINT fk_saved_items_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4) SHIPPING ADDRESSES (PER USER)
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id               INT NOT NULL AUTO_INCREMENT,
  user_id          INT NOT NULL,
  address_type     ENUM('home', 'office') NOT NULL DEFAULT 'home',
  is_default       TINYINT(1) NOT NULL DEFAULT 0,

  first_name       VARCHAR(100) NULL,
  middle_name      VARCHAR(100) NULL,
  last_name        VARCHAR(100) NULL,
  recipient_name   VARCHAR(255) NULL,
  company_name     VARCHAR(255) NULL,

  mobile_number    VARCHAR(20) NULL,
  alternate_number VARCHAR(20) NULL,
  office_phone     VARCHAR(20) NULL,
  email_address    VARCHAR(255) NULL,

  house_unit_number   VARCHAR(50) NULL,
  building_name       VARCHAR(255) NULL,
  floor_unit_number   VARCHAR(50) NULL,
  street_name         VARCHAR(255) NULL,
  subdivision_village VARCHAR(255) NULL,
  barangay            VARCHAR(100) NULL,
  city_municipality   VARCHAR(100) NULL,
  province_state      VARCHAR(100) NULL,
  postal_zip_code     VARCHAR(20) NULL,
  country             VARCHAR(100) NOT NULL DEFAULT 'Philippines',

  landmark_delivery_notes TEXT NULL,
  office_hours            VARCHAR(255) NULL,
  additional_instructions TEXT NULL,

  latitude          DECIMAL(10, 8) NULL,
  longitude         DECIMAL(11, 8) NULL,
  formatted_address TEXT NULL,

  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_ship_user (user_id),
  INDEX idx_ship_type (address_type),
  INDEX idx_ship_default (is_default),
  CONSTRAINT fk_shipping_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5) USER PREFERENCES (ONE ROW PER USER)
CREATE TABLE IF NOT EXISTS user_preferences (
  id              INT NOT NULL AUTO_INCREMENT,
  user_id         INT NOT NULL,
  default_payment VARCHAR(50) NULL DEFAULT NULL,
  default_courier VARCHAR(50) NULL DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_preference (user_id),
  INDEX idx_user_pref_user (user_id),
  CONSTRAINT fk_user_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6) NOTIFICATIONS (PER USER)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  order_status  TINYINT(1) DEFAULT 1,
  cart_reminder TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_notif_pref_user (user_id),
  CONSTRAINT fk_notif_prefs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  notification_type ENUM('order_status', 'cart_reminder') NOT NULL,
  title            VARCHAR(255) NOT NULL,
  message          TEXT NOT NULL,
  is_read          TINYINT(1) DEFAULT 0,
  related_id       INT NULL COMMENT 'Order ID or Cart Item ID',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_type (notification_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 7) LOGIN HISTORY (PER USER)
CREATE TABLE IF NOT EXISTS login_history (
  id               INT NOT NULL AUTO_INCREMENT,
  user_id          INT NOT NULL,
  ip_address       VARCHAR(45) NULL,
  user_agent       VARCHAR(512) NULL,
  login_time       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logout_time      TIMESTAMP NULL DEFAULT NULL,
  session_duration INT NULL DEFAULT NULL COMMENT 'Duration in seconds',
  PRIMARY KEY (id),
  INDEX idx_login_user (user_id),
  INDEX idx_login_time (login_time),
  CONSTRAINT fk_login_history_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 8) REVIEWS (PER USER + ITEM)
CREATE TABLE IF NOT EXISTS reviews (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT NOT NULL,
  product_title VARCHAR(255) NOT NULL,
  item_id       VARCHAR(128) NOT NULL,
  rating        DECIMAL(3,1) NOT NULL,
  comment       TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_reviews_user (user_id),
  INDEX idx_reviews_item (item_id),
  INDEX idx_reviews_title (product_title),
  INDEX idx_reviews_created (created_at),
  INDEX idx_reviews_rating (rating),
  UNIQUE KEY unique_user_product (user_id, item_id),
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (rating >= 0.5 AND rating <= 5.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 9) USER ACTIVITIES (REWARDS, PER USER)
CREATE TABLE IF NOT EXISTS user_activities (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  activity_type  VARCHAR(64) NOT NULL,
  description    TEXT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_ua_user (user_id),
  INDEX idx_ua_type (activity_type),
  INDEX idx_ua_created (created_at),
  CONSTRAINT fk_user_activities_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 10) ITEMS CATALOG (GLOBAL, NO user_id)
CREATE TABLE IF NOT EXISTS items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id      VARCHAR(128) NOT NULL UNIQUE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT NULL,
  price        DECIMAL(10,2) NOT NULL,
  image        VARCHAR(512) NULL,
  category     VARCHAR(128) NULL,
  rating       DECIMAL(3,2) NULL DEFAULT 0.00,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_items_category (category),
  INDEX idx_items_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 11) OPTIONAL: SEED ITEMS FOR EXPLORE PAGE
INSERT INTO items (item_id, title, description, price, image, category) VALUES
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
ON DUPLICATE KEY UPDATE
  title       = VALUES(title),
  description = VALUES(description),
  price       = VALUES(price),
  image       = VALUES(image),
  category    = VALUES(category);

