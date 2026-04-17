# Salon User App - React Native

A beautiful, interactive React Native mobile app for users to book salon services, browse stylists, and manage their appointments.

## 🎨 Features

- **User Authentication** - Sign up and login
- **Browse Stylists** - View all available stylists with ratings and specializations
- **Browse Services** - See all salon services with pricing and duration
- **Book Appointments** - Easy booking with date, time, and service selection
- **My Bookings** - Track all your appointments
- **User Profile** - Manage personal information and preferences
- **Real-time Updates** - Live data from backend
- **Beautiful UI** - Modern gradient design with smooth animations

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Expo CLI: `npm install -g expo-cli`
- Backend server running on `http://localhost:3001`

### Installation

1. **Install dependencies:**
```bash
cd salon-user-app
npm install
```

2. **Start the app:**
```bash
npm start
```

3. **Run on device/emulator:**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## 📱 Screens

### 1. Login Screen
- Email and password authentication
- Sign up link
- Demo credentials display
- Beautiful gradient background

### 2. Signup Screen
- Create new account
- Name, email, phone, password
- Password confirmation
- Form validation

### 3. Home Screen
- Welcome banner
- Quick action cards
- Featured stylists
- Popular services
- Special offers promo

### 4. Stylists Screen
- Browse all stylists
- Search functionality
- Filter by specialization
- View ratings and reviews
- Book appointments

### 5. Services Screen
- View all services
- Service descriptions
- Pricing information
- Duration details
- Add to booking

### 6. Booking Screen
- Select date
- Choose time slot
- Pick service
- Add special notes
- Confirm booking

### 7. My Bookings Screen
- View all bookings
- Booking status
- Stylist and service details
- Booking date and time

### 8. Profile Screen
- View/edit personal info
- Notification preferences
- Help & support
- Logout

## 🎨 Design Features

- **Gradient Backgrounds** - Beautiful purple and pink gradients
- **Icons** - Ionicons for intuitive UI
- **Cards** - Clean card-based layouts
- **Animations** - Smooth transitions
- **Color Scheme** - Professional purple (#667eea) and pink (#f5576c)
- **Typography** - Clear hierarchy and readability

## 🔌 API Integration

The app connects to the backend API at `http://localhost:3001`:

### Endpoints Used
- `POST /api/users/login` - User login
- `POST /api/users/signup` - User registration
- `GET /api/stylists` - Fetch stylists
- `GET /api/services` - Fetch services
- `GET /api/bookings` - Fetch user bookings
- `POST /api/bookings` - Create booking

## 📦 Dependencies

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **Expo Linear Gradient** - Gradient backgrounds
- **Expo Vector Icons** - Icon library

## 🛠️ Project Structure

```
salon-user-app/
├── App.js                 # Main app component
├── screens/
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   ├── HomeScreen.js
│   ├── StylistsScreen.js
│   ├── ServicesScreen.js
│   ├── BookingScreen.js
│   ├── MyBookingsScreen.js
│   └── ProfileScreen.js
├── package.json
└── README.md
```

## 🎯 Usage

### Login
1. Open the app
2. Enter email and password
3. Tap "Sign In"
4. Or create new account with "Create New Account"

### Book an Appointment
1. Go to "Stylists" tab
2. Browse or search for stylists
3. Tap on a stylist
4. Select date, time, and service
5. Add notes if needed
6. Confirm booking

### View Bookings
1. Go to "My Bookings" tab
2. See all your appointments
3. View booking details
4. Check booking status

### Manage Profile
1. Go to "Profile" tab
2. Edit personal information
3. Manage preferences
4. Access help & support
5. Logout

## 🔐 Security

- Passwords are hashed on backend
- JWT tokens for authentication
- Secure API communication
- Input validation on all forms

## 🚀 Deployment

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

### Web
```bash
npm run web
```

## 📝 Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## 🐛 Troubleshooting

### App won't connect to backend
- Ensure backend is running on port 3001
- Check network connectivity
- Verify API URL in code

### Styling issues
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Navigation not working
- Ensure all screens are properly imported
- Check navigation structure in App.js

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs
3. Check network tab in Expo DevTools

## 📄 License

MIT License

## 🎉 Features Coming Soon

- Payment integration
- Appointment reminders
- Stylist reviews and ratings
- Loyalty program
- Referral system
- Video consultations
- Rescheduling appointments
- Cancellation with refunds

---

**Happy Booking! 💇‍♀️**
