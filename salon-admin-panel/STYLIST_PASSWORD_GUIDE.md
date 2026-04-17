# Stylist Password Management Guide

## Overview

The admin panel now includes a password field when creating and editing stylist accounts. This password is used by stylists to login to the stylist app.

## Creating a Stylist with Password

### Step 1: Open Admin Panel
- URL: http://localhost:5173
- Login: admin@salon.com / admin123

### Step 2: Go to Stylists
- Click "Stylists" in the sidebar
- Click "+ Add Stylist" button

### Step 3: Fill in the Form
1. **Name**: Stylist's full name
2. **Email**: Unique email address (used for login)
3. **Phone**: Contact number
4. **Specialization**: Hair Cutting, Hair Coloring, Styling, etc.
5. **Status**: Active or Inactive
6. **Password**: Set a secure password for the stylist

### Step 4: Share Credentials
- Share the email and password with the stylist securely
- Example:
  ```
  Email: john@salon.com
  Password: SecurePass123
  ```

## Editing Stylist Password

### To Change a Stylist's Password:
1. Click "Edit" on the stylist row
2. Enter the new password in the Password field
3. Click "Update Stylist"
4. Share the new password with the stylist

### To Keep Existing Password:
1. Click "Edit" on the stylist row
2. Leave the Password field empty
3. Click "Update Stylist"
4. Password remains unchanged

## Password Requirements

- Minimum 6 characters recommended
- Use mix of letters, numbers, and symbols for security
- Don't use common passwords
- Each stylist should have a unique password

## Stylist Login

Once credentials are created, stylists can:

1. Download Expo Go app
2. Scan QR code from stylist app (port 8082)
3. Login with provided email and password
4. Access booking management features

## Security Best Practices

✅ **DO:**
- Use strong, unique passwords
- Share credentials via secure channels
- Change passwords regularly
- Deactivate inactive stylist accounts
- Keep admin credentials secure

❌ **DON'T:**
- Share passwords via email or chat
- Use default passwords permanently
- Reuse passwords across accounts
- Share admin credentials with stylists

## Password Reset

If a stylist forgets their password:
1. Go to Stylists page
2. Click "Edit" on the stylist
3. Enter a new temporary password
4. Click "Update"
5. Share new password with stylist
6. Stylist should change it after first login

## Database

Passwords are:
- Hashed using bcryptjs (10 rounds)
- Stored securely in the database
- Never displayed in plain text
- Only used for authentication

## Troubleshooting

### Stylist Can't Login
- Verify email and password are correct
- Check if account status is "active"
- Ensure backend is running on port 3001
- Try resetting the password

### Password Not Saving
- Ensure password field is not empty when creating new stylist
- Check backend logs for errors
- Verify database connection

### Forgot Admin Password
- Contact system administrator
- May require database reset
