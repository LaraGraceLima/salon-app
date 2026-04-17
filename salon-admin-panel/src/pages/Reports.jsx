import { useState, useEffect, useCallback } from 'react';
import './Reports.css';

const BASE = 'http://localhost:3001';

function fmt(n) { return Number(n || 0).toLocaleString('en-PH'); }
function pct(a, b) { return b > 0 ? ((a / b) * 100).toFixed(1) : '0.0'; }

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function Reports() {
  const [data, setData]       = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [revRes, bkRes, statsRes] = await Promise.all([
        fetch(`${BASE}/api/dashboard/revenue`),
        fetch(`${BASE}/api/bookings`),
        fetch(`${BASE}/api/dashboard/stats`),
      ]);
      const rev   = await revRes.json();
      const bks   = await bkRes.json();
      const stats = await statsRes.json();
      setData({ ...rev, stats });
      setBookings(Array.isArray(bks) ? bks : []);
    } catch (e) { setError('Failed to load report data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return (
    <div className="rp-loading">
      <div className="rp-ring"><div/><div/><div/><div/></div>
      <p>Loading reports…</p>
    </div>
  );

  if (error) return (
    <div className="rp-error">
      <div className="rp-error-ico">⚠️</div>
      <h3>{error}</h3>
      <button className="rp-retry-btn" onClick={fetchAll}>Retry</button>
    </div>
  );

  const bkTotal     = bookings.length;
  const bkCompleted = bookings.filter(b => b.status === 'completed').length;
  const bkPending   = bookings.filter(b => b.status === 'pending').length;
  const bkConfirmed = bookings.filter(b => b.status === 'confirmed').length;
  const bkCancelled = bookings.filter(b => b.status === 'cancelled').length;
  const completionRate = pct(bkCompleted, bkTotal);
  const cancellationRate = pct(bkCancelled, bkTotal);

  const monthly = (data?.monthlyRevenue || []).slice().reverse();
  const maxRev  = Math.max(...monthly.map(m => Number(m.revenue)), 1);

  const topServices = (data?.serviceRevenue || []).slice(0, 8);
  const topStylists = (data?.stylistRevenue || []).slice(0, 8);
  const maxSvcRev   = Math.max(...topServices.map(s => Number(s.revenue)), 1);
  const maxStRev    = Math.max(...topStylists.map(s => Number(s.revenue)), 1);

  const growthRate = () => {
    const m = data?.monthlyRevenue || [];
    if (m.length < 2) return null;
    const cur = Number(m[0]?.revenue || 0);
    const prv = Number(m[1]?.revenue || 0);
    if (prv === 0) return null;
    return ((cur - prv) / prv * 100).toFixed(1);
  };
  const growth = growthRate();

  const handleExport = () => {
    setExporting(true);
    const lines = [
      '╔══════════════════════════════════════╗',
      '║     SALON BUSINESS REPORT            ║',
      '╚══════════════════════════════════════╝',
      `Generated: ${new Date().toLocaleString('en-PH')}`,
      '',
      '── REVENUE SUMMARY ──────────────────────',
      `Total Revenue (completed): ₱${fmt(data?.totalRevenue)}`,
      growth !== null ? `Month-over-Month Growth: ${growth >= 0 ? '+' : ''}${growth}%` : '',
      '',
      '── BOOKING STATISTICS ───────────────────',
      `Total Bookings:   ${bkTotal}`,
      `Completed:        ${bkCompleted} (${completionRate}%)`,
      `Confirmed:        ${bkConfirmed}`,
      `Pending:          ${bkPending}`,
      `Cancelled:        ${bkCancelled} (${cancellationRate}%)`,
      '',
      '── TOP SERVICES ─────────────────────────',
      ...topServices.map((s, i) =>
        `${i + 1}. ${s.name.padEnd(25)} ₱${fmt(s.revenue).padStart(10)}  ${s.bookings} bookings`
      ),
      '',
      '── TOP STYLISTS ─────────────────────────',
      ...topStylists.map((s, i) =>
        `${i + 1}. ${s.name.padEnd(25)} ₱${fmt(s.revenue).padStart(10)}  ${s.bookings} bookings`
      ),
      '',
      '── MONTHLY REVENUE TREND ────────────────',
      ...(data?.monthlyRevenue || []).map(m =>
        `${m.month}   ₱${fmt(m.revenue).padStart(12)}   ${m.bookings} bookings`
      ),
    ].filter(l => l !== undefined).join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `salon-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 800);
  };

  return (
    <div className="rp-root">

      {/* Banner */}
      <div className="rp-banner">
        <div className="rp-banner-orb rp-banner-orb1" />
        <div className="rp-banner-orb rp-banner-orb2" />
        <div className="rp-banner-shimmer-line" />
        <div className="rp-banner-content">
          <div className="rp-banner-left">
            <div className="rp-banner-icon">📊</div>
            <div>
              <h1 className="rp-banner-title">Reports</h1>
              <p className="rp-banner-sub">Real-time business insights from your salon data</p>
            </div>
          </div>
          <div className="rp-banner-actions">
            <button className="rp-refresh-btn" onClick={fetchAll}>🔄 Refresh</button>
            <button className="rp-export-btn" onClick={handleExport} disabled={exporting}>
              {exporting ? '⏳ Exporting…' : '📥 Export Report'}
            </button>
          </div>
        </div>
      </div>

      <div className="rp-body">

      {/* KPI Cards */}
      <div className="rp-kpis">
        <div className="rp-kpi" style={{'--kc':'#6366f1','--kl':'#eef2ff'}}>
          <div className="rp-kpi-icon">💰</div>
          <div className="rp-kpi-body">
            <div className="rp-kpi-val">₱{fmt(data?.totalRevenue)}</div>
            <div className="rp-kpi-lbl">Total Revenue</div>
            {growth !== null && (
              <div className={`rp-kpi-growth ${Number(growth) >= 0 ? 'rp-kpi-growth--up' : 'rp-kpi-growth--down'}`}>
                {Number(growth) >= 0 ? '↗' : '↘'} {Math.abs(growth)}% vs last month
              </div>
            )}
          </div>
        </div>
        <div className="rp-kpi" style={{'--kc':'#10b981','--kl':'#d1fae5'}}>
          <div className="rp-kpi-icon">📅</div>
          <div className="rp-kpi-body">
            <div className="rp-kpi-val">{bkTotal}</div>
            <div className="rp-kpi-lbl">Total Bookings</div>
            <div className="rp-kpi-sub">{completionRate}% completion rate</div>
          </div>
        </div>
        <div className="rp-kpi" style={{'--kc':'#f59e0b','--kl':'#fef3c7'}}>
          <div className="rp-kpi-icon">✂️</div>
          <div className="rp-kpi-body">
            <div className="rp-kpi-val">{data?.stats?.totalServices ?? topServices.length}</div>
            <div className="rp-kpi-lbl">Services</div>
            <div className="rp-kpi-sub">Top: {topServices[0]?.name || '—'}</div>
          </div>
        </div>
        <div className="rp-kpi" style={{'--kc':'#ec4899','--kl':'#fce7f3'}}>
          <div className="rp-kpi-icon">💇‍♀️</div>
          <div className="rp-kpi-body">
            <div className="rp-kpi-val">{data?.stats?.totalStylists ?? topStylists.length}</div>
            <div className="rp-kpi-lbl">Stylists</div>
            <div className="rp-kpi-sub">Top: {topStylists[0]?.name || '—'}</div>
          </div>
        </div>
      </div>

      {/* Row 1: Revenue chart + Booking status */}
      <div className="rp-row">

        {/* Monthly Revenue Bar Chart */}
        <div className="rp-card rp-card--wide">
          <div className="rp-card-head">
            <div className="rp-card-title">📈 Monthly Revenue Trend</div>
            <span className="rp-card-badge">{monthly.length} months</span>
          </div>
          {monthly.length === 0 ? (
            <div className="rp-no-data">No revenue data yet</div>
          ) : (
            <div className="rp-bar-chart">
              {monthly.map((item, i) => {
                const h = Math.max((Number(item.revenue) / maxRev) * 100, 2);
                const d = new Date(item.month + '-01');
                const lbl = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                return (
                  <div key={i} className="rp-bar-col">
                    <div className="rp-bar-val">₱{Number(item.revenue) >= 1000 ? (Number(item.revenue)/1000).toFixed(1)+'k' : fmt(item.revenue)}</div>
                    <div className="rp-bar-wrap">
                      <div className="rp-bar-fill" style={{ height: `${h}%` }} title={`₱${fmt(item.revenue)} — ${item.bookings} bookings`} />
                    </div>
                    <div className="rp-bar-lbl">{lbl}</div>
                    <div className="rp-bar-bk">{item.bookings} bk</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking Status Breakdown */}
        <div className="rp-card">
          <div className="rp-card-head">
            <div className="rp-card-title">📋 Booking Breakdown</div>
            <span className="rp-card-badge">{bkTotal} total</span>
          </div>
          <div className="rp-status-list">
            {[
              { label: 'Completed', count: bkCompleted, color: '#10b981', bg: '#d1fae5' },
              { label: 'Confirmed', count: bkConfirmed, color: '#3b82f6', bg: '#dbeafe' },
              { label: 'Pending',   count: bkPending,   color: '#f59e0b', bg: '#fef3c7' },
              { label: 'Cancelled', count: bkCancelled, color: '#ef4444', bg: '#fee2e2' },
            ].map(s => (
              <div key={s.label} className="rp-status-row">
                <div className="rp-status-info">
                  <span className="rp-status-dot" style={{ background: s.color }} />
                  <span className="rp-status-lbl">{s.label}</span>
                  <span className="rp-status-pct" style={{ color: s.color }}>{pct(s.count, bkTotal)}%</span>
                </div>
                <div className="rp-status-bar-wrap">
                  <div className="rp-status-bar-fill"
                    style={{ width: `${pct(s.count, bkTotal)}%`, background: s.color }} />
                </div>
                <span className="rp-status-count" style={{ background: s.bg, color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
          <div className="rp-completion-ring-wrap">
            <div className="rp-completion-ring">
              <svg viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="8"
                  strokeDasharray={`${(bkCompleted / Math.max(bkTotal,1)) * 201} 201`}
                  strokeLinecap="round" transform="rotate(-90 40 40)"/>
              </svg>
              <div className="rp-ring-label">
                <span className="rp-ring-val">{completionRate}%</span>
                <span className="rp-ring-sub">Done</span>
              </div>
            </div>
            <div className="rp-ring-stats">
              <div className="rp-ring-stat"><span>Completion</span><strong style={{color:'#10b981'}}>{completionRate}%</strong></div>
              <div className="rp-ring-stat"><span>Cancellation</span><strong style={{color:'#ef4444'}}>{cancellationRate}%</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Top Services + Top Stylists */}
      <div className="rp-row">

        {/* Top Services */}
        <div className="rp-card">
          <div className="rp-card-head">
            <div className="rp-card-title">✂️ Top Services by Revenue</div>
            <span className="rp-card-badge">{topServices.length} services</span>
          </div>
          {topServices.length === 0 ? (
            <div className="rp-no-data">No service data yet</div>
          ) : (
            <div className="rp-leaderboard">
              {topServices.map((svc, i) => (
                <div key={i} className="rp-lb-row">
                  <span className="rp-lb-rank">{RANK_MEDALS[i] || `#${i+1}`}</span>
                  <div className="rp-lb-info">
                    <div className="rp-lb-name">{svc.name}</div>
                    <div className="rp-lb-bar-wrap">
                      <div className="rp-lb-bar">
                        <div className="rp-lb-bar-fill" style={{ width: `${(Number(svc.revenue)/maxSvcRev)*100}%`, background: '#6366f1' }} />
                      </div>
                      <span className="rp-lb-bk">{svc.bookings} bookings</span>
                    </div>
                  </div>
                  <div className="rp-lb-rev">
                    <span className="rp-lb-rev-val">₱{fmt(svc.revenue)}</span>
                    <span className="rp-lb-avg">avg ₱{svc.bookings > 0 ? fmt(Math.round(svc.revenue / svc.bookings)) : '0'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Stylists */}
        <div className="rp-card">
          <div className="rp-card-head">
            <div className="rp-card-title">💇‍♀️ Top Stylists by Revenue</div>
            <span className="rp-card-badge">{topStylists.length} stylists</span>
          </div>
          {topStylists.length === 0 ? (
            <div className="rp-no-data">No stylist data yet</div>
          ) : (
            <div className="rp-leaderboard">
              {topStylists.map((st, i) => (
                <div key={i} className="rp-lb-row">
                  <span className="rp-lb-rank">{RANK_MEDALS[i] || `#${i+1}`}</span>
                  <div className="rp-lb-info">
                    <div className="rp-lb-name">{st.name}</div>
                    <div className="rp-lb-bar-wrap">
                      <div className="rp-lb-bar">
                        <div className="rp-lb-bar-fill" style={{ width: `${(Number(st.revenue)/maxStRev)*100}%`, background: '#ec4899' }} />
                      </div>
                      <span className="rp-lb-bk">{st.bookings} bookings</span>
                    </div>
                  </div>
                  <div className="rp-lb-rev">
                    <span className="rp-lb-rev-val">₱{fmt(st.revenue)}</span>
                    <span className="rp-lb-avg">avg ₱{st.bookings > 0 ? fmt(Math.round(st.revenue / st.bookings)) : '0'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Full tables */}
      <div className="rp-row">
        <div className="rp-card rp-card--full">
          <div className="rp-card-head">
            <div className="rp-card-title">📋 Service Performance Table</div>
          </div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr><th>Rank</th><th>Service</th><th>Revenue</th><th>Bookings</th><th>Avg per Booking</th><th>Share</th></tr>
              </thead>
              <tbody>
                {topServices.length === 0 ? (
                  <tr><td colSpan={6} className="rp-table-empty">No data available</td></tr>
                ) : topServices.map((svc, i) => (
                  <tr key={i}>
                    <td><span className="rp-rank-badge">{RANK_MEDALS[i] || `#${i+1}`}</span></td>
                    <td><span className="rp-table-name">{svc.name}</span></td>
                    <td><span className="rp-table-rev">₱{fmt(svc.revenue)}</span></td>
                    <td>{svc.bookings}</td>
                    <td>₱{svc.bookings > 0 ? fmt(Math.round(svc.revenue / svc.bookings)) : '0'}</td>
                    <td>
                      <div className="rp-share-bar">
                        <div style={{ width: `${pct(svc.revenue, data?.totalRevenue || 1)}%`, background: '#6366f1' }} />
                      </div>
                      <span className="rp-share-pct">{pct(svc.revenue, data?.totalRevenue || 1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rp-row">
        <div className="rp-card rp-card--full">
          <div className="rp-card-head">
            <div className="rp-card-title">💇‍♀️ Stylist Performance Table</div>
          </div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr><th>Rank</th><th>Stylist</th><th>Revenue</th><th>Bookings</th><th>Avg per Booking</th><th>Share</th></tr>
              </thead>
              <tbody>
                {topStylists.length === 0 ? (
                  <tr><td colSpan={6} className="rp-table-empty">No data available</td></tr>
                ) : topStylists.map((st, i) => (
                  <tr key={i}>
                    <td><span className="rp-rank-badge">{RANK_MEDALS[i] || `#${i+1}`}</span></td>
                    <td><span className="rp-table-name">{st.name}</span></td>
                    <td><span className="rp-table-rev">₱{fmt(st.revenue)}</span></td>
                    <td>{st.bookings}</td>
                    <td>₱{st.bookings > 0 ? fmt(Math.round(st.revenue / st.bookings)) : '0'}</td>
                    <td>
                      <div className="rp-share-bar">
                        <div style={{ width: `${pct(st.revenue, data?.totalRevenue || 1)}%`, background: '#ec4899' }} />
                      </div>
                      <span className="rp-share-pct">{pct(st.revenue, data?.totalRevenue || 1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      </div>{/* end rp-body */}
    </div>
  );
}
