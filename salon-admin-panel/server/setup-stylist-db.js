const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupStylistDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'salon_admin',
    });

    console.log('Connected to database...');

    // Add password column to stylists if it doesn't exist
    try {
      await connection.query(
        `ALTER TABLE stylists ADD COLUMN password VARCHAR(255) NULL`
      );
      console.log('✓ Added password column to stylists table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Password column already exists in stylists table');
      } else {
        throw error;
      }
    }

    // Update existing stylists with hashed password (if they don't have one)
    try {
      const hashedPassword = await bcrypt.hash('stylist123', 10);
      
      await connection.query(
        `UPDATE stylists SET password = ? WHERE password IS NULL`,
        [hashedPassword]
      );
      console.log('✓ Updated stylists with default password');
    } catch (error) {
      console.log('✓ Stylists already have passwords or error:', error.message);
    }

    await connection.end();
    console.log('\n✓ Stylist database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupStylistDatabase();
