-- Add new features: Promos, Ratings, Additional Services
USE salon_admin;

-- Promos Table
CREATE TABLE IF NOT EXISTS promos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  discount_percentage DECIMAL(5, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  image_url VARCHAR(255) DEFAULT NULL,
  terms_conditions TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  client_id INT NOT NULL,
  stylist_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE,
  UNIQUE KEY unique_booking_rating (booking_id)
);

-- Booking Additional Services Table (for multiple services per booking)
CREATE TABLE IF NOT EXISTS booking_services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  service_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Add cancelled_at column to bookings table for tracking cancellation time
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by ENUM('client', 'stylist', 'admin') NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL DEFAULT NULL;

-- Insert demo promos
INSERT INTO promos (title, description, discount_percentage, start_date, end_date, terms_conditions) VALUES 
('Spring Special', 'Get 20% off on all hair coloring services this spring!', 20.00, '2024-03-01', '2024-05-31', 'Valid for new and existing customers. Cannot be combined with other offers.'),
('New Customer Discount', 'First-time customers get 15% off any service', 15.00, '2024-01-01', '2024-12-31', 'Valid for first-time customers only. Must present valid ID.'),
('Weekend Warrior', 'Special weekend rates - 10% off all services', 10.00, '2024-03-01', '2024-06-30', 'Valid on Saturdays and Sundays only.');

-- Insert demo ratings
INSERT INTO ratings (booking_id, client_id, stylist_id, rating, review) VALUES 
(3, 3, 3, 5, 'Excellent service! Michael did an amazing job with my styling. Highly recommended!'),
(1, 1, 1, 4, 'Great haircut, very professional. Sarah was friendly and skilled.');

-- Update existing bookings to have primary service in booking_services table
INSERT INTO booking_services (booking_id, service_id) 
SELECT id, service_id FROM bookings WHERE id IN (1, 2, 3);