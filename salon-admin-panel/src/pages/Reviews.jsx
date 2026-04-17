import { useState, useEffect, useCallback } from 'react';
import './Reviews.css';

const API = 'http://localhost:3001/api';

const Stars = ({ rating, size = 14 }) => (
  <span className="rv-stars">
    {[1,2,3,4,5].map(s => (
      <i key={s} className={`bi bi-star${s <= rating ? '-fill' : ''}`}
        style={{ fontSize: size, color: s <= rating ? '#e8a020' : 'rgba(255,255,255,0.15)' }} />
    ))}
  </span>
);

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const AVATAR_COLORS = ['#59226b','#7b3494','#e8a020','#c0604a','#3d1450','#c8860a'];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name?.length || 0); i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const STAR_FILTERS = ['All', '5', '4', '3', '2', '1'];

export default function Reviews() {
  const [reviews, setReviews]     = useState([]);
  const [stylists, setStylists]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [starFilter, setStarFilter] = useState('All');
  const [stylistFilter, setStylistFilter] = useState('All');
  const [search, setSearch]       = useState('');
  const [deleting, setDeleting]   = useState(null);
  const [toast, setToast]         = useState(null);

  const fire = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = useCallback(async () => {
    try {
      const [rvRes, stRes] = await Promise.all([
        fetch(`${API}/ratings`),
        fetch(`${API}/stylists`),
      ]);
      if (rvRes.ok) setReviews(await rvRes.json());
      if (stRes.ok) setStylists(await stRes.json());
    } catch { fire('Failed to load reviews.', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const deleteReview = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`${API}/ratings/${id}`, { method: 'DELETE' });
      if (res.ok) { setReviews(prev => prev.filter(r => r.id !== id)); fire('Review removed.'); }
      else fire('Failed to delete.', 'error');
    } catch { fire('Connection error.', 'error'); }
    finally { setDeleting(null); }
  };

  // Filtered list
  const filtered = reviews.filter(r => {
    const matchStar    = starFilter === 'All' || r.rating === parseInt(starFilter);
    const matchStylist = stylistFilter === 'All' || String(r.stylistId) === stylistFilter;
    const q = search.toLowerCase();
    const matchSearch  = !q || r.clientName?.toLowerCase().includes(q) || r.stylistName?.toLowerCase().includes(q) || r.serviceName?.toLowerCase().includes(q) || r.review?.toLowerCase().includes(q);
    return matchStar && matchStylist && matchSearch;
  });

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const breakdown = [5,4,3,2,1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === s).length / reviews.length) * 100 : 0,
  }));

  // Per-stylist averages
  const stylistStats = stylists.map(st => {
    const stRvs = reviews.filter(r => r.stylistId === st.id);
    const stAvg = stRvs.length ? stRvs.reduce((s, r) => s + r.rating, 0) / stRvs.length : 0;
    return { ...st, avg: stAvg, count: stRvs.length };
  }).filter(s => s.count > 0).sort((a, b) => b.avg - a.avg);

  if (loading) return (
    <div className="rv-loading">
      <div className="rv-ring"><div/><div/><div/><div/></div>
      <p>Loading reviews…</p>
    </div>
  );

  return (
    <div className="rv-root">

      {/* Toast */}
      {toast && (
        <div className={`rv-toast rv-toast--${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="rv-header">
        <div className="rv-header-icon"><i className="bi bi-chat-heart-fill" /></div>
        <div>
          <h1 className="rv-title">Reviews & Feedback</h1>
          <p className="rv-sub">Monitor what clients say about your stylists</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="rv-summary">
        <div className="rv-avg-block">
          <span className="rv-avg-num">{avg.toFixed(1)}</span>
          <Stars rating={Math.round(avg)} size={18} />
          <span className="rv-avg-lbl">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="rv-breakdown">
          {breakdown.map(({ star, count, pct }) => (
            <div key={star} className="rv-bar-row">
              <span className="rv-bar-star">{star} <i className="bi bi-star-fill" style={{ color: '#e8a020', fontSize: 10 }} /></span>
              <div className="rv-bar-track"><div className="rv-bar-fill" style={{ width: `${pct}%` }} /></div>
              <span className="rv-bar-count">{count}</span>
            </div>
          ))}
        </div>

        <div className="rv-quick-stats">
          <div className="rv-qs"><span className="rv-qs-val">{reviews.filter(r => r.rating >= 4).length}</span><span className="rv-qs-lbl">Positive</span></div>
          <div className="rv-qs"><span className="rv-qs-val">{reviews.filter(r => r.rating <= 2).length}</span><span className="rv-qs-lbl">Negative</span></div>
          <div className="rv-qs"><span className="rv-qs-val">{stylistStats.length}</span><span className="rv-qs-lbl">Stylists</span></div>
        </div>
      </div>

      {/* Stylist leaderboard */}
      {stylistStats.length > 0 && (
        <div className="rv-leaderboard">
          <div className="rv-lb-title"><i className="bi bi-trophy-fill" /> Stylist Ratings</div>
          <div className="rv-lb-list">
            {stylistStats.map((st, i) => (
              <button
                key={st.id}
                className={`rv-lb-item ${stylistFilter === String(st.id) ? 'active' : ''}`}
                onClick={() => setStylistFilter(stylistFilter === String(st.id) ? 'All' : String(st.id))}
              >
                <span className="rv-lb-rank">#{i + 1}</span>
                <div className="rv-lb-avatar" style={{ background: avatarColor(st.name) }}>{getInitials(st.name)}</div>
                <div className="rv-lb-info">
                  <span className="rv-lb-name">{st.name}</span>
                  <span className="rv-lb-meta">{st.count} review{st.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="rv-lb-score">
                  <span className="rv-lb-avg">{st.avg.toFixed(1)}</span>
                  <i className="bi bi-star-fill" style={{ color: '#e8a020', fontSize: 11 }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="rv-toolbar">
        <div className="rv-search-wrap">
          <i className="bi bi-search" />
          <input className="rv-search" placeholder="Search client, stylist, service…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="rv-search-x" onClick={() => setSearch('')}>✕</button>}
        </div>
        <div className="rv-star-filters">
          {STAR_FILTERS.map(f => (
            <button key={f} className={`rv-chip ${starFilter === f ? 'active' : ''}`} onClick={() => setStarFilter(f)}>
              {f === 'All' ? 'All Stars' : <><i className="bi bi-star-fill" style={{ color: starFilter === f ? '#fff' : '#e8a020', fontSize: 11 }} /> {f}</>}
            </button>
          ))}
        </div>
      </div>

      {/* Results bar */}
      <div className="rv-results-bar">
        <span className="rv-results-count"><span className="rv-results-dot" />{filtered.length} review{filtered.length !== 1 ? 's' : ''}</span>
        {(search || starFilter !== 'All' || stylistFilter !== 'All') && (
          <button className="rv-clear-btn" onClick={() => { setSearch(''); setStarFilter('All'); setStylistFilter('All'); }}>✕ Clear filters</button>
        )}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rv-empty">
          <i className="bi bi-chat-slash" />
          <p>{reviews.length === 0 ? 'No reviews yet — they\'ll appear once clients rate their appointments.' : 'No reviews match your filters.'}</p>
        </div>
      ) : (
        <div className="rv-list">
          {filtered.map((r, i) => (
            <div key={r.id} className="rv-card" style={{ animationDelay: `${i * 25}ms` }}>
              <div className="rv-card-top">
                <div className="rv-avatar" style={{ background: avatarColor(r.clientName) }}>
                  {getInitials(r.clientName)}
                </div>
                <div className="rv-card-info">
                  <span className="rv-client">{r.clientName}</span>
                  <span className="rv-meta">
                    <i className="bi bi-scissors" /> {r.serviceName}
                    &nbsp;·&nbsp;
                    <i className="bi bi-person-fill" /> {r.stylistName}
                    &nbsp;·&nbsp;
                    <i className="bi bi-clock" /> {timeAgo(r.created_at)}
                  </span>
                </div>
                <div className="rv-card-right">
                  <Stars rating={r.rating} size={15} />
                  <span className="rv-rating-num">{r.rating}.0</span>
                </div>
              </div>

              {r.review && (
                <p className="rv-comment">"{r.review}"</p>
              )}
              {!r.review && (
                <p className="rv-no-comment">No written review</p>
              )}

              <div className="rv-card-footer">
                <span className="rv-stylist-tag">
                  <i className="bi bi-person-badge-fill" /> {r.stylistName}
                </span>
                <button
                  className="rv-del-btn"
                  disabled={deleting === r.id}
                  onClick={() => deleteReview(r.id)}
                  title="Remove review"
                >
                  <i className={`bi ${deleting === r.id ? 'bi-hourglass-split' : 'bi-trash3'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
