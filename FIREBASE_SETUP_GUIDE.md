# 🔥 Firebase Setup Guide for Salon System

## Overview
This guide shows how to set up Firebase Storage and Firestore for free image uploads in your salon system.

## 🚀 Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `salon-system-[your-name]`
4. Disable Google Analytics (not needed for this project)
5. Click "Create project"

### 2. Enable Firebase Storage
1. In Firebase Console, go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode" (we'll configure security later)
4. Select a location (choose closest to your users)
5. Click "Done"

### 3. Enable Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select same location as Storage
5. Click "Done"

### 4. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add web app
4. Enter app name: "Salon System"
5. Copy the configuration object

## 🔧 Configuration Setup

### 1. Update Firebase Config Files
Replace the placeholder config in these files with your actual Firebase config:

**Files to update:**
- `salon-user-app/firebase-config.js`
- `salon-stylist-app/firebase-config.js`
- `firebase-config.js` (root)

**Replace this:**
```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "salon-system-12345.firebaseapp.com",
  projectId: "salon-system-12345",
  storageBucket: "salon-system-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**With your actual config:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Your actual API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

### 2. Install Firebase Dependencies

**For React Native Apps:**
```bash
# User App
cd salon-user-app
npm install firebase

# Stylist App  
cd salon-stylist-app
npm install firebase
```

**For Admin Panel (if needed):**
```bash
cd salon-admin-panel
npm install firebase
```

### 3. Update Database Schema
Run the SQL script to add image URL columns:
```sql
-- In phpMyAdmin or your MySQL client
source salon-admin-panel/server/add-firebase-columns.sql
```

## 🔒 Firebase Security Rules

### Storage Rules
In Firebase Console > Storage > Rules, replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated uploads to profile pictures
    match /stylist-profiles/{imageId} {
      allow read: if true;
      allow write: if request.auth != null 
        && resource == null 
        && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
    
    match /client-profiles/{imageId} {
      allow read: if true;
      allow write: if request.auth != null 
        && resource == null 
        && request.resource.size < 5 * 1024 * 1024;
    }
    
    match /service-images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null 
        && resource == null 
        && request.resource.size < 5 * 1024 * 1024;
    }
    
    match /gallery/{imageId} {
      allow read: if true;
      allow write: if request.auth != null 
        && resource == null 
        && request.resource.size < 10 * 1024 * 1024; // 10MB for gallery
    }
  }
}
```

### Firestore Rules
In Firebase Console > Firestore > Rules, replace with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all documents
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📱 Usage in Apps

### Profile Picture Upload (Stylist App)
The ProfileScreen now includes Firebase integration:
1. User taps camera icon
2. Selects image from camera/gallery
3. Image uploads to Firebase Storage
4. Download URL saved to database
5. Profile picture updates in real-time

### Image Upload Flow
```javascript
// 1. Upload to Firebase Storage
const result = await FirebaseService.uploadImage(imageUri, 'stylist-profiles');

// 2. Save URL to database via API
await fetch('/api/stylists/profile-image', {
  method: 'PUT',
  body: JSON.stringify({ profile_image_url: result.downloadURL })
});

// 3. Update UI with new image
setProfileImage(result.downloadURL);
```

## 💰 Firebase Pricing (Free Tier)

### Spark Plan (Free) Limits:
- **Storage**: 5GB total
- **Downloads**: 1GB/day
- **Uploads**: 20,000/day
- **Firestore**: 50,000 reads/day, 20,000 writes/day

### Estimated Usage for Salon:
- **Profile pictures**: ~50 stylists × 1MB = 50MB
- **Service images**: ~20 services × 500KB = 10MB
- **Gallery images**: ~100 photos × 2MB = 200MB
- **Total**: ~260MB (well within 5GB limit)

## 🎯 Features Enabled

### Current Implementation:
- ✅ Stylist profile picture upload
- ✅ Firebase Storage integration
- ✅ Automatic URL saving to database
- ✅ Real-time image updates

### Future Enhancements:
- 📸 Client profile pictures
- 🖼️ Service images
- 🎨 Salon gallery
- 📱 Before/after photos
- 🎪 Portfolio management

## 🔧 Testing Firebase Integration

### 1. Test Profile Upload
1. Open Stylist app
2. Login with: sarah@salon.com / stylist123
3. Go to Profile screen
4. Tap camera icon
5. Select/take photo
6. Verify upload success message
7. Check Firebase Console > Storage for uploaded image

### 2. Verify Database Update
1. Check stylists table in database
2. Verify profile_image_url column has Firebase URL
3. Refresh profile screen to see persistent image

### 3. Test Image Loading
1. Close and reopen app
2. Login again
3. Profile image should load from Firebase URL

## 🆘 Troubleshooting

### Common Issues:

**"Firebase not configured"**
- Check firebase-config.js has correct credentials
- Verify Firebase project is active

**"Upload failed"**
- Check internet connection
- Verify Firebase Storage rules allow uploads
- Check image size (must be < 5MB)

**"Permission denied"**
- Update Storage security rules
- Check Firebase project permissions

**"Image not loading"**
- Verify Firebase URL is saved to database
- Check network connectivity
- Verify Storage rules allow reads

### Debug Commands:
```javascript
// Test Firebase connection
import { storage } from './firebase-config';
console.log('Firebase Storage:', storage);

// Test upload
const result = await FirebaseService.uploadImage(imageUri);
console.log('Upload result:', result);
```

## 📊 Monitoring Usage

### Firebase Console Monitoring:
1. Go to Firebase Console
2. Check "Usage" tab for:
   - Storage usage
   - Bandwidth usage
   - Request counts
3. Set up alerts for approaching limits

### Cost Optimization:
- Compress images before upload
- Delete old/unused images
- Use appropriate image sizes
- Monitor bandwidth usage

## 🎉 Benefits of Firebase Integration

### For Development:
- ✅ **Free hosting** for images
- ✅ **Global CDN** for fast loading
- ✅ **Automatic scaling** 
- ✅ **No server maintenance**

### For Users:
- ✅ **Fast image uploads**
- ✅ **Reliable image storage**
- ✅ **High-quality image delivery**
- ✅ **Cross-platform compatibility**

### For Business:
- ✅ **Zero hosting costs** (free tier)
- ✅ **Professional image management**
- ✅ **Scalable solution**
- ✅ **Backup and security**

Your salon system now has professional image upload capabilities powered by Firebase! 🔥