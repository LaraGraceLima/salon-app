# Dual Device Setup Guide - User & Stylist Apps

## Overview

You can now run both the User App and Stylist App simultaneously on two different devices to test the complete booking workflow.

## ✅ All Services Running

```
✅ Backend API: http://10.220.244.90:3001
✅ WebSocket: ws://10.220.244.90:3001
✅ Admin Panel: http://localhost:5173
✅ User App (Expo): http://localhost:8081 - OFFLINE MODE
✅ Stylist App (Expo): http://localhost:8082 - OFFLINE MODE
```

## 📱 Setup Instructions

### Device 1: User App (Client)

1. **Open Expo Go** on your first device
2. **Scan QR Code** from terminal showing:
   ```
   › Metro waiting on exp://192.168.12.156:8081
   › Scan the QR code above with Expo Go
   ```
3. **Wait for app to load** (may take 30-60 seconds)
4. **Login with:**
   - Email: `user@example.com`
   - Password: `password123`
5. **You'll see:**
   - Home dashboard with featured stylists
   - Browse stylists and services
   - Book appointments

### Device 2: Stylist App

1. **Open Expo Go** on your second device
2. **Scan QR Code** from terminal showing:
   ```
   › Metro waiting on exp://192.168.12.156:8082
   › Scan the QR code above with Expo Go
   ```
3. **Wait for app to load** (may take 30-60 seconds)
4. **Login with:**
   - Email: `sarah@salon.com`
   - Password: `stylist123`
5. **You'll see:**
   - My Bookings tab with pending bookings
   - Accept/decline bookings
   - Mark as completed

## 🔄 Complete Workflow

### Step 1: User Books Appointment
1. On Device 1 (User App)
2. Go to "Stylists" tab
3. Select a stylist (e.g., Sarah Williams)
4. Go to "Services" tab
5. Select a service (e.g., Hair Cut)
6. Click "Book Now"
7. Select date and time
8. Confirm booking

### Step 2: Stylist Sees Booking
1. On Device 2 (Stylist App)
2. Go to "My Bookings" tab
3. You'll see the new booking as "pending"
4. Booking appears in real-time via WebSocket

### Step 3: Stylist Accepts Booking
1. On Device 2 (Stylist App)
2. Click "Accept" on the pending booking
3. Booking status changes to "confirmed"

### Step 4: User Sees Update
1. On Device 1 (User App)
2. Go to "My Bookings" tab
3. Booking status updates to "confirmed" in real-time

### Step 5: Stylist Completes Booking
1. On Device 2 (Stylist App)
2. Click "Mark Complete" on the confirmed booking
3. Booking status changes to "completed"

### Step 6: User Sees Completion
1. On Device 1 (User App)
2. Booking status updates to "completed"

## 🔑 Test Credentials

### User (Device 1)
```
Email: user@example.com
Password: password123
```

### Stylist (Device 2)
```
Email: sarah@salon.com
Password: stylist123
```

### Other Available Stylists
```
emily@salon.com - stylist123
michael@salon.com - stylist123
nel@gmail.com - stylist123
an@salon.com - stylist123
```

## ⚙️ Offline Mode

Both apps are running in **offline mode** to avoid:
- Remote update download failures
- Java/Android errors
- Network dependency issues

This means:
- ✅ Apps work without internet
- ✅ No remote update checks
- ✅ Faster startup
- ✅ More reliable on multiple devices

## 🔌 Real-time Features

### WebSocket Enabled
- Bookings update in real-time
- Status changes appear instantly
- No need to refresh
- Multiple devices stay synchronized

### Live Updates
- User sees booking accepted immediately
- Stylist sees new bookings instantly
- Admin panel updates in real-time
- All changes broadcast via WebSocket

## 📊 Admin Panel

While testing on devices, you can also:
1. Open http://localhost:5173
2. Login: `admin@salon.com` / `admin123`
3. View all bookings in real-time
4. Create new stylist accounts
5. Manage clients and services

## 🐛 Troubleshooting

### App Won't Load
- Wait 30-60 seconds for Metro bundler
- Check terminal for errors
- Press 'r' to reload app

### Can't Connect to Backend
- Verify backend is running on port 3001
- Check IP address: 10.220.244.90
- Ensure devices are on same WiFi network

### Booking Not Appearing
- Refresh app (press 'r' in terminal)
- Check WebSocket connection
- Verify backend is running

### Login Failed
- Verify credentials are correct
- Check if account exists in database
- Ensure backend is running

## 📝 Notes

- Both apps can run simultaneously
- Each device needs Expo Go installed
- Devices must be on same WiFi network
- Backend must be running on port 3001
- Admin panel runs on localhost (computer only)

## ✅ You're Ready!

Both apps are now ready for simultaneous testing. Scan the QR codes on two different devices and test the complete booking workflow!
