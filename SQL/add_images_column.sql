-- add_images_column.sql
-- Adds images column to items table for storing multiple images

USE `jbr7_db`;

-- Add images column to store JSON array of image path
-- Note: Run this only if column doesn't exist
ALTER TABLE `items` 
ADD COLUMN `images` JSON NULL AFTER `image`;

-- Update existing items with their main image in the images array
UPDATE `items` 
SET `images` = JSON_ARRAY(`image`)
WHERE `image` IS NOT NULL AND (`images` IS NULL OR JSON_LENGTH(`images`) = 0);
