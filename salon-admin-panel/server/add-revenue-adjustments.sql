-- Revenue Adjustments Table
CREATE TABLE IF NOT EXISTS revenue_adjustments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  amount DECIMAL(10, 2) NOT NULL,
  type ENUM('add', 'subtract') NOT NULL,
  description TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add adjustment tracking to bookings table (optional, for tracking manual adjustments)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adjustment_id INT NULL DEFAULT NULL;
ALTER TABLE bookings ADD CONSTRAINT fk_adjustment FOREIGN KEY (adjustment_id) REFERENCES revenue_adjustments(id) ON DELETE SET NULL;
