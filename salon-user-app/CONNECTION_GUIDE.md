# Connection Guide for Salon User App

## Issue Fixed
The app was trying to connect to `localhost:3001` which doesn't work on physical devices or emulators. This has been fixed to use your machine's IP address.

## Your Machine IP Address
**10.220.244.90**

## What Changed
- Created `config/api.js` with the correct IP address
- Updated all screens to use the IP-based API URL
- All API calls now go to: `http://10.220.244.90:3001`

## How to Use

### On Physical Device (iOS/Android)
1. Make sure your device is on the same WiFi network as your computer
2. Open Expo Go app
3. Scan the QR code from the terminal
4. App will connect to the backend at `10.220.244.90:3001`

### On Emulator
1. Android Emulator: Should automatically resolve `10.220.244.90`
2. iOS Simulator: May need special configuration

## Test Credentials
- Email: `user@example.com`
- Password: `password123`

Or create a new account!

## If Connection Still Fails
1. Verify your computer's IP: Run `ipconfig` in terminal
2. Update `salon-user-app/config/api.js` with the correct IP
3. Restart the Expo app (press `r` in terminal)
4. Verify backend is running on port 3001

## Backend Status
- Backend API: http://10.220.244.90:3001
- WebSocket: ws://10.220.244.90:3001
- Admin Panel: http://localhost:5173 (local only)
