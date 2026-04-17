import { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalStylists: 0,
    totalServices: 0,
    totalBookings: 0,
  });
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    monthlyRevenue: [],
    serviceRevenue: [],
    stylistRevenue: []
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/dashboard/stats');
      const data = await response.json();
      setStats(data);

      const revenueResponse = await fetch('http://localhost:3001/api/dashboard/revenue');
      const revenueData = await revenueResponse.json();
      setRevenueData(revenueData);

      const bookingsResponse = await fetch('http://localhost:3001/api/bookings/recent');
      const bookingsData = await bookingsResponse.json();
      setRecentBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get max value for chart scaling
  const getMaxValue = (data, key) => {
    return Math.max(...data.map(item => item[key]), 0);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to your salon management system</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Clients</h3>
          <div className="value">{stats.totalClients}</div>
        </div>
        <div className="stat-card">
          <h3>Total Stylists</h3>
          <div className="value">{stats.totalStylists}</div>
        </div>
        <div className="stat-card">
          <h3>Total Services</h3>
          <div className="value">{stats.totalServices}</div>
        </div>
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <div className="value">{stats.totalBookings}</div>
        </div>
        <div className="stat-card revenue-card">
          <h3>Total Revenue</h3>
          <div className="value">₱{revenueData.totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Revenue Trend</h3>
          <div className="chart-container">
            <div className="bar-chart">
              {revenueData.monthlyRevenue.slice().reverse().map((item, index) => {
                const maxRevenue = getMaxValue(revenueData.monthlyRevenue, 'revenue');
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const date = new Date(item.month + '-01');
                const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
                
                return (
                  <div key={index} className="bar-item">
                    <div className="bar-container">
                      <div 
                        className="bar" 
                        style={{ height: `${height}%` }}
                        title={`${monthLabel}: ₱${item.revenue.toLocaleString()}`}
                      ></div>
                    </div>
                    <div className="bar-label">{monthLabel}</div>
                    <div className="bar-value">₱{item.revenue.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Revenue by Service</h3>
          <div className="chart-container">
            <div className="service-chart">
              {revenueData.serviceRevenue.map((service, index) => {
                const maxRevenue = getMaxValue(revenueData.serviceRevenue, 'revenue');
                const percentage = maxRevenue > 0 ? (service.revenue / maxRevenue) * 100 : 0;
                const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
                
                return (
                  <div key={index} className="service-item">
                    <div className="service-info">
                      <div 
                        className="service-color" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      <span className="service-name">{service.name}</span>
                    </div>
                    <div className="service-bar">
                      <div 
                        className="service-progress" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: colors[index % colors.length]
                        }}
                      ></div>
                    </div>
                    <div className="service-value">₱{service.revenue.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Stylist Performance</h3>
          <div className="chart-container">
            <div className="stylist-chart">
              {revenueData.stylistRevenue.map((stylist, index) => {
                const maxRevenue = getMaxValue(revenueData.stylistRevenue, 'revenue');
                const maxBookings = getMaxValue(revenueData.stylistRevenue, 'bookings');
                const revenueHeight = maxRevenue > 0 ? (stylist.revenue / maxRevenue) * 100 : 0;
                const bookingsHeight = maxBookings > 0 ? (stylist.bookings / maxBookings) * 100 : 0;
                
                return (
                  <div key={index} className="stylist-item">
                    <div className="stylist-bars">
                      <div className="stylist-bar-group">
                        <div 
                          className="stylist-bar revenue-bar" 
                          style={{ height: `${revenueHeight}%` }}
                          title={`Revenue: ₱${stylist.revenue.toLocaleString()}`}
                        ></div>
                        <div 
                          className="stylist-bar bookings-bar" 
                          style={{ height: `${bookingsHeight}%` }}
                          title={`Bookings: ${stylist.bookings}`}
                        ></div>
                      </div>
                    </div>
                    <div className="stylist-label">{stylist.name}</div>
                    <div className="stylist-stats">
                      <div className="stat-item">
                        <span className="stat-label">Revenue:</span>
                        <span className="stat-value">₱{stylist.revenue.toLocaleString()}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Bookings:</span>
                        <span className="stat-value">{stylist.bookings}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color revenue-color"></div>
                <span>Revenue</span>
              </div>
              <div className="legend-item">
                <div className="legend-color bookings-color"></div>
                <span>Bookings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Bookings</h2>
        {recentBookings.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Stylist</th>
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.clientName}</td>
                  <td>{booking.stylistName}</td>
                  <td>{booking.serviceName}</td>
                  <td>{new Date(booking.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recent bookings</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
