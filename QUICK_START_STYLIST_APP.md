# Quick Start - Stylist App

## 🚀 All Services Running

```
✅ Admin Panel: http://localhost:5173
✅ User App: http://localhost:8081 (Expo)
✅ Stylist App: http://localhost:8082 (Expo)
✅ Backend API: http://10.220.244.90:3001
```

## 📱 Test the Stylist App

### Step 1: Admin Creates Stylist Account
1. Open http://localhost:5173
2. Login: `admin@salon.com` / `admin123`
3. Click "Stylists" in sidebar
4. Click "Add Stylist"
5. Fill in details:
   - Name: `John Stylist`
   - Email: `john@salon.com`
   - Phone: `555-2001`
   - Specialization: `Hair Cutting`
   - Status: `Active`
6. Click "Add"

### Step 2: Stylist Logs In
1. Open Expo Go app on your device
2. Scan QR code from stylist app terminal (port 8082)
3. Login with:
   - Email: `john@salon.com`
   - Password: `stylist123`

### Step 3: Client Books Appointment
1. Open Expo Go app on another device
2. Scan QR code from user app terminal (port 8081)
3. Login: `user@example.com` / `password123`
4. Go to "Stylists" tab
5. Select a stylist
6. Go to "Services" tab
7. Select a service
8. Click "Book Now"
9. Select date/time
10. Confirm booking

### Step 4: Stylist Accepts Booking
1. In stylist app, go to "My Bookings" tab
2. You'll see the pending booking
3. Click "Accept" to confirm
4. Click "Mark Complete" when done

## 🔑 Default Credentials

### Admin
```
Email: admin@salon.com
Password: admin123
```

### Test User
```
Email: user@example.com
Password: password123
```

### Test Stylist (Pre-created)
```
Email: sarah@salon.com
Password: stylist123
```

## 📊 Booking Status Flow

```
Client Books → Pending (Stylist sees this)
                  ↓
Stylist Accepts → Confirmed
                  ↓
Stylist Completes → Completed
```

## 🎯 Key Features

### Stylist App
- ✅ Login with credentials
- ✅ View pending bookings
- ✅ Accept/decline bookings
- ✅ Mark as completed
- ✅ Filter by status
- ✅ View profile & stats

### Admin Panel
- ✅ Create stylist accounts
- ✅ Manage stylists
- ✅ View all bookings
- ✅ Real-time updates

### User App
- ✅ Browse stylists
- ✅ Book appointments
- ✅ Manage bookings
- ✅ View profile

## 🔧 Troubleshooting

### Stylist Can't Login
```
✓ Check email and password
✓ Verify account is active
✓ Ensure backend is running on port 3001
```

### Bookings Not Showing
```
✓ Refresh app (press 'r' in terminal)
✓ Verify booking is assigned to stylist
✓ Check backend logs
```

### Connection Failed
```
✓ Verify backend running: http://10.220.244.90:3001
✓ Check device is on same WiFi
✓ Verify IP in config/api.js
```

## 📝 Notes

- Stylists can only see their own bookings
- Admin can create multiple stylist accounts
- Each stylist needs unique email
- Default password: `stylist123`
- Passwords should be changed after first login

## 🎉 You're Ready!

The complete salon booking system is now ready with:
- Admin management panel
- Client booking app
- Stylist management app
- Real-time updates via WebSocket

Enjoy! 🎨
