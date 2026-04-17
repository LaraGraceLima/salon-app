import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import './TopBar.css';

const PAGE_META = {
  '/':           { title: 'Dashboard',           subtitle: 'Overview of your salon today',      icon: 'bi-speedometer2',    color: '#e8a020' },
  '/clients':    { title: 'Clients',             subtitle: 'Manage your client database',        icon: 'bi-people-fill',     color: '#7b3494' },
  '/stylists':   { title: 'Stylists',            subtitle: 'Your team of professionals',         icon: 'bi-scissors',        color: '#e8a020' },
  '/services':   { title: 'Services',            subtitle: 'Manage treatments & pricing',        icon: 'bi-stars',           color: '#c0604a' },
  '/bookings':   { title: 'Appointments',        subtitle: 'Track and manage all bookings',      icon: 'bi-calendar2-check', color: '#59226b' },
  '/promos':     { title: 'Promos',              subtitle: 'Active promotions & discounts',      icon: 'bi-tag-fill',        color: '#f6c06f' },
  '/reports':    { title: 'Reports & Analytics', subtitle: 'Insights and performance data',      icon: 'bi-graph-up-arrow',  color: '#7b3494' },
  '/reviews':    { title: 'Reviews & Feedback',  subtitle: 'What your clients are saying',       icon: 'bi-chat-heart-fill', color: '#e07a60' },
  '/reminders':  { title: 'Reminders',           subtitle: 'Automated client notifications',     icon: 'bi-bell-fill',       color: '#e8a020' },
  '/settings':   { title: 'Settings',            subtitle: 'Configure your admin panel',         icon: 'bi-gear-fill',       color: '#59226b' },
};

const NOTIF_ITEMS = [];

const SEARCH_ROUTES = [
  { label: 'Dashboard',    path: '/',          icon: 'bi-speedometer2' },
  { label: 'Appointments', path: '/bookings',  icon: 'bi-calendar2-check' },
  { label: 'Services',     path: '/services',  icon: 'bi-stars' },
  { label: 'Stylists',     path: '/stylists',  icon: 'bi-scissors' },
  { label: 'Clients',      path: '/clients',   icon: 'bi-people-fill' },
  { label: 'Reports',      path: '/reports',   icon: 'bi-graph-up-arrow' },
  { label: 'Reviews',      path: '/reviews',   icon: 'bi-chat-heart-fill' },
  { label: 'Reminders',    path: '/reminders', icon: 'bi-bell-fill' },
  { label: 'Settings',     path: '/settings',  icon: 'bi-gear-fill' },
];

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="tb-clock">
      <i className="bi bi-clock" />
      <span>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  );
}

let notifIdCounter = 1;

function timeAgo(date) {
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return 'Yesterday';
}

export default function TopBar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = PAGE_META[location.pathname] || PAGE_META['/'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const [showNotifs, setShowNotifs]     = useState(false);
  const [notifs, setNotifs]             = useState(NOTIF_ITEMS);
  const [flashToast, setFlashToast]     = useState(null);
  const [showSearch, setShowSearch]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef       = useRef(null);
  const searchRef      = useRef(null);
  const userMenuRef    = useRef(null);
  const searchInputRef = useRef(null);
  const wsRef          = useRef(null);
  const toastTimerRef  = useRef(null);

  const unreadCount = notifs.filter(n => !n.read).length;
  const searchResults = searchQuery.trim()
    ? SEARCH_ROUTES.filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : SEARCH_ROUTES;

  /* ── WebSocket connection ── */
  const connectWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return;
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === 'booking_created') {
          const d = msg.data || {};
          const newNotif = {
            id: notifIdCounter++,
            icon: 'bi-calendar2-check',
            color: '#59226b',
            bg: '#f3e8ff',
            title: 'New Booking!',
            sub: `${d.clientName || 'A client'} booked ${d.serviceName || 'a service'}`,
            time: timeAgo(Date.now()),
            read: false,
            _ts: Date.now(),
          };
          setNotifs(prev => [newNotif, ...prev]);
          triggerFlashToast(newNotif);
        } else if (msg.type === 'booking_cancelled') {
          const d = msg.data || {};
          const newNotif = {
            id: notifIdCounter++,
            icon: 'bi-x-circle-fill',
            color: '#c0604a',
            bg: '#fee2e2',
            title: 'Booking Cancelled',
            sub: `${d.clientName || 'A client'} cancelled their appointment`,
            time: timeAgo(Date.now()),
            read: false,
            _ts: Date.now(),
          };
          setNotifs(prev => [newNotif, ...prev]);
        } else if (msg.type === 'rating_added') {
          const d = msg.data || {};
          const newNotif = {
            id: notifIdCounter++,
            icon: 'bi-star-fill',
            color: '#c8860a',
            bg: '#fef3c7',
            title: 'New Review!',
            sub: `${d.clientName || 'A client'} left a ${d.rating || 5}-star review`,
            time: timeAgo(Date.now()),
            read: false,
            _ts: Date.now(),
          };
          setNotifs(prev => [newNotif, ...prev]);
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      // auto-reconnect after 5s
      setTimeout(connectWS, 5000);
    };
  }, []);

  useEffect(() => {
    connectWS();
    return () => {
      wsRef.current?.close();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [connectWS]);

  const triggerFlashToast = (notif) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFlashToast(notif);
    toastTimerRef.current = setTimeout(() => setFlashToast(null), 30000);
  };

  const dismissFlashToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFlashToast(null);
  };

  /* ── Click outside ── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current    && !notifRef.current.contains(e.target))    setShowNotifs(false);
      if (searchRef.current   && !searchRef.current.contains(e.target))   setShowSearch(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [showSearch]);

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleSearchSelect = (path) => {
    navigate(path);
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <header className="topbar">
      {/* gold shimmer line */}
      <div className="tb-accent-line" />

      {/* ── Flash Toast (booking notification) ── */}
      {flashToast && (
        <div className="tb-flash-toast">
          <div className="tb-flash-toast-icon">
            <i className={`bi ${flashToast.icon}`} style={{ color: flashToast.color }} />
          </div>
          <div className="tb-flash-toast-body">
            <span className="tb-flash-toast-title">{flashToast.title}</span>
            <span className="tb-flash-toast-sub">{flashToast.sub}</span>
          </div>
          <button className="tb-flash-toast-close" onClick={dismissFlashToast}>
            <i className="bi bi-x" />
          </button>
          <div className="tb-flash-toast-progress" />
        </div>
      )}

      {/* ── Left: page identity ── */}
      <div className="tb-left">
        <div className="tb-page-icon" style={{ '--pg-color': meta.color }}>
          <i className={`bi ${meta.icon}`} />
        </div>
        <div className="tb-page-text">
          <h1 className="tb-page-title">{meta.title}</h1>
          <p className="tb-page-sub">{meta.subtitle}</p>
        </div>
      </div>

      {/* ── Right: controls ── */}
      <div className="tb-right">

        {/* Date */}
        <div className="tb-date">
          <i className="bi bi-calendar3" />
          <span>{today}</span>
        </div>

        {/* Clock */}
        <Clock />

        <div className="tb-divider" />

        {/* Notifications */}
        <div className="tb-dropdown-wrap" ref={notifRef}>
          <button
            className={`tb-icon-btn ${showNotifs ? 'active' : ''}`}
            onClick={() => { setShowNotifs(v => !v); setShowSearch(false); setShowUserMenu(false); }}
            title="Notifications"
          >
            <i className="bi bi-bell-fill" />
            {unreadCount > 0 && <span className="tb-badge">{unreadCount}</span>}
          </button>

          {showNotifs && (
            <div className="tb-dropdown tb-notif-dropdown">
              <div className="tb-dd-header">
                <span className="tb-dd-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="tb-dd-action" onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              <div className="tb-notif-list">
                {notifs.map(n => (
                  <div key={n.id} className={`tb-notif-item ${n.read ? 'read' : ''}`} onClick={() => markRead(n.id)}>
                    <div className="tb-notif-icon" style={{ background: n.bg, color: n.color }}>
                      <i className={`bi ${n.icon}`} />
                    </div>
                    <div className="tb-notif-body">
                      <span className="tb-notif-title">{n.title}</span>
                      <span className="tb-notif-sub">{n.sub}</span>
                      <span className="tb-notif-time">{n.time}</span>
                    </div>
                    {!n.read && <span className="tb-notif-dot" />}
                  </div>
                ))}
              </div>
              <div className="tb-dd-footer">
                <button className="tb-dd-view-all" onClick={() => { navigate('/reminders'); setShowNotifs(false); }}>
                  View all notifications <i className="bi bi-arrow-right" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="tb-dropdown-wrap" ref={searchRef}>
          <button
            className={`tb-icon-btn ${showSearch ? 'active' : ''}`}
            onClick={() => { setShowSearch(v => !v); setShowNotifs(false); setShowUserMenu(false); }}
            title="Search"
          >
            <i className="bi bi-search" />
          </button>

          {showSearch && (
            <div className="tb-dropdown tb-search-dropdown">
              <div className="tb-search-input-wrap">
                <i className="bi bi-search tb-search-icon" />
                <input
                  ref={searchInputRef}
                  className="tb-search-input"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="tb-search-clear" onClick={() => setSearchQuery('')}>
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
              <div className="tb-search-results">
                {searchResults.length === 0
                  ? <div className="tb-search-empty">No results found</div>
                  : searchResults.map(r => (
                    <button key={r.path} className="tb-search-item" onClick={() => handleSearchSelect(r.path)}>
                      <i className={`bi ${r.icon}`} />
                      <span>{r.label}</span>
                      <i className="bi bi-arrow-right tb-search-arrow" />
                    </button>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <div className="tb-divider" />

        {/* User menu */}
        <div className="tb-dropdown-wrap" ref={userMenuRef}>
          <div
            className={`tb-user-chip ${showUserMenu ? 'active' : ''}`}
            onClick={() => { setShowUserMenu(v => !v); setShowNotifs(false); setShowSearch(false); }}
          >
            <div className="tb-user-avatar">
              {(user?.name || 'A').charAt(0).toUpperCase()}
              <span className="tb-online-dot" />
            </div>
            <div className="tb-user-meta">
              <span className="tb-user-name">{user?.name || 'Admin'}</span>
              <span className="tb-user-role">
                <span className="tb-role-dot" />
                Administrator
              </span>
            </div>
            <i className={`bi bi-chevron-${showUserMenu ? 'up' : 'down'} tb-chevron`} />
          </div>

          {showUserMenu && (
            <div className="tb-dropdown tb-user-dropdown">
              <div className="tb-user-dd-header">
                <div className="tb-user-dd-avatar">
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="tb-user-dd-name">{user?.name || 'Admin User'}</div>
                  <div className="tb-user-dd-email">{user?.email || 'admin@beautyboss.com'}</div>
                </div>
              </div>
              <div className="tb-user-dd-divider" />
              <button className="tb-user-dd-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                <i className="bi bi-person-circle" /> My Profile
              </button>
              <button className="tb-user-dd-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                <i className="bi bi-gear-fill" /> Settings
              </button>
              <div className="tb-user-dd-divider" />
              <button className="tb-user-dd-item tb-user-dd-logout" onClick={onLogout}>
                <i className="bi bi-box-arrow-right" /> Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
