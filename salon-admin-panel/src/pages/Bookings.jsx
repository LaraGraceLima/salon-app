import { useState, useEffect, useCallback, useRef } from 'react';
import './Bookings.css';

const API = 'http://localhost:3001/api/bookings';

const STATUS_META = {
  pending:   { color: '#f59e0b', bg: '#fef3c7', label: 'Pending',   icon: '⏳' },
  confirmed: { color: '#3b82f6', bg: '#dbeafe', label: 'Confirmed', icon: '✅' },
  completed: { color: '#10b981', bg: '#d1fae5', label: 'Completed', icon: '🎉' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'Cancelled', icon: '❌' },
};

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

function formatTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const AVATAR_COLORS = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#8b5cf6','#10b981','#0ea5e9','#f43f5e'];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name?.length || 0); i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function Bookings() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [updating, setUpdating]   = useState(null);
  const [toast, setToast]         = useState(null);
  const [lightbox, setLightbox]   = useState(null); // { images: [], index: 0 }
  const toastRef = useState(null)[1];
  const [cancelAlert, setCancelAlert] = useState(null); // { clientName, serviceName, reason }
  const [rescheduleAlert, setRescheduleAlert] = useState(null); // { clientName, oldDateTime, newDateTime, oldStylist, newStylist, oldService, newService }
  const cancelAlertTimer = useRef(null);
  const rescheduleAlertTimer = useRef(null);

  const fire = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      // Sort by id ascending = queue order (first booked = first in line)
      setBookings(Array.isArray(data) ? data.sort((a, b) => b.id - a.id) : []);
    } catch { fire('Failed to load bookings.', 'error'); }
    finally { setLoading(false); }
  }, [fire]);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);

    // WebSocket for real-time notifications
    const wsUrl = 'ws://localhost:3001';
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          
          // Cancellation alerts
          if (msg.type === 'booking_cancelled' && msg.data?.cancelled_by === 'client') {
            clearTimeout(cancelAlertTimer.current);
            setCancelAlert({
              clientName: msg.data.clientName || 'A client',
              serviceName: msg.data.serviceName || 'a service',
              reason: msg.data.reason || 'No reason provided',
            });
            cancelAlertTimer.current = setTimeout(() => setCancelAlert(null), 30000);
            fetchBookings();
          }
          
          // Reschedule alerts
          if (msg.type === 'booking_rescheduled') {
            clearTimeout(rescheduleAlertTimer.current);
            setRescheduleAlert({
              clientName: msg.data.clientName || 'A client',
              oldDateTime: msg.data.oldDateTime,
              newDateTime: msg.data.newDateTime,
              oldStylist: msg.data.oldStylistId,
              newStylist: msg.data.newStylistId,
              oldService: msg.data.oldServiceId,
              newService: msg.data.newServiceId,
              reason: msg.data.reason || 'Rescheduled by client'
            });
            rescheduleAlertTimer.current = setTimeout(() => setRescheduleAlert(null), 30000);
            fetchBookings();
          }
        } catch {}
      };
    } catch {}

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
      clearTimeout(cancelAlertTimer.current);
      clearTimeout(rescheduleAlertTimer.current);
    };
  }, [fetchBookings]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await fetchBookings();
      fire(`Booking ${status}.`);
    } catch { fire('Failed to update booking.', 'error'); }
    finally { setUpdating(null); }
  };

  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.clientName?.toLowerCase().includes(q) ||
      b.stylistName?.toLowerCase().includes(q) ||
      b.serviceName?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? bookings.length : bookings.filter(b => b.status === f).length;
    return acc;
  }, {});

  if (loading) return (
    <div className="bk-loading">
      <div className="bk-ring"><div/><div/><div/><div/></div>
      <p>Loading bookings…</p>
    </div>
  );

  return (
    <div className="bk-root">

      {/* Toast */}
      {toast && (
        <div className={`bk-toast bk-toast--${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.msg}</span>
          <div className="bk-toast-bar" />
        </div>
      )}

      {/* Cancellation Flash Alert */}
      {cancelAlert && (
        <div className="bk-cancel-alert">
          <div className="bk-cancel-alert-icon">🚨</div>
          <div className="bk-cancel-alert-body">
            <div className="bk-cancel-alert-title">Booking Cancelled by Client</div>
            <div className="bk-cancel-alert-detail">
              <strong>{cancelAlert.clientName}</strong> cancelled <strong>{cancelAlert.serviceName}</strong>
            </div>
            <div className="bk-cancel-alert-reason">Reason: {cancelAlert.reason}</div>
          </div>
          <button className="bk-cancel-alert-close" onClick={() => { clearTimeout(cancelAlertTimer.current); setCancelAlert(null); }}>✕</button>
          <div className="bk-cancel-alert-bar" />
        </div>
      )}

      {/* Reschedule Flash Alert */}
      {rescheduleAlert && (
        <div className="bk-reschedule-alert">
          <div className="bk-reschedule-alert-icon">🔄</div>
          <div className="bk-reschedule-alert-body">
            <div className="bk-reschedule-alert-title">Appointment Rescheduled</div>
            <div className="bk-reschedule-alert-client">
              <strong>{rescheduleAlert.clientName}</strong> rescheduled their appointment
            </div>
            <div className="bk-reschedule-alert-changes">
              <div className="bk-reschedule-change">
                <span className="bk-reschedule-label">📅 Date & Time:</span>
                <span className="bk-reschedule-old">{formatTime(rescheduleAlert.oldDateTime)}</span>
                <span className="bk-reschedule-arrow">→</span>
                <span className="bk-reschedule-new">{formatTime(rescheduleAlert.newDateTime)}</span>
              </div>
              {rescheduleAlert.oldStylist !== rescheduleAlert.newStylist && (
                <div className="bk-reschedule-change">
                  <span className="bk-reschedule-label">💇 Stylist:</span>
                  <span className="bk-reschedule-old">{rescheduleAlert.oldStylist}</span>
                  <span className="bk-reschedule-arrow">→</span>
                  <span className="bk-reschedule-new">{rescheduleAlert.newStylist}</span>
                </div>
              )}
              {rescheduleAlert.oldService !== rescheduleAlert.newService && (
                <div className="bk-reschedule-change">
                  <span className="bk-reschedule-label">✨ Service:</span>
                  <span className="bk-reschedule-old">{rescheduleAlert.oldService}</span>
                  <span className="bk-reschedule-arrow">→</span>
                  <span className="bk-reschedule-new">{rescheduleAlert.newService}</span>
                </div>
              )}
            </div>
            <div className="bk-reschedule-alert-reason">Reason: {rescheduleAlert.reason}</div>
          </div>
          <button className="bk-reschedule-alert-close" onClick={() => { clearTimeout(rescheduleAlertTimer.current); setRescheduleAlert(null); }}>✕</button>
          <div className="bk-reschedule-alert-bar" />
        </div>
      )}



      {/* Lightbox */}
      {lightbox && (
        <div className="bk-lightbox" onClick={() => setLightbox(null)}>
          <div className="bk-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="bk-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img
              src={lightbox.images[lightbox.index]}
              alt="Reference"
              className="bk-lightbox-img"
            />
            {lightbox.images.length > 1 && (
              <div className="bk-lightbox-nav">
                {lightbox.images.map((_, i) => (
                  <button
                    key={i}
                    className={`bk-lightbox-dot ${i === lightbox.index ? 'active' : ''}`}
                    onClick={() => setLightbox(prev => ({ ...prev, index: i }))}
                  />
                ))}
              </div>
            )}
            {lightbox.specialRequest && (
              <div className="bk-lightbox-caption">
                <i className="bi bi-chat-quote-fill" /> {lightbox.specialRequest}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="bk-toolbar">
        <div className="bk-search-wrap">
          <span>🔍</span>
          <input className="bk-search" placeholder="Search client, stylist, service…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="bk-search-x" onClick={() => setSearch('')}>✕</button>}
        </div>
        <div className="bk-filters">
          {FILTERS.map(f => (
            <button key={f}
              className={`bk-filter${filter === f ? ' bk-filter--active' : ''}`}
              style={filter === f && f !== 'all' ? { '--fc': STATUS_META[f]?.color, '--fb': STATUS_META[f]?.bg } : {}}
              onClick={() => setFilter(f)}>
              {f !== 'all' && <span>{STATUS_META[f]?.icon}</span>}
              <span>{f === 'all' ? 'All' : STATUS_META[f]?.label}</span>
              <span className="bk-filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="bk-results-bar">
        <span className="bk-results-count"><span className="bk-results-dot" />{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</span>
        {(search || filter !== 'all') && (
          <button className="bk-clear-btn" onClick={() => { setSearch(''); setFilter('all'); }}>✕ Clear</button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bk-empty">
          <div className="bk-empty-ico">📋</div>
          <h3>{search || filter !== 'all' ? 'No results found' : 'No bookings yet'}</h3>
          <p>{search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Bookings will appear here once clients start booking.'}</p>
        </div>
      ) : (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Service</th>
                <th>Stylist</th>
                <th>Date & Time</th>
                <th>Price</th>
                <th>Request</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking, i) => {
                const meta  = STATUS_META[booking.status] || STATUS_META.pending;
                const isUpd = updating === booking.id;
                return (
                  <tr key={booking.id} style={{ animationDelay: `${i * 30}ms` }}>
                    <td><span className="bk-td-id">#{booking.id}</span></td>

                    <td>
                      <div className="bk-td-client">
                        <div className="bk-avatar" style={{ background: avatarColor(booking.clientName) }}>
                          {getInitials(booking.clientName)}
                        </div>
                        <div>
                          <div className="bk-client-name">{booking.clientName}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="bk-td-service">
                        {booking.serviceImage && (
                          <img src={booking.serviceImage} alt={booking.serviceName} className="bk-service-thumb" />
                        )}
                        <div>
                          <div className="bk-service-name">{booking.serviceName}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="bk-stylist-name">{booking.stylistName}</span>
                    </td>

                    <td>
                      <span className="bk-td-date">{formatTime(booking.dateTime)}</span>
                    </td>

                    <td>
                      {Number(booking.promoDiscountPercentage || 0) > 0 && Number(booking.discountedPrice) < Number(booking.originalPrice) ? (
                        <div className="bk-td-price-wrap">
                          <span className="bk-td-price-old">₱{Number(booking.originalPrice).toLocaleString()}</span>
                          <span className="bk-td-price">₱{Number(booking.discountedPrice).toLocaleString()}</span>
                          <span className="bk-td-discount">-{Number(booking.promoDiscountPercentage)}%</span>
                        </div>
                      ) : (
                        <span className="bk-td-price">₱{Number(booking.price).toLocaleString()}</span>
                      )}
                    </td>

                    <td>
                      {/* Special request + reference images */}
                      {(booking.specialRequest || (booking.referenceImages && booking.referenceImages.length > 0) || booking.referenceImage) ? (
                        <div className="bk-request-cell">
                          {booking.specialRequest && (
                            <div className="bk-request-text" title={booking.specialRequest}>
                              <i className="bi bi-chat-quote-fill" />
                              <span>{booking.specialRequest.length > 40 ? booking.specialRequest.slice(0, 40) + '…' : booking.specialRequest}</span>
                            </div>
                          )}
                          {(() => {
                            const imgs = booking.referenceImages?.length > 0
                              ? booking.referenceImages
                              : booking.referenceImage ? [booking.referenceImage] : [];
                            if (imgs.length === 0) return null;
                            return (
                              <div className="bk-ref-thumbs">
                                {imgs.slice(0, 3).map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Ref ${idx + 1}`}
                                    className="bk-ref-thumb"
                                    onClick={() => setLightbox({ images: imgs, index: idx, specialRequest: booking.specialRequest })}
                                    title="Click to view"
                                  />
                                ))}
                                {imgs.length > 3 && <span className="bk-ref-more">+{imgs.length - 3}</span>}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="bk-no-request">—</span>
                      )}
                    </td>

                    <td>
                      <span className="bk-status-pill" style={{ background: meta.bg, color: meta.color }}>
                        {meta.icon} {meta.label}
                      </span>
                      {booking.status === 'cancelled' && booking.cancellationReason && (
                        <div className="bk-cancel-reason" style={{ marginTop: 6 }} title={booking.cancellationReason}>
                          💬 {booking.cancellationReason.length > 50
                            ? booking.cancellationReason.slice(0, 50) + '…'
                            : booking.cancellationReason}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="bk-td-actions">
                        {booking.status === 'pending' && (
                          <>
                            <button className="bk-btn bk-btn--confirm" disabled={isUpd}
                              onClick={() => updateStatus(booking.id, 'confirmed')}>
                              {isUpd ? '…' : '✓ Confirm'}
                            </button>
                            <button className="bk-btn bk-btn--cancel" disabled={isUpd}
                              onClick={() => updateStatus(booking.id, 'cancelled')}>
                              ✕
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button className="bk-btn bk-btn--complete" disabled={isUpd}
                            onClick={() => updateStatus(booking.id, 'completed')}>
                            {isUpd ? '…' : '🎉 Complete'}
                          </button>
                        )}
                        {(booking.status === 'completed' || booking.status === 'cancelled') && (
                          <div className="bk-done-wrap">
                            <span className="bk-done-label">
                              {booking.status === 'completed' ? '✓ Done' : '✕ Cancelled'}
                            </span>
                            {booking.status === 'cancelled' && booking.cancellationReason && (
                              <span className="bk-cancel-reason" title={booking.cancellationReason}>
                                💬 {booking.cancellationReason.length > 40
                                  ? booking.cancellationReason.slice(0, 40) + '…'
                                  : booking.cancellationReason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
