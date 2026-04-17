# Salon Stylist App

A React Native mobile app for salon stylists to manage their bookings and client appointments.

## Features

✅ **Stylist Authentication**
- Login with credentials provided by admin
- Secure JWT-based authentication

✅ **Booking Management**
- View all pending bookings
- Accept or decline client bookings
- Mark bookings as completed
- Filter bookings by status (pending, confirmed, completed, cancelled)

✅ **Real-time Updates**
- Auto-refresh bookings every 5 seconds
- Instant status updates

✅ **Profile Management**
- View stylist profile information
- Display ratings and reviews
- Show professional statistics

## Getting Started

### Prerequisites
- Node.js and npm installed
- Expo CLI installed
- Expo Go app on your mobile device or emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the app:
```bash
npm start
```

3. Scan the QR code with Expo Go app (iOS/Android)

## Login Credentials

**Default Stylist Credentials:**
- Email: `sarah@salon.com` (or any stylist email from database)
- Password: `stylist123`

## How It Works

### Admin Creates Stylist Account
1. Admin logs into the admin panel
2. Goes to Stylists section
3. Creates a new stylist account with email and password
4. Stylist receives login credentials

### Stylist Workflow
1. **Login**: Stylist logs in with provided credentials
2. **View Bookings**: See all pending bookings from clients
3. **Accept/Decline**: Accept or decline pending bookings
4. **Manage**: Mark confirmed bookings as completed
5. **Track**: View booking history and statistics

## App Structure

```
salon-stylist-app/
├── App.js                 # Main navigation setup
├── config/
│   └── api.js            # API configuration
├── screens/
│   ├── LoginScreen.js    # Stylist login
│   ├── BookingsScreen.js # Booking management
│   └── ProfileScreen.js  # Stylist profile
├── package.json
└── app.json
```

## API Endpoints Used

- `POST /api/stylists/login` - Stylist authentication
- `GET /api/bookings` - Fetch all bookings
- `PUT /api/bookings/:id` - Update booking status

## Booking Status Flow

```
pending → confirmed → completed
   ↓
cancelled
```

- **Pending**: New booking awaiting stylist acceptance
- **Confirmed**: Stylist accepted the booking
- **Completed**: Service completed
- **Cancelled**: Booking cancelled by stylist or admin

## Backend Connection

The app connects to the backend API at:
- **IP**: 10.220.244.90
- **Port**: 3001
- **Base URL**: http://10.220.244.90:3001

## Troubleshooting

### Connection Failed
- Ensure backend server is running on port 3001
- Verify your device is on the same WiFi network
- Check IP address in `config/api.js`

### Login Failed
- Verify credentials with admin
- Ensure stylist account exists in database
- Check backend server logs

### Bookings Not Loading
- Refresh the app (press 'r' in terminal)
- Verify backend API is running
- Check network connection

## Development

### Running on Different Ports
```bash
npm start -- --port 8082
```

### Debugging
- Press 'j' in terminal to open debugger
- Use React Native Debugger for advanced debugging

## Support

For issues or questions, contact the admin or development team.
