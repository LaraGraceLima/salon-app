const mysql = require('mysql2/promise');

async function updateImageColumn() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'salon_admin'
    });

    console.log('Checking current column type...');
    const [columns] = await connection.query('DESCRIBE stylists');
    const imageColumn = columns.find(col => col.Field === 'profile_image');
    console.log('Current profile_image column:', imageColumn);

    console.log('\nUpdating column to MEDIUMTEXT...');
    await connection.query('ALTER TABLE stylists MODIFY COLUMN profile_image MEDIUMTEXT DEFAULT NULL');
    
    console.log('Verifying update...');
    const [newColumns] = await connection.query('DESCRIBE stylists');
    const newImageColumn = newColumns.find(col => col.Field === 'profile_image');
    console.log('Updated profile_image column:', newImageColumn);

    await connection.end();
    console.log('\n✅ Column updated successfully!');
    console.log('MEDIUMTEXT can store up to 16MB of data (perfect for base64 images)');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateImageColumn();
