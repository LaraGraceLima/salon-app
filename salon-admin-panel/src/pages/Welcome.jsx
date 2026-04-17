import './Welcome.css';

export default function Welcome({ onEnter }) {
  return (
    <div className="wl-root">
      {/* Background blobs */}
      <div className="wl-blob wl-blob--1" />
      <div className="wl-blob wl-blob--2" />
      <div className="wl-blob wl-blob--3" />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`wl-particle wl-particle--${i + 1}`} />
      ))}
      <div className="wl-grid" />

      <div className="wl-content">
        {/* Logo */}
        <div className="wl-logo-wrap">
          <img src="/BEAUTYBOSS.png" alt="BEAUTYBOSS" className="wl-logo" />
        </div>

        {/* Brand */}
        <div className="wl-brand-row">
          <span className="wl-brand-line" />
          <span className="wl-brand-label">ADMIN PORTAL</span>
          <span className="wl-brand-line" />
        </div>
        <h1 className="wl-title">BEAUTYBOSS</h1>
        <p className="wl-subtitle">Smart scheduling. Beautiful results</p>
        <div className="wl-feature-row">
          <div className="wl-feature-chip"><i className="bi bi-lightning-charge-fill" /> Fast Workflow</div>
          <div className="wl-feature-chip"><i className="bi bi-stars" /> Premium Experience</div>
          <div className="wl-feature-chip"><i className="bi bi-bar-chart-fill" /> Better Decisions</div>
        </div>

        {/* CTA */}
        <button className="wl-btn" onClick={onEnter}>
          <span>Get Started</span>
          <i className="bi bi-arrow-right-circle-fill" />
        </button>

        <p className="wl-footer-note">Secure admin access · BeautyBoss v1.0</p>
      </div>
    </div>
  );
}
