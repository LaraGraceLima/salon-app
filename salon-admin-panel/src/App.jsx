import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Stylists from './pages/Stylists';
import Services from './pages/Services';
import Bookings from './pages/Bookings';
import Promos from './pages/Promos';
import Reports from './pages/Reports';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import POS from './pages/POS';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      setShowWelcome(false);
      setUser(JSON.parse(localStorage.getItem('adminUser')));
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setShowWelcome(false);
    setUser(userData);
    localStorage.setItem('adminToken', userData.token);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowWelcome(true);
    setUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  if (!isAuthenticated) {
    if (showWelcome) return <Welcome onEnter={() => setShowWelcome(false)} />;
    return <Login onLogin={handleLogin} onBack={() => setShowWelcome(true)} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <TopBar user={user} onLogout={handleLogout} />
          <div className="page-body">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/stylists" element={<Stylists />} />
              <Route path="/services" element={<Services />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/promos" element={<Promos />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/pos" element={<POS />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
