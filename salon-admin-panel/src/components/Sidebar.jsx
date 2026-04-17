import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { path: '/',         icon: 'bi-speedometer2',    label: 'Dashboard'    },
      { path: '/bookings', icon: 'bi-calendar2-check', label: 'Appointments' },
      { path: '/services', icon: 'bi-stars',           label: 'Services'     },
      { path: '/stylists', icon: 'bi-scissors',        label: 'Stylists'     },
      { path: '/clients',  icon: 'bi-people-fill',     label: 'Clients'      },
      { path: '/promos',   icon: 'bi-tag-fill',        label: 'Promos'       },
      { path: '/pos',      icon: 'bi-cash-register',   label: 'POS'          },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: '/reports',  icon: 'bi-graph-up-arrow',  label: 'Reports'      },
      { path: '/reviews',  icon: 'bi-chat-heart-fill', label: 'Reviews'      },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/settings',  icon: 'bi-gear-fill',  label: 'Settings'  },
    ],
  },
];

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar-v3 ${collapsed ? 'collapsed' : ''}`}>

      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-logo-wrap">
          <div className="sb-logo-icon">
            <img src="/BEAUTYBOSS.png" alt="BeautyBoss" className="sb-logo-img" />
            <span className="sb-logo-shine" />
          </div>
          {!collapsed && (
            <div className="sb-logo-text">
              <span className="sb-title">
                Beauty<span className="sb-title-accent">Boss</span>
              </span>
              <span className="sb-sub">Admin Panel</span>
            </div>
          )}
        </div>
        <button
          className="sb-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="sb-group">
            {!collapsed && (
              <div className="sb-section-label">{group.label}</div>
            )}
            {group.items.map(({ path, icon, label }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`sb-link ${active ? 'sb-link--active' : ''}`}
                  onMouseEnter={() => setHoveredPath(path)}
                  onMouseLeave={() => setHoveredPath(null)}
                >
                  {active && <span className="sb-active-bar" />}
                  <span className="sb-link-icon">
                    <i className={`bi ${icon}`} />
                  </span>
                  {!collapsed && (
                    <span className="sb-link-label">{label}</span>
                  )}
                  {!collapsed && active && (
                    <span className="sb-active-dot" />
                  )}
                  {collapsed && hoveredPath === path && (
                    <span className="sb-tooltip">{label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <div className={`sb-user ${collapsed ? 'sb-user--mini' : ''}`}>
          <div className="sb-avatar">
            <span>{(user?.name || 'A').charAt(0).toUpperCase()}</span>
            <span className="sb-avatar-ring" />
          </div>
          {!collapsed && (
            <div className="sb-user-info">
              <span className="sb-user-name">{user?.name || 'Admin'}</span>
              <span className="sb-user-role">Administrator</span>
            </div>
          )}
        </div>
        <button className="sb-logout" onClick={onLogout} title="Sign out">
          <i className="bi bi-box-arrow-right" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
}
