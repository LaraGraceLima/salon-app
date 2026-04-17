-- Add notes column to bookings table if it doesn't exist
ALTER TABLE bookings ADD COLUMN notes TEXT DEFAULT NULL AFTER date_time;
