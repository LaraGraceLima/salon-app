# Salon Admin Panel

A comprehensive admin panel for managing salon bookings, clients, stylists, and services. Built with React.js, Node.js, MySQL, and WebSocket for real-time updates.

## Features

- **Admin Authentication**: Secure login system
- **Client Management**: Add, edit, and delete clients
- **Stylist Management**: Create and manage stylist accounts with specializations
- **Service Management**: Create and manage salon services with pricing
- **Booking Management**: Monitor and manage booking transactions with status updates
- **Real-time Updates**: WebSocket integration for live data synchronization
- **Dashboard**: Overview of key metrics and recent bookings

## Project Structure

```
salon-admin-panel/
├── src/                    # React frontend
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── App.jsx           # Main app component
│   └── App.css           # Global styles
├── server/               # Node.js backend
│   ├── server.js         # Express server with WebSocket
│   ├── database.sql      # Database schema
│   ├── package.json      # Backend dependencies
│   └── .env              # Environment variables
├── package.json          # Frontend dependencies
└── README.md            # This file
```

## Prerequisites

- Node.js (v14 or higher)
- XAMPP (MySQL)
- npm or yarn

## Installation & Setup

### 1. Database Setup

1. Open XAMPP Control Panel and start MySQL
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create a new database or import the SQL file:
   - Go to `server/database.sql`
   - Copy all SQL commands
   - Paste into phpMyAdmin SQL tab and execute

Alternatively, use MySQL command line:
```bash
mysql -u root < server/database.sql
```

### 2. Backend Setup

```bash
cd server
npm install
npm start
```

The backend server will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Login Credentials

- **Email**: admin@salon.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Stylists
- `GET /api/stylists` - Get all stylists
- `POST /api/stylists` - Add new stylist
- `PUT /api/stylists/:id` - Update stylist
- `DELETE /api/stylists/:id` - Delete stylist

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Add new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/recent` - Get recent bookings
- `PUT /api/bookings/:id` - Update booking status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## WebSocket Events

The application uses WebSocket for real-time updates:

- `client_added` - New client added
- `client_updated` - Client information updated
- `client_deleted` - Client deleted
- `stylist_added` - New stylist added
- `stylist_updated` - Stylist information updated
- `stylist_deleted` - Stylist deleted
- `service_added` - New service added
- `service_updated` - Service information updated
- `service_deleted` - Service deleted
- `booking_updated` - Booking status updated

## Features in Detail

### Dashboard
- View total counts of clients, stylists, services, and bookings
- See recent bookings with status

### Clients Management
- Add new clients with name, email, and phone
- Edit existing client information
- Delete clients
- Real-time updates across all connected admins

### Stylists Management
- Create stylist accounts with specialization
- Set stylist status (active/inactive)
- Edit and delete stylists
- Track stylist information

### Services Management
- Create salon services with pricing
- Set service duration
- Add service descriptions
- Edit and delete services

### Bookings Management
- View all bookings with client, stylist, and service details
- Filter bookings by status (pending, confirmed, completed, cancelled)
- Update booking status
- Real-time booking updates

## Technology Stack

- **Frontend**: React.js, React Router, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Real-time**: WebSocket (ws)
- **Authentication**: JWT, bcryptjs
- **HTTP Client**: Axios

## Security Notes

- Change the JWT_SECRET in `.env` file
- Use environment variables for sensitive data
- Implement proper password hashing (bcryptjs is already configured)
- Add HTTPS in production
- Implement rate limiting for API endpoints

## Future Enhancements

- Payment processing integration
- Email notifications
- SMS reminders
- Advanced reporting and analytics
- Mobile app
- Multi-language support
- Role-based access control

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running in XAMPP
- Check database credentials in `.env`
- Verify database exists

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using the port

### CORS Errors
- Ensure backend is running on port 3001
- Check CORS configuration in server.js

## License

MIT License

## Support

For issues or questions, please create an issue in the repository.
