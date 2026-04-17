# Customization Guide

## 🎨 UI Customization

### Change Color Scheme

Edit `src/components/Sidebar.css`:

```css
/* Change sidebar gradient */
.sidebar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Change primary button color */
.btn-primary {
  background-color: #6c5ce7;
}

.btn-primary:hover {
  background-color: #5f3dc4;
}
```

### Change Sidebar Width

Edit `src/components/Sidebar.css`:

```css
.sidebar {
  width: 250px;  /* Change this value */
}
```

### Change Font

Edit `src/App.css`:

```css
body {
  font-family: 'Your Font Name', sans-serif;
}
```

---

## 🔐 Security Customization

### Change JWT Secret

Edit `server/.env`:

```
JWT_SECRET=your-new-secret-key-here
```

### Change Admin Password

1. Generate bcrypt hash of your password
2. Update `server/database.sql`:

```sql
UPDATE admins SET password = '$2a$10$YOUR_HASHED_PASSWORD' WHERE email = 'admin@salon.com';
```

Or use Node.js to generate hash:

```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('your-password', 10, (err, hash) => {
  console.log(hash);
});
```

### Add HTTPS

In production, update `server/server.js`:

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/key.pem'),
  cert: fs.readFileSync('path/to/cert.pem')
};

https.createServer(options, app).listen(PORT);
```

---

## 📊 Database Customization

### Add New Fields to Clients

1. Update `server/database.sql`:

```sql
ALTER TABLE clients ADD COLUMN address VARCHAR(255);
ALTER TABLE clients ADD COLUMN city VARCHAR(100);
```

2. Update `src/pages/Clients.jsx` form:

```jsx
<div className="form-group">
  <label>Address</label>
  <input
    type="text"
    value={formData.address}
    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
  />
</div>
```

3. Update `server/server.js` API:

```javascript
app.post('/api/clients', async (req, res) => {
  const { name, email, phone, address, city } = req.body;
  // ... update query
});
```

### Add New Table

1. Add to `server/database.sql`:

```sql
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  amount DECIMAL(10, 2),
  status ENUM('pending', 'completed', 'failed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

2. Create API endpoints in `server/server.js`

3. Create React component in `src/pages/`

---

## 🔔 Feature Customization

### Add Email Notifications

Install nodemailer:

```bash
npm install nodemailer
```

Add to `server/server.js`:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email on booking confirmation
async function sendBookingConfirmation(email, bookingDetails) {
  await transporter.sendMail({
    to: email,
    subject: 'Booking Confirmed',
    html: `<h1>Your booking is confirmed!</h1>...`
  });
}
```

### Add SMS Notifications

Install Twilio:

```bash
npm install twilio
```

Add to `server/server.js`:

```javascript
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(phone, message) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}
```

### Add Payment Processing

Install Stripe:

```bash
npm install stripe
```

Add to `server/server.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/payments', async (req, res) => {
  const { amount, token } = req.body;
  
  const charge = await stripe.charges.create({
    amount: amount * 100,
    currency: 'usd',
    source: token
  });
  
  res.json(charge);
});
```

---

## 📱 Responsive Design

### Add Mobile Menu

Edit `src/components/Sidebar.jsx`:

```jsx
const [mobileOpen, setMobileOpen] = useState(false);

return (
  <>
    <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
      ☰
    </button>
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* ... */}
    </aside>
  </>
);
```

Add to `src/components/Sidebar.css`:

```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -250px;
    height: 100vh;
    transition: left 0.3s ease;
    z-index: 1000;
  }
  
  .sidebar.mobile-open {
    left: 0;
  }
  
  .mobile-menu-btn {
    display: block;
  }
}
```

---

## 🔄 API Customization

### Add Rate Limiting

Install express-rate-limit:

```bash
npm install express-rate-limit
```

Add to `server/server.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### Add Request Logging

Add to `server/server.js`:

```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

### Add Error Handling

Add to `server/server.js`:

```javascript
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});
```

---

## 🎯 Performance Optimization

### Add Caching

```javascript
const cache = new Map();

app.get('/api/services', (req, res) => {
  if (cache.has('services')) {
    return res.json(cache.get('services'));
  }
  
  // Fetch from database
  // cache.set('services', data);
});
```

### Add Pagination

```javascript
app.get('/api/bookings', async (req, res) => {
  const page = req.query.page || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  
  const [rows] = await connection.query(
    'SELECT * FROM bookings LIMIT ? OFFSET ?',
    [limit, offset]
  );
  
  res.json(rows);
});
```

---

## 📈 Analytics

### Add Google Analytics

Add to `src/main.jsx`:

```javascript
import ReactGA from 'react-ga';

ReactGA.initialize('GA_MEASUREMENT_ID');
ReactGA.pageview(window.location.pathname);
```

### Add Custom Events

```javascript
ReactGA.event({
  category: 'Booking',
  action: 'Created',
  label: 'New Booking'
});
```

---

## 🚀 Deployment Customization

### Environment Variables

Create `.env.production`:

```
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

Update API calls:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### Build Optimization

Edit `vite.config.js`:

```javascript
export default {
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  }
}
```

---

## 📝 Common Customizations Checklist

- [ ] Change color scheme
- [ ] Update admin credentials
- [ ] Add custom fields to database
- [ ] Implement email notifications
- [ ] Add payment processing
- [ ] Set up analytics
- [ ] Configure environment variables
- [ ] Add rate limiting
- [ ] Implement caching
- [ ] Add error handling
- [ ] Test on mobile devices
- [ ] Set up HTTPS
- [ ] Configure CDN
- [ ] Add logging
- [ ] Set up monitoring

---

## 🆘 Need Help?

Refer to:
- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Setup instructions
- `QUICK_START.md` - Quick start guide
