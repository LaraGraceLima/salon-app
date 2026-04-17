# Stylist App - Testing Guide

## Quick Start

### Prerequisites
1. Backend running on `http://192.168.12.156:3001`
2. Database imported with salon_admin schema
3. Stylist app running on Expo

### Test Credentials
- Email: `sarah@salon.com`
- Password: `stylist123`

## Step-by-Step Testing

### 1. Login Test
1. Open Stylist App
2. Enter email: `sarah@salon.com`
3. Enter password: `stylist123`
4. Tap "Sign In"
5. **Expected**: App navigates to Bookings tab, bookings load immediately

### 2. Bookings Display Test
1. After login, you should see the Bookings tab
2. Check if any bookings are displayed
3. **Expected**: 
   - Bookings load without errors
   - No "No token available" warnings
   - No AsyncStorage errors
   - Bookings show client name, service, date/time, status, and price

### 3. Tab Navigation Test
1. Tap on "Profile" tab
2. Verify profile information displays
3. Tap back on "Bookings" tab
4. **Expected**: 
   - Bookings still display
   - No errors when switching tabs
   - Token remains available

### 4. Booking Status Update Test
1. If there are pending bookings:
   - Tap "Accept" button on a pending booking
   - **Expected**: Alert shows "Success, Booking confirmed!"
   - Booking status changes to "confirmed"
   - Booking moves to "Confirmed" filter

2. If there are confirmed bookings:
   - Tap "Mark Complete" button
   - **Expected**: Alert shows "Success, Booking completed!"
   - Booking status changes to "completed"
   - Booking moves to "Completed" filter

### 5. Filter Test
1. Tap on different filter buttons: "Pending", "Confirmed", "Completed", "Cancelled"
2. **Expected**: List updates to show only bookings with that status

### 6. Auto-Refresh Test
1. Open Bookings tab
2. Wait 5 seconds
3. **Expected**: Bookings list refreshes automatically (you may see a brief loading state)

### 7. Logout Test
1. Tap on "Profile" tab
2. Scroll down to "Logout" button
3. Tap "Logout"
4. Tap "Logout" in the confirmation alert
5. **Expected**:
   - No "RESET action not handled" error
   - App returns to Login screen
   - All state is cleared

### 8. Re-login Test
1. After logout, login again with same credentials
2. **Expected**: 
   - Login works
   - Bookings load immediately
   - Full flow works again

## Console Logs to Check

When testing, check the console for these expected logs:

### On Login
```
Stylist App - Login with token: [first 20 chars of token]...
```

### On Bookings Screen
```
BookingsScreen - Token from params: [first 20 chars of token]...
Fetching stylist bookings with token: [first 20 chars of token]...
Bookings fetched: [number of bookings]
```

### On Logout
```
(No errors, clean state reset)
```

## Errors to Watch For

❌ **Should NOT see these errors:**
- "RESET action not handled"
- "AsyncStorage error: Native module is null"
- "No token available for fetching bookings"
- "Non-serializable values were found in the navigation state"

✅ **Should see these logs:**
- Token being passed correctly
- Bookings fetching successfully
- Clean logout without errors

## Troubleshooting

### Bookings Not Loading
1. Check if backend is running: `http://192.168.12.156:3001/api/health`
2. Check if token is being passed (look for console logs)
3. Verify stylist has bookings in database

### Logout Not Working
1. Check console for errors
2. Verify ProfileScreen is receiving `onLogout` function
3. Try restarting the app

### Token Not Available
1. Check if login was successful
2. Verify token is being set in App.js state
3. Check if BookingsScreen is receiving token in params

## Success Criteria

✅ All tests pass when:
1. Login works without errors
2. Bookings load immediately after login
3. Tab switching doesn't cause errors
4. Booking status updates work
5. Filters work correctly
6. Auto-refresh works (5-second interval)
7. Logout works without errors
8. Re-login works after logout
9. No AsyncStorage errors
10. No navigation errors
