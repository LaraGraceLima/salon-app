import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
);

const C = {
  primary: '#6366f1', secondary: '#8b5cf6', success: '#10b981',
  warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6',
  pink: '#ec4899', teal: '#14b8a6', orange: '#f97316',
};

/* ── Animated counter hook ── */
function useCounter(target, duration = 1200) {
  const num = Number(target) || 0;
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!num) { setVal(0); return; }
    let start = 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setVal(num); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [num, duration]);
  return val;
}

/* ── KPI Card ── */
function KPICard({ icon, label, value, trend, trendLabel, color, prefix = '', delay = 0 }) {
  const animated = useCounter(typeof value === 'number' ? value : 0);
  return (
    <div className="col-xl-3 col-md-6">
      <div className="kpi-card" style={{ '--kpi-color': color, animationDelay: `${delay}ms` }}>
        <div className="kpi-glow"></div>
        <div className="kpi-top">
          <div className="kpi-icon-wrap">
            <i className={`bi ${icon}`}></i>
          </div>
          <div className="kpi-trend-pill" style={{ color: trend >= 0 ? C.success : C.danger, background: trend >= 0 ? '#d1fae5' : '#fee2e2' }}>
            <i className={`bi bi-arrow-${trend >= 0 ? 'up' : 'down'}-right`}></i>
            {trend !== undefined ? `${Math.abs(trend)}%` : '—'}
          </div>
        </div>
        <div className="kpi-value">{prefix}{animated.toLocaleString()}</div>
        <div className="kpi-label">{label}</div>
        {trendLabel && <div className="kpi-sub">{trendLabel}</div>}
        <div className="kpi-bar"><div className="kpi-bar-fill"></div></div>
      </div>
    </div>
  );
}

/* ── Chart Card wrapper ── */
function ChartCard({ title, icon, iconColor, children, action, className = '' }) {
  return (
    <div className={`dash-card ${className}`}>
      <div className="dash-card-header">
        <div className="dash-card-title">
          <span className="dash-card-icon" style={{ '--ic': iconColor || C.primary }}>
            <i className={`bi ${icon}`}></i>
          </span>
          <span>{title}</span>
        </div>
        {action && <div className="dash-card-action">{action}</div>}
      </div>
      <div className="dash-card-body">{children}</div>
    </div>
  );
}

/* ── Status Badge ── */
function StatusBadge({ status }) {
  const cfg = {
    pending:   { bg: '#fef3c7', color: '#92400e', icon: 'bi-hourglass-split' },
    confirmed: { bg: '#d1fae5', color: '#065f46', icon: 'bi-check-circle-fill' },
    completed: { bg: '#dbeafe', color: '#1e40af', icon: 'bi-patch-check-fill' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', icon: 'bi-x-circle-fill' },
  };
  const s = cfg[status] || { bg: '#f1f5f9', color: '#475569', icon: 'bi-circle' };
  return (
    <span className="status-pill" style={{ background: s.bg, color: s.color }}>
      <i className={`bi ${s.icon} me-1`}></i>{status}
    </span>
  );
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
══════════════════════════════════════════ */
export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ totalClients: 0, totalStylists: 0, totalServices: 0, totalBookings: 0 });
  const [revenueData, setRevenueData] = useState({ totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, revenueTrend: 0, posBreakdown: [], monthlyRevenue: [], serviceRevenue: [], stylistRevenue: [] });
  const [analyticsData, setAnalyticsData] = useState({
    dailyRevenue: [], weeklyRevenue: [], dailyBookings: [],
    servicePopularity: [], statusDistribution: [], peakHours: [], newCustomers: 0
  });
  const [bookings, setBookings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [timeRange, setTimeRange] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, r, a, b] = await Promise.all([
        fetch('http://localhost:3001/api/dashboard/stats').then(x => x.json()),
        fetch('http://localhost:3001/api/dashboard/revenue').then(x => x.json()),
        fetch('http://localhost:3001/api/dashboard/analytics').then(x => x.json()),
        fetch('http://localhost:3001/api/bookings').then(x => x.json()),
      ]);
      setStats(s);
      setRevenueData({
        ...r,
        totalRevenue: Number(r.totalRevenue) || 0,
        thisMonthRevenue: Number(r.thisMonthRevenue) || 0,
        lastMonthRevenue: Number(r.lastMonthRevenue) || 0,
        revenueTrend: Number(r.revenueTrend) || 0,
        posBreakdown: (r.posBreakdown || []).map(p => ({ ...p, total: Number(p.total) || 0, count: Number(p.count) || 0 })),
        serviceRevenue: (r.serviceRevenue || []).map(s => ({ ...s, revenue: Number(s.revenue) || 0 })),
        stylistRevenue: (r.stylistRevenue || []).map(s => ({ ...s, revenue: Number(s.revenue) || 0 })),
      });
      setAnalyticsData(a); setBookings(b);
      const sc = { pending: C.warning, confirmed: C.success, completed: C.info, cancelled: C.danger };
      setCalendarEvents(b.map(bk => ({
        id: String(bk.id),
        title: `${bk.clientName} — ${bk.serviceName}`,
        start: bk.dateTime,
        backgroundColor: sc[bk.status] || C.primary,
        borderColor: sc[bk.status] || C.primary,
        extendedProps: { stylist: bk.stylistName, status: bk.status, price: bk.price, client: bk.clientName },
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  /* ── Chart configs ── */
  const lineData = () => {
    const src = (timeRange === 'daily' ? analyticsData.dailyRevenue : analyticsData.weeklyRevenue).slice().reverse();
    return {
      labels: src.map(d => timeRange === 'daily'
        ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `Wk ${String(d.week).slice(-2)}`),
      datasets: [
        {
          label: 'Revenue (₱)',
          data: src.map(d => Number(d.revenue)),
          fill: true, tension: 0.45,
          borderColor: C.primary,
          backgroundColor: 'rgba(99,102,241,0.08)',
          pointBackgroundColor: '#fff',
          pointBorderColor: C.primary,
          pointBorderWidth: 2,
          pointRadius: 5, pointHoverRadius: 8,
        },
        {
          label: 'Bookings',
          data: src.map(d => Number(d.bookings) * 10),
          fill: false, tension: 0.45,
          borderColor: C.pink,
          borderDash: [5, 4],
          pointBackgroundColor: C.pink,
          pointRadius: 3, pointHoverRadius: 6,
          backgroundColor: 'transparent',
        }
      ]
    };
  };

  const barData = () => {
    const src = analyticsData.dailyBookings.slice(0, 7).reverse();
    return {
      labels: src.map(d => d.day_name?.slice(0, 3) ?? ''),
      datasets: [{
        label: 'Bookings',
        data: src.map(d => d.bookings),
        backgroundColor: src.map((_, i) => [C.primary, C.pink, C.warning, C.teal, C.info, C.orange, C.success][i % 7]),
        borderRadius: 10, borderSkipped: false,
      }]
    };
  };

  const donutService = () => ({
    labels: analyticsData.servicePopularity.slice(0, 5).map(s => s.name),
    datasets: [{
      data: analyticsData.servicePopularity.slice(0, 5).map(s => s.bookings),
      backgroundColor: [C.primary, C.pink, C.warning, C.teal, C.info],
      borderWidth: 4, borderColor: '#fff', hoverOffset: 10,
    }]
  });

  const donutStatus = () => {
    const cm = { completed: C.success, pending: C.warning, cancelled: C.danger, confirmed: C.info };
    return {
      labels: analyticsData.statusDistribution.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1)),
      datasets: [{
        data: analyticsData.statusDistribution.map(s => s.count),
        backgroundColor: analyticsData.statusDistribution.map(s => cm[s.status] || C.primary),
        borderWidth: 4, borderColor: '#fff', hoverOffset: 10,
      }]
    };
  };

  const radarData = () => {
    const src = revenueData.stylistRevenue.slice(0, 5);
    const mr = Math.max(...src.map(s => s.revenue), 1);
    const mb = Math.max(...src.map(s => s.bookings), 1);
    return {
      labels: src.map(s => s.name.split(' ')[0]),
      datasets: [
        { label: 'Revenue', data: src.map(s => Math.round((s.revenue / mr) * 100)), backgroundColor: `${C.primary}30`, borderColor: C.primary, pointBackgroundColor: C.primary, pointRadius: 4 },
        { label: 'Bookings', data: src.map(s => Math.round((s.bookings / mb) * 100)), backgroundColor: `${C.pink}30`, borderColor: C.pink, pointBackgroundColor: C.pink, pointRadius: 4 },
      ]
    };
  };

  const peakData = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);
    const max = Math.max(...analyticsData.peakHours.map(p => p.bookings), 1);
    return {
      labels: hours.map(h => `${h}:00`),
      datasets: [{
        label: 'Bookings',
        data: hours.map(h => analyticsData.peakHours.find(p => p.hour === h)?.bookings ?? 0),
        backgroundColor: hours.map(h => {
          const v = analyticsData.peakHours.find(p => p.hour === h)?.bookings ?? 0;
          return `rgba(99,102,241,${0.15 + (v / max) * 0.85})`;
        }),
        borderRadius: 8, borderSkipped: false,
      }]
    };
  };

  const baseOpts = (yPrefix = '') => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1b4b', titleColor: '#c7d2fe', bodyColor: '#e0e7ff',
        padding: 12, cornerRadius: 10, displayColors: true,
        callbacks: { label: ctx => ` ${yPrefix}${ctx.parsed.y?.toLocaleString() ?? ctx.parsed}` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => `${yPrefix}${v.toLocaleString()}` }, border: { display: false } }
    }
  });

  const donutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8 } },
      tooltip: { backgroundColor: '#1e1b4b', titleColor: '#c7d2fe', bodyColor: '#e0e7ff', padding: 10, cornerRadius: 10 }
    }
  };

  const radarOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } },
    scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 25, color: '#94a3b8', font: { size: 10 } }, grid: { color: '#e2e8f0' }, pointLabels: { color: '#475569', font: { size: 11 } } } }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loading-inner">
        <div className="dash-spinner"></div>
        <p>Loading dashboard…</p>
      </div>
    </div>
  );

  const TABS = [
    { key: 'overview',  label: 'Overview',  icon: 'bi-grid-1x2-fill' },
    { key: 'calendar',  label: 'Calendar',  icon: 'bi-calendar3' },
    { key: 'analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
  ];

  return (
    <div className="dash-root">

      {/* ══ WELCOME BANNER ══ */}
      <div className="dash-banner">
        <div className="dash-banner-orb dash-banner-orb1"></div>
        <div className="dash-banner-orb dash-banner-orb2"></div>
        <div className="dash-banner-orb dash-banner-orb3"></div>
        <div className="dash-banner-content">
          <div>
            <h2 className="dash-banner-title">
              Good {getGreeting()}, <span>{user?.name || 'Admin'}</span> ✨
            </h2>
            <p className="dash-banner-sub">Here's your salon performance at a glance.</p>
          </div>
          <button className="dash-refresh-btn" onClick={fetchAll}>
            <i className="bi bi-arrow-clockwise me-2"></i>Refresh
          </button>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="row g-3 mb-4">
        <KPICard icon="bi-cash-coin"        label="Total Revenue"   value={revenueData.totalRevenue} prefix="₱" trend={revenueData.revenueTrend} trendLabel="vs last month" color={C.primary} delay={0} />
        <KPICard icon="bi-calendar2-check"  label="Total Bookings"  value={stats.totalBookings}      trend={8.3}  trendLabel="vs last month" color={C.success} delay={80} />
        <KPICard icon="bi-scissors"         label="Active Stylists" value={stats.totalStylists}      color={C.warning} delay={160} />
        <KPICard icon="bi-people-fill"      label="Total Clients"   value={stats.totalClients}       trend={15.2} trendLabel="last 30 days" color={C.pink} delay={240} />
      </div>

      {/* ══ TABS ══ */}
      <div className="dash-tabs mb-4">
        {TABS.map(t => (
          <button key={t.key} className={`dash-tab ${activeTab === t.key ? 'dash-tab--active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <i className={`bi ${t.icon}`}></i>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === 'overview' && (
        <>
      {/* Row 1: Revenue line + Bookings bar */}
          <div className="row g-4 mb-4">
            <div className="col-xl-8">
              <ChartCard
                title="Revenue & Bookings Trend"
                icon="bi-graph-up-arrow" iconColor={C.primary}
                action={
                  <div className="dash-toggle">
                    <button className={timeRange === 'daily' ? 'active' : ''} onClick={() => setTimeRange('daily')}>Daily</button>
                    <button className={timeRange === 'weekly' ? 'active' : ''} onClick={() => setTimeRange('weekly')}>Weekly</button>
                  </div>
                }
              >
                <div style={{ height: 290 }}><Line data={lineData()} options={{ ...baseOpts('₱'), plugins: { ...baseOpts('₱').plugins, legend: { display: true, position: 'top', labels: { font: { size: 11 }, usePointStyle: true, padding: 16 } } } }} /></div>
              </ChartCard>
            </div>
            <div className="col-xl-4">
              <ChartCard title="Daily Bookings" icon="bi-bar-chart-fill" iconColor={C.success}>
                <div style={{ height: 290 }}><Bar data={barData()} options={baseOpts()} /></div>
              </ChartCard>
            </div>
          </div>

          {/* Row 2: 3 donuts / radar */}
          <div className="row g-4 mb-4">
            <div className="col-xl-4 col-md-6">
              <ChartCard title="Service Popularity" icon="bi-pie-chart-fill" iconColor={C.warning}>
                <div style={{ height: 270 }}><Doughnut data={donutService()} options={donutOpts} /></div>
              </ChartCard>
            </div>
            <div className="col-xl-4 col-md-6">
              <ChartCard title="Booking Status" icon="bi-clipboard2-data-fill" iconColor={C.info}>
                <div style={{ height: 270 }}><Doughnut data={donutStatus()} options={donutOpts} /></div>
              </ChartCard>
            </div>
            <div className="col-xl-4">
              <ChartCard title="Stylist Performance" icon="bi-radar" iconColor={C.pink}>
                <div style={{ height: 270 }}><Radar data={radarData()} options={radarOpts} /></div>
              </ChartCard>
            </div>
          </div>

          {/* Row 3: Peak hours */}
          <div className="row g-4 mb-4">
            <div className="col-12">
              <ChartCard title="Peak Booking Hours" icon="bi-clock-history" iconColor={C.danger}>
                <div style={{ height: 200 }}><Bar data={peakData()} options={baseOpts()} /></div>
              </ChartCard>
            </div>
          </div>

          {/* Row 4: Recent bookings */}
          <ChartCard title="Recent Bookings" icon="bi-table" iconColor={C.primary}
            action={<span className="dash-badge-count">{bookings.length} total</span>}>
            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr><th>#</th><th>Client</th><th>Stylist</th><th>Service</th><th>Date & Time</th><th>Price</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 8).map((b, i) => (
                    <tr key={b.id} style={{ animationDelay: `${i * 40}ms` }}>
                      <td><span className="dash-row-id">#{b.id}</span></td>
                      <td>
                        <div className="dash-client-cell">
                          <div className="dash-avatar" style={{ background: `hsl(${(b.clientName?.charCodeAt(0) || 65) * 5}, 65%, 55%)` }}>
                            {(b.clientName || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-semibold">{b.clientName}</span>
                        </div>
                      </td>
                      <td className="text-muted">{b.stylistName}</td>
                      <td><span className="dash-service-tag">{b.serviceName}</span></td>
                      <td className="text-muted small">{new Date(b.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td><span className="dash-price">₱{Number(b.price).toLocaleString()}</span></td>
                      <td><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-5">
                      <i className="bi bi-calendar-x fs-2 text-muted d-block mb-2"></i>
                      <span className="text-muted">No bookings yet</span>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}

      {/* ══ CALENDAR TAB ══ */}
      {activeTab === 'calendar' && (
        <ChartCard title="Booking Calendar" icon="bi-calendar3" iconColor={C.primary}
          action={
            <div className="d-flex gap-3 flex-wrap align-items-center">
              {[['pending', C.warning], ['confirmed', C.success], ['completed', C.info], ['cancelled', C.danger]].map(([s, c]) => (
                <span key={s} className="dash-legend-item">
                  <span className="dash-legend-dot" style={{ background: c }}></span>
                  <span className="text-capitalize">{s}</span>
                </span>
              ))}
            </div>
          }
        >
          {selectedBooking && (
            <div className="dash-event-popup">
              <button className="dash-event-close" onClick={() => setSelectedBooking(null)}><i className="bi bi-x-lg"></i></button>
              <div className="dash-event-title">{selectedBooking.title}</div>
              <div className="dash-event-row"><i className="bi bi-scissors me-2"></i>{selectedBooking.stylist}</div>
              <div className="dash-event-row"><i className="bi bi-cash me-2"></i>₱{Number(selectedBooking.price).toLocaleString()}</div>
              <div className="dash-event-row"><StatusBadge status={selectedBooking.status} /></div>
            </div>
          )}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            events={calendarEvents}
            height={640}
            eventClick={info => setSelectedBooking({ title: info.event.title, ...info.event.extendedProps })}
            eventContent={arg => (
              <div className="fc-custom-event">
                <i className="bi bi-scissors me-1"></i>{arg.event.title}
              </div>
            )}
          />
        </ChartCard>
      )}

      {/* ══ ANALYTICS TAB ══ */}
      {activeTab === 'analytics' && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-xl-6">
              <ChartCard title="Revenue by Service" icon="bi-bar-chart-steps" iconColor={C.primary}>
                <div style={{ height: 280 }}>
                  <Bar data={{
                    labels: revenueData.serviceRevenue.map(s => s.name),
                    datasets: [{ label: 'Revenue (₱)', data: revenueData.serviceRevenue.map(s => s.revenue), backgroundColor: [C.primary, C.pink, C.warning, C.teal], borderRadius: 8, borderSkipped: false }]
                  }} options={{ ...baseOpts('₱'), indexAxis: 'y' }} />
                </div>
              </ChartCard>
            </div>
            <div className="col-xl-6">
              <ChartCard title="Revenue by Stylist" icon="bi-person-badge-fill" iconColor={C.success}>
                <div style={{ height: 280 }}>
                  <Bar data={{
                    labels: revenueData.stylistRevenue.map(s => s.name.split(' ')[0]),
                    datasets: [{ label: 'Revenue (₱)', data: revenueData.stylistRevenue.map(s => s.revenue), backgroundColor: revenueData.stylistRevenue.map((_, i) => `hsl(${250 + i * 28}, 65%, 60%)`), borderRadius: 8, borderSkipped: false }]
                  }} options={baseOpts('₱')} />
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Leaderboard */}
          <ChartCard title="Stylist Leaderboard" icon="bi-trophy-fill" iconColor={C.warning}>
            <div className="dash-leaderboard">
              {revenueData.stylistRevenue.map((s, i) => {
                const maxRev = Math.max(...revenueData.stylistRevenue.map(x => x.revenue), 1);
                const pct = Math.round((s.revenue / maxRev) * 100);
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={i} className="dash-lb-row" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="dash-lb-rank">{medals[i] || `#${i + 1}`}</div>
                    <div className="dash-avatar" style={{ background: `hsl(${260 + i * 30}, 65%, 55%)` }}>
                      {s.name.charAt(0)}
                    </div>
                    <div className="dash-lb-info">
                      <div className="dash-lb-name">{s.name}</div>
                      <div className="dash-lb-bar-wrap">
                        <div className="dash-lb-bar">
                          <div className="dash-lb-bar-fill" style={{ width: `${pct}%`, background: `hsl(${250 + i * 28}, 65%, 60%)` }}></div>
                        </div>
                        <span className="dash-lb-pct">{pct}%</span>
                      </div>
                    </div>
                    <div className="dash-lb-stats">
                      <span className="dash-lb-rev">₱{Number(s.revenue).toLocaleString()}</span>
                      <span className="dash-lb-bk">{s.bookings} bookings</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </>
      )}

    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
