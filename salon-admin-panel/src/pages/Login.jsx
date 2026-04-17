import { useState } from 'react';
import './Login.css';

export default function Login({ onLogin, onBack }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ln-root">
      {/* Background layers */}
      <div className="ln-blob ln-blob--1" />
      <div className="ln-blob ln-blob--2" />
      <div className="ln-blob ln-blob--3" />
      <div className="ln-grid" />
      <div className="ln-noise" />

      <div className="ln-layout">
        <section className="ln-hero">
          <p className="ln-hero-chip">BeautyBoss Admin Suite</p>
          <h1 className="ln-hero-title">Power your salon operations with confidence.</h1>
          <p className="ln-hero-sub">
            Track appointments, revenue, and stylist performance in one elegant dashboard.
          </p>
          <div className="ln-hero-stats">
            <div className="ln-hero-stat">
              <i className="bi bi-graph-up-arrow" />
              <span>Revenue Insights</span>
            </div>
            <div className="ln-hero-stat">
              <i className="bi bi-calendar2-check" />
              <span>Smart Scheduling</span>
            </div>
            <div className="ln-hero-stat">
              <i className="bi bi-shield-lock" />
              <span>Secure Access</span>
            </div>
          </div>
        </section>

        {/* Glass card */}
        <div className="ln-glass">
          {/* Back button */}
          {onBack && (
            <button className="ln-back" onClick={onBack}>
              <i className="bi bi-arrow-left" /> Back
            </button>
          )}

          {/* Header */}
          <div className="ln-logo">
            <img src="/BEAUTYBOSS.png" alt="BEAUTYBOSS" />
          </div>
          <h2 className="ln-title">Welcome Back</h2>
          <p className="ln-sub">Sign in to your admin account</p>

          {error && (
            <div className="ln-error">
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="ln-form">
            <div className="ln-field">
              <label>Email Address</label>
              <div className="ln-input-wrap">
                <i className="bi bi-envelope ln-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@salon.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="ln-field">
              <label>Password</label>
              <div className="ln-input-wrap">
                <i className="bi bi-lock ln-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="ln-eye" onClick={() => setShowPw(p => !p)}>
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="ln-btn" disabled={loading}>
              {loading
                ? <><i className="bi bi-hourglass-split" /> Signing in...</>
                : <><i className="bi bi-box-arrow-in-right" /> Login</>}
            </button>
          </form>

          <div className="ln-hint">
            <i className="bi bi-info-circle" />
            <span>Demo: <strong>admin@salon.com</strong> / <strong>admin123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
