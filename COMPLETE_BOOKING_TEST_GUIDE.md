# Complete Booking System Test Guide

## System Status
- ✓ Backend: Running on port 3001
- ✓ Admin Panel: Running on port 5173
- ✓ User App: Ready to test
- ✓ Stylist App: Ready to test
- ✓ Database: Connected

## Test Credentials

### User App
- Email: `user@example.com`
- Password: `password123`

### Stylist App
- Email: `sarah@salon.com`
- Password: `stylist123`

### Admin Panel
- Email: `admin@salon.com`
- Password: `admin123`

## Complete Booking Workflow Test

### Step 1: Start All Services
```bash
# Terminal 1: Backend
cd salon-admin-panel/server
npm start

# Terminal 2: Admin Panel
cd salon-admin-panel
npm run dev

# Terminal 3: User App (Expo)
cd salon-user-app
npm start

# Terminal 4: Stylist App (Expo)
cd salon-stylist-app
npm start
```

### Step 2: Test User App Login
1. Open Expo Go on your device
2. Scan QR code for user app (port 8081)
3. App loads and shows Login screen
4. Enter credentials:
   - Email: `user@example.com`
   - Password: `password123`
5. Tap "Sign In"
6. **Expected**: Navigate to Home screen (no errors)
7. **Check**: Token is stored in App state (not AsyncStorage)

### Step 3: Browse Stylists
1. Tap "Stylists" tab
2. See list of available stylists
3. Each stylist shows:
   - Name
   - Specialization
   - Rating
   - Phone number
   - Availability status
4. **Expected**: All stylists load without errors

### Step 4: Create a Booking
1. Tap on any stylist card
2. Navigate to Booking screen
3. Fill in booking details:
   - **Date**: 2026-03-20 (or any future date)
   - **Time**: Select any available time (09:00, 10:00, etc.)
   - **Service**: Select a service from the list
   - **Notes**: Optional - add any special requests
4. Tap "Confirm Booking"
5. **Expected**: Success alert "Booking confirmed!"
6. **Check**: Navigate to "My Bookings" screen
7. **Verify**: New booking appears in the list

### Step 5: View My Bookings
1. Tap "My Bookings" tab
2. See list of all user's bookings
3. Each booking shows:
   - Service name
   - Stylist name
   - Date and time
   - Price
   - Status (pending/confirmed/completed/cancelled)
   - Notes (if any)
4. **Expected**: Bookings load without errors
5. **Check**: Token is being used correctly

### Step 6: View Profile
1. Tap "Profile" tab
2. See user information:
   - User's name (from login)
   - User's email (from login)
   - Phone number
3. **Expected**: Shows actual user data from login
4. **Check**: Not showing placeholder data

### Step 7: Test Logout
1. Tap "Logout" button
2. Confirm logout in alert
3. **Expected**: Return to Login screen
4. **Check**: All state is cleared
5. **Verify**: Can login again with same credentials

### Step 8: Test Stylist App
1. Open Expo Go on another device (or same device in new terminal)
2. Scan QR code for stylist app (port 8082)
3. Login with:
   - Email: `sarah@salon.com`
   - Password: `stylist123`
4. **Expected**: Navigate to Bookings screen
5. **Check**: See bookings created by users
6. **Verify**: Can view booking details

### Step 9: Test Admin Panel
1. Open browser: `http://localhost:5173`
2. Login with:
   - Email: `admin@salon.com`
   - Password: `admin123`
3. Navigate to "Bookings" page
4. **Expected**: See all bookings from all users
5. **Verify**: Booking created in Step 4 appears here

## Expected Results

### ✓ Successful Booking Flow
```
Login → Home → Stylists → Select Stylist → Booking Form → Confirm → My Bookings
```

### ✓ No Errors
- No "authentication token not found" errors
- No "AsyncStorage error" warnings
- No "NAVIGATE action not handled" errors
- No "RESET action not handled" errors

### ✓ Token Management
- Token is available in all screens
- Token is used in all API calls
- Token is cleared on logout
- No AsyncStorage calls

### ✓ Data Persistence
- Bookings are saved to database
- Bookings appear in My Bookings screen
- Bookings appear in Admin panel
- Bookings appear in Stylist app

## Troubleshooting

### Issue: "authentication token not found" error
**Solution**: 
- Logout and login again
- Check that token is being passed through navigation params
- Verify App.js state is being updated

### Issue: Booking screen shows empty token
**Solution**:
- Check StylistsScreen is passing userToken to BookingScreen
- Verify route.params.userToken is not undefined
- Check console logs for token status

### Issue: My Bookings shows no bookings
**Solution**:
- Verify token is being passed to MyBookingsScreen
- Check API endpoint `/api/users/bookings` is working
- Verify user has created at least one booking

### Issue: Profile shows placeholder data
**Solution**:
- Verify userName and userEmail are passed from App.js
- Check route.params in ProfileScreen
- Verify login is passing name and email to setIsLoggedIn

### Issue: Logout doesn't work
**Solution**:
- Verify onLogout function is passed to ProfileScreen
- Check handleLogout in App.js is clearing state
- Verify navigation switches back to AuthStack

## Performance Notes

- First load may take 2-3 seconds (normal for React Native)
- Booking creation should complete in 1-2 seconds
- My Bookings should load in 1-2 seconds
- No lag or freezing should occur

## Security Notes

- Token is stored in React state (memory only)
- Token is cleared on logout
- Token is passed via navigation params (not stored on device)
- No sensitive data in AsyncStorage
- All API calls use Bearer token authentication

## Next Steps After Testing

1. If all tests pass: System is ready for production
2. If any tests fail: Check error logs and troubleshooting section
3. Consider adding:
   - Push notifications for booking confirmations
   - Real-time updates using WebSocket
   - Payment integration
   - Review and rating system
