-- Create Database
CREATE DATABASE IF NOT EXISTS salon_admin;
USE salon_admin;

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stylists Table
CREATE TABLE IF NOT EXISTS stylists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  specialization VARCHAR(100),
  status ENUM('active', 'inactive') DEFAULT 'active',
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  stylist_id INT NOT NULL,
  service_id INT NOT NULL,
  date_time DATETIME NOT NULL,
  notes TEXT DEFAULT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  rescheduled_at TIMESTAMP NULL DEFAULT NULL,
  rescheduled_by ENUM('client', 'stylist', 'admin') NULL DEFAULT NULL,
  old_date_time DATETIME NULL DEFAULT NULL,
  old_stylist_id INT NULL DEFAULT NULL,
  old_service_id INT NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Insert demo admin (password: admin123)
INSERT INTO admins (name, email, password) VALUES 
('Admin User', 'admin@salon.com', '$2a$10$XnSc38ie/yGURL2OwJ7iTOTq5YQ/B23aLIJIpq3Mjp1.FFS9NFKFu');

-- Insert demo data
INSERT INTO clients (name, email, phone, password) VALUES 
('John Doe', 'john@example.com', '555-0101', NULL),
('Jane Smith', 'jane@example.com', '555-0102', NULL),
('Bob Johnson', 'bob@example.com', '555-0103', NULL),
('Test User', 'user@example.com', '555-0100', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm');

INSERT INTO stylists (name, email, phone, specialization, status, password) VALUES 
('Sarah Williams', 'sarah@salon.com', '555-1001', 'Hair Cutting', 'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm'),
('Emily Brown', 'emily@salon.com', '555-1002', 'Hair Coloring', 'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm'),
('Michael Davis', 'michael@salon.com', '555-1003', 'Styling', 'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm');

INSERT INTO services (name, description, price, duration) VALUES 
('Hair Cut', 'Professional hair cutting service', 35.00, 30),
('Hair Coloring', 'Full hair coloring service', 75.00, 60),
('Hair Styling', 'Professional styling for special occasions', 50.00, 45),
('Beard Trim', 'Professional beard trimming', 25.00, 20);

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

-- Add cancellation tracking columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by ENUM('client', 'stylist', 'admin') NULL DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL DEFAULT NULL;

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

INSERT INTO bookings (client_id, stylist_id, service_id, date_time, status) VALUES 
(1, 1, 1, '2024-03-20 10:00:00', 'confirmed'),
(2, 2, 2, '2024-03-20 14:00:00', 'pending'),
(3, 3, 3, '2024-03-21 11:00:00', 'completed');

-- Insert demo promos
INSERT INTO promos (title, description, discount_percentage, start_date, end_date, terms_conditions) VALUES 
('Spring Special', 'Get 20% off on all hair coloring services this spring!', 20.00, '2024-03-01', '2024-05-31', 'Valid for new and existing customers. Cannot be combined with other offers.'),
('New Customer Discount', 'First-time customers get 15% off any service', 15.00, '2024-01-01', '2024-12-31', 'Valid for first-time customers only. Must present valid ID.'),
('Weekend Warrior', 'Special weekend rates - 10% off all services', 10.00, '2024-03-01', '2024-06-30', 'Valid on Saturdays and Sundays only.');

-- Insert demo ratings
INSERT INTO ratings (booking_id, client_id, stylist_id, rating, review) VALUES 
(3, 3, 3, 5, 'Excellent service! Michael did an amazing job with my styling. Highly recommended!'),
(1, 1, 1, 4, 'Great haircut, very professional. Sarah was friendly and skilled.');

-- Insert booking services for existing bookings
INSERT INTO booking_services (booking_id, service_id) 
SELECT id, service_id FROM bookings WHERE id IN (1, 2, 3);

-- Salon Info Table (for dynamic salon information)
CREATE TABLE IF NOT EXISTS salon_info (
  id INT PRIMARY KEY DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  currency VARCHAR(10),
  timezone VARCHAR(50),
  business_hours JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default salon info
INSERT INTO salon_info (id, name, tagline, address, phone, email, currency, timezone, business_hours) 
VALUES (
  1, 
  'JKD SALON', 
  'Your premier beauty destination ✨', 
  '123 Salon St, Brgy. Elegance, Quezon City, Metro Manila', 
  '+63 912 345 6789', 
  'hello@salonsuite.com', 
  'PHP', 
  'Asia/Manila',
  '{"Monday":{"open":true,"from":"09:00","to":"18:00"},"Tuesday":{"open":true,"from":"09:00","to":"18:00"},"Wednesday":{"open":true,"from":"09:00","to":"18:00"},"Thursday":{"open":true,"from":"09:00","to":"18:00"},"Friday":{"open":true,"from":"09:00","to":"20:00"},"Saturday":{"open":true,"from":"08:00","to":"20:00"},"Sunday":{"open":false,"from":"10:00","to":"16:00"}}'
) ON DUPLICATE KEY UPDATE name=name;
