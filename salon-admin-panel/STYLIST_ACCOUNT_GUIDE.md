# Stylist Account Management Guide

## Overview

The admin can create stylist accounts through the admin panel. Once created, stylists can login to the stylist app to manage their bookings.

## Creating a Stylist Account

### Step 1: Access Admin Panel
1. Open http://localhost:5173
2. Login with admin credentials:
   - Email: `admin@salon.com`
   - Password: `admin123`

### Step 2: Navigate to Stylists
1. Click on "Stylists" in the sidebar
2. You'll see the list of existing stylists

### Step 3: Add New Stylist
1. Click the "Add Stylist" button
2. Fill in the following information:
   - **Name**: Stylist's full name
   - **Email**: Unique email address (used for login)
   - **Phone**: Contact number
   - **Specialization**: Hair Cutting, Hair Coloring, Styling, etc.
   - **Status**: Active or Inactive

### Step 4: Set Password
- The system will automatically generate a secure password
- Default password: `stylist123`
- Share the email and password with the stylist securely

## Stylist Login

Once the account is created, the stylist can:

1. **Download Expo Go** on their mobile device
2. **Open the Stylist App** (running on port 8082)
3. **Scan the QR code** with Expo Go
4. **Login** with their email and password

## Stylist App Features

### Bookings Management
- View all pending bookings
- Accept or decline bookings
- Mark bookings as completed
- Filter by status

### Profile
- View personal information
- See ratings and reviews
- View booking statistics

## Workflow

```
Admin Creates Account
        ↓
Stylist Receives Credentials
        ↓
Stylist Logs In
        ↓
Stylist Sees Pending Bookings
        ↓
Stylist Accepts/Declines Bookings
        ↓
Stylist Marks as Completed
```

## Important Notes

- Each stylist needs a unique email address
- Passwords should be changed after first login
- Stylists can only see their own bookings
- Admin can modify or delete stylist accounts anytime

## Troubleshooting

### Stylist Can't Login
1. Verify the email and password are correct
2. Check if the stylist account status is "active"
3. Ensure the backend server is running

### Stylist Can't See Bookings
1. Verify bookings are assigned to the stylist
2. Check booking status (should be "pending" or "confirmed")
3. Refresh the app

### Password Issues
1. Admin can reset password through the admin panel
2. Provide new credentials to the stylist

## Security Best Practices

- Use strong, unique passwords
- Change default password after first login
- Don't share credentials via unsecured channels
- Regularly review active stylist accounts
- Deactivate accounts for inactive stylists
