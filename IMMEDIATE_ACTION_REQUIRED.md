# Immediate Action Required - Token Debug

## Current Status
- ✗ Token showing as empty in BookingScreen
- ✗ StyleSheet error (transient - should resolve on reload)
- ⚠️ Token not flowing through navigation stack

## What to Do Now

### Step 1: Restart the App
```bash
# In the terminal running the user app:
# Press 'r' to reload
# Or restart completely:
cd salon-user-app
npm start
```

### Step 2: Watch Console Logs
Open Expo Go and watch for these logs:

1. **After Login:**
   ```
   LOG  Login successful, received token: eyJhbGciOiJIUzI1NiIs...
   LOG  App.js handleLogin called with token: eyJhbGciOiJIUzI1NiIs...
   ```

2. **Navigate to Stylists:**
   ```
   LOG  StylistsScreen - Token from params: eyJhbGciOiJIUzI1NiIs...
   ```

3. **Select Stylist:**
   ```
   LOG  Token received in BookingScreen: eyJhbGciOiJIUzI1NiIs...
   ```

### Step 3: Identify the Problem
- If token is `EMPTY` in step 1 → Backend not returning token
- If token is `EMPTY` in step 2 → App.js not passing to StylistsScreen
- If token is `EMPTY` in step 3 → StylistsScreen not passing to BookingScreen

### Step 4: Report Findings
Tell me which logs you see and which are missing.

## Quick Checklist

- [ ] Restart app
- [ ] Login with user@example.com / password123
- [ ] Watch console for logs
- [ ] Navigate to Stylists tab
- [ ] Select a stylist
- [ ] Check console logs
- [ ] Report which logs appeared and which didn't

## Expected Console Output

### Successful Flow
```
LOG  Login successful, received token: eyJhbGciOiJIUzI1NiIs...
LOG  Login response data: {"token": "present", "name": "John Doe", "email": "john@example.com"}
LOG  App.js handleLogin called with token: eyJhbGciOiJIUzI1NiIs...
LOG  App.js handleLogin called with name: John Doe
LOG  App.js handleLogin called with email: john@example.com
LOG  StylistsScreen - Token from params: eyJhbGciOiJIUzI1NiIs...
LOG  Token received in BookingScreen: eyJhbGciOiJIUzI1NiIs...
```

### Problem Flow
```
LOG  Login successful, received token: EMPTY
LOG  Login response data: {"token": "missing", "name": "John Doe", "email": "john@example.com"}
LOG  App.js handleLogin called with token: EMPTY
LOG  App.js handleLogin called with name: John Doe
LOG  App.js handleLogin called with email: john@example.com
LOG  StylistsScreen - Token from params: EMPTY
LOG  Token received in BookingScreen: EMPTY
ERROR  authentication token not found
```

## Files Modified for Debugging

1. `salon-user-app/App.js` - Added handleLogin logging
2. `salon-user-app/screens/LoginScreen.js` - Added login response logging
3. `salon-user-app/screens/StylistsScreen.js` - Added token params logging
4. `salon-user-app/screens/BookingScreen.js` - Added token received logging

## Next Steps After Debugging

Once you identify where the token is lost:

1. **If token is empty from API:**
   - Check backend `/api/users/login` endpoint
   - Verify it's returning token in response
   - Test with curl or Postman

2. **If token is empty in App.js:**
   - Check LoginScreen is calling setIsLoggedIn
   - Verify setIsLoggedIn is passed from AuthStack
   - Check App.js handleLogin is being called

3. **If token is empty in StylistsScreen:**
   - Check App.js is passing token to MainTabNavigator
   - Verify initialParams includes userToken
   - Check StylistsScreen is receiving route.params

4. **If token is empty in BookingScreen:**
   - Check StylistsScreen is passing token when navigating
   - Verify navigation.navigate includes userToken
   - Check BookingScreen is receiving route.params

## Support

For detailed debugging guide, see: `DEBUG_TOKEN_FLOW.md`

For complete documentation, see: `TOKEN_FIX_DOCUMENTATION_INDEX.md`

---

**Action**: Restart app and report console logs
