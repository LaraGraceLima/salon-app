# Quick Booking Test - Step by Step

## Test Credentials

**User App:**
- Email: `user@example.com`
- Password: `password123`

**Stylist App:**
- Email: `sarah@salon.com`
- Password: `stylist123`

---

## Test Workflow

### Step 1: User Creates Booking (2 min)

1. Open User App
2. Login with user@example.com / password123
3. Tap "Stylists" tab
4. Select "Sarah Williams"
5. Fill booking details:
   - Date: 2026-03-20
   - Time: 10:00
   - Service: Hair Cut
   - Notes: "Please trim the sides"
6. Tap "Confirm Booking"

**Expected**: 
- ✓ Success alert "Booking confirmed!"
- ✓ Automatically navigates to "My Bookings" tab
- ✓ Booking appears in the list

---

### Step 2: Verify Booking in My Bookings (1 min)

1. You should already be on "My Bookings" tab
2. Look for the booking you just created

**Expected**:
- ✓ Shows: "Hair Cut" service
- ✓ Shows: "Sarah Williams" stylist
- ✓ Shows: Date "3/20/2026"
- ✓ Shows: Time "10:00 AM"
- ✓ Shows: Status "pending"
- ✓ Shows: Price "$35.00"
- ✓ Shows: Notes "Please trim the sides"

---

### Step 3: Stylist Sees Booking (2 min)

1. Open Stylist App (different device or new terminal)
2. Login with sarah@salon.com / stylist123
3. Tap "Bookings" tab
4. Make sure "Pending" filter is selected

**Expected**:
- ✓ Shows the booking you just created
- ✓ Shows: "John Doe" (client name)
- ✓ Shows: "Hair Cut" service
- ✓ Shows: Date "3/20/2026"
- ✓ Shows: Time "10:00 AM"
- ✓ Shows: Status "pending"
- ✓ Shows: Price "$35.00"
- ✓ Shows: Notes "Please trim the sides"

---

### Step 4: Stylist Accepts Booking (1 min)

1. In Stylist App, tap "Accept" button on the booking
2. See success alert "Booking confirmed!"

**Expected**:
- ✓ Alert shows success
- ✓ Booking moves to "Confirmed" tab
- ✓ Status changes to "confirmed"

---

### Step 5: User Sees Updated Status (1 min)

1. Go back to User App
2. Go to "My Bookings" tab
3. Pull down to refresh (or wait for auto-refresh)

**Expected**:
- ✓ Booking status changed to "confirmed"
- ✓ All other details remain the same

---

## Success Checklist

- [ ] User can create booking with notes
- [ ] Booking saves to database
- [ ] User automatically navigates to My Bookings
- [ ] Booking appears in My Bookings with all details
- [ ] Stylist sees only their bookings (not all bookings)
- [ ] Stylist can see client name and notes
- [ ] Stylist can accept booking
- [ ] Status updates in real-time
- [ ] User sees updated status

---

## Troubleshooting

### Issue: Booking not appearing in My Bookings
**Solution**: 
- Refresh the page (pull down)
- Check backend logs for errors
- Verify token is being passed

### Issue: Stylist doesn't see booking
**Solution**:
- Verify stylist_id matches (Sarah = 1)
- Check backend is using `/api/stylists/bookings` endpoint
- Verify token is valid

### Issue: Status not updating
**Solution**:
- Refresh My Bookings page
- Check backend is running
- Verify booking exists in database

---

## Expected Results

✓ Complete end-to-end booking workflow
✓ User creates booking → Navigates to My Bookings
✓ Stylist sees booking in their app
✓ Stylist accepts booking
✓ User sees updated status

**Total Time**: ~7 minutes

---

**Ready to test? Start with Step 1!**
