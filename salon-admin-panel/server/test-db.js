const mysql = require('mysql2/promise');

async function testDB() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'salon_admin',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    // Check if salon_info table exists
    const [rows] = await pool.query('SHOW TABLES LIKE "salon_info"');
    console.log('salon_info table exists:', rows.length > 0);
    
    if (rows.length > 0) {
      // Check table structure
      const [columns] = await pool.query('DESCRIBE salon_info');
      console.log('Table columns:', columns.map(c => c.Field));
      
      // Check data
      const [data] = await pool.query('SELECT * FROM salon_info WHERE id = 1');
      console.log('Data:', JSON.stringify(data, null, 2));
    }
    
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDB();
