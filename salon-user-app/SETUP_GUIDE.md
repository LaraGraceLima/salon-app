# Salon User App - Complete Setup Guide

## 🎯 Overview

This is a beautiful React Native mobile app for salon users to book appointments. It features a modern design with gradient backgrounds, smooth animations, and intuitive navigation.

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js (v14+) installed
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Backend server running on `http://localhost:3001`
- iOS Simulator (Mac) or Android Emulator (Windows/Mac/Linux)
- Or Expo Go app on physical device

## 🚀 Installation Steps

### Step 1: Navigate to Project
```bash
cd salon-user-app
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- React Native
- Expo
- React Navigation
- Expo Linear Gradient
- Expo Vector Icons
- And other dependencies

### Step 3: Start Development Server
```bash
npm start
```

You should see:
```
Expo DevTools is running at http://localhost:19002
```

### Step 4: Run on Device/Emulator

**Option A: iOS Simulator (Mac only)**
```
Press i in terminal
```

**Option B: Android Emulator**
```
Press a in terminal
```

**Option C: Physical Device**
1. Download "Expo Go" app from App Store or Play Store
2. Scan QR code from terminal
3. App opens on your device

## 🎨 App Features

### Authentication
- User login
- Account creation
- Password validation
- Secure authentication

### Browsing
- Browse stylists with filters
- View all services
- Search functionality
- Real-time data

### Booking
- Select date and time
- Choose service
- Add special notes
- Instant confirmation

### Management
- View all bookings
- Check booking status
- Manage profile
- Update preferences

## 📱 Screen Guide

### 1. Login Screen
- Enter email and password
- Or create new account
- Demo credentials available

### 2. Home Screen
- Welcome banner
- Quick action cards
- Featured stylists
- Popular services
- Special offers

### 3. Stylists Screen
- Search stylists
- Filter by specialization
- View ratings
- Check availability
- Book appointments

### 4. Services Screen
- View all services
- See pricing
- Check duration
- Service descriptions

### 5. Booking Screen
- Select date
- Choose time slot
- Pick service
- Add notes
- Confirm booking

### 6. My Bookings Screen
- View all bookings
- Check status
- See details
- Manage appointments

### 7. Profile Screen
- Edit personal info
- Manage preferences
- Help & support
- Logout

## 🎨 Design System

### Colors
```
Primary Purple: #667eea
Dark Purple: #764ba2
Pink Accent: #f5576c
Light Gray: #f5f5f5
White: #ffffff
```

### Typography
- Headers: Bold, 24-28px
- Titles: Bold, 16-20px
- Body: Regular, 14px
- Small: Regular, 12px

### Components
- Gradient backgrounds
- Card layouts
- Icon buttons
- Search bars
- Filter chips
- Status badges
- Loading spinners

## 🔌 API Integration

### Backend URL
```
http://localhost:3001
```

### Endpoints Used
```
POST /api/users/login
POST /api/users/signup
GET /api/stylists
GET /api/services
GET /api/bookings
POST /api/bookings
```

## 🛠️ Development

### Project Structure
```
salon-user-app/
├── App.js                 # Main navigation
├── screens/              # Screen components
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

### Adding New Screen

1. Create new file in `screens/` folder
2. Import in `App.js`
3. Add to navigation
4. Add tab icon and label

### Modifying Styles

Edit StyleSheet in each screen file:
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // ... more styles
});
```

### Changing Colors

Update gradient colors:
```javascript
<LinearGradient colors={['#667eea', '#764ba2']}>
```

## 🐛 Troubleshooting

### App Won't Start
```bash
# Clear cache and reinstall
npm install
npm start -c
```

### Can't Connect to Backend
- Verify backend is running on port 3001
- Check network connectivity
- Verify API URL in code

### Styling Issues
```bash
# Clear cache
expo start -c
```

### Navigation Not Working
- Check all screens are imported in App.js
- Verify screen names match navigation
- Check navigation structure

### Emulator Issues
- Restart emulator
- Clear Expo cache: `expo start -c`
- Reinstall app

## 📝 Common Tasks

### Change App Name
Edit `app.json`:
```json
{
  "name": "Your App Name",
  "slug": "your-app-slug"
}
```

### Change Primary Color
Search and replace `#667eea` with your color

### Add New Service
Add to Services screen array

### Modify Booking Form
Edit `BookingScreen.js` form fields

## 🚀 Building for Production

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

## 📊 Performance Tips

- Use React.memo for components
- Optimize images
- Lazy load screens
- Cache API responses
- Minimize re-renders

## 🔐 Security Best Practices

- Never hardcode API keys
- Use environment variables
- Validate all inputs
- Sanitize user data
- Use HTTPS in production
- Secure token storage

## 📚 Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Expo Vector Icons](https://icons.expo.fyi)

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Start development server
3. ✅ Run on device/emulator
4. ✅ Test all features
5. ✅ Customize branding
6. ✅ Deploy to app stores

## 📞 Support

### Common Issues

**Q: App crashes on startup**
A: Clear cache with `expo start -c`

**Q: Can't login**
A: Ensure backend is running on port 3001

**Q: Styling looks wrong**
A: Restart with `expo start -c`

**Q: Navigation not working**
A: Check screen imports in App.js

## 🎉 You're Ready!

Your Salon User App is ready to use. Start by:

1. Running `npm start`
2. Opening on device/emulator
3. Creating an account
4. Booking an appointment

Enjoy! 💇‍♀️

---

**Version**: 1.0.0
**Last Updated**: March 2026
**Status**: Production Ready ✅
