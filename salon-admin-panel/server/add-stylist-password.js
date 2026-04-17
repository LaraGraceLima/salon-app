const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function addPasswordColumn() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'salon_admin',
  });

  try {
    const connection = await pool.getConnection();

    // Check if password column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'stylists' AND COLUMN_NAME = 'password'
    `);

    if (columns.length === 0) {
      console.log('Adding password column to stylists table...');
      await connection.query(`
        ALTER TABLE stylists ADD COLUMN password VARCHAR(255) AFTER status
      `);
      console.log('✓ Password column added');
    } else {
      console.log('✓ Password column already exists');
    }

    // Set password for existing stylists
    console.log('Setting passwords for existing stylists...');
    
    // Sarah Williams - stylist123
    const hashedPassword1 = await bcrypt.hash('stylist123', 10);
    await connection.query(
      'UPDATE stylists SET password = ? WHERE email = ?',
      [hashedPassword1, 'sarah@salon.com']
    );
    console.log('✓ Set password for sarah@salon.com');

    // Emily Brown - stylist123
    const hashedPassword2 = await bcrypt.hash('stylist123', 10);
    await connection.query(
      'UPDATE stylists SET password = ? WHERE email = ?',
      [hashedPassword2, 'emily@salon.com']
    );
    console.log('✓ Set password for emily@salon.com');

    // Michael Davis - stylist123
    const hashedPassword3 = await bcrypt.hash('stylist123', 10);
    await connection.query(
      'UPDATE stylists SET password = ? WHERE email = ?',
      [hashedPassword3, 'michael@salon.com']
    );
    console.log('✓ Set password for michael@salon.com');

    connection.release();
    console.log('\n✓ All stylists now have passwords set!');
    console.log('Stylist credentials:');
    console.log('  Email: sarah@salon.com, Password: stylist123');
    console.log('  Email: emily@salon.com, Password: stylist123');
    console.log('  Email: michael@salon.com, Password: stylist123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addPasswordColumn();
