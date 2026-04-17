# Booking Feature - Complete Guide

## What's New

The booking system is now fully functional with real-time availability checking and backend integration.

## User App - Booking Flow

### Step 1: Login
- Email: `user@example.com`
- Password: `password123`
- Token is automatically saved to device storage

### Step 2: Browse Stylists
- Go to "Stylists" tab
- Search by name or filter by specialization
- Tap on any stylist card to book

### Step 3: Create Booking
1. **Select Date**: Enter date in YYYY-MM-DD format (e.g., 2025-03-20)
2. **Select Time**: Choose from 6 available time slots:
   - 09:00, 10:00, 11:00, 14:00, 15:00, 16:00
3. **Select Service**: Choose from available services:
   - Hair Cut ($25)
   - Hair Coloring ($50)
   - Styling ($35)
4. **Add Notes** (optional): Special requests or preferences
5. **Confirm Booking**: Submit to backend

### Step 4: View Bookings
- Go to "My Bookings" tab
- See all your bookings with:
  - Stylist name
  - Service name
  - Date and time
  - Price
  - Status (pending, confirmed, completed, cancelled)
  - Any notes you added
- Pull down to refresh

## Backend Features

### Availability Checking
- System prevents double-booking
- If stylist is already booked at selected time, booking is rejected
- Error message: "Stylist is not available at this time"

### Booking Status
- **pending**: Awaiting stylist confirmation
- **confirmed**: Stylist accepted the booking
- **completed**: Service completed
- **cancelled**: Booking cancelled

### Real-time Updates
- WebSocket broadcasts booking updates to all connected clients
- Admin panel shows new bookings instantly
- Stylist app receives booking notifications in real-time

## API Endpoints Used

### Create Booking
```
POST /api/bookings
Headers: Authorization: Bearer {token}
Body: {
  stylist_id: number,
  service_id: number,
  date_time: "YYYY-MM-DD HH:MM",
  notes: string (optional)
}
```

### Get User Bookings
```
GET /api/users/bookings
Headers: Authorization: Bearer {token}
```

### Get All Services
```
GET /api/services
```

## Testing Scenarios

### Scenario 1: Successful Booking
1. Login as user
2. Browse stylists
3. Select Sarah (or any stylist)
4. Enter date: 2025-03-20
5. Select time: 10:00
6. Select service: Hair Cut
7. Add note: "Please trim 2 inches"
8. Confirm booking
9. Expected: Success message, navigate to My Bookings
10. Verify booking appears in My Bookings tab

### Scenario 2: Double-Booking Prevention
1. Create first booking for Sarah on 2025-03-20 at 10:00
2. Try to create another booking for Sarah on same date/time
3. Expected: Error message "Stylist is not available at this time"

### Scenario 3: View Bookings
1. Login as user
2. Go to My Bookings tab
3. Expected: See all created bookings with full details
4. Pull down to refresh
5. Expected: Bookings update if status changed in admin panel

### Scenario 4: Stylist Accepts Booking
1. In User App: Create booking
2. In Stylist App: Login and view pending bookings
3. In Stylist App: Accept the booking
4. In User App: Go to My Bookings and refresh
5. Expected: Booking status changes to "confirmed"

## Troubleshooting

### Booking Not Appearing
- Check token is saved: AsyncStorage contains userToken
- Verify API connection: Check IP address in config/api.js
- Check backend logs for errors

### "Stylist is not available" Error
- Verify date/time format is correct (YYYY-MM-DD HH:MM)
- Check if another booking exists at that time
- Try different time slot

### Services Not Loading
- Verify backend is running
- Check /api/services endpoint returns data
- Verify network connection

## Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  stylist_id INT NOT NULL,
  service_id INT NOT NULL,
  date_time DATETIME NOT NULL,
  notes TEXT,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (stylist_id) REFERENCES stylists(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);
```

## Security Features

- JWT token authentication on all booking endpoints
- Token stored securely in AsyncStorage
- Password hashing with bcryptjs
- SQL injection prevention with parameterized queries
- CORS enabled for cross-origin requests

## Performance

- Real-time availability checking prevents conflicts
- WebSocket broadcasts reduce polling overhead
- Efficient database queries with proper indexing
- Token-based auth reduces session overhead

All features are production-ready!
