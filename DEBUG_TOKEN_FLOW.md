# Debug Token Flow - Console Logs Guide

## What Changed

Added comprehensive logging to track token flow through the app. This will help identify where the token is being lost.

## Console Logs to Watch

### 1. After Login (LoginScreen.js)
```
LOG  Login successful, received token: eyJhbGciOiJIUzI1NiIs...
LOG  Login response data: {"token": "present", "name": "John Doe", "email": "john@example.com"}
```

**What it means:**
- ✓ API returned a token
- ✓ Token is not empty
- ✓ Name and email received

**If you see:**
- `"token": "missing"` → API didn't return token
- `"token": "EMPTY"` → API returned empty token
- No logs → Login didn't complete

### 2. App State Update (App.js)
```
LOG  App.js handleLogin called with token: eyJhbGciOiJIUzI1NiIs...
LOG  App.js handleLogin called with name: John Doe
LOG  App.js handleLogin called with email: john@example.com
```

**What it means:**
- ✓ LoginScreen called setIsLoggedIn with token
- ✓ App.js received the token
- ✓ State is being updated

**If you see:**
- `token: EMPTY` → Token wasn't passed from LoginScreen
- No logs → setIsLoggedIn wasn't called

### 3. Stylists Screen (StylistsScreen.js)
```
LOG  StylistsScreen - Token from params: eyJhbGciOiJIUzI1NiIs...
```

**What it means:**
- ✓ Token was passed through navigation params
- ✓ StylistsScreen received it

**If you see:**
- `Token from params: EMPTY` → Token wasn't passed to StylistsScreen
- No logs → StylistsScreen didn't mount

### 4. Booking Screen (BookingScreen.js)
```
LOG  Token received in BookingScreen: eyJhbGciOiJIUzI1NiIs...
```

**What it means:**
- ✓ Token was passed to BookingScreen
- ✓ Ready to create booking

**If you see:**
- `No token in route.params` → Token wasn't passed from StylistsScreen
- No logs → BookingScreen didn't mount

## Complete Flow Logs

### Successful Login Flow
```
1. User enters email/password
2. LoginScreen.js:
   LOG  Login successful, received token: eyJhbGciOiJIUzI1NiIs...
   LOG  Login response data: {"token": "present", "name": "John Doe", "email": "john@example.com"}

3. App.js:
   LOG  App.js handleLogin called with token: eyJhbGciOiJIUzI1NiIs...
   LOG  App.js handleLogin called with name: John Doe
   LOG  App.js handleLogin called with email: john@example.com

4. Navigation switches to AppStack
5. User navigates to Stylists tab

6. StylistsScreen.js:
   LOG  StylistsScreen - Token from params: eyJhbGciOiJIUzI1NiIs...

7. User selects a stylist
8. Navigation to BookingScreen

9. BookingScreen.js:
   LOG  Token received in BookingScreen: eyJhbGciOiJIUzI1NiIs...

10. User creates booking
11. API call succeeds ✓
```

## Troubleshooting by Logs

### Scenario 1: Token is empty in BookingScreen
```
LOG  Token received in BookingScreen: EMPTY
```

**Possible causes:**
1. Token not passed from StylistsScreen
2. Token not in App state
3. Token not passed to StylistsScreen

**Check:**
- Look for `StylistsScreen - Token from params: EMPTY`
- Look for `App.js handleLogin called with token: EMPTY`
- Look for `Login successful, received token: EMPTY`

### Scenario 2: No logs from LoginScreen
```
(No "Login successful" log)
```

**Possible causes:**
1. Login failed
2. API error
3. Network error

**Check:**
- Look for error logs
- Check if Alert shows error message
- Verify backend is running

### Scenario 3: No logs from App.js
```
(No "App.js handleLogin called" log)
```

**Possible causes:**
1. setIsLoggedIn not called from LoginScreen
2. setIsLoggedIn is undefined
3. LoginScreen didn't receive setIsLoggedIn in params

**Check:**
- Look for "Login successful" log (if present, setIsLoggedIn should be called)
- Check if navigation switched to AppStack
- Verify AuthStack is passing setIsLoggedIn correctly

### Scenario 4: No logs from StylistsScreen
```
(No "StylistsScreen - Token from params" log)
```

**Possible causes:**
1. StylistsScreen didn't mount
2. useEffect didn't run
3. App crashed before reaching StylistsScreen

**Check:**
- Look for error logs
- Check if app is still running
- Try navigating to Stylists tab again

## How to Read Logs

### In Expo Go
1. Open Expo Go app
2. Tap on running app
3. Shake device to open menu
4. Tap "View logs"
5. Look for LOG messages

### In Terminal
```bash
# If running with npm start, logs appear in terminal
cd salon-user-app
npm start
# Watch terminal for LOG messages
```

### In Browser (Web)
1. Open browser console (F12)
2. Look for console.log messages
3. Filter by "Token" or "handleLogin"

## Expected vs Actual

### Expected Logs (Success)
```
✓ Login successful, received token: eyJhbGciOiJIUzI1NiIs...
✓ App.js handleLogin called with token: eyJhbGciOiJIUzI1NiIs...
✓ StylistsScreen - Token from params: eyJhbGciOiJIUzI1NiIs...
✓ Token received in BookingScreen: eyJhbGciOiJIUzI1NiIs...
✓ Booking created successfully
```

### Actual Logs (Problem)
```
✗ Login successful, received token: EMPTY
✗ App.js handleLogin called with token: EMPTY
✗ StylistsScreen - Token from params: EMPTY
✗ Token received in BookingScreen: EMPTY
✗ ERROR: authentication token not found
```

## Next Steps

1. **Restart the app** to apply logging changes
2. **Login** and watch console logs
3. **Navigate to Stylists** and check logs
4. **Select a stylist** and check logs
5. **Try to create booking** and check logs
6. **Compare** your logs with expected logs above
7. **Identify** where token is being lost
8. **Report** which logs are missing

## Common Issues & Solutions

### Issue: Token is empty everywhere
**Solution:**
- Check backend is returning token in login response
- Verify API endpoint `/api/users/login` is working
- Test with curl or Postman

### Issue: Token is present in App.js but empty in StylistsScreen
**Solution:**
- Check App.js is passing token to MainTabNavigator
- Verify initialParams includes userToken
- Check StylistsScreen is receiving route.params

### Issue: Token is present in StylistsScreen but empty in BookingScreen
**Solution:**
- Check StylistsScreen is passing token when navigating
- Verify navigation.navigate includes userToken
- Check BookingScreen is receiving route.params

### Issue: No logs at all
**Solution:**
- Restart app to apply logging changes
- Check console is open
- Verify app is running
- Try logging in again

## Removing Logs

Once debugging is complete, remove logs by:
1. Removing console.log statements
2. Or keeping them for future debugging

For now, keep them to help identify issues.

## Summary

The logging will help you see exactly where the token is being lost. Follow the logs and compare with expected flow to identify the problem.

**Key logs to watch:**
1. `Login successful, received token:` - Is API returning token?
2. `App.js handleLogin called with token:` - Is token reaching App state?
3. `StylistsScreen - Token from params:` - Is token passed to Stylists?
4. `Token received in BookingScreen:` - Is token passed to Booking?

If any of these show `EMPTY`, that's where the problem is.
