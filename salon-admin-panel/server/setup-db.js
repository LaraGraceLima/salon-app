const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'salon_admin',
    });

    console.log('Connected to database...');

    // Add password column if it doesn't exist
    try {
      await connection.query(
        `ALTER TABLE clients ADD COLUMN password VARCHAR(255) NULL`
      );
      console.log('✓ Added password column to clients table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Password column already exists');
      } else {
        throw error;
      }
    }

    // Insert test user if not exists
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await connection.query(
        `INSERT IGNORE INTO clients (id, name, email, phone, password) 
         VALUES (999, 'Test User', 'user@example.com', '555-0100', ?)`,
        [hashedPassword]
      );
      console.log('✓ Test user created (email: user@example.com, password: password123)');
    } catch (error) {
      console.log('✓ Test user already exists or error:', error.message);
    }

    await connection.end();
    console.log('\n✓ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
