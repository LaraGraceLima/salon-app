# 💇‍♀️ BeautyBoss — Salon Booking System

A full-stack salon management system with three apps: an admin web panel, a client mobile app, and a stylist mobile app.

---

## 📦 Project Structure

```
kiro-solon/
├── salon-admin-panel/     # React + Vite web dashboard for salon admins
│   └── server/            # Node.js + Express + MySQL backend API
├── salon-user-app/        # React Native (Expo) app for clients
└── salon-stylist-app/     # React Native (Expo) app for stylists
```

---

## ✨ Features

### Admin Panel
- Dashboard with revenue charts and booking stats
- Manage services, stylists, clients, bookings, promos
- View reviews and ratings
- POS (Point of Sale) system
- Real-time updates via WebSocket

### User App (Client)
- Browse and book salon services
- Choose stylist, date, and time slot
- Upload reference images and special requests
- View and manage bookings (reschedule, cancel)
- Promo codes and discounts
- In-app notifications
- Profile management

### Stylist App
- View and manage assigned bookings (accept, decline, complete)
- See client special requests and reference images
- Schedule management (working days, hours, blocked dates)
- Ratings and reviews
- Real-time booking notifications

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Admin Frontend | React, Vite, CSS |
| Mobile Apps | React Native, Expo |
| Backend | Node.js, Express.js |
| Database | MySQL (XAMPP) |
| Real-time | WebSocket |
| Auth | JWT |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [XAMPP](https://www.apachefriends.org/) (MySQL)
- [Expo Go](https://expo.dev/client) on your phone

### 1. Database Setup
1. Start XAMPP and run MySQL
2. Import `salon-admin-panel/server/database.sql` into phpMyAdmin
3. Create a `.env` file in `salon-admin-panel/server/`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=salon_admin
JWT_SECRET=your_secret_key
PORT=3001
```

### 2. Start the Backend
```bash
cd salon-admin-panel/server
npm install
node server.js
```

### 3. Start the Admin Panel
```bash
cd salon-admin-panel
npm install
npm run dev
```

### 4. Start the Mobile Apps
```bash
# User app
cd salon-user-app
npm install
npx expo start

# Stylist app
cd salon-stylist-app
npm install
npx expo start
```

### 5. Update the IP Address
In `salon-user-app/config/api.js` and `salon-stylist-app/config/api.js`, update `CANDIDATE_IPS` with your machine's local IP (run `ipconfig` on Windows to find it).

---

## 📱 App Screenshots

> Admin Panel · User App · Stylist App

---

## 👤 Author

**LaraGrace Lima**  
GitHub: [@LaraGraceLima](https://github.com/LaraGraceLima)
