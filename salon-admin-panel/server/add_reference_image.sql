-- Add reference_image column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reference_image LONGTEXT DEFAULT NULL AFTER notes;
