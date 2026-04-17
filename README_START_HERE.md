# Salon Booking System - Start Here

## What You Have

A complete, production-ready salon booking system with:
- **Backend API** (Node.js + Express + MySQL)
- **Admin Panel** (React.js web app)
- **User App** (React Native mobile app)
- **Stylist App** (React Native mobile app)

---

## Quick Start (2 minutes)

### 1. Start Backend Server
```bash
cd salon-admin-panel/server
npm start
```
Expected output: `Server running on port 3001`

### 2. Start Admin Panel (in new terminal)
```bash
cd salon-admin-panel
npm run dev
```
Expected output: `Local: http://localhost:5173`

### 3. Start User App (in new terminal)
```bash
cd salon-user-app
npm start -- --offline
```
Expected output: `Expo Go app will open`

### 4. Start Stylist App (in new terminal)
```bash
cd salon-stylist-app
npm start -- --port 8082 --offline
```
Expected output: `Expo Go app will open`

---

## Login Credentials

### Admin Panel
- Email: `admin@salon.com`
- Password: `admin123`
- URL: `http://localhost:5173`

### User App
- Email: `user@example.com`
- Password: `password123`

### Stylist App
- Email: `sarah@salon.com`
- Password: `stylist123`

---

## Testing on Mobile Device

### Prerequisites
- Mobile device on same WiFi network as computer
- Expo Go app installed on device

### Steps
1. **Get your computer's IP**:
   ```bash
   ipconfig | findstr IPv4
   ```
   Should show: `192.168.12.156`

2. **Verify backend is accessible**:
   ```bash
   curl http://192.168.12.156:3001/api/health
   ```
   Should return JSON with `"status": "ok"`

3. **On your mobile device**:
   - Connect to same WiFi network
   - Open browser and go to: `http://192.168.12.156:3001/api/health`
   - Should see JSON response

4. **If device can reach server**:
   - Scan QR code from Expo app
   - App should load
   - Try logging in with credentials above

5. **If device cannot reach server**:
   - See "Connection Failed?" section below

---

## Connection Failed?

### Quick Fix (5 minutes)

1. **Check backend is running**:
   ```bash
   curl http://192.168.12.156:3001/api/health
   ```

2. **Check device WiFi**:
   - Go to WiFi settings on mobile device
   - Connect to same network as computer

3. **Test device connection**:
   - Open browser on mobile device
   - Go to: `http://192.168.12.156:3001/api/health`
   - If you see JSON, device can reach server

4. **If device cannot reach server**:
   - Check if IP address is still `192.168.12.156`
   - If IP changed, update:
     - `salon-user-app/config/api.js`
     - `salon-stylist-app/config/api.js`
   - Restart Expo apps

5. **Check Windows Firewall**:
   - Open Windows Defender Firewall
   - Click "Allow an app through firewall"
   - Ensure Node.js is allowed for Private and Public networks

For detailed help, see `QUICK_CONNECTION_FIX.md`

---

## What Each App Does

### Admin Panel
- Manage clients (add, edit, delete)
- Manage stylists (add, edit, delete, set passwords)
- Manage services (add, edit, delete)
- View all bookings
- Update booking status
- View dashboard statistics

### User App
- Create account or login
- Browse stylists
- View services and pricing
- Book appointments (select stylist, service, date, time)
- View booking history
- View profile

### Stylist App
- Login with credentials
- View pending bookings
- Accept, decline, or complete bookings
- Filter bookings by status
- View profile

---

## Database

**Name**: `salon_admin`

**Tables**:
- `admins` - Admin accounts
- `clients` - User accounts
- `stylists` - Stylist accounts
- `services` - Available services
- `bookings` - Booking records

**Default Data**:
- 1 Admin
- 1 User
- 5 Stylists
- 5 Services

---

## API Endpoints

### Health Check
- `GET /api/health` - Server status

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/signup` - User signup
- `POST /api/stylists/login` - Stylist login
- `POST /api/admin/login` - Admin login

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Stylists
- `GET /api/stylists` - Get all stylists
- `POST /api/stylists` - Add stylist
- `PUT /api/stylists/:id` - Update stylist
- `DELETE /api/stylists/:id` - Delete stylist

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Add service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Bookings
- `POST /api/bookings` - Create booking (requires JWT)
- `GET /api/bookings` - Get all bookings
- `GET /api/users/bookings` - Get user's bookings (requires JWT)
- `PUT /api/bookings/:id` - Update booking status

---

## Troubleshooting

### Backend not starting
```bash
# Check if port 3001 is already in use
netstat -an | findstr 3001

# If in use, kill the process or use different port
```

### Database connection error
- Ensure MySQL is running in XAMPP
- Ensure `salon_admin` database is imported
- Check database credentials in `salon-admin-panel/server/server.js`

### Mobile app shows "Connection failed"
- See "Connection Failed?" section above
- Or read `QUICK_CONNECTION_FIX.md`

### Admin panel won't load
- Ensure backend is running
- Check if port 5173 is available
- Try: `npm run dev` in `salon-admin-panel`

### Expo app won't load
- Ensure backend is running
- Ensure device is on same WiFi network
- Try scanning QR code again
- Restart Expo app

---

## File Structure

```
salon-admin-panel/
├── server/
│   ├── server.js (Backend API)
│   ├── database.sql (Database schema)
│   └── package.json
├── src/
│   ├── pages/ (Admin panel pages)
│   ├── components/ (Reusable components)
│   └── App.jsx
└── package.json

salon-user-app/
├── screens/ (User app screens)
├── config/api.js (API configuration)
├── App.js (Main app)
└── package.json

salon-stylist-app/
├── screens/ (Stylist app screens)
├── config/api.js (API configuration)
├── App.js (Main app)
└── package.json
```

---

## Documentation

- `SYSTEM_READY_FOR_TESTING.md` - System status and testing guide
- `QUICK_CONNECTION_FIX.md` - 5-minute connection fix
- `CONNECTION_TROUBLESHOOTING_GUIDE.md` - Detailed troubleshooting
- `DEVICE_CONNECTION_TEST.md` - Device testing guide
- `CURRENT_SYSTEM_STATUS.md` - Complete system overview
- `FINAL_DIAGNOSIS.md` - Backend verification

---

## Next Steps

1. **Start all services** (follow Quick Start above)
2. **Test admin panel** at `http://localhost:5173`
3. **Test mobile apps** on your device
4. **Create bookings** through user app
5. **Manage bookings** through stylist app

---

## System is Ready! 🎉

Everything is set up and ready to use. Follow the Quick Start section above to get started.

If you encounter any issues, check the troubleshooting section or refer to the documentation files listed above.

Good luck with your salon booking system!
