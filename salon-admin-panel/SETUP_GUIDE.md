# Salon Admin Panel - Complete Setup Guide

## Step-by-Step Installation

### Step 1: Start XAMPP MySQL

1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait for it to show "Running"

### Step 2: Create Database

#### Option A: Using phpMyAdmin (Easiest)

1. Open browser and go to `http://localhost/phpmyadmin`
2. Click on "SQL" tab at the top
3. Copy all content from `server/database.sql`
4. Paste into the SQL editor
5. Click "Go" to execute

#### Option B: Using MySQL Command Line

1. Open Command Prompt
2. Navigate to the project folder
3. Run:
```bash
mysql -u root < server/database.sql
```

### Step 3: Start Backend Server

1. Open Command Prompt
2. Navigate to the project folder
3. Run:
```bash
cd server
npm install
npm start
```

You should see:
```
Server running on port 3001
WebSocket server running on ws://localhost:3001
```

### Step 4: Start Frontend (in a new Command Prompt)

1. Open a new Command Prompt
2. Navigate to the project folder
3. Run:
```bash
npm run dev
```

You should see:
```
VITE v8.0.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 5: Access the Application

1. Open your browser
2. Go to `http://localhost:5173`
3. Login with:
   - Email: `admin@salon.com`
   - Password: `admin123`

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
- Make sure MySQL is running in XAMPP
- Check that the database was created successfully
- Verify credentials in `server/.env`

### Issue: "Port 3001 already in use"

**Solution:**
- Change PORT in `server/.env` to another port (e.g., 3002)
- Or kill the process using port 3001

### Issue: "Cannot GET /api/clients"

**Solution:**
- Make sure backend server is running
- Check that you're accessing from `http://localhost:5173`
- Check browser console for CORS errors

### Issue: "Module not found" errors

**Solution:**
```bash
# In server folder
npm install

# In root folder
npm install
```

## Database Schema

The application uses 6 main tables:

1. **admins** - Admin user accounts
2. **clients** - Salon clients
3. **stylists** - Salon stylists
4. **services** - Salon services
5. **bookings** - Client bookings
6. Relationships are maintained through foreign keys

## Default Data

After setup, you'll have:

**Admin Account:**
- Email: admin@salon.com
- Password: admin123

**Sample Data:**
- 3 Clients
- 3 Stylists
- 4 Services
- 3 Bookings

## Development Commands

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
npm start        # Start server
npm run dev      # Start with nodemon (auto-reload)
```

## File Structure

```
salon-admin-panel/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   └── Sidebar.css
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Clients.jsx
│   │   ├── Stylists.jsx
│   │   ├── Services.jsx
│   │   └── Bookings.jsx
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── server/
│   ├── server.js
│   ├── database.sql
│   ├── .env
│   └── package.json
├── package.json
├── vite.config.js
└── README.md
```

## Next Steps

1. **Customize Branding**: Update colors and logo in Sidebar.jsx
2. **Add More Features**: Implement payment processing, notifications, etc.
3. **Deploy**: Deploy frontend to Vercel/Netlify and backend to Heroku/AWS
4. **Security**: Change JWT_SECRET and implement proper authentication

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all services are running (MySQL, Backend, Frontend)
3. Check browser console for errors
4. Check backend console for server errors

## Security Reminders

- Change the JWT_SECRET in `server/.env`
- Use strong passwords for admin accounts
- Implement HTTPS in production
- Add rate limiting to API endpoints
- Validate all user inputs on backend
- Use environment variables for sensitive data
