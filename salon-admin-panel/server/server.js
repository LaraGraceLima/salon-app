const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Email transporter (configure via .env) ──
const mailer = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

async function sendBookingEmail(toEmail, clientName, status, booking) {
  if (!toEmail) {
    console.warn(`Email skipped: missing recipient for status "${status}"`);
    return { sent: false, reason: 'missing_recipient' };
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(`Email skipped: EMAIL_USER/EMAIL_PASS not configured for status "${status}"`);
    return { sent: false, reason: 'email_not_configured' };
  }

  const dt = new Date(booking.dateTime);
  const dateStr = dt.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  const subjects = {
    confirmed:  `✅ Booking Confirmed — ${booking.serviceName}`,
    completed:  `🎉 Thank You! Your Appointment is Complete`,
    cancelled:  `❌ Booking Cancelled — ${booking.serviceName}`,
  };

  const bodies = {
    confirmed: `
      <p>Hi <strong>${clientName}</strong>,</p>
      <p>Your booking has been <strong style="color:#1D4ED8">confirmed</strong>! Here are your details:</p>
      <table style="border-collapse:collapse;width:100%;max-width:480px">
        <tr><td style="padding:8px;color:#6B7280">Service</td><td style="padding:8px;font-weight:700">${booking.serviceName}</td></tr>
        <tr style="background:#F9FAFB"><td style="padding:8px;color:#6B7280">Stylist</td><td style="padding:8px;font-weight:700">${booking.stylistName}</td></tr>
        <tr><td style="padding:8px;color:#6B7280">Date</td><td style="padding:8px;font-weight:700">${dateStr}</td></tr>
        <tr style="background:#F9FAFB"><td style="padding:8px;color:#6B7280">Time</td><td style="padding:8px;font-weight:700">${timeStr}</td></tr>
        <tr><td style="padding:8px;color:#6B7280">Price</td><td style="padding:8px;font-weight:700">₱${Number(booking.price).toLocaleString()}</td></tr>
      </table>
      <br/>
      <div style="background:#EDE9FE;border-left:4px solid #7C3AED;padding:14px 18px;border-radius:8px;margin-top:16px">
        <p style="margin:0;font-weight:700;color:#5B21B6">📍 Please arrive at the salon before your scheduled time.</p>
        <p style="margin:8px 0 0;color:#374151">Being on time ensures you get the full service experience. If you arrive late, your stylist may already be serving another client and your slot could be reassigned.</p>
      </div>
      <p style="margin-top:20px;color:#6B7280">See you soon! 💜<br/><strong>Salon Suite Team</strong></p>
    `,
    completed: `
      <p>Hi <strong>${clientName}</strong>,</p>
      <p>Thank you for visiting <strong>Salon Suite</strong>! We hope you loved your <strong>${booking.serviceName}</strong> with <strong>${booking.stylistName}</strong>.</p>
      <p>We'd love to hear your feedback — open the app and rate your experience!</p>
      <p style="margin-top:20px;color:#6B7280">See you again soon! 💜<br/><strong>Salon Suite Team</strong></p>
    `,
    cancelled: `
      <p>Hi <strong>${clientName}</strong>,</p>
      <p>Your booking for <strong>${booking.serviceName}</strong> on <strong>${dateStr} at ${timeStr}</strong> has been <strong style="color:#DC2626">cancelled</strong>.</p>
      <p>If you have questions, please contact us. We hope to see you again soon!</p>
      <p style="margin-top:20px;color:#6B7280">Warm regards,<br/><strong>Salon Suite Team</strong></p>
    `,
  };

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#3B0764,#5B21B6,#7C3AED);padding:28px 32px">
        <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:-0.5px">✂️ Salon Suite</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Your premier beauty destination</p>
      </div>
      <div style="padding:28px 32px">
        ${bodies[status] || ''}
      </div>
      <div style="background:#F9FAFB;padding:16px 32px;text-align:center;font-size:12px;color:#9CA3AF">
        123 Salon Street, Quezon City · hello@salonsuite.com · +63 912 345 6789
      </div>
    </div>
  `;

  try {
    await mailer.sendMail({
      from: `"Salon Suite" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subjects[status] || 'Booking Update',
      html,
    });
    console.log(`Email sent to ${toEmail} for status: ${status}`);
    return { sent: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { sent: false, reason: err.message };
  }
}

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'salon_admin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-this';

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('verifyToken middleware - Token present:', !!token);
  if (!token) {
    console.log('verifyToken middleware - No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('verifyToken middleware - Token verified for user ID:', decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('verifyToken middleware - Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ============ USER ROUTES ============

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: '192.168.12.156:3001'
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working',
    timestamp: new Date().toISOString()
  });
});

// User Signup
app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const connection = await pool.getConnection();

    // Check if user already exists
    const [existingUser] = await connection.query('SELECT * FROM clients WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await connection.query(
      'INSERT INTO clients (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword]
    );

    connection.release();
    console.log('User signup successful:', email);
    res.json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// User Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`User login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.query('SELECT * FROM clients WHERE email = ?', [email]);
    connection.release();

    if (rows.length === 0) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '24h',
    });

    console.log(`User logged in successfully: ${email}`);
    res.json({
      token,
      name: user.name,
      email: user.email,
      id: user.id,
      phone: user.phone || '',
      profile_image_url: user.profile_image_url || null,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const client_id = req.user.id;
    const connection = await pool.getConnection();
    try {
      await connection.query('ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_image_url LONGTEXT DEFAULT NULL');
    } catch (migrationErr) {
      console.log('clients.profile_image_url migration skipped:', migrationErr.message);
    }

    const [rows] = await connection.query(
      'SELECT id, name, email, phone, profile_image_url FROM clients WHERE id = ? LIMIT 1',
      [client_id]
    );
    connection.release();

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile basic info
app.put('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const client_id = req.user.id;
    const { name, email, phone } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name || '', email || '', phone || '', client_id]
    );
    connection.release();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile image
app.put('/api/users/profile-image', verifyToken, async (req, res) => {
  try {
    const client_id = req.user.id;
    const { profile_image_url } = req.body;
    const connection = await pool.getConnection();
    try {
      await connection.query('ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_image_url LONGTEXT DEFAULT NULL');
    } catch (migrationErr) {
      console.log('clients.profile_image_url migration skipped:', migrationErr.message);
    }

    await connection.query(
      'UPDATE clients SET profile_image_url = ? WHERE id = ?',
      [profile_image_url || null, client_id]
    );
    connection.release();

    res.json({ message: 'Profile image updated successfully' });
  } catch (error) {
    console.error('Error updating user profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ STYLIST ROUTES ============

// Stylist Login
app.post('/api/stylists/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Stylist login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.query('SELECT * FROM stylists WHERE email = ?', [email]);
    connection.release();

    if (rows.length === 0) {
      console.log(`Stylist not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const stylist = rows[0];
    const isPasswordValid = await bcrypt.compare(password, stylist.password);

    if (!isPasswordValid) {
      console.log(`Invalid password for stylist: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: stylist.id, email: stylist.email }, JWT_SECRET, {
      expiresIn: '24h',
    });

    console.log(`Stylist logged in successfully: ${email}`);
    res.json({
      token,
      name: stylist.name,
      email: stylist.email,
      id: stylist.id,
    });
  } catch (error) {
    console.error('Stylist login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ADMIN ROUTES ============

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    const [rows] = await connection.query('SELECT * FROM admins WHERE email = ?', [email]);
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      name: admin.name,
      email: admin.email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ADMIN SETTINGS ROUTES ============

// Change admin password
app.put('/api/admin/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    const connection = await pool.getConnection();
    // Use first admin (single-admin setup)
    const [rows] = await connection.query('SELECT id, password FROM admins LIMIT 1');
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Admin account not found.' });
    }
    const admin = rows[0];
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) {
      connection.release();
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await connection.query('UPDATE admins SET password = ? WHERE id = ?', [hashed, admin.id]);
    connection.release();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get salon settings
app.get('/api/admin/settings', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Ensure table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salon_settings (
        id INT PRIMARY KEY DEFAULT 1,
        settings_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await connection.query('SELECT settings_json FROM salon_settings WHERE id = 1');
    connection.release();
    if (rows.length === 0) return res.json(null);
    res.json(JSON.parse(rows[0].settings_json));
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save salon settings
app.put('/api/admin/settings', async (req, res) => {
  try {
    const settings = req.body;
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salon_settings (
        id INT PRIMARY KEY DEFAULT 1,
        settings_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await connection.query(
      'INSERT INTO salon_settings (id, settings_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE settings_json = ?, updated_at = NOW()',
      [JSON.stringify(settings), JSON.stringify(settings)]
    );
    connection.release();
    res.json({ message: 'Settings saved successfully.' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ SALON INFO ROUTES ============

// Get salon info (public endpoint for user app)
app.get('/api/salon-info', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Ensure table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salon_info (
        id INT PRIMARY KEY DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        about_us TEXT,
        salon_images JSON,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(100),
        currency VARCHAR(10),
        timezone VARCHAR(50),
        business_hours JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await connection.query('SELECT * FROM salon_info WHERE id = 1');
    connection.release();
    if (rows.length === 0) {
      // Return default values if no data
      return res.json({
        id: 1,
        name: 'JKD SALON',
        tagline: 'Your premier beauty destination ✨',
        address: '123 Salon St, Brgy. Elegance, Quezon City, Metro Manila',
        phone: '+63 912 345 6789',
        email: 'hello@salonsuite.com',
        salon_images: [],
        currency: 'PHP',
        timezone: 'Asia/Manila',
        business_hours: null,
        about_us: 'Welcome to BeautyBoss Salon, where elegance meets expertise. We are passionate about helping you look and feel your best through top-tier salon services and personalized care.'
      });
    }
    const salonInfo = rows[0];
    if (typeof salonInfo.business_hours === 'string') {
      try {
        salonInfo.business_hours = JSON.parse(salonInfo.business_hours);
      } catch {
        salonInfo.business_hours = null;
      }
    }
    if (typeof salonInfo.salon_images === 'string') {
      try {
        salonInfo.salon_images = JSON.parse(salonInfo.salon_images);
      } catch {
        salonInfo.salon_images = [];
      }
    }
    res.json(salonInfo);
  } catch (error) {
    console.error('Get salon info error:', error);
    // Return default values if table doesn't exist
    res.json({
      id: 1,
      name: 'JKD SALON',
      tagline: 'Your premier beauty destination ✨',
      address: '123 Salon St, Brgy. Elegance, Quezon City, Metro Manila',
      phone: '+63 912 345 6789',
      email: 'hello@salonsuite.com',
      salon_images: [],
      currency: 'PHP',
      timezone: 'Asia/Manila',
      business_hours: null,
      about_us: 'Welcome to BeautyBoss Salon, where elegance meets expertise. We are passionate about helping you look and feel your best through top-tier salon services and personalized care.'
    });
  }
});

// Update salon info (admin only)
app.put('/api/admin/salon-info', verifyToken, async (req, res) => {
  try {
    const { name, tagline, about_us, salon_images, address, phone, email, currency, timezone, business_hours } = req.body;
    const connection = await pool.getConnection();
    
    // Ensure table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salon_info (
        id INT PRIMARY KEY DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        about_us TEXT,
        salon_images JSON,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(100),
        currency VARCHAR(10),
        timezone VARCHAR(50),
        business_hours JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await connection.query(
      'INSERT INTO salon_info (id, name, tagline, about_us, salon_images, address, phone, email, currency, timezone, business_hours) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, tagline = ?, about_us = ?, salon_images = ?, address = ?, phone = ?, email = ?, currency = ?, timezone = ?, business_hours = ?, updated_at = NOW()',
      [name, tagline, about_us || null, Array.isArray(salon_images) ? JSON.stringify(salon_images) : null, address, phone, email, currency, timezone, business_hours ? JSON.stringify(business_hours) : null, name, tagline, about_us || null, Array.isArray(salon_images) ? JSON.stringify(salon_images) : null, address, phone, email, currency, timezone, business_hours ? JSON.stringify(business_hours) : null]
    );
    connection.release();
    
    // Broadcast update to all connected clients
    broadcast({ type: 'salon_info_updated' });
    
    res.json({ message: 'Salon info updated successfully.' });
  } catch (error) {
    console.error('Update salon info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ CLIENTS ROUTES ============

// Get all clients
app.get('/api/clients', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM clients');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add client
app.post('/api/clients', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email and phone are required.' });
    }
    const connection = await pool.getConnection();
    await connection.query('INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)', [name, email, phone]);
    connection.release();
    broadcast({ type: 'client_added', data: { name, email, phone } });
    res.json({ message: 'Client added successfully' });
  } catch (error) {
    console.error('Error adding client:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A client with this email already exists.' });
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update client
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email and phone are required.' });
    }
    const connection = await pool.getConnection();
    await connection.query('UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, id]);
    connection.release();
    broadcast({ type: 'client_updated', data: { id, name, email, phone } });
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A client with this email already exists.' });
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Delete client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    await connection.query('DELETE FROM clients WHERE id = ?', [id]);

    connection.release();
    broadcast({ type: 'client_deleted', data: { id } });
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ STYLISTS ROUTES ============

// Get all stylists
app.get('/api/stylists', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT s.*,
        ROUND(COALESCE(AVG(r.rating), 0), 2) AS rating,
        COUNT(DISTINCT r.id)                  AS total_ratings,
        COUNT(DISTINCT b.id)                  AS total_bookings
      FROM stylists s
      LEFT JOIN ratings  r ON r.stylist_id = s.id
      LEFT JOIN bookings b ON b.stylist_id = s.id
      GROUP BY s.id
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stylists:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add stylist
app.post('/api/stylists', async (req, res) => {
  try {
    const { name, email, phone, specialization, status, password, years_of_experience, bio, profile_image, achievements } = req.body;
    const connection = await pool.getConnection();

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await connection.query(
      'INSERT INTO stylists (name, email, phone, specialization, status, password, years_of_experience, bio, profile_image, achievements) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, specialization, status, hashedPassword, years_of_experience || 0, bio || null, profile_image || null, achievements || null]
    );

    connection.release();
    broadcast({ type: 'stylist_added', data: { name, email, phone, specialization, status } });
    res.json({ message: 'Stylist added successfully' });
  } catch (error) {
    console.error('Error adding stylist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stylist
app.put('/api/stylists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, specialization, status, password, years_of_experience, bio, profile_image, achievements } = req.body;
    const connection = await pool.getConnection();

    // If password is provided, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.query(
        'UPDATE stylists SET name = ?, email = ?, phone = ?, specialization = ?, status = ?, password = ?, years_of_experience = ?, bio = ?, profile_image = ?, achievements = ? WHERE id = ?',
        [name, email, phone, specialization, status, hashedPassword, years_of_experience || 0, bio || null, profile_image || null, achievements || null, id]
      );
    } else {
      // Update without changing password
      await connection.query(
        'UPDATE stylists SET name = ?, email = ?, phone = ?, specialization = ?, status = ?, years_of_experience = ?, bio = ?, profile_image = ?, achievements = ? WHERE id = ?',
        [name, email, phone, specialization, status, years_of_experience || 0, bio || null, profile_image || null, achievements || null, id]
      );
    }

    connection.release();
    broadcast({
      type: 'stylist_updated',
      data: { id, name, email, phone, specialization, status },
    });
    res.json({ message: 'Stylist updated successfully' });
  } catch (error) {
    console.error('Error updating stylist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stylists by service (filtered by service name/specialization)
app.get('/api/stylists/by-service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const connection = await pool.getConnection();

    // First get the service details
    const [serviceRows] = await connection.query('SELECT * FROM services WHERE id = ?', [serviceId]);
    
    if (serviceRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Service not found' });
    }

    const service = serviceRows[0];
    
    // Filter stylists based on service name matching specialization
    // This is a simple matching - you can make it more sophisticated
    const [stylistRows] = await connection.query(`
      SELECT * FROM stylists 
      WHERE status = 'active' 
      AND (
        specialization LIKE ? OR 
        specialization LIKE ? OR
        specialization LIKE ?
      )
    `, [
      `%${service.name}%`,
      `%${service.name.replace('Hair ', '')}%`,
      `%${service.name.replace(' ', '%')}%`
    ]);

    connection.release();
    
    console.log(`Found ${stylistRows.length} stylists for service: ${service.name}`);
    res.json(stylistRows);
  } catch (error) {
    console.error('Error fetching stylists by service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get services that a specific stylist provides (based on specialization matching)
app.get('/api/stylists/:stylistId/services', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const connection = await pool.getConnection();

    // Get the stylist's specialization
    const [stylistRows] = await connection.query('SELECT * FROM stylists WHERE id = ?', [stylistId]);
    
    if (stylistRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Stylist not found' });
    }

    const stylist = stylistRows[0];
    
    // Get services that match the stylist's specialization
    const [serviceRows] = await connection.query(`
      SELECT * FROM services 
      WHERE 
        name LIKE ? OR 
        name LIKE ? OR
        description LIKE ?
    `, [
      `%${stylist.specialization}%`,
      `%${stylist.specialization.replace('Hair ', '')}%`,
      `%${stylist.specialization}%`
    ]);

    // If no specific matches, return all services (fallback)
    if (serviceRows.length === 0) {
      const [allServices] = await connection.query('SELECT * FROM services');
      connection.release();
      console.log(`No specific services found for ${stylist.name}, returning all services`);
      return res.json(allServices);
    }

    connection.release();
    console.log(`Found ${serviceRows.length} services for stylist ${stylist.name} (${stylist.specialization})`);
    res.json(serviceRows);
  } catch (error) {
    console.error('Error fetching stylist services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete stylist
app.delete('/api/stylists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    await connection.query('DELETE FROM stylists WHERE id = ?', [id]);

    connection.release();
    broadcast({ type: 'stylist_deleted', data: { id } });
    res.json({ message: 'Stylist deleted successfully' });
  } catch (error) {
    console.error('Error deleting stylist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ SERVICES ROUTES ============

// Get all services (with assigned stylists count)
app.get('/api/services', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT s.*,
        COUNT(DISTINCT b.stylist_id) AS assigned_stylists,
        COUNT(DISTINCT b.id) AS total_bookings
      FROM services s
      LEFT JOIN bookings b ON s.id = b.service_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add service
app.post('/api/services', async (req, res) => {
  try {
    const { name, description, price, duration, service_image_url } = req.body;
    if (!name || !price || !duration) {
      return res.status(400).json({ message: 'Name, price and duration are required' });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO services (name, description, price, duration, service_image_url) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, price, duration, service_image_url || null]
    );
    connection.release();
    broadcast({ type: 'service_added', data: { id: result.insertId, name, price, duration } });
    res.json({ message: 'Service added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update service
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, service_image_url } = req.body;
    if (!name || !price || !duration) {
      return res.status(400).json({ message: 'Name, price and duration are required' });
    }
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE services SET name = ?, description = ?, price = ?, duration = ?, service_image_url = ? WHERE id = ?',
      [name, description || null, price, duration, service_image_url || null, id]
    );
    connection.release();
    broadcast({ type: 'service_updated', data: { id, name, price, duration } });
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Delete service
app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM services WHERE id = ?', [id]);
    connection.release();
    broadcast({ type: 'service_deleted', data: { id } });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ============ BOOKINGS ROUTES ============

// Create booking
app.post('/api/bookings', verifyToken, async (req, res) => {
  try {
    const { stylist_id, service_id, date_time, notes, reference_image, special_request, reference_images, promo_id, promo_discount_percentage } = req.body;
    const client_id = req.user.id;

    if (!stylist_id || !service_id || !date_time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    // Backward-compatible migration for promo-aware booking pricing
    try {
      await connection.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_id INT NULL');
      await connection.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_discount_percentage DECIMAL(5,2) NULL');
      await connection.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) NULL');
      await connection.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2) NULL');
    } catch (migrationErr) {
      console.log('Promo booking columns migration skipped:', migrationErr.message);
    }

    // Check if stylist is available at that time (exclude same client's own bookings)
    const [existingBookings] = await connection.query(
      'SELECT * FROM bookings WHERE stylist_id = ? AND date_time = ? AND status != ? AND client_id != ?',
      [stylist_id, date_time, 'cancelled', client_id]
    );

    if (existingBookings.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Stylist is not available at this time' });
    }

    // Get service base price to persist pricing snapshot
    const [serviceRows] = await connection.query('SELECT price FROM services WHERE id = ? LIMIT 1', [service_id]);
    const servicePrice = Number(serviceRows?.[0]?.price || 0);
    const discountPct = Number(promo_discount_percentage || 0);
    const validDiscountPct = Number.isFinite(discountPct) && discountPct > 0 ? discountPct : 0;
    const discountedPrice = Math.max(0, servicePrice - (servicePrice * validDiscountPct / 100));

    // Create booking
    const [result] = await connection.query(
      `INSERT INTO bookings
      (client_id, stylist_id, service_id, date_time, notes, reference_image, special_request, reference_images, status, promo_id, promo_discount_percentage, original_price, discounted_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_id, stylist_id, service_id, date_time, notes || '', reference_image || null, special_request || null, reference_images ? JSON.stringify(reference_images) : null, 'pending', promo_id || null, validDiscountPct || null, servicePrice || null, discountedPrice || null]
    );

    const bookingId = result.insertId;

    connection.release();
    broadcast({ type: 'booking_created', data: { id: bookingId, client_id, stylist_id, service_id, date_time } });
    res.json({ 
      message: 'Booking created successfully',
      bookingId: bookingId,
      id: bookingId,
      originalPrice: servicePrice,
      discountedPrice
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT b.*, c.name as clientName, s.name as stylistName, sv.name as serviceName, sv.price, sv.description as serviceDescription, sv.service_image_url
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN stylists s ON b.stylist_id = s.id
      JOIN services sv ON b.service_id = sv.id
      ORDER BY b.id DESC
    `);
    connection.release();

    const formattedRows = rows.map((row) => ({
      id: row.id,
      clientName: row.clientName,
      stylistName: row.stylistName,
      serviceName: row.serviceName,
      serviceDescription: row.serviceDescription,
      serviceImage: row.service_image_url,
      dateTime: row.date_time,
      status: row.status,
      price: row.price,
      originalPrice: row.original_price != null ? Number(row.original_price) : Number(row.price),
      discountedPrice: row.discounted_price != null ? Number(row.discounted_price) : Number(row.price),
      promoDiscountPercentage: row.promo_discount_percentage != null ? Number(row.promo_discount_percentage) : 0,
      notes: row.notes,
      specialRequest: row.special_request || null,
      referenceImage: row.reference_image,
      referenceImages: row.reference_images ? JSON.parse(row.reference_images) : [],
      cancellationReason: row.cancellation_reason || null,
      cancelledBy: row.cancelled_by || null,
      cancelledAt: row.cancelled_at || null,
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookings
app.get('/api/users/bookings', verifyToken, async (req, res) => {
  try {
    const client_id = req.user.id;
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT b.*, s.name as stylistName, sv.name as serviceName, sv.price
      FROM bookings b
      JOIN stylists s ON b.stylist_id = s.id
      JOIN services sv ON b.service_id = sv.id
      WHERE b.client_id = ?
      ORDER BY b.id DESC
    `, [client_id]);

    connection.release();

    const formattedRows = rows.map((row) => ({
      id: row.id,
      stylistName: row.stylistName,
      stylistId: row.stylist_id,
      serviceName: row.serviceName,
      serviceId: row.service_id,
      dateTime: row.date_time,
      status: row.status,
      price: row.price,
      originalPrice: row.original_price != null ? Number(row.original_price) : Number(row.price),
      discountedPrice: row.discounted_price != null ? Number(row.discounted_price) : Number(row.price),
      promoDiscountPercentage: row.promo_discount_percentage != null ? Number(row.promo_discount_percentage) : 0,
      notes: row.notes,
      createdAt: row.created_at,
      confirmedAt: row.confirmed_at || null,
      rescheduleCount: Number.isFinite(Number(row.reschedule_count)) ? Number(row.reschedule_count) : 0,
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stylist's bookings
app.get('/api/stylists/bookings', verifyToken, async (req, res) => {
  try {
    const stylist_id = req.user.id;
    console.log('Fetching bookings for stylist ID:', stylist_id);
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT b.*, c.name as clientName, sv.name as serviceName, sv.price,
             b.cancelled_at, b.cancelled_by, b.cancellation_reason
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN services sv ON b.service_id = sv.id
      WHERE b.stylist_id = ?
      ORDER BY b.date_time DESC
    `, [stylist_id]);

    connection.release();

    console.log('Found', rows.length, 'bookings for stylist', stylist_id);

    const formattedRows = rows.map((row) => ({
      id: row.id,
      clientName: row.clientName,
      serviceName: row.serviceName,
      dateTime: row.date_time,
      status: row.status,
      price: row.price,
      notes: row.notes,
      specialRequest: row.special_request,
      referenceImages: (() => {
        try { return row.reference_images ? JSON.parse(row.reference_images) : []; }
        catch { return []; }
      })(),
      cancelled_at: row.cancelled_at,
      cancelled_by: row.cancelled_by,
      cancellation_reason: row.cancellation_reason,
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching stylist bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent bookings
app.get('/api/bookings/recent', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT b.*, c.name as clientName, s.name as stylistName, sv.name as serviceName
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN stylists s ON b.stylist_id = s.id
      JOIN services sv ON b.service_id = sv.id
      ORDER BY b.date_time DESC
      LIMIT 5
    `);
    connection.release();

    const formattedRows = rows.map((row) => ({
      id: row.id,
      clientName: row.clientName,
      stylistName: row.stylistName,
      serviceName: row.serviceName,
      date: row.date_time,
      status: row.status,
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const connection = await pool.getConnection();

    if (status === 'confirmed') {
      await connection.query('UPDATE bookings SET status = ?, confirmed_at = NOW() WHERE id = ?', [status, id]);
    } else {
      await connection.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    }

    // Fetch booking + client email to send notification
    let bookingData = null;
    let emailResult = null;
    if (['confirmed', 'completed', 'cancelled'].includes(status)) {
      const [rows] = await connection.query(`
        SELECT b.*, c.name as clientName, c.email as clientEmail, c.id as clientId,
               s.name as stylistName, sv.name as serviceName, sv.price
        FROM bookings b
        JOIN clients c ON b.client_id = c.id
        JOIN stylists s ON b.stylist_id = s.id
        JOIN services sv ON b.service_id = sv.id
        WHERE b.id = ?
      `, [id]);
      if (rows.length > 0) {
        bookingData = rows[0];
        emailResult = await sendBookingEmail(bookingData.clientEmail, bookingData.clientName, status, {
          serviceName: bookingData.serviceName,
          stylistName: bookingData.stylistName,
          dateTime: bookingData.date_time,
          price: bookingData.price,
        });
        if (!emailResult?.sent) {
          console.warn(`Booking ${id} status "${status}" updated but email not sent: ${emailResult?.reason || 'unknown'}`);
        }
      }
    }

    connection.release();
    broadcast({ type: 'booking_updated', data: { id, status } });

    // Broadcast status notification to the specific client
    if (bookingData && ['confirmed', 'completed', 'cancelled'].includes(status)) {
      const clientId = bookingData.clientId || bookingData.client_id;
      console.log(`Broadcasting ${status} notify to clientId:`, clientId, '| service:', bookingData.serviceName);
      broadcast({
        type: 'booking_confirmed_notify',
        data: {
          clientId,
          bookingId: id,
          serviceName: bookingData.serviceName,
          stylistName: bookingData.stylistName,
          dateTime: bookingData.date_time,
          status,
        }
      });
      
      // Save notification to database
      const dt = new Date(bookingData.date_time);
      const dateStr = dt.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      
      let title = '';
      let message = '';
      let type = '';
      
      if (status === 'confirmed') {
        title = 'Booking Confirmed';
        message = `Your ${bookingData.serviceName} with ${bookingData.stylistName} on ${dateStr} at ${timeStr} is confirmed.`;
        type = 'confirmed';
      } else if (status === 'completed') {
        title = 'Appointment Complete';
        message = `Your ${bookingData.serviceName} appointment with ${bookingData.stylistName} is complete.`;
        type = 'completed';
      } else if (status === 'cancelled') {
        title = 'Booking Cancelled';
        message = `Your ${bookingData.serviceName} booking has been cancelled.`;
        type = 'cancelled';
      }
      
      await createNotification(clientId, title, message, type, id);
    }

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check for booking conflicts
app.get('/api/bookings/check-conflict', async (req, res) => {
  try {
    const { date, time, stylistId, excludeBookingId } = req.query;
    
    if (!date || !time || !stylistId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    const connection = await pool.getConnection();
    const selectedDateTime = `${date}T${time}:00`;
    
    // Check if stylist has any booking at this time (excluding current booking if editing)
    let query = `
      SELECT * FROM bookings 
      WHERE stylist_id = ? 
      AND date_time = ? 
      AND status != 'cancelled'
    `;
    const params = [stylistId, selectedDateTime];
    
    if (excludeBookingId) {
      query += ' AND id != ?';
      params.push(excludeBookingId);
    }
    
    const [conflictingBookings] = await connection.query(query, params);
    connection.release();
    
    res.json({ 
      conflict: conflictingBookings.length > 0,
      conflicts: conflictingBookings
    });
  } catch (error) {
    console.error('Error checking conflict:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reschedule booking
app.put('/api/bookings/:id/reschedule', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_date_time, new_stylist_id, new_service_id, reason } = req.body;
    const client_id = req.user.id;
    
    const connection = await pool.getConnection();
    
    // Get original booking
    const [bookingRows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );
    
    if (bookingRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const originalBooking = bookingRows[0];
    const currentRescheduleCount = Number.isFinite(Number(originalBooking.reschedule_count))
      ? Number(originalBooking.reschedule_count)
      : 0;
    const MAX_RESCHEDULES = 2;

    if (currentRescheduleCount >= MAX_RESCHEDULES) {
      connection.release();
      return res.status(400).json({ message: `You can only reschedule this appointment up to ${MAX_RESCHEDULES} times.` });
    }
    
    // Check if stylist is available at new time (exclude this booking)
    if (new_stylist_id && new_stylist_id !== originalBooking.stylist_id) {
      const [existingBookings] = await connection.query(
        'SELECT * FROM bookings WHERE stylist_id = ? AND date_time = ? AND id != ? AND status != ?',
        [new_stylist_id, new_date_time, id, 'cancelled']
      );
      
      if (existingBookings.length > 0) {
        connection.release();
        return res.status(400).json({ message: 'Stylist is not available at the new time' });
      }
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (new_date_time && new_date_time !== originalBooking.date_time) {
      updateFields.push('date_time = ?');
      updateValues.push(new_date_time);
    }
    
    if (new_stylist_id && new_stylist_id !== originalBooking.stylist_id) {
      updateFields.push('stylist_id = ?');
      updateValues.push(new_stylist_id);
    }
    
    if (new_service_id && new_service_id !== originalBooking.service_id) {
      updateFields.push('service_id = ?');
      updateValues.push(new_service_id);
    }

    if ('reschedule_count' in originalBooking) {
      updateFields.push('reschedule_count = COALESCE(reschedule_count, 0) + 1');
    }
    
    // Add reschedule tracking if columns exist
    try {
      updateFields.push('rescheduled_at = NOW()');
      updateFields.push('rescheduled_by = ?');
      updateValues.push('client');
    } catch (e) {
      // Columns might not exist, continue without them
    }
    
    updateValues.push(id);
    
    const updateQuery = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
    await connection.query(updateQuery, updateValues);
    
    // Get the values to use for history and broadcast
    const oldStylistId = new_stylist_id || originalBooking.stylist_id;
    const oldServiceId = new_service_id || originalBooking.service_id;
    const oldDateTime = new_date_time || originalBooking.date_time;
    
    connection.release();
    
    // Broadcast reschedule notification to admin and stylist
    broadcast({
      type: 'booking_rescheduled',
      data: {
        bookingId: id,
        oldDateTime,
        newDateTime: new_date_time,
        oldStylistId,
        newStylistId: new_stylist_id,
        oldServiceId,
        newServiceId: new_service_id,
        rescheduledBy: 'client',
        reason: reason || 'Rescheduled by client'
      }
    });
    
    res.json({ 
      message: 'Booking rescheduled successfully',
      bookingId: id
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ============ DASHBOARD ROUTES ============

// Get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [clientsCount] = await connection.query('SELECT COUNT(*) as count FROM clients');
    const [stylistsCount] = await connection.query('SELECT COUNT(*) as count FROM stylists');
    const [servicesCount] = await connection.query('SELECT COUNT(*) as count FROM services');
    const [bookingsCount] = await connection.query('SELECT COUNT(*) as count FROM bookings');

    connection.release();

    res.json({
      totalClients: clientsCount[0].count,
      totalStylists: stylistsCount[0].count,
      totalServices: servicesCount[0].count,
      totalBookings: bookingsCount[0].count,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue analytics
app.get('/api/dashboard/revenue', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Total revenue from completed bookings
    const [bookingRevenue] = await connection.query(`
      SELECT COALESCE(SUM(s.price), 0) as total
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.status = 'completed'
    `);

    // Total adjustments (add - subtract)
    const [adjustments] = await connection.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE 0 END), 0) as adds,
        COALESCE(SUM(CASE WHEN type = 'subtract' THEN amount ELSE 0 END), 0) as subtracts
      FROM revenue_adjustments
    `);

    const totalAdjustments = Number(adjustments[0].adds) - Number(adjustments[0].subtracts);
    const totalRevenue = Number(bookingRevenue[0].total) + totalAdjustments;

    // This month revenue
    const [thisMonthRevenue] = await connection.query(`
      SELECT COALESCE(SUM(s.price), 0) as total
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.status = 'completed'
        AND MONTH(b.date_time) = MONTH(NOW())
        AND YEAR(b.date_time) = YEAR(NOW())
    `);

    // Last month revenue
    const [lastMonthRevenue] = await connection.query(`
      SELECT COALESCE(SUM(s.price), 0) as total
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.status = 'completed'
        AND MONTH(b.date_time) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
        AND YEAR(b.date_time) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `);

    // POS breakdown: revenue by status
    const [posBreakdown] = await connection.query(`
      SELECT 
        b.status,
        COUNT(b.id) as count,
        COALESCE(SUM(s.price), 0) as total
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      GROUP BY b.status
    `);

    // Monthly revenue for the last 6 months
    const [monthlyRevenue] = await connection.query(`
      SELECT 
        DATE_FORMAT(b.date_time, '%Y-%m') as month,
        COALESCE(SUM(s.price), 0) as revenue,
        COUNT(b.id) as bookings
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.status = 'completed' 
        AND b.date_time >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(b.date_time, '%Y-%m')
      ORDER BY month DESC
    `);

    // Revenue by service
    const [serviceRevenue] = await connection.query(`
      SELECT 
        s.name,
        COALESCE(SUM(s.price), 0) as revenue,
        COUNT(b.id) as bookings
      FROM services s
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      GROUP BY s.id, s.name
      ORDER BY revenue DESC
    `);

    // Revenue by stylist
    const [stylistRevenue] = await connection.query(`
      SELECT 
        st.name,
        COALESCE(SUM(s.price), 0) as revenue,
        COUNT(b.id) as bookings
      FROM stylists st
      LEFT JOIN bookings b ON st.id = b.stylist_id AND b.status = 'completed'
      LEFT JOIN services s ON b.service_id = s.id
      GROUP BY st.id, st.name
      ORDER BY revenue DESC
    `);

    connection.release();

    const thisMonth = Number(thisMonthRevenue[0].total);
    const lastMonth = Number(lastMonthRevenue[0].total);
    const revenueTrend = lastMonth === 0
      ? (thisMonth > 0 ? 100 : 0)
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100 * 10) / 10;

    res.json({
      totalRevenue: totalRevenue,
      thisMonthRevenue: thisMonth,
      lastMonthRevenue: lastMonth,
      revenueTrend: revenueTrend,
      posBreakdown: posBreakdown,
      monthlyRevenue: monthlyRevenue,
      serviceRevenue: serviceRevenue,
      stylistRevenue: stylistRevenue
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add revenue adjustment (manual add/subtract)
app.post('/api/dashboard/revenue/adjustment', async (req, res) => {
  try {
    const { amount, type, description, createdBy, clientName } = req.body;
    
    if (!amount || !type) {
      return res.status(400).json({ message: 'Amount and type are required' });
    }

    const connection = await pool.getConnection();

    // Ensure table and columns exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS revenue_adjustments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('add','subtract') NOT NULL,
        description TEXT,
        created_by VARCHAR(100),
        client_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await connection.query(`ALTER TABLE revenue_adjustments ADD COLUMN IF NOT EXISTS client_name VARCHAR(255) DEFAULT NULL`);

    // Create adjustment record
    const [adjustment] = await connection.query(
      'INSERT INTO revenue_adjustments (amount, type, description, created_by, client_name) VALUES (?, ?, ?, ?, ?)',
      [amount, type, description || null, createdBy || null, clientName || null]
    );

    connection.release();

    res.json({ 
      message: 'Revenue adjustment recorded successfully',
      adjustmentId: adjustment.insertId
    });
  } catch (error) {
    console.error('Error adding revenue adjustment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue adjustments history
app.get('/api/dashboard/revenue/adjustments', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Ensure table and columns exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS revenue_adjustments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('add','subtract') NOT NULL,
        description TEXT,
        created_by VARCHAR(100),
        client_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await connection.query(`ALTER TABLE revenue_adjustments ADD COLUMN IF NOT EXISTS client_name VARCHAR(255) DEFAULT NULL`);

    const [adjustments] = await connection.query(`
      SELECT * FROM revenue_adjustments 
      ORDER BY created_at DESC 
      LIMIT 50
    `);

    connection.release();

    res.json(adjustments);
  } catch (error) {
    console.error('Error fetching revenue adjustments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enhanced dashboard analytics
app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Daily revenue for last 30 days
    const [dailyRevenue] = await connection.query(`
      SELECT 
        DATE(b.date_time) as date,
        COALESCE(SUM(s.price), 0) as revenue,
        COUNT(b.id) as bookings
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.status = 'completed' 
        AND b.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(b.date_time)
      ORDER BY date DESC
    `);

    // Weekly revenue for last 12 weeks
    const [weeklyRevenue] = await connection.query(`
      SELECT 
        YEARWEEK(b.date_time) as week,
        COALESCE(SUM(s.price), 0) as revenue,
        COUNT(b.id) as bookings
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.status = 'completed' 
        AND b.date_time >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
      GROUP BY YEARWEEK(b.date_time)
      ORDER BY week DESC
    `);

    // Daily bookings for last 30 days
    const [dailyBookings] = await connection.query(`
      SELECT 
        DATE(b.date_time) as date,
        COUNT(b.id) as bookings,
        DAYNAME(b.date_time) as day_name
      FROM bookings b 
      WHERE b.date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(b.date_time), DAYNAME(b.date_time)
      ORDER BY date DESC
    `);

    // Service popularity (booking count)
    const [servicePopularity] = await connection.query(`
      SELECT 
        s.name,
        COUNT(b.id) as bookings,
        COALESCE(SUM(s.price), 0) as revenue
      FROM services s
      LEFT JOIN bookings b ON s.id = b.service_id
      GROUP BY s.id, s.name
      ORDER BY bookings DESC
    `);

    // Appointment status distribution
    const [statusDistribution] = await connection.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM bookings 
      WHERE date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY status
    `);

    // Peak hours analysis
    const [peakHours] = await connection.query(`
      SELECT 
        HOUR(date_time) as hour,
        COUNT(*) as bookings
      FROM bookings 
      WHERE date_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY HOUR(date_time)
      ORDER BY hour
    `);

    // New customers (last 30 days)
    const [newCustomers] = await connection.query(`
      SELECT COUNT(*) as count
      FROM clients 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    connection.release();

    res.json({
      dailyRevenue: dailyRevenue,
      weeklyRevenue: weeklyRevenue,
      dailyBookings: dailyBookings,
      servicePopularity: servicePopularity,
      statusDistribution: statusDistribution,
      peakHours: peakHours,
      newCustomers: newCustomers[0].count
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ PROMOS ROUTES ============

// Get all promos
app.get('/api/promos', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM promos ORDER BY created_at DESC');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching promos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active promos
app.get('/api/promos/active', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT * FROM promos 
      WHERE is_active = TRUE 
      AND start_date <= CURDATE() 
      AND end_date >= CURDATE()
      ORDER BY created_at DESC
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching active promos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add promo
app.post('/api/promos', async (req, res) => {
  try {
    const { title, description, discount_percentage, discount_amount, start_date, end_date, terms_conditions } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'INSERT INTO promos (title, description, discount_percentage, discount_amount, start_date, end_date, terms_conditions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, discount_percentage, discount_amount, start_date, end_date, terms_conditions]
    );

    connection.release();
    broadcast({ type: 'promo_added', data: { title, description, discount_percentage } });
    res.json({ message: 'Promo added successfully' });
  } catch (error) {
    console.error('Error adding promo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update promo
app.put('/api/promos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, discount_percentage, discount_amount, start_date, end_date, is_active, terms_conditions } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE promos SET title = ?, description = ?, discount_percentage = ?, discount_amount = ?, start_date = ?, end_date = ?, is_active = ?, terms_conditions = ? WHERE id = ?',
      [title, description, discount_percentage, discount_amount, start_date, end_date, is_active, terms_conditions, id]
    );

    connection.release();
    broadcast({ type: 'promo_updated', data: { id, title, description } });
    res.json({ message: 'Promo updated successfully' });
  } catch (error) {
    console.error('Error updating promo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete promo
app.delete('/api/promos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    await connection.query('DELETE FROM promos WHERE id = ?', [id]);

    connection.release();
    broadcast({ type: 'promo_deleted', data: { id } });
    res.json({ message: 'Promo deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ RATINGS ROUTES ============

// Get ALL ratings (admin)
app.get('/api/ratings', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT r.id, r.rating, r.review, r.created_at,
             c.name as clientName,
             st.name as stylistName, st.id as stylistId,
             sv.name as serviceName,
             b.date_time
      FROM ratings r
      JOIN clients c  ON r.client_id  = c.id
      JOIN stylists st ON r.stylist_id = st.id
      JOIN bookings b  ON r.booking_id = b.id
      JOIN services sv ON b.service_id = sv.id
      ORDER BY r.created_at DESC
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching all ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete rating (admin)
app.delete('/api/ratings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM ratings WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Rating deleted' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ratings for a stylist (stylist app)
app.get('/api/stylists/ratings', verifyToken, async (req, res) => {
  try {
    const stylist_id = req.user.id;
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT r.*, c.name as clientName, s.name as serviceName, b.date_time
      FROM ratings r
      JOIN clients c ON r.client_id = c.id
      JOIN bookings b ON r.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      WHERE r.stylist_id = ?
      ORDER BY r.created_at DESC
    `, [stylist_id]);

    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stylist ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ratings for a stylist
app.get('/api/stylists/:stylistId/ratings', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT r.*, c.name as clientName, s.name as serviceName, b.date_time
      FROM ratings r
      JOIN clients c ON r.client_id = c.id
      JOIN bookings b ON r.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      WHERE r.stylist_id = ?
      ORDER BY r.created_at DESC
    `, [stylistId]);

    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stylist ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add rating
app.post('/api/ratings', verifyToken, async (req, res) => {
  try {
    const { booking_id, rating, review } = req.body;
    const client_id = req.user.id;

    const connection = await pool.getConnection();

    // Check if booking exists and belongs to the client, and get stylist_id
    const [bookingRows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? AND client_id = ? AND status = ?',
      [booking_id, client_id, 'completed']
    );

    if (bookingRows.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'Invalid booking or booking not completed' });
    }

    const booking = bookingRows[0];
    const stylist_id = booking.stylist_id;

    // Check if rating already exists
    const [existingRating] = await connection.query(
      'SELECT * FROM ratings WHERE booking_id = ?',
      [booking_id]
    );

    if (existingRating.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Rating already exists for this booking' });
    }

    // Insert rating
    await connection.query(
      'INSERT INTO ratings (booking_id, client_id, stylist_id, rating, review) VALUES (?, ?, ?, ?, ?)',
      [booking_id, client_id, stylist_id, rating, review || '']
    );

    connection.release();
    broadcast({ type: 'rating_added', data: { booking_id, stylist_id, rating } });
    res.json({ message: 'Rating added successfully' });
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ STYLIST PROFILE ROUTES ============

// Get stylist profile
app.get('/api/stylists/profile', verifyToken, async (req, res) => {
  try {
    const stylist_id = req.user.id;
    const connection = await pool.getConnection();

    // Try to get profile with profile_image_url, but handle if column doesn't exist
    try {
      const [rows] = await connection.query('SELECT id, name, email, phone, specialization, status, profile_image_url FROM stylists WHERE id = ?', [stylist_id]);
      
      if (rows.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Stylist not found' });
      }

      connection.release();
      res.json(rows[0]);
    } catch (columnError) {
      // If profile_image_url column doesn't exist, query without it
      console.log('profile_image_url column not found, querying without it');
      const [rows] = await connection.query('SELECT id, name, email, phone, specialization, status FROM stylists WHERE id = ?', [stylist_id]);
      
      if (rows.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Stylist not found' });
      }

      connection.release();
      // Add null profile_image_url for compatibility
      const stylistData = { ...rows[0], profile_image_url: null };
      res.json(stylistData);
    }
  } catch (error) {
    console.error('Error fetching stylist profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stylist profile
app.put('/api/stylists/profile', verifyToken, async (req, res) => {
  try {
    const stylist_id = req.user.id;
    const { name, email, phone, specialization } = req.body;
    const connection = await pool.getConnection();

    // Check if email is already taken by another stylist
    const [existingEmail] = await connection.query(
      'SELECT id FROM stylists WHERE email = ? AND id != ?',
      [email, stylist_id]
    );

    if (existingEmail.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email already in use by another stylist' });
    }

    // Update profile
    await connection.query(
      'UPDATE stylists SET name = ?, email = ?, phone = ?, specialization = ? WHERE id = ?',
      [name, email, phone, specialization, stylist_id]
    );

    connection.release();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating stylist profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stylist profile image URL
app.put('/api/stylists/profile-image', verifyToken, async (req, res) => {
  try {
    const stylist_id = req.user.id;
    const { profile_image_url } = req.body;
    const connection = await pool.getConnection();

    // Update profile image URL
    await connection.query(
      'UPDATE stylists SET profile_image_url = ? WHERE id = ?',
      [profile_image_url, stylist_id]
    );

    connection.release();
    res.json({ message: 'Profile image updated successfully' });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change stylist password
app.put('/api/stylists/change-password', verifyToken, async (req, res) => {
  try {
    const stylist_id = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const connection = await pool.getConnection();

    // Get current password hash
    const [rows] = await connection.query('SELECT password FROM stylists WHERE id = ?', [stylist_id]);
    
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Stylist not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, rows[0].password);
    
    if (!isCurrentPasswordValid) {
      connection.release();
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.query(
      'UPDATE stylists SET password = ? WHERE id = ?',
      [hashedNewPassword, stylist_id]
    );

    connection.release();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ STYLIST AVAILABILITY ROUTES ============

// GET own availability (stylist app)
app.get('/api/stylists/availability', verifyToken, async (req, res) => {
  try {
    const stylist_id = req.user.id;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM stylist_availability WHERE stylist_id = ?', [stylist_id]
    );
    connection.release();
    if (rows.length === 0) {
      // Return defaults
      return res.json({
        is_available: true,
        work_days: 'Mon,Tue,Wed,Thu,Fri,Sat',
        start_hour: 9,
        end_hour: 18,
        blocked_dates: [],
      });
    }
    const row = rows[0];
    res.json({
      is_available: !!row.is_available,
      work_days: row.work_days,
      start_hour: row.start_hour,
      end_hour: row.end_hour,
      blocked_dates: row.blocked_dates ? JSON.parse(row.blocked_dates) : [],
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// SAVE own availability (stylist app)
app.put('/api/stylists/availability', verifyToken, async (req, res) => {
  try {
    const stylist_id = req.user.id;
    const { is_available, work_days, start_hour, end_hour, blocked_dates } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      `INSERT INTO stylist_availability (stylist_id, is_available, work_days, start_hour, end_hour, blocked_dates)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_available = VALUES(is_available),
         work_days    = VALUES(work_days),
         start_hour   = VALUES(start_hour),
         end_hour     = VALUES(end_hour),
         blocked_dates = VALUES(blocked_dates)`,
      [
        stylist_id,
        is_available ? 1 : 0,
        work_days,
        start_hour,
        end_hour,
        JSON.stringify(blocked_dates || []),
      ]
    );
    connection.release();
    broadcast({ type: 'stylist_availability_updated', data: { stylist_id } });
    res.json({ message: 'Availability saved' });
  } catch (error) {
    console.error('Error saving availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET availability for a specific stylist (user app — public)
app.get('/api/stylists/:stylistId/availability', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM stylist_availability WHERE stylist_id = ?', [stylistId]
    );
    connection.release();
    if (rows.length === 0) {
      return res.json({
        is_available: true,
        work_days: 'Mon,Tue,Wed,Thu,Fri,Sat',
        start_hour: 9,
        end_hour: 18,
        blocked_dates: [],
      });
    }
    const row = rows[0];
    res.json({
      is_available: !!row.is_available,
      work_days: row.work_days,
      start_hour: row.start_hour,
      end_hour: row.end_hour,
      blocked_dates: row.blocked_dates ? JSON.parse(row.blocked_dates) : [],
    });
  } catch (error) {
    console.error('Error fetching stylist availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ BOOKING CANCELLATION ROUTES ============

// Cancel booking
app.put('/api/bookings/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const reason = req.body && req.body.reason ? String(req.body.reason).trim() : null;
    const client_id = req.user.id;
    console.log('Cancel booking - ID:', id, '| reason received:', JSON.stringify(reason), '| body:', JSON.stringify(req.body));

    const connection = await pool.getConnection();

    // Check if booking exists and belongs to the client
    const [bookingRows] = await connection.query(
      `SELECT b.*, c.name as clientName, sv.name as serviceName
       FROM bookings b
       JOIN clients c ON b.client_id = c.id
       JOIN services sv ON b.service_id = sv.id
       WHERE b.id = ? AND b.client_id = ? AND b.status IN (?, ?)`,
      [id, client_id, 'pending', 'confirmed']
    );

    if (bookingRows.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'Booking not found or cannot be cancelled' });
    }

    const booking = bookingRows[0];

    // Enforce 5-minute window: only confirmed bookings have the window restriction
    if (booking.status === 'confirmed' && booking.confirmed_at) {
      const confirmedAt = new Date(booking.confirmed_at);
      const diffMs = Date.now() - confirmedAt.getTime();
      if (diffMs > 5 * 60 * 1000) {
        connection.release();
        return res.status(400).json({ message: 'Cancellation window has expired. You can only cancel within 5 minutes of confirmation.' });
      }
    }

    // Update booking status
    await connection.query(
      'UPDATE bookings SET status = ?, cancelled_at = NOW(), cancelled_by = ?, cancellation_reason = ? WHERE id = ?',
      ['cancelled', 'client', reason || 'No reason provided', id]
    );

    connection.release();

    broadcast({
      type: 'booking_cancelled',
      data: {
        id,
        cancelled_by: 'client',
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        reason: reason || 'No reason provided',
      }
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rating for a specific booking
app.get('/api/bookings/:bookingId/rating', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT r.*, c.name as clientName
      FROM ratings r
      JOIN clients c ON r.client_id = c.id
      WHERE r.booking_id = ?
    `, [bookingId]);

    connection.release();

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'No rating found for this booking' });
    }
  } catch (error) {
    console.error('Error fetching booking rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ NOTIFICATIONS ROUTES ============

// Get notifications for a client
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(`
      SELECT n.*, 
             b.id as bookingId,
             b.date_time as bookingDateTime,
             s.name as serviceName,
             sty.name as stylistName
      FROM notifications n
      LEFT JOIN bookings b ON n.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN stylists sty ON b.stylist_id = sty.id
      WHERE n.client_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [clientId]);
    
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
app.get('/api/notifications/unread-count', verifyToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM notifications WHERE client_id = ? AND is_read = FALSE',
      [clientId]
    );
    
    connection.release();
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const clientId = req.user.id;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND client_id = ?',
      [notificationId, clientId]
    );
    
    connection.release();
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE notifications SET is_read = TRUE WHERE client_id = ?',
      [clientId]
    );
    
    connection.release();
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const clientId = req.user.id;
    const connection = await pool.getConnection();
    
    await connection.query(
      'DELETE FROM notifications WHERE id = ? AND client_id = ?',
      [notificationId, clientId]
    );
    
    connection.release();
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all notifications
app.delete('/api/notifications', verifyToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const connection = await pool.getConnection();
    
    await connection.query(
      'DELETE FROM notifications WHERE client_id = ?',
      [clientId]
    );
    
    connection.release();
    res.json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to create notification
async function createNotification(clientId, title, message, type, bookingId = null) {
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO notifications (client_id, title, message, type, booking_id) VALUES (?, ?, ?, ?, ?)',
      [clientId, title, message, type, bookingId]
    );
    connection.release();
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

// ============ ADDITIONAL SERVICES ROUTES ============

// Add additional service to booking
app.post('/api/bookings/:id/services', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { service_id } = req.body;
    const client_id = req.user.id;

    const connection = await pool.getConnection();

    // Check if booking exists and belongs to the client
    const [bookingRows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? AND client_id = ?',
      [id, client_id]
    );

    if (bookingRows.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'Booking not found' });
    }

    // Check if service is already added
    const [existingService] = await connection.query(
      'SELECT * FROM booking_services WHERE booking_id = ? AND service_id = ?',
      [id, service_id]
    );

    if (existingService.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Service already added to this booking' });
    }

    // Add service to booking
    await connection.query(
      'INSERT INTO booking_services (booking_id, service_id) VALUES (?, ?)',
      [id, service_id]
    );

    connection.release();
    broadcast({ type: 'service_added_to_booking', data: { booking_id: id, service_id } });
    res.json({ message: 'Service added to booking successfully' });
  } catch (error) {
    console.error('Error adding service to booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking services
app.get('/api/bookings/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT bs.*, s.name, s.description, s.price, s.duration
      FROM booking_services bs
      JOIN services s ON bs.service_id = s.id
      WHERE bs.booking_id = ?
    `, [id]);

    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching booking services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Run DB migrations then start server
async function runMigrations() {
  try {
    const conn = await pool.getConnection();
    await conn.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reference_image LONGTEXT DEFAULT NULL AFTER notes`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_request TEXT DEFAULT NULL AFTER reference_image`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reference_images LONGTEXT DEFAULT NULL AFTER special_request`);
    await conn.query(`ALTER TABLE stylists MODIFY COLUMN profile_image LONGTEXT DEFAULT NULL`);
    await conn.query(`ALTER TABLE stylists ADD COLUMN IF NOT EXISTS profile_image_url LONGTEXT DEFAULT NULL`);
    await conn.query(`ALTER TABLE salon_info ADD COLUMN IF NOT EXISTS about_us TEXT DEFAULT NULL`);
    await conn.query(`ALTER TABLE salon_info ADD COLUMN IF NOT EXISTS salon_images JSON DEFAULT NULL`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS revenue_adjustments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('add','subtract') NOT NULL,
        description TEXT,
        created_by VARCHAR(100),
        client_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`ALTER TABLE revenue_adjustments ADD COLUMN IF NOT EXISTS client_name VARCHAR(255) DEFAULT NULL`);
    console.log('Migrations complete.');
    conn.release();
  } catch (e) {
    console.error('Migration error:', e.message);
  }
}

const PORT = process.env.PORT || 3001;
runMigrations().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
  });
});
