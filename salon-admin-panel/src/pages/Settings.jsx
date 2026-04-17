import { useState, useEffect } from 'react';
import './Settings.css';

const API = 'http://localhost:3001/api';
const STORAGE_KEY = 'salon_settings';

const TABS = [
  { id: 'salon',    label: 'Salon Info',     icon: 'bi-shop' },
  { id: 'hours',    label: 'Business Hours', icon: 'bi-clock' },
  { id: 'notifs',   label: 'Notifications',  icon: 'bi-bell' },
  { id: 'security', label: 'Security',       icon: 'bi-shield-lock' },
  { id: 'about',    label: 'About',          icon: 'bi-info-circle' },
];

const DEFAULT_HOURS = [
  { day: 'Monday',    open: true,  from: '09:00', to: '18:00' },
  { day: 'Tuesday',   open: true,  from: '09:00', to: '18:00' },
  { day: 'Wednesday', open: true,  from: '09:00', to: '18:00' },
  { day: 'Thursday',  open: true,  from: '09:00', to: '18:00' },
  { day: 'Friday',    open: true,  from: '09:00', to: '20:00' },
  { day: 'Saturday',  open: true,  from: '08:00', to: '20:00' },
  { day: 'Sunday',    open: false, from: '10:00', to: '16:00' },
];

const DEFAULT_SETTINGS = {
  salon: {
    name: 'Salon Suite',
    tagline: 'Your premier beauty destination',
    address: '123 Salon Street, Quezon City',
    phone: '+63 912 345 6789',
    email: 'hello@salonsuite.com',
    currency: 'PHP',
    timezone: 'Asia/Manila',
  },
  hours: DEFAULT_HOURS,
  notifs: {
    emailBooking: true,
    emailReminder: true,
    emailCancellation: true,
    smsBooking: false,
    smsReminder: false,
    adminFlashAlert: true,
  },
};

const normalizeBusinessHours = (hoursInput) => {
  if (!hoursInput) return DEFAULT_HOURS;
  if (Array.isArray(hoursInput)) return hoursInput;
  if (typeof hoursInput === 'object') {
    return DEFAULT_HOURS.map(({ day, ...rest }) => {
      const row = hoursInput[day];
      return row ? { day, ...rest, ...row } : { day, ...rest };
    });
  }
  return DEFAULT_HOURS;
};

function Toggle({ checked, onChange }) {
  return (
    <label className="st-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="st-slider" />
    </label>
  );
}

export default function Settings() {
  const [tab, setTab]           = useState('salon');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [salonInfo, setSalonInfo] = useState(null);
  const [toast, setToast]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [salonImages, setSalonImages] = useState([]);

  // Security tab state
  const [pw, setPw]           = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw]   = useState({ current: false, next: false, confirm: false });

  // Load salon info from API
  useEffect(() => {
    fetch(`${API}/salon-info`)
      .then(r => r.json())
      .then(data => {
        setSalonInfo({
          ...data,
          about_us: data?.about_us || 'Welcome to BeautyBoss Salon, where elegance meets expertise.',
        });
        setSalonImages(Array.isArray(data?.salon_images) ? data.salon_images : []);
        if (data?.business_hours) {
          setSettings(s => ({ ...s, hours: normalizeBusinessHours(data.business_hours) }));
        }
      })
      .catch(() => {
        setSalonInfo({
          id: 1,
          name: 'JKD SALON',
          tagline: 'Your premier beauty destination ✨',
          address: '123 Salon St, Brgy. Elegance, Quezon City, Metro Manila',
          phone: '+63 912 345 6789',
          email: 'hello@salonsuite.com',
          currency: 'PHP',
          timezone: 'Asia/Manila',
          business_hours: null,
          about_us: 'Welcome to BeautyBoss Salon, where elegance meets expertise.',
          salon_images: []
        });
        setSalonImages([]);
      });
  }, []);

  // Load settings from API
  useEffect(() => {
    fetch(`${API}/admin/settings`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setSettings(data);
        } else {
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setSettings(JSON.parse(stored));
          } catch {}
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) setSettings(JSON.parse(stored));
        } catch {}
      });
  }, []);

  const fire = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSalonImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const images = await Promise.all(files.map(readFileAsDataUrl));
      setSalonImages(prev => [...prev, ...images].slice(0, 30));
      fire(`${files.length} image${files.length > 1 ? 's' : ''} added.`);
    } catch {
      fire('Failed to read selected image(s).', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem('adminToken');
      const authHeaders = adminToken ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` } : { 'Content-Type': 'application/json' };
      
      // Save salon info
      if (salonInfo) {
        const payload = {
          ...salonInfo,
          business_hours: settings.hours,
          salon_images: salonImages,
        };
        console.log('Saving salon info:', payload);
        const siRes = await fetch(`${API}/admin/salon-info`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        console.log('Salon info save response:', siRes.status, await siRes.text());
        if (!siRes.ok) {
          const errText = await siRes.text();
          console.error('Failed to save salon info:', errText);
          fire('Failed to save salon info.', 'error');
        }
      }
      
      // Save settings
      const res = await fetch(`${API}/admin/settings`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        fire('Settings saved successfully!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        
        // Reload salon info from database to ensure we have latest data
        await fetch(`${API}/salon-info`)
          .then(r => r.json())
          .then(data => {
            setSalonInfo(data);
            setSalonImages(Array.isArray(data?.salon_images) ? data.salon_images : []);
          })
          .catch(err => console.error('Failed to reload salon info:', err));
      } else {
        const errText = await res.text();
        console.error('Failed to save settings:', errText);
        fire('Failed to save settings.', 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      // Fallback to localStorage if server unreachable
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      fire('Saved locally (server unreachable).');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const setSalon  = patch => setSettings(s => ({ ...s, salon: { ...s.salon, ...patch } }));
  const setNotifs = patch => setSettings(s => ({ ...s, notifs: { ...s.notifs, ...patch } }));
  const setHour   = (i, patch) => setSettings(s => {
    const hours = [...s.hours];
    hours[i] = { ...hours[i], ...patch };
    return { ...s, hours };
  });

  const changePassword = async () => {
    setPwError('');
    if (!pw.current)          { setPwError('Enter your current password.'); return; }
    if (pw.next.length < 8)   { setPwError('New password must be at least 8 characters.'); return; }
    if (pw.next !== pw.confirm){ setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/admin/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (res.ok) {
        fire('Password changed successfully!');
        setPw({ current: '', next: '', confirm: '' });
      } else {
        setPwError(data.message || 'Failed to change password.');
      }
    } catch {
      setPwError('Connection error. Please try again.');
    } finally {
      setPwSaving(false);
    }
  };

  const { salon, hours, notifs } = settings;

  return (
    <div className="st-root">

      {/* Toast */}
      {toast && (
        <div className={`st-toast st-toast--${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="st-header">
        <div className="st-header-icon"><i className="bi bi-gear-fill" /></div>
        <div>
          <h1 className="st-title">Settings</h1>
          <p className="st-sub">Manage your salon preferences and configuration</p>
        </div>
      </div>

      <div className="st-layout">

        {/* Tab sidebar */}
        <div className="st-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`st-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <i className={`bi ${t.icon}`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="st-panel">

          {/* ── Salon Info ── */}
          {tab === 'salon' && salonInfo && (
            <div className="st-section">
              <h2 className="st-section-title">Salon Information</h2>
              <div className="st-grid">
                <div className="st-field st-field--full">
                  <label>Salon Name</label>
                  <input value={salonInfo.name || ''} onChange={e => setSalonInfo({ ...salonInfo, name: e.target.value })} placeholder="Salon Suite" />
                </div>
                <div className="st-field st-field--full">
                  <label>Tagline</label>
                  <input value={salonInfo.tagline || ''} onChange={e => setSalonInfo({ ...salonInfo, tagline: e.target.value })} placeholder="Your premier beauty destination" />
                </div>
                <div className="st-field st-field--full">
                  <label>Address</label>
                  <input value={salonInfo.address || ''} onChange={e => setSalonInfo({ ...salonInfo, address: e.target.value })} placeholder="123 Salon Street, Quezon City" />
                </div>
                <div className="st-field st-field--full">
                  <label>Salon Place Images (choose from gallery)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSalonImagePick}
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(90,26,138,0.15)',
                      padding: 10,
                      fontSize: 13,
                      background: '#f8f3ff'
                    }}
                  />
                  {salonImages.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {salonImages.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <img
                            src={url}
                            alt={`Salon ${idx + 1}`}
                            style={{ width: 74, height: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(90,26,138,0.18)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setSalonImages(prev => prev.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              border: 'none',
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: 11,
                              cursor: 'pointer'
                            }}
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>No salon images selected yet.</div>
                  )}
                </div>
                <div className="st-field">
                  <label>Phone</label>
                  <input value={salonInfo.phone || ''} onChange={e => setSalonInfo({ ...salonInfo, phone: e.target.value })} placeholder="+63 912 345 6789" />
                </div>
                <div className="st-field">
                  <label>Email</label>
                  <input value={salonInfo.email || ''} onChange={e => setSalonInfo({ ...salonInfo, email: e.target.value })} placeholder="hello@salonsuite.com" />
                </div>
                <div className="st-field">
                  <label>Currency</label>
                  <select value={salonInfo.currency || 'PHP'} onChange={e => setSalonInfo({ ...salonInfo, currency: e.target.value })}>
                    <option value="PHP">PHP — Philippine Peso (₱)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                  </select>
                </div>
                <div className="st-field">
                  <label>Timezone</label>
                  <select value={salonInfo.timezone || 'Asia/Manila'} onChange={e => setSalonInfo({ ...salonInfo, timezone: e.target.value })}>
                    <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Business Hours ── */}
          {tab === 'hours' && (
            <div className="st-section">
              <h2 className="st-section-title">Business Hours</h2>
              <div className="st-hours-list">
                {hours.map((h, i) => (
                  <div key={h.day} className={`st-hour-row ${!h.open ? 'st-hour-row--closed' : ''}`}>
                    <div className="st-hour-day">
                      <Toggle checked={h.open} onChange={v => setHour(i, { open: v })} />
                      <span className="st-hour-day-name">{h.day}</span>
                      {!h.open && <span className="st-closed-badge">Closed</span>}
                    </div>
                    {h.open && (
                      <div className="st-hour-times">
                        <input type="time" value={h.from} onChange={e => setHour(i, { from: e.target.value })} />
                        <span className="st-hour-sep">to</span>
                        <input type="time" value={h.to}   onChange={e => setHour(i, { to: e.target.value })} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === 'notifs' && (
            <div className="st-section">
              <h2 className="st-section-title">Notification Preferences</h2>
              <div className="st-notif-group">
                <h3 className="st-notif-group-title"><i className="bi bi-envelope-fill" /> Email Notifications</h3>
                <div className="st-toggles">
                  {[
                    { key: 'emailBooking',      label: 'New Booking',      sub: 'Get notified when a new booking is made' },
                    { key: 'emailReminder',     label: 'Reminders',        sub: 'Receive appointment reminder emails' },
                    { key: 'emailCancellation', label: 'Cancellations',    sub: 'Get notified when a booking is cancelled' },
                  ].map(({ key, label, sub }) => (
                    <div key={key} className="st-toggle-row">
                      <div><span className="st-toggle-label">{label}</span><span className="st-toggle-sub">{sub}</span></div>
                      <Toggle checked={notifs[key]} onChange={v => setNotifs({ [key]: v })} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="st-notif-group">
                <h3 className="st-notif-group-title"><i className="bi bi-phone-fill" /> SMS Notifications</h3>
                <div className="st-toggles">
                  {[
                    { key: 'smsBooking',  label: 'New Booking SMS',  sub: 'Receive SMS for new bookings' },
                    { key: 'smsReminder', label: 'Reminder SMS',     sub: 'Send SMS reminders to clients' },
                  ].map(({ key, label, sub }) => (
                    <div key={key} className="st-toggle-row">
                      <div><span className="st-toggle-label">{label}</span><span className="st-toggle-sub">{sub}</span></div>
                      <Toggle checked={notifs[key]} onChange={v => setNotifs({ [key]: v })} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="st-notif-group">
                <h3 className="st-notif-group-title"><i className="bi bi-bell-fill" /> Admin Alerts</h3>
                <div className="st-toggles">
                  <div className="st-toggle-row">
                    <div><span className="st-toggle-label">Flash Cancellation Alert</span><span className="st-toggle-sub">Show 30-second flash when a client cancels</span></div>
                    <Toggle checked={notifs.adminFlashAlert} onChange={v => setNotifs({ adminFlashAlert: v })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {tab === 'security' && (
            <div className="st-section">
              <h2 className="st-section-title">Change Password</h2>
              <div className="st-grid">
                <div className="st-field st-field--full">
                  <label>Current Password</label>
                  <div className="st-pw-wrap">
                    <input
                      type={showPw.current ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={pw.current}
                      onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                    />
                    <button className="st-pw-eye" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}>
                      <i className={`bi ${showPw.current ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>
                <div className="st-field">
                  <label>New Password</label>
                  <div className="st-pw-wrap">
                    <input
                      type={showPw.next ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={pw.next}
                      onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                    />
                    <button className="st-pw-eye" onClick={() => setShowPw(s => ({ ...s, next: !s.next }))}>
                      <i className={`bi ${showPw.next ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>
                <div className="st-field">
                  <label>Confirm New Password</label>
                  <div className="st-pw-wrap">
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={pw.confirm}
                      onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                    />
                    <button className="st-pw-eye" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}>
                      <i className={`bi ${showPw.confirm ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>
              </div>
              {pwError && <div className="st-pw-error"><i className="bi bi-exclamation-circle-fill" /> {pwError}</div>}
              <button className="st-save-btn" onClick={changePassword} disabled={pwSaving}>
                <i className={`bi ${pwSaving ? 'bi-hourglass-split' : 'bi-key-fill'}`} />
                {pwSaving ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          )}

          {/* ── About ── */}
          {tab === 'about' && (
            <div className="st-section">
              <h2 className="st-section-title">About</h2>
              <div className="st-about-card">
                <div className="st-about-logo" aria-label="JKD logo">
                  <span className="st-about-logo-text">JKD</span>
                </div>
                <div className="st-about-info">
                  <span className="st-about-name">{salonInfo?.name || 'Salon Suite Admin'}</span>
                  <span className="st-about-tagline">{salonInfo?.tagline || 'Your premier beauty destination'}</span>
                  <span className="st-about-ver">Version 1.0.0</span>
                  <span className="st-about-desc">This content appears in the user app About page.</span>
                </div>
              </div>
              <div className="st-grid" style={{ marginTop: 14 }}>
                <div className="st-field st-field--full">
                  <label>About Us Description</label>
                  <textarea
                    value={salonInfo?.about_us || ''}
                    onChange={e => setSalonInfo({ ...(salonInfo || {}), about_us: e.target.value })}
                    placeholder="Tell clients about your salon..."
                    rows={6}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      borderRadius: 12,
                      border: '1px solid rgba(90,26,138,0.15)',
                      padding: 12,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      color: '#334155'
                    }}
                  />
                </div>
              </div>
              <div className="st-about-links">
                <div className="st-about-row"><i className="bi bi-envelope-fill" /> {salonInfo?.email || 'hello@salonsuite.com'}</div>
                <div className="st-about-row"><i className="bi bi-telephone-fill" /> {salonInfo?.phone || '+63 912 345 6789'}</div>
                <div className="st-about-row"><i className="bi bi-geo-alt-fill" /> {salonInfo?.address || '123 Salon Street, Quezon City'}</div>
              </div>
            </div>
          )}

          {/* Footer save button (not shown on security tab) */}
          {tab !== 'security' && (
            <div className="st-footer">
              {saved && <span className="st-saved"><i className="bi bi-check-circle-fill" /> Changes saved!</span>}
              <button className="st-save-btn" onClick={save} disabled={saving}>
                <i className={`bi ${saving ? 'bi-hourglass-split' : 'bi-floppy-fill'}`} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
