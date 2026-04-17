# Quick Reference - Token Changes

## What Changed

### Before (Broken)
```javascript
// MyBookingsScreen.js - Tried to get token from AsyncStorage
const storedToken = await AsyncStorage.getItem('userToken');
// Result: AsyncStorage error, token = null, booking fails
```

### After (Fixed)
```javascript
// MyBookingsScreen.js - Gets token from navigation params
const { userToken } = route.params || {};
// Result: Token available immediately, booking works
```

---

## Key Changes Summary

### 1. App.js
```javascript
// Added state
const [userToken, setUserToken] = useState('');
const [userName, setUserName] = useState('');
const [userEmail, setUserEmail] = useState('');

// Added handler
const handleLogin = (token, name, email) => {
  setUserToken(token);
  setUserName(name);
  setUserEmail(email);
  setIsLoggedIn(true);
};

// Pass to navigation
<AppStack userToken={userToken} userName={userName} userEmail={userEmail} onLogout={handleLogout} />
```

### 2. LoginScreen.js
```javascript
// Before
await AsyncStorage.setItem('userToken', data.token);

// After
if (setIsLoggedIn) {
  setIsLoggedIn(data.token, data.name, data.email);
}
```

### 3. MyBookingsScreen.js
```javascript
// Before
const [token, setToken] = useState('');
const storedToken = await AsyncStorage.getItem('userToken');

// After
const { userToken } = route.params || {};
// Use userToken directly
```

### 4. ProfileScreen.js
```javascript
// Before
const [name, setName] = useState('John Doe');
const [email, setEmail] = useState('john@example.com');

// After
const { userName, userEmail, onLogout } = route.params || {};
const [name, setName] = useState(userName || 'User');
const [email, setEmail] = useState(userEmail || 'user@example.com');
```

---

## Token Flow in One Picture

```
Login → App State → Navigation Params → All Screens → API Calls
```

---

## Files to Check

1. `salon-user-app/App.js` - Token state
2. `salon-user-app/screens/LoginScreen.js` - Pass token
3. `salon-user-app/screens/MyBookingsScreen.js` - Use token
4. `salon-user-app/screens/ProfileScreen.js` - Use user data
5. `salon-user-app/screens/BookingScreen.js` - Use token for API

---

## How to Verify It Works

### Check 1: Token in State
```javascript
// In App.js, after login
console.log('Token:', userToken); // Should show JWT token
console.log('Name:', userName);   // Should show user name
console.log('Email:', userEmail); // Should show user email
```

### Check 2: Token in Params
```javascript
// In any screen
const { userToken } = route.params || {};
console.log('Token from params:', userToken); // Should show JWT token
```

### Check 3: API Call Works
```javascript
// In BookingScreen
const response = await fetch(`${API_BASE_URL}/api/bookings`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
  },
  body: JSON.stringify({...}),
});
// Should return 200 OK, not 401 Unauthorized
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Token is empty | Not passed from login | Check LoginScreen calls setIsLoggedIn |
| Token is undefined | Not in route.params | Check App.js passes initialParams |
| Booking fails | Token not in header | Check BookingScreen uses userToken |
| My Bookings empty | Token not passed | Check App.js passes to MyBookingsScreen |
| Profile shows placeholder | User data not passed | Check App.js passes userName/Email |
| Logout doesn't work | onLogout not passed | Check App.js passes onLogout |

---

## Testing Commands

```bash
# Terminal 1: Backend
cd salon-admin-panel/server && npm start

# Terminal 2: Admin Panel
cd salon-admin-panel && npm run dev

# Terminal 3: User App
cd salon-user-app && npm start

# Terminal 4: Stylist App
cd salon-stylist-app && npm start
```

---

## Expected Console Logs

### After Login
```
LOG  Token status: {"token": "eyJhbGciOiJIUzI1NiIs...", "tokenLength": 200}
```

### When Creating Booking
```
LOG  Creating booking with token: eyJhbGciOiJIUzI1NiIs...
```

### When Fetching Bookings
```
LOG  Fetching bookings with token: eyJhbGciOiJIUzI1NiIs...
```

### No More Errors
```
✓ No "AsyncStorage error" warnings
✓ No "authentication token not found" errors
✓ No "NAVIGATE action not handled" errors
```

---

## Deployment Checklist

- [ ] All 5 files modified correctly
- [ ] No syntax errors (getDiagnostics passed)
- [ ] Token flows through all screens
- [ ] Booking API calls work
- [ ] My Bookings loads correctly
- [ ] Profile shows real user data
- [ ] Logout clears state
- [ ] Can login again after logout
- [ ] No AsyncStorage calls
- [ ] No console errors

---

## Success Criteria

✓ User can login
✓ User can browse stylists
✓ User can create booking
✓ User can view bookings
✓ User can view profile
✓ User can logout
✓ No errors in console
✓ No AsyncStorage warnings
✓ Token always available
✓ All API calls work

---

**Status**: Ready to test
