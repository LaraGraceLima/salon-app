const mysql = require('mysql2/promise');

async function setupStylistImages() {
  try {
    console.log('🔧 Setting up stylist image support...\n');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'salon_admin'
    });

    // Check current columns
    console.log('1. Checking current stylists table structure...');
    const [columns] = await connection.query('DESCRIBE stylists');
    console.log('Current columns:', columns.map(c => c.Field).join(', '));

    // Check if other fields exist and add them in order
    console.log('\n2. Adding required fields in order...');
    
    // Add years_of_experience
    if (!columns.some(col => col.Field === 'years_of_experience')) {
      console.log('   Adding years_of_experience...');
      await connection.query('ALTER TABLE stylists ADD COLUMN years_of_experience INT DEFAULT 0 AFTER specialization');
      console.log('   ✅ years_of_experience added');
    } else {
      console.log('   ✅ years_of_experience exists');
    }

    // Add bio
    if (!columns.some(col => col.Field === 'bio')) {
      console.log('   Adding bio...');
      await connection.query('ALTER TABLE stylists ADD COLUMN bio TEXT DEFAULT NULL AFTER years_of_experience');
      console.log('   ✅ bio added');
    } else {
      console.log('   ✅ bio exists');
    }

    // Add profile_image
    if (!columns.some(col => col.Field === 'profile_image')) {
      console.log('   Adding profile_image...');
      await connection.query('ALTER TABLE stylists ADD COLUMN profile_image MEDIUMTEXT DEFAULT NULL AFTER bio');
      console.log('   ✅ profile_image added (MEDIUMTEXT - supports up to 16MB)');
    } else {
      console.log('   ✅ profile_image exists');
      const imageCol = columns.find(col => col.Field === 'profile_image');
      if (imageCol && imageCol.Type !== 'mediumtext') {
        console.log('   Updating to MEDIUMTEXT...');
        await connection.query('ALTER TABLE stylists MODIFY COLUMN profile_image MEDIUMTEXT DEFAULT NULL');
        console.log('   ✅ Column type updated to MEDIUMTEXT');
      }
    }

    // Add achievements
    if (!columns.some(col => col.Field === 'achievements')) {
      console.log('   Adding achievements...');
      await connection.query('ALTER TABLE stylists ADD COLUMN achievements TEXT DEFAULT NULL AFTER profile_image');
      console.log('   ✅ achievements added');
    } else {
      console.log('   ✅ achievements exists');
    }

    // Add rating
    if (!columns.some(col => col.Field === 'rating')) {
      console.log('   Adding rating...');
      await connection.query('ALTER TABLE stylists ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00 AFTER achievements');
      console.log('   ✅ rating added');
    } else {
      console.log('   ✅ rating exists');
    }

    // Add total_bookings
    if (!columns.some(col => col.Field === 'total_bookings')) {
      console.log('   Adding total_bookings...');
      await connection.query('ALTER TABLE stylists ADD COLUMN total_bookings INT DEFAULT 0 AFTER rating');
      console.log('   ✅ total_bookings added');
    } else {
      console.log('   ✅ total_bookings exists');
    }

    // Verify final structure
    console.log('\n3. Final table structure:');
    const [finalColumns] = await connection.query('DESCRIBE stylists');
    finalColumns.forEach(col => {
      console.log(`   ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    await connection.end();
    
    console.log('\n✅ Setup complete! Stylists table is ready for image uploads.');
    console.log('\n📝 Notes:');
    console.log('   - profile_image column can store base64 images up to 16MB');
    console.log('   - All required fields are in place');
    console.log('   - You can now upload images from the admin panel');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupStylistImages();
