const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Checking bookings table structure...');
    
    // Get all columns
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'bookings' AND TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    console.log('Current columns:', columns.map(c => c.COLUMN_NAME));

    // Check if notes column exists
    const hasNotes = columns.some(c => c.COLUMN_NAME === 'notes');

    if (!hasNotes) {
      console.log('Adding notes column to bookings table...');
      try {
        await connection.query(`
          ALTER TABLE bookings ADD COLUMN notes TEXT DEFAULT NULL AFTER date_time
        `);
        console.log('✓ Notes column added successfully');
      } catch (alterError) {
        console.error('Error adding column:', alterError.message);
      }
    } else {
      console.log('✓ Notes column already exists');
    }

    // Verify the table structure
    const [tableStructure] = await connection.query(`
      DESCRIBE bookings
    `);

    console.log('\nBookings table structure:');
    tableStructure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    console.log('\n✓ Database fix complete!');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await connection.end();
  }
}

fixDatabase();
