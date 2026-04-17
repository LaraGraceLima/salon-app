const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'salon_admin'
  });

  try {
    console.log('Starting database migration...');

    // Create promos table
    await connection.execute(`
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
      )
    `);
    console.log('✓ Promos table created');

    // Create ratings table
    await connection.execute(`
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
      )
    `);
    console.log('✓ Ratings table created');

    // Create booking_services table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS booking_services (
        id INT PRIMARY KEY AUTO_INCREMENT,
        booking_id INT NOT NULL,
        service_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Booking services table created');

    // Add cancellation columns to bookings table
    try {
      await connection.execute(`
        ALTER TABLE bookings 
        ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL,
        ADD COLUMN cancelled_by ENUM('client', 'stylist', 'admin') NULL DEFAULT NULL,
        ADD COLUMN cancellation_reason TEXT NULL DEFAULT NULL
      `);
      console.log('✓ Booking cancellation columns added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Booking cancellation columns already exist');
      } else {
        throw error;
      }
    }

    // Insert demo promos
    await connection.execute(`
      INSERT IGNORE INTO promos (title, description, discount_percentage, start_date, end_date, terms_conditions) VALUES 
      ('Spring Special', 'Get 20% off on all hair coloring services this spring!', 20.00, '2024-03-01', '2024-05-31', 'Valid for new and existing customers. Cannot be combined with other offers.'),
      ('New Customer Discount', 'First-time customers get 15% off any service', 15.00, '2024-01-01', '2024-12-31', 'Valid for first-time customers only. Must present valid ID.'),
      ('Weekend Warrior', 'Special weekend rates - 10% off all services', 10.00, '2024-03-01', '2024-06-30', 'Valid on Saturdays and Sundays only.')
    `);
    console.log('✓ Demo promos inserted');

    // Insert booking services for existing bookings
    await connection.execute(`
      INSERT IGNORE INTO booking_services (booking_id, service_id) 
      SELECT id, service_id FROM bookings WHERE service_id IS NOT NULL
    `);
    console.log('✓ Existing booking services migrated');

    console.log('Database migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await connection.end();
  }
}

runMigration();