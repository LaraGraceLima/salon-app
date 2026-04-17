# Verify Backend Login Endpoint

## Quick Test with curl

Test if the backend is returning a token correctly.

### Test 1: Login with curl

```bash
curl -X POST http://192.168.12.156:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Expected Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "name": "John Doe",
  "email": "user@example.com"
}
```

### If You See This
```json
{
  "token": "",
  "name": "John Doe",
  "email": "user@example.com"
}
```
**Problem**: Backend is returning empty token

### If You See This
```json
{
  "error": "Invalid credentials"
}
```
**Problem**: User doesn't exist or password is wrong

### If You See This
```
curl: (7) Failed to connect to 192.168.12.156 port 3001: Connection refused
```
**Problem**: Backend is not running

---

## Test 2: Check Backend is Running

```bash
# Check if backend is running
curl http://192.168.12.156:3001/api/stylists
```

### Expected Response
```json
[
  {
    "id": 1,
    "name": "Sarah",
    "email": "sarah@salon.com",
    "specialization": "Hair Cutting",
    "status": "active"
  },
  ...
]
```

### If You See This
```
curl: (7) Failed to connect
```
**Problem**: Backend is not running

**Solution**: Start backend
```bash
cd salon-admin-panel/server
npm start
```

---

## Test 3: Check Database Connection

```bash
# Check if database is connected
curl http://192.168.12.156:3001/api/services
```

### Expected Response
```json
[
  {
    "id": 1,
    "name": "Hair Cut",
    "price": 25
  },
  ...
]
```

### If You See This
```json
{
  "error": "Database connection failed"
}
```
**Problem**: Database is not connected

**Solution**: 
1. Check MySQL is running
2. Check database.sql was imported
3. Check .env file has correct credentials

---

## Test 4: Verify User Exists

```bash
# Check if user exists in database
# Login with the user credentials
curl -X POST http://192.168.12.156:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### If You See This
```json
{
  "error": "User not found"
}
```
**Problem**: User doesn't exist

**Solution**: Create user via signup or admin panel

---

## Test 5: Check Token Format

If you get a token, verify it's valid:

```bash
# The token should look like this:
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjI2NzA5NjAwfQ.signature

# It should have 3 parts separated by dots:
# 1. Header (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9)
# 2. Payload (eyJpZCI6MSwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjI2NzA5NjAwfQ)
# 3. Signature (signature)
```

### If Token is Empty
```
"token": ""
```
**Problem**: Backend is not generating token

**Solution**: Check server.js login endpoint

---

## Test 6: Use Token to Get Bookings

```bash
# Get the token from login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use token to get bookings
curl -X GET http://192.168.12.156:3001/api/users/bookings \
  -H "Authorization: Bearer $TOKEN"
```

### Expected Response
```json
[
  {
    "id": 1,
    "serviceName": "Hair Cut",
    "stylistName": "Sarah",
    "dateTime": "2026-03-20 10:00:00",
    "price": 25,
    "status": "pending"
  },
  ...
]
```

### If You See This
```json
{
  "error": "Unauthorized"
}
```
**Problem**: Token is invalid or expired

**Solution**: Get a new token by logging in again

---

## Troubleshooting Checklist

- [ ] Backend is running on port 3001
- [ ] Database is connected
- [ ] User exists in database
- [ ] Login returns a token
- [ ] Token is not empty
- [ ] Token has 3 parts (header.payload.signature)
- [ ] Token can be used to get bookings

---

## Common Issues

### Issue: Backend not running
```bash
# Start backend
cd salon-admin-panel/server
npm start
```

### Issue: Database not connected
```bash
# Check MySQL is running
# Check database.sql was imported
# Check .env file has correct credentials
```

### Issue: User not found
```bash
# Create user via signup
# Or check user exists in database
```

### Issue: Token is empty
```bash
# Check server.js login endpoint
# Verify JWT_SECRET is set in .env
# Check token generation code
```

### Issue: Token is invalid
```bash
# Get a new token by logging in again
# Check token hasn't expired
# Verify JWT_SECRET matches
```

---

## Quick Verification Script

Run this to verify everything:

```bash
#!/bin/bash

echo "1. Testing backend connection..."
curl -s http://192.168.12.156:3001/api/stylists > /dev/null && echo "✓ Backend is running" || echo "✗ Backend is not running"

echo "2. Testing login..."
RESPONSE=$(curl -s -X POST http://192.168.12.156:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "✗ Login failed or token is empty"
  echo "Response: $RESPONSE"
else
  echo "✓ Login successful"
  echo "Token: ${TOKEN:0:20}..."
  
  echo "3. Testing token..."
  curl -s -X GET http://192.168.12.156:3001/api/users/bookings \
    -H "Authorization: Bearer $TOKEN" > /dev/null && echo "✓ Token is valid" || echo "✗ Token is invalid"
fi
```

---

## Summary

If all tests pass:
- ✓ Backend is working
- ✓ Database is connected
- ✓ User exists
- ✓ Login returns token
- ✓ Token is valid

If any test fails, identify which one and fix that issue first.

---

**Next**: Run these tests and report results
