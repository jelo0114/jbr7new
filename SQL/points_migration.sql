-- points_migration.sql
-- Adds a `points` column to the existing `users` table and zeroes existing points

USE `jbr7_db`;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `points` INT NOT NULL DEFAULT 0;

-- Ensure existing rows have 0 points
UPDATE `users` SET `points` = 0 WHERE `points` IS NULL;
