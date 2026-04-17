# Complete System Restart Guide - Test Auto IP Detection

## 🚀 STARTUP ORDER & COMMANDS

### 1. Backend Server (Node.js + WebSocket)
**Location**: `salon-admin-panel/server/`

```bash
# Navigate to server directory
cd salon-admin-panel/server

# Start the backend server
node server.js
```

**Expected Output**:
```
Server running on port 3001
WebSocket server running on port 3002
Database connected successfully
```

**Important**: Note the IP address shown in console (should auto-detect your current network IP)

---

### 2. Admin Panel (React + Vite)
**Location**: `salon-admin-panel/`

```bash
# Navigate to admin panel directory
cd salon-admin-panel

# Start the admin panel
npm run dev
```

**Expected Output**:
```
Local:   http://localhost:5173/
Network: http://[YOUR-IP]:5173/
```

**Login Credentials**:
- Email: `admin@salon.com`
- Password: `admin123`

---

### 3. User App (React Native + Expo)
**Location**: `salon-user-app/`

```bash
# Navigate to user app directory
cd salon-user-app

# Start the user app
expo start
```

**Expected Output**:
```
Metro waiting on exp://[YOUR-IP]:8081
```

**Login Credentials**:
- Email: `user@example.com`
- Password: `password123`

**Auto IP Features**:
- App will auto-detect backend server IP
- "Refresh IP Connection" button on login screen
- Tests multiple common IP ranges automatically

---

### 4. Stylist App (React Native + Expo)
**Location**: `salon-stylist-app/`

```bash
# Navigate to stylist app directory
cd salon-stylist-app

# Start the stylist app
expo start
```

**Expected Output**:
```
Metro waiting on exp://[YOUR-IP]:8081
```

**Login Credentials**:
- Email: `sarah@salon.com`
- Password: `stylist123`
- Alternative: `emily@salon.com` / `stylist123`
- Alternative: `michael@salon.com` / `stylist123`

**New Features**:
- Dashboard with analytics and charts
- Auto IP detection system
- Professional UI with PHP peso currency (₱)

---

## 🔧 TESTING AUTO IP DETECTION

### User App Auto IP Testing
1. **Open User App** on device/emulator
2. **Try Login** - should auto-detect backend IP
3. **If Connection Fails**:
   - Tap "Refresh IP Connection" button
   - App will test multiple IP ranges automatically
   - Success message will show detected IP
4. **Test Features**:
   - Browse stylists
   - Make a booking
   - Check "My Bookings"

### Stylist App Auto IP Testing
1. **Open Stylist App** on device/emulator
2. **Try Login** - should auto-detect backend IP
3. **If Connection Fails**:
   - Tap "Refresh IP Connection" button
   - App will auto-detect working IP
4. **Test New Dashboard**:
   - View analytics and charts
   - Check booking statistics
   - Navigate between tabs

---

## 📱 COMPLETE TESTING WORKFLOW

### Step 1: Start All Services
```bash
# Terminal 1 - Backend
cd salon-admin-panel/server && node server.js

# Terminal 2 - Admin Panel
cd salon-admin-panel && npm run dev

# Terminal 3 - User App
cd salon-user-app && expo start

# Terminal 4 - Stylist App
cd salon-stylist-app && expo start
```

### Step 2: Test Admin Panel
1. Open `http://localhost:5173`
2. Login with `admin@salon.com` / `admin123`
3. Verify all data loads correctly
4. Check stylists, services, bookings

### Step 3: Test User App
1. Open in Expo Go on device
2. Login with `user@example.com` / `password123`
3. **Test Auto IP**: Should connect automatically
4. **If fails**: Use "Refresh IP Connection"
5. Browse stylists → Select service → Book appointment
6. Check "My Bookings" for confirmation

### Step 4: Test Stylist App
1. Open in Expo Go on device
2. Login with `sarah@salon.com` / `stylist123`
3. **Test Auto IP**: Should connect automatically
4. **View Dashboard**: Check analytics and charts
5. **Check Bookings**: View pending bookings
6. **Accept/Decline**: Test booking management

---

## 🌐 AUTO IP DETECTION FEATURES

### How It Works
- **Automatic Detection**: Apps test multiple common IP ranges
- **Smart Fallback**: Falls back to last known working IP
- **Manual Refresh**: Button to re-detect IP if network changes
- **Multiple Ranges Tested**:
  - Current detected IP range (10.220.244.x)
  - Previous IP range (192.168.12.x)
  - Common router IPs (192.168.1.x, 192.168.0.x)
  - Corporate networks (10.0.0.x, 172.16.0.x)

### IP Ranges Tested
```
10.220.244.90   (Current detected)
192.168.12.156  (Previous)
10.220.244.91-100
192.168.1.100-102
192.168.0.100-102
10.0.0.100-101
172.16.0.100
localhost (emulator)
```

---

## 🔍 TROUBLESHOOTING

### Backend Not Starting
```bash
# Check if port 3001 is in use
netstat -an | findstr :3001

# Kill process if needed
taskkill /F /PID [PID_NUMBER]
```

### Apps Can't Connect
1. **Check Backend IP**: Note IP shown in backend console
2. **Use Refresh Button**: Tap "Refresh IP Connection" in apps
3. **Manual Check**: Verify `http://[YOUR-IP]:3001/api/stylists` in browser
4. **Firewall**: Ensure Windows Firewall allows Node.js

### Database Issues
```bash
# Navigate to server directory
cd salon-admin-panel/server

# Run database setup
node setup-db.js
```

---

## ✅ SUCCESS INDICATORS

### Backend Running
- ✅ "Server running on port 3001"
- ✅ "WebSocket server running on port 3002"
- ✅ "Database connected successfully"

### Admin Panel Working
- ✅ Login successful
- ✅ Dashboard loads with data
- ✅ All CRUD operations work

### User App Connected
- ✅ Auto IP detection successful
- ✅ Login works
- ✅ Can browse stylists and services
- ✅ Booking flow completes

### Stylist App Connected
- ✅ Auto IP detection successful
- ✅ Login works
- ✅ Dashboard shows analytics
- ✅ Can manage bookings

---

## 🎯 TESTING CHECKLIST

### Complete System Test
- [ ] Backend server started (port 3001)
- [ ] Admin panel accessible (port 5173)
- [ ] User app connects automatically
- [ ] Stylist app connects automatically
- [ ] Auto IP detection works when network changes
- [ ] All login credentials work
- [ ] Booking flow works end-to-end
- [ ] Stylist dashboard shows analytics
- [ ] WebSocket notifications work
- [ ] PHP peso currency displays correctly

### Auto IP Detection Test
- [ ] Apps connect on first try
- [ ] "Refresh IP Connection" button works
- [ ] Success message shows detected IP
- [ ] Apps work after IP refresh
- [ ] Multiple IP ranges tested automatically

**Ready to test the complete system with auto IP detection!** 🚀