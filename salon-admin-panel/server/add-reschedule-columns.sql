-- Add reschedule tracking columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_by ENUM('client', 'stylist', 'admin') NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS old_date_time DATETIME NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS old_stylist_id INT NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS old_service_id INT NULL DEFAULT NULL;

-- Create reschedule history table
CREATE TABLE IF NOT EXISTS reschedule_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  old_date_time DATETIME NOT NULL,
  new_date_time DATETIME NOT NULL,
  old_stylist_id INT,
  new_stylist_id INT,
  old_service_id INT,
  new_service_id INT,
  rescheduled_by ENUM('client', 'stylist', 'admin') NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (old_stylist_id) REFERENCES stylists(id) ON DELETE SET NULL,
  FOREIGN KEY (new_stylist_id) REFERENCES stylists(id) ON DELETE SET NULL,
  FOREIGN KEY (old_service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (new_service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX idx_reschedule_history_booking ON reschedule_history(booking_id);
CREATE INDEX idx_reschedule_history_created ON reschedule_history(created_at);
