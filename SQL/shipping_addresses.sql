-- shipping_addresses.sql
-- Creates a table to store user shipping addresses (Home and Office)

USE `jbr7_db`;

CREATE TABLE IF NOT EXISTS `shipping_addresses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `address_type` ENUM('home', 'office') NOT NULL DEFAULT 'home',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  
  -- Home Address Fields
  `first_name` VARCHAR(100) NULL,
  `middle_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `recipient_name` VARCHAR(255) NULL COMMENT 'For office addresses',
  `company_name` VARCHAR(255) NULL COMMENT 'For office addresses',
  
  -- Contact Information
  `mobile_number` VARCHAR(20) NULL,
  `alternate_number` VARCHAR(20) NULL,
  `office_phone` VARCHAR(20) NULL COMMENT 'For office addresses',
  `email_address` VARCHAR(255) NULL,
  
  -- Address Fields
  `house_unit_number` VARCHAR(50) NULL,
  `building_name` VARCHAR(255) NULL COMMENT 'For office addresses',
  `floor_unit_number` VARCHAR(50) NULL COMMENT 'For office addresses',
  `street_name` VARCHAR(255) NULL,
  `subdivision_village` VARCHAR(255) NULL COMMENT 'For home addresses',
  `barangay` VARCHAR(100) NULL,
  `city_municipality` VARCHAR(100) NULL,
  `province_state` VARCHAR(100) NULL,
  `postal_zip_code` VARCHAR(20) NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'Philippines',
  
  -- Additional Information
  `landmark_delivery_notes` TEXT NULL COMMENT 'For home addresses',
  `office_hours` VARCHAR(255) NULL COMMENT 'For office addresses',
  `additional_instructions` TEXT NULL COMMENT 'For office addresses',
  
  -- Location Tracking
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `formatted_address` TEXT NULL COMMENT 'Full formatted address from geocoding',
  
  -- Timestamps
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX (`user_id`),
  INDEX (`address_type`),
  INDEX (`is_default`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
