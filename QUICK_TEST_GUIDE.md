# Quick Test Guide - 5 Minutes

## Start Here

### Step 1: Verify All Services Running
```bash
# Check backend
curl http://192.168.12.156:3001/api/health

# Should see: {"status":"ok",...}
```

### Step 2: Test User App

**Login**
```
Email: user@example.com
Password: password123
```

**Test Booking**
1. Tap "Stylists" tab
2. Tap on any stylist
3. Enter date: 2026-03-20
4. Select time: 10:00
5. Select service
6. Tap "Confirm Booking"
7. Go to "My Bookings" to see it

### Step 3: Test Stylist App

**Login**
```
Email: sarah@salon.com
Password: stylist123
```

**Test Booking Management**
1. See pending bookings
2. Tap "Accept" on a booking
3. See it move to "Confirmed"
4. Tap "Mark Complete"
5. See it move to "Completed"

### Step 4: Verify Real-Time Updates

1. Create booking in user app
2. Check stylist app (should see new booking)
3. Accept in stylist app
4. Check user app (status should update)

---

## Test Credentials

| App | Email | Password |
|-----|-------|----------|
| User | user@example.com | password123 |
| Stylist | sarah@salon.com | stylist123 |
| Admin | admin@salon.com | admin123 |

---

## What Should Work

- [x] Login
- [x] Browse stylists
- [x] Create booking
- [x] View bookings
- [x] Accept/decline booking
- [x] Mark complete
- [x] Real-time updates
- [x] Navigation

---

## If Something Doesn't Work

### Login fails
- Check credentials
- Verify backend is running
- Check network connection

### Can't navigate to booking
- Restart app
- Check if BookingScreen is registered
- Verify navigation structure

### Bookings not updating
- Check if stylist app is running
- Verify auto-refresh is working
- Try manual refresh

### AsyncStorage errors
- These are non-critical warnings
- App should still work
- Ignore if functionality works

---

## Success Indicators

✓ Login works
✓ Can browse stylists
✓ Can create booking
✓ Can view bookings
✓ Can manage bookings
✓ Real-time updates work
✓ Navigation smooth

---

## System Status

- Backend: ✓ Running
- User App: ✓ Running
- Stylist App: ✓ Running
- Admin Panel: ✓ Running
- Database: ✓ Connected

---

## Ready to Test!

All systems are running and ready. Start with the user app login and follow the steps above.

Good luck!
