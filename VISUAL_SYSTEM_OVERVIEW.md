# Visual System Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SALON BOOKING SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │  MySQL Database  │
                         │  (salon_admin)   │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
        ┌───────────▼──────────┐    ┌──────────▼──────────┐
        │  Backend API Server  │    │  WebSocket Server   │
        │  (Node.js/Express)   │    │  (Real-time updates)│
        │  Port: 3001          │    │  Port: 3001         │
        │  IP: 192.168.12.156  │    │                     │
        └───────────┬──────────┘    └──────────┬──────────┘
                    │                           │
        ┌───────────┴───────────────────────────┴──────────┐
        │                                                   │
        │  HTTP/REST API + WebSocket Connection            │
        │                                                   │
    ┌───┴────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Admin  │  │  User    │  │ Stylist  │  │ Browser  │
    │ Panel  │  │  App     │  │  App     │  │ (Test)   │
    │ React  │  │ React    │  │ React    │  │          │
    │ Port   │  │ Native   │  │ Native   │  │ Health   │
    │ 5173   │  │ Port     │  │ Port     │  │ Check    │
    │        │  │ 8081     │  │ 8082     │  │          │
    └────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## Data Flow

### User Booking Flow
```
User App
   │
   ├─ Login
   │   └─ POST /api/users/login
   │       └─ Backend validates credentials
   │           └─ Returns JWT token
   │
   ├─ Browse Stylists
   │   └─ GET /api/stylists
   │       └─ Backend returns stylist list
   │
   ├─ View Services
   │   └─ GET /api/services
   │       └─ Backend returns service list
   │
   ├─ Create Booking
   │   └─ POST /api/bookings (with JWT)
   │       └─ Backend checks availability
   │           └─ Creates booking if available
   │
   └─ View My Bookings
       └─ GET /api/users/bookings (with JWT)
           └─ Backend returns user's bookings
```

### Stylist Booking Management Flow
```
Stylist App
   │
   ├─ Login
   │   └─ POST /api/stylists/login
   │       └─ Backend validates credentials
   │           └─ Returns JWT token
   │
   ├─ View Pending Bookings
   │   └─ GET /api/bookings (filtered)
   │       └─ Backend returns pending bookings
   │
   ├─ Accept/Decline/Complete Booking
   │   └─ PUT /api/bookings/:id
   │       └─ Backend updates booking status
   │           └─ WebSocket notifies all clients
   │
   └─ View Profile
       └─ Displays stylist information
```

### Admin Management Flow
```
Admin Panel
   │
   ├─ Login
   │   └─ POST /api/admin/login
   │       └─ Backend validates credentials
   │           └─ Returns JWT token
   │
   ├─ Manage Clients
   │   ├─ GET /api/clients (view all)
   │   ├─ POST /api/clients (add)
   │   ├─ PUT /api/clients/:id (edit)
   │   └─ DELETE /api/clients/:id (delete)
   │
   ├─ Manage Stylists
   │   ├─ GET /api/stylists (view all)
   │   ├─ POST /api/stylists (add with password)
   │   ├─ PUT /api/stylists/:id (edit)
   │   └─ DELETE /api/stylists/:id (delete)
   │
   ├─ Manage Services
   │   ├─ GET /api/services (view all)
   │   ├─ POST /api/services (add)
   │   ├─ PUT /api/services/:id (edit)
   │   └─ DELETE /api/services/:id (delete)
   │
   ├─ View Bookings
   │   └─ GET /api/bookings (view all)
   │       └─ Backend returns all bookings with details
   │
   ├─ Update Booking Status
   │   └─ PUT /api/bookings/:id
   │       └─ Backend updates status
   │           └─ WebSocket notifies all clients
   │
   └─ View Dashboard
       └─ GET /api/dashboard/stats
           └─ Backend returns statistics
```

---

## Service Ports

```
┌─────────────────────────────────────────┐
│         SERVICE PORTS                   │
├─────────────────────────────────────────┤
│ Backend API:      192.168.12.156:3001   │
│ Admin Panel:      localhost:5173        │
│ User App:         localhost:8081        │
│ Stylist App:      localhost:8082        │
│ MySQL Database:   localhost:3306        │
└─────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│              JWT AUTHENTICATION FLOW                    │
└─────────────────────────────────────────────────────────┘

1. User/Stylist/Admin Login
   │
   ├─ Send email + password
   │   └─ POST /api/users/login
   │       POST /api/stylists/login
   │       POST /api/admin/login
   │
2. Backend Validation
   │
   ├─ Check if user exists
   │   └─ Query database
   │
   ├─ Verify password
   │   └─ Compare with bcrypt hash
   │
3. Generate JWT Token
   │
   ├─ Create token with user ID + email
   │   └─ Sign with secret key
   │       └─ Expires in 24 hours
   │
4. Return Token to Client
   │
   ├─ Client stores token in AsyncStorage
   │   └─ Token persists across app restarts
   │
5. Use Token for Protected Endpoints
   │
   ├─ Include token in Authorization header
   │   └─ Authorization: Bearer <token>
   │
6. Backend Verifies Token
   │
   ├─ Decode token
   │   └─ Verify signature
   │       └─ Check expiration
   │           └─ Extract user ID
   │
7. Process Request
   │
   └─ Execute API endpoint with user context
```

---

## Database Schema

```
┌──────────────────────────────────────────────────────────┐
│                    SALON_ADMIN DATABASE                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   ADMINS    │  │   CLIENTS    │  │  STYLISTS    │   │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤   │
│  │ id (PK)     │  │ id (PK)      │  │ id (PK)      │   │
│  │ name        │  │ name         │  │ name         │   │
│  │ email       │  │ email        │  │ email        │   │
│  │ password    │  │ phone        │  │ phone        │   │
│  │ created_at  │  │ password     │  │ specialization
│  │             │  │ created_at   │  │ status       │   │
│  │             │  │              │  │ password     │   │
│  │             │  │              │  │ created_at   │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │  SERVICES    │  │        BOOKINGS                  │ │
│  ├──────────────┤  ├──────────────────────────────────┤ │
│  │ id (PK)      │  │ id (PK)                          │ │
│  │ name         │  │ client_id (FK → CLIENTS)        │ │
│  │ description  │  │ stylist_id (FK → STYLISTS)      │ │
│  │ price        │  │ service_id (FK → SERVICES)      │ │
│  │ duration      │  │ date_time                       │ │
│  │ created_at   │  │ status (pending/confirmed/etc)  │ │
│  │              │  │ notes                           │ │
│  │              │  │ created_at                      │ │
│  └──────────────┘  └──────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Real-time Updates (WebSocket)

```
┌─────────────────────────────────────────────────────────┐
│           WEBSOCKET REAL-TIME UPDATES                   │
└─────────────────────────────────────────────────────────┘

Backend Server
   │
   ├─ Maintains WebSocket connections
   │   └─ Stores all connected clients
   │
   ├─ When booking is updated
   │   ├─ Update database
   │   ├─ Broadcast to all connected clients
   │   │   ├─ Admin Panel
   │   │   ├─ User App
   │   │   └─ Stylist App
   │   │
   │   └─ All clients receive update instantly
   │       └─ No need to refresh
   │           └─ Real-time synchronization
```

---

## Error Handling

```
┌─────────────────────────────────────────────────────────┐
│              ERROR HANDLING FLOW                        │
└─────────────────────────────────────────────────────────┘

Client Request
   │
   ├─ Network Error
   │   └─ "Connection failed: {error.message}"
   │       └─ Check backend is running
   │           └─ Check device WiFi
   │               └─ Check IP address
   │
   ├─ Invalid Credentials
   │   └─ "Invalid credentials"
   │       └─ Check email/password
   │           └─ Check database
   │
   ├─ Missing Fields
   │   └─ "All fields are required"
   │       └─ Fill in all form fields
   │
   ├─ Booking Conflict
   │   └─ "Stylist is not available at this time"
   │       └─ Choose different time
   │           └─ Check stylist availability
   │
   └─ Server Error
       └─ "Server error"
           └─ Check backend logs
               └─ Check database connection
```

---

## Testing Endpoints

```
┌─────────────────────────────────────────────────────────┐
│            TESTING ENDPOINTS                           │
└─────────────────────────────────────────────────────────┘

Health Check:
  GET http://192.168.12.156:3001/api/health
  Response: {"status":"ok","timestamp":"...","server":"..."}

Services:
  GET http://192.168.12.156:3001/api/services
  Response: [{"id":1,"name":"Hair Cut",...}]

Stylists:
  GET http://192.168.12.156:3001/api/stylists
  Response: [{"id":1,"name":"Sarah",...}]

Clients:
  GET http://192.168.12.156:3001/api/clients
  Response: [{"id":1,"name":"John",...}]

Bookings:
  GET http://192.168.12.156:3001/api/bookings
  Response: [{"id":1,"clientName":"John",...}]
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│           CURRENT DEPLOYMENT (LOCAL)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Computer (Windows)                                    │
│  ├─ Backend Server (Node.js)                          │
│  ├─ Admin Panel (React)                               │
│  ├─ MySQL Database (XAMPP)                            │
│  └─ WebSocket Server                                  │
│                                                         │
│  Mobile Device (Same WiFi)                            │
│  ├─ User App (React Native + Expo)                    │
│  └─ Stylist App (React Native + Expo)                 │
│                                                         │
│  Connection: WiFi Network (192.168.12.156)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## System Status Indicators

```
✓ Backend Server:     RUNNING (Port 3001)
✓ Admin Panel:        RUNNING (Port 5173)
✓ User App:           RUNNING (Port 8081)
✓ Stylist App:        RUNNING (Port 8082)
✓ Database:           CONNECTED (salon_admin)
✓ WebSocket:          RUNNING (Port 3001)
✓ Health Check:       OK (http://192.168.12.156:3001/api/health)
✓ All Features:       IMPLEMENTED
✓ Documentation:      COMPLETE
✓ System:             READY FOR TESTING
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────┐
│              QUICK REFERENCE                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Start Backend:                                         │
│   cd salon-admin-panel/server && npm start             │
│                                                         │
│ Start Admin Panel:                                     │
│   cd salon-admin-panel && npm run dev                  │
│                                                         │
│ Start User App:                                        │
│   cd salon-user-app && npm start -- --offline          │
│                                                         │
│ Start Stylist App:                                     │
│   cd salon-stylist-app && npm start -- --port 8082 --offline
│                                                         │
│ Test Health Check:                                     │
│   curl http://192.168.12.156:3001/api/health          │
│                                                         │
│ Admin Login:                                           │
│   Email: admin@salon.com                              │
│   Password: admin123                                   │
│                                                         │
│ User Login:                                            │
│   Email: user@example.com                             │
│   Password: password123                                │
│                                                         │
│ Stylist Login:                                         │
│   Email: sarah@salon.com                              │
│   Password: stylist123                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## System is Ready! 🎉

All components are running and ready for testing.

**Start with**: README_START_HERE.md
