const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixStylistPasswords() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'salon_admin',
    });

    console.log('Connected to database...');

    // Get all stylists
    const [stylists] = await connection.query('SELECT id, email, password FROM stylists');
    
    console.log(`Found ${stylists.length} stylists`);

    // Hash password for stylists without password or with NULL password
    const hashedPassword = await bcrypt.hash('stylist123', 10);

    for (const stylist of stylists) {
      if (!stylist.password) {
        console.log(`Updating password for stylist: ${stylist.email}`);
        await connection.query(
          'UPDATE stylists SET password = ? WHERE id = ?',
          [hashedPassword, stylist.id]
        );
      }
    }

    console.log('✓ All stylists now have passwords set to: stylist123');

    // Show all stylists
    const [updatedStylists] = await connection.query('SELECT id, email, password FROM stylists');
    console.log('\nStylists in database:');
    updatedStylists.forEach(s => {
      console.log(`  - ${s.email} (password set: ${s.password ? 'YES' : 'NO'})`);
    });

    await connection.end();
    console.log('\n✓ Database fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

fixStylistPasswords();
