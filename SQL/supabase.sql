-- DATABASE SCHEMA FOR PROFILE SYSTEM
-- Run these SQL commands to create the required tables

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(500),
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SAVED ITEMS TABLE (Wishlist)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    price VARCHAR(50) NOT NULL,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    UNIQUE KEY unique_user_item (user_id, title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'processing',
    total VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_title VARCHAR(255) NOT NULL,
    product_price VARCHAR(50),
    product_image VARCHAR(500),
    rating DECIMAL(2,1) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_product_title (product_title),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- ACTIVITIES TABLE (Optional - for tracking all activities)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert test user
INSERT INTO users (username, email, password, points) VALUES
('Test User', 'test@example.com', 'hashed_password_here', 1250)
ON DUPLICATE KEY UPDATE username=username;

-- Get the user ID (adjust this based on your actual user ID)
SET @test_user_id = (SELECT id FROM users WHERE email = 'test@example.com');

-- Insert sample saved items
INSERT INTO saved_items (user_id, title, price, image) VALUES
(@test_user_id, 'Eco-Friendly Tote Bag', '299', 'totebag.avif'),
(@test_user_id, 'Reusable Shopping Bag', '249', 'totebag.avif'),
(@test_user_id, 'Canvas Shoulder Bag', '399', 'totebag.avif')
ON DUPLICATE KEY UPDATE price=price;

-- Insert sample orders
INSERT INTO orders (user_id, order_number, status, total, created_at) VALUES
(@test_user_id, 'ORD-2024-001', 'delivered', '1,295', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@test_user_id, 'ORD-2024-002', 'processing', '849', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@test_user_id, 'ORD-2024-003', 'shipped', '1,499', DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE status=status;

-- Insert sample reviews
INSERT INTO reviews (user_id, product_title, product_price, product_image, rating, comment, created_at) VALUES
(@test_user_id, 'Eco-Friendly Tote Bag', '299', 'totebag.avif', 5.0, 'Excellent quality! Very durable and eco-friendly.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@test_user_id, 'Canvas Shoulder Bag', '399', 'totebag.avif', 4.5, 'Great bag, love the design!', DATE_SUB(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE comment=comment;

-- ============================================
-- USEFUL QUERIES FOR DEBUGGING
-- ============================================

-- Check if tables exist
SHOW TABLES;

-- Check table structure
DESCRIBE users;
DESCRIBE saved_items;
DESCRIBE orders;
DESCRIBE reviews;

-- Count records per table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'saved_items', COUNT(*) FROM saved_items
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;

-- Get user with all stats
SELECT 
    u.id,
    u.username,
    u.email,
    u.points,
    (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as total_orders,
    (SELECT COUNT(*) FROM saved_items WHERE user_id = u.id) as saved_items,
    (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as reviews
FROM users u
WHERE u.id = @test_user_id;

-- ============================================
-- MIGRATION COMMANDS (if updating existing schema)
-- ============================================

-- Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON reviews(user_id);

-- Add missing profile_picture column to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Optional: Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- ============================================
-- SHIPPING ADDRESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('home', 'office')),
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Home Address Fields
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Office Address Fields
    recipient_name VARCHAR(200),
    company_name VARCHAR(200),
    office_phone VARCHAR(50),
    
    -- Contact Information
    mobile_number VARCHAR(50),
    alternate_number VARCHAR(50),
    email_address VARCHAR(255),
    
    -- Home Address Details
    house_unit_number VARCHAR(100),
    subdivision_village VARCHAR(200),
    landmark_delivery_notes TEXT,
    
    -- Office Address Details
    building_name VARCHAR(200),
    floor_unit_number VARCHAR(100),
    office_hours VARCHAR(200),
    additional_instructions TEXT,
    
    -- Common Address Fields
    street_name VARCHAR(255),
    barangay VARCHAR(200),
    city_municipality VARCHAR(200) NOT NULL,
    province_state VARCHAR(200) NOT NULL,
    postal_zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'Philippines',
    
    -- Location Coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    formatted_address TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for shipping_addresses
CREATE INDEX idx_shipping_user_id ON shipping_addresses(user_id);
CREATE INDEX idx_shipping_default ON shipping_addresses(is_default);
CREATE INDEX idx_shipping_type ON shipping_addresses(address_type);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    default_payment VARCHAR(50),
    default_courier VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for user_preferences
CREATE INDEX idx_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    order_status BOOLEAN DEFAULT TRUE,
    cart_reminder BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for notification_preferences
CREATE INDEX idx_notif_user_id ON notification_preferences(user_id);

-- ============================================
-- ADD PHONE COLUMN TO USERS TABLE (if not exists)
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- ============================================
-- TRIGGER TO UPDATE updated_at TIMESTAMP
-- ============================================

-- For shipping_addresses
CREATE OR REPLACE FUNCTION update_shipping_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_shipping_addresses_updated_at
    BEFORE UPDATE ON shipping_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_shipping_addresses_updated_at();

-- For user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- For notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert test shipping address (adjust user_id as needed)
INSERT INTO shipping_addresses (
    user_id, address_type, is_default,
    first_name, last_name, mobile_number,
    house_unit_number, street_name, barangay,
    city_municipality, province_state, postal_zip_code
) VALUES (
    1, 'home', TRUE,
    'Juan', 'Dela Cruz', '09171234567',
    '123', 'Rizal Street', 'Barangay 1',
    'Baliuag', 'Bulacan', '3006'
) ON CONFLICT DO NOTHING;

-- Insert test user preferences
INSERT INTO user_preferences (user_id, default_payment, default_courier)
VALUES (1, 'cod', 'jnt')
ON CONFLICT (user_id) DO NOTHING;

-- Insert test notification preferences
INSERT INTO notification_preferences (user_id, order_status, cart_reminder)
VALUES (1, TRUE, TRUE)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shipping_addresses', 'user_preferences', 'notification_preferences')
ORDER BY table_name;

-- Check shipping_addresses structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shipping_addresses'
ORDER BY ordinal_position;

-- Check user_preferences structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check notification_preferences structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- Count records in each table
SELECT 
    'shipping_addresses' as table_name, 
    COUNT(*) as record_count 
FROM shipping_addresses
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM notification_preferences;

-- ============================================
-- CLEANUP (Use only if you need to start fresh)
-- ============================================

-- DROP TABLE IF EXISTS shipping_addresses CASCADE;
-- DROP TABLE IF EXISTS user_preferences CASCADE;
-- DROP TABLE IF EXISTS notification_preferences CASCADE;