import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './POS.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API = 'http://localhost:3001';

/* ── Animated counter ── */
function useCounter(target, duration = 1000) {
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
  }, [num]);
  return val;
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const map = {
    completed: { bg: '#d1fae5', color: '#065f46', icon: 'bi-patch-check-fill' },
    pending:   { bg: '#fef3c7', color: '#92400e', icon: 'bi-hourglass-split' },
    confirmed: { bg: '#dbeafe', color: '#1e40af', icon: 'bi-check-circle-fill' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', icon: 'bi-x-circle-fill' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', icon: 'bi-circle' };
  return (
    <span className="pos-status-pill" style={{ background: s.bg, color: s.color }}>
      <i className={`bi ${s.icon} me-1`}></i>{status}
    </span>
  );
}

export default function POS() {
  const [data, setData]       = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [completing, setCompleting] = useState(null);
  const [toast, setToast]     = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [receiptDetails, setReceiptDetails] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rev, bk, adjustments] = await Promise.all([
        fetch(`${API}/api/dashboard/revenue`).then(r => r.json()),
        fetch(`${API}/api/bookings`).then(r => r.json()),
        fetch(`${API}/api/dashboard/revenue/adjustments`).then(r => r.json()).catch(() => []),
      ]);
      setData({
        ...rev,
        totalRevenue:     Number(rev.totalRevenue) || 0,
        thisMonthRevenue: Number(rev.thisMonthRevenue) || 0,
        lastMonthRevenue: Number(rev.lastMonthRevenue) || 0,
        revenueTrend:     Number(rev.revenueTrend) || 0,
        posBreakdown: (rev.posBreakdown || []).map(p => ({ ...p, total: Number(p.total)||0, count: Number(p.count)||0 })),
        serviceRevenue:   (rev.serviceRevenue || []).map(s => ({ ...s, revenue: Number(s.revenue)||0 })),
        stylistRevenue:   (rev.stylistRevenue || []).map(s => ({ ...s, revenue: Number(s.revenue)||0 })),
        monthlyRevenue:   (rev.monthlyRevenue || []).map(m => ({ ...m, revenue: Number(m.revenue)||0 })),
      });
      setBookings(bk);
      // Update totalRevenue state with the fetched value
      setTotalRevenue(Number(rev.totalRevenue) || 0);
      // Load persisted adjustment history from database
      setCalcHistory(
        Array.isArray(adjustments)
          ? adjustments.map(item => ({
              clientName:
                item.client_name ||
                (typeof item.description === 'string' && item.description.startsWith('Client: ')
                  ? item.description.replace('Client: ', '').split(' | ')[0].trim()
                  : 'No client name'),
              mode: item.type === 'subtract' ? 'subtract' : 'add',
              amount: Number(item.amount) || 0,
              result: item.type === 'subtract' ? -Math.abs(Number(item.amount) || 0) : Math.abs(Number(item.amount) || 0),
              date: item.created_at
                ? new Date(item.created_at).toLocaleString('en-US', {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : ''
            }))
          : []
      );
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markComplete = async (id) => {
    setCompleting(id);
    try {
      await fetch(`${API}/api/bookings/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      showToast('✅ Booking marked as completed!', 'success');
      fetchAll();
    } catch(e) { showToast('❌ Failed to update booking', 'error'); }
    finally { setCompleting(null); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Manual Add/Less Counter Calculator
  const [calcMode, setCalcMode] = useState('add'); // 'add' or 'subtract'
  const [calcAmount, setCalcAmount] = useState('');
  const [calcClientName, setCalcClientName] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [calcHistory, setCalcHistory] = useState([]);
  const [showCalcHistory, setShowCalcHistory] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const handleAdd = () => {
    setCalcMode('add');
    setCalcAmount('');
    setCalcResult(null);
    setReceiptData(null);
  };

  const handleSubtract = () => {
    setCalcMode('subtract');
    setCalcAmount('');
    setCalcResult(null);
    setReceiptData(null);
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setCalcAmount(val);
    if (val) {
      const amount = parseFloat(val);
      setCalcResult(calcMode === 'add' ? amount : -amount);
    } else {
      setCalcResult(null);
    }
  };

  const handleConfirm = async () => {
    if (!calcClientName.trim()) {
      showToast('❌ Please enter client name', 'error');
      return;
    }

    if (!calcAmount) {
      showToast('❌ Please enter amount', 'error');
      return;
    }

    const amount = parseFloat(calcAmount);
    const revenueChange = calcMode === 'add' ? amount : -amount;
    
    try {
      // Save adjustment to database
      const response = await fetch(`${API}/api/dashboard/revenue/adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          type: calcMode,
          description: `Client: ${calcClientName.trim()} | Manual revenue adjustment via POS`,
          createdBy: 'admin',
          clientName: calcClientName.trim()
        })
      });
      
      const result = await response.json();
      
      // Refresh data to get updated total revenue
      await fetchAll();
      
      // Show success message
      showToast(
        `${calcMode === 'add' ? '✅ Added' : '❌ Deducted'} ₱${amount.toLocaleString()} to revenue`, 
        calcMode === 'add' ? 'success' : 'error'
      );
      
      // Set receipt details
      setReceiptDetails({
        mode: calcMode,
        amount,
        result: revenueChange,
        receiptNo: `RA-${Date.now()}`,
        printedAt: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        date: new Date().toLocaleString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        clientName: calcClientName.trim(),
        serviceName: 'Revenue Adjustment',
        stylistName: 'Admin'
      });
      
      // Refresh and pull persisted history from database
      await fetchAll();
    } catch (error) {
      console.error('Error saving adjustment:', error);
      showToast('❌ Failed to save adjustment', 'error');
    }
  };

  const clearCalculator = () => {
    setCalcMode('add');
    setCalcAmount('');
    setCalcClientName('');
    setCalcResult(null);
    setReceiptData(null);
    setReceiptDetails(null);
  };

  const handlePrintReceipt = () => {
    if (!receiptDetails) return;

    const printWindow = window.open('', '_blank', 'width=420,height=700');
    if (!printWindow) return;

    const safeReceiptNo = receiptDetails.receiptNo || `RA-${Date.now()}`;
    const safePrintedAt = receiptDetails.printedAt || new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const actionText = `${receiptDetails.mode === 'add' ? 'Add' : 'Subtract'}: ₱${Number(receiptDetails.amount || 0).toLocaleString()}`;
    const changeText = `${receiptDetails.mode === 'add' ? '+' : '-'}₱${Math.abs(Number(receiptDetails.result || 0)).toLocaleString()}`;

    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Receipt</title>
        <meta charset="utf-8" />
        <style>
          @page { margin: 10mm; }
          body {
            font-family: Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.35;
          }
          .receipt {
            max-width: 360px;
            margin: 0 auto;
            border: 1px solid #111827;
            padding: 12px;
          }
          .title {
            font-weight: 700;
            margin: 8px 0 10px;
            border-bottom: 1px solid #111827;
            padding-bottom: 6px;
          }
          .line { margin: 0 0 4px; }
          .label { font-weight: 700; margin: 8px 0 0; }
          .value { margin: 1px 0 0; }
          .total {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #111827;
          }
          .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px dashed #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <p class="line">Receipt #: ${safeReceiptNo}</p>
          <p class="line">Printed: ${safePrintedAt}</p>
          <div class="title">Revenue Adjustment</div>

          <p class="label">Service:</p>
          <p class="value">${receiptDetails.serviceName || 'Revenue Adjustment'}</p>

          <p class="label">Client:</p>
          <p class="value">${receiptDetails.clientName || 'No client name'}</p>

          <p class="label">Stylist:</p>
          <p class="value">${receiptDetails.stylistName || 'Admin'}</p>

          <p class="label">Date:</p>
          <p class="value">${receiptDetails.date || ''}</p>

          <p class="label">Action:</p>
          <p class="value">${actionText}</p>

          <p class="label total">Revenue Change:</p>
          <p class="value">${changeText}</p>

          <p class="footer">Adjustment recorded successfully</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (loading) return (
    <div className="pos-page-loading">
      <div className="pos-spinner"></div>
      <p>Loading POS data…</p>
    </div>
  );

  const completed = data.posBreakdown.find(p => p.status === 'completed') || { count: 0, total: 0 };
  const pending   = data.posBreakdown.find(p => p.status === 'pending')   || { count: 0, total: 0 };
  const confirmed = data.posBreakdown.find(p => p.status === 'confirmed') || { count: 0, total: 0 };
  const cancelled = data.posBreakdown.find(p => p.status === 'cancelled') || { count: 0, total: 0 };

  const earned    = completed.total;
  const potential = pending.total + confirmed.total;
  const lost      = cancelled.total;
  const totalAll  = earned + potential + lost;
  const earnedPct    = totalAll > 0 ? (earned / totalAll) * 100 : 0;
  const potentialPct = totalAll > 0 ? (potential / totalAll) * 100 : 0;
  const lostPct      = totalAll > 0 ? (lost / totalAll) * 100 : 0;
  const rate         = totalAll > 0 ? Math.round(earnedPct) : 0;
  const avgPerService = completed.count > 0 ? Math.round(earned / completed.count) : 0;
  const totalCount    = completed.count + pending.count + confirmed.count + cancelled.count;

  /* filter bookings */
  const now = new Date();
  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchSearch = !search || b.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      b.stylistName?.toLowerCase().includes(search.toLowerCase());
    let matchDate = true;
    if (dateFilter === 'today') {
      matchDate = new Date(b.dateTime).toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const d = new Date(b.dateTime);
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      matchDate = d >= weekAgo;
    } else if (dateFilter === 'month') {
      const d = new Date(b.dateTime);
      matchDate = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return matchStatus && matchSearch && matchDate;
  });

  /* charts */
  const monthlyChartData = {
    labels: [...data.monthlyRevenue].reverse().map(m => {
      const [y, mo] = m.month.split('-');
      return new Date(y, mo - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [{
      label: 'Revenue (₱)',
      data: [...data.monthlyRevenue].reverse().map(m => m.revenue),
      fill: true, tension: 0.4,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      pointBackgroundColor: '#fff',
      pointBorderColor: '#6366f1',
      pointRadius: 5,
    }]
  };

  const serviceChartData = {
    labels: data.serviceRevenue.slice(0, 6).map(s => s.name),
    datasets: [{
      data: data.serviceRevenue.slice(0, 6).map(s => s.revenue),
      backgroundColor: ['#6366f1','#10b981','#f59e0b','#ec4899','#14b8a6','#f97316'],
      borderWidth: 3, borderColor: '#fff', hoverOffset: 8,
    }]
  };

  const stylistChartData = {
    labels: data.stylistRevenue.slice(0, 5).map(s => s.name.split(' ')[0]),
    datasets: [{
      label: 'Revenue (₱)',
      data: data.stylistRevenue.slice(0, 5).map(s => s.revenue),
      backgroundColor: data.stylistRevenue.slice(0, 5).map((_, i) => `hsl(${250 + i * 30},65%,60%)`),
      borderRadius: 10, borderSkipped: false,
    }]
  };

  const chartOpts = (prefix = '₱') => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1b4b', titleColor: '#c7d2fe', bodyColor: '#e0e7ff',
        padding: 12, cornerRadius: 10,
        callbacks: { label: ctx => ` ${prefix}${(ctx.parsed.y ?? ctx.parsed).toLocaleString()}` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => `${prefix}${v.toLocaleString()}` }, border: { display: false } }
    }
  });

  const donutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 }, usePointStyle: true } },
      tooltip: { backgroundColor: '#1e1b4b', titleColor: '#c7d2fe', bodyColor: '#e0e7ff', padding: 10, cornerRadius: 10 }
    }
  };

  return (
    <div className="pos-page">

      {/* Toast */}
      {toast && (
        <div className={`pos-toast pos-toast--${toast.type}`}>{toast.msg}</div>
      )}
      {showCalcHistory && (
        <div className="pos-history-modal" onClick={() => setShowCalcHistory(false)}>
          <div className="pos-history-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pos-history-modal-head">
              <div className="pos-history-modal-title">
                <i className="bi bi-journal-text me-2"></i>Revenue Adjustment History
              </div>
              <div className="pos-history-modal-actions">
                <button
                  className="pos-history-clear-btn"
                  onClick={() => showToast('History is persisted in database. Use backend cleanup if needed.', 'error')}
                  disabled={calcHistory.length === 0}
                >
                  <i className="bi bi-trash3 me-1"></i>Clear History
                </button>
                <button className="pos-history-modal-close" onClick={() => setShowCalcHistory(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            {calcHistory.length === 0 ? (
              <div className="pos-history-empty">No adjustments yet.</div>
            ) : (
              <div className="pos-calculator-history-list">
                {[...calcHistory].reverse().map((item, i) => (
                  <div key={i} className="pos-calculator-history-item">
                    <div>
                      <span className="pos-calculator-history-exp">
                        {item.clientName || 'No client name'} · {item.mode === 'add' ? 'Add' : 'Subtract'}: ₱{item.amount.toLocaleString()}
                      </span>
                      <div className="pos-calculator-history-date">{item.date}</div>
                    </div>
                    <span className={`pos-calculator-history-result ${item.mode === 'subtract' ? 'pos-calculator-history-result--negative' : ''}`}>
                      {item.mode === 'add' ? '+' : '-'}₱{Math.abs(item.result).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Banner ── */}
      <div className="pos-banner">
        <div className="pos-banner-orb1" />
        <div className="pos-banner-orb2" />
        <div className="pos-banner-shimmer" />
        <div className="pos-banner-content">
          <div className="pos-banner-left">
            <div className="pos-banner-icon"><i className="bi bi-cash-register"></i></div>
            <div>
              <h1 className="pos-banner-title">POS Revenue Center</h1>
              <p className="pos-banner-sub">Service-based revenue tracking · Completed appointments = Earned income</p>
            </div>
          </div>
          <button className="pos-refresh-btn" onClick={fetchAll}>
            <i className="bi bi-arrow-clockwise"></i>Refresh
          </button>
        </div>
      </div>

      <div className="pos-page-body">

      {/* ── Manual Add/Less Counter Calculator ── */}
      <div className="pos-calculator-card">
        <div className="pos-calculator-header">
          <span><i className="bi bi-calculator me-2"></i>Manual Calculator</span>
          <div className="pos-calculator-header-actions">
            <button
              className="pos-calculator-history-toggle"
              onClick={() => setShowCalcHistory(true)}
              title="View revenue adjustment history"
            >
              <i className="bi bi-journal-text me-1"></i>History
            </button>
            <button 
              className="pos-calculator-toggle"
              onClick={clearCalculator}
            >
              <i className="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>

        <div className="pos-calculator-body">
          {/* Mode Selection */}
          <div className="pos-mode-selection">
            <button 
              className={`pos-mode-btn ${calcMode === 'add' ? 'pos-mode-btn--active' : ''}`}
              onClick={handleAdd}
            >
              <i className="bi bi-plus-circle me-1"></i>Add
            </button>
            <button 
              className={`pos-mode-btn ${calcMode === 'subtract' ? 'pos-mode-btn--active' : ''}`}
              onClick={handleSubtract}
            >
              <i className="bi bi-dash-circle me-1"></i>Subtract
            </button>
          </div>

          {/* Amount Input */}
          <div className="pos-amount-section">
            <label className="pos-amount-label">Client Name</label>
            <div className="pos-amount-input-wrapper">
              <input
                type="text"
                className="pos-amount-input pos-amount-input--text"
                placeholder="Enter client name"
                value={calcClientName}
                onChange={(e) => setCalcClientName(e.target.value)}
              />
            </div>
          </div>

          {/* Amount Input */}
          <div className="pos-amount-section">
            <label className="pos-amount-label">
              {calcMode === 'add' ? 'Amount to Add' : 'Amount to Subtract'}
            </label>
            <div className="pos-amount-input-wrapper">
              <span className="pos-currency-symbol">₱</span>
              <input
                type="number"
                className="pos-amount-input"
                placeholder="0.00"
                value={calcAmount}
                onChange={handleAmountChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Result Display */}
          {calcResult !== null && (
            <div className={`pos-result-display ${calcMode === 'subtract' ? 'pos-result-display--subtract' : ''}`}>
              <div>
                <span className="pos-result-label">
                  {calcMode === 'add' ? 'Added to Revenue:' : 'Subtracted from Revenue:'}
                </span>
                <div className="pos-current-revenue">
                  <span className="pos-current-revenue-label">Current Total:</span>
                  <span className="pos-current-revenue-value">₱{totalRevenue.toLocaleString()}</span>
                </div>
              </div>
              <span className="pos-result-value">
                {calcMode === 'add' ? '+' : '-'}₱{Math.abs(calcResult).toLocaleString()}
              </span>
            </div>
          )}

          {/* Confirm Button */}
          <button 
            className="pos-calculator-btn pos-calculator-btn--confirm"
            onClick={handleConfirm}
            disabled={!calcAmount || !calcClientName.trim()}
          >
            <i className="bi bi-check-circle me-1"></i>Confirm
          </button>

          {/* Receipt Summary */}
          {receiptDetails && (
            <div className="pos-receipt-summary">
              <div className="pos-receipt-print-meta">
                <span>Receipt #: {receiptDetails.receiptNo}</span>
                <span>Printed: {receiptDetails.printedAt}</span>
              </div>
              <div className="pos-receipt-header">
                <i className="bi bi-receipt me-2"></i>Revenue Adjustment
              </div>
              <div className="pos-receipt-body">
                {/* Service/Transaction Info */}
                <div className="pos-receipt-info-section">
                  <div className="pos-receipt-row">
                    <span className="pos-receipt-label">Service:</span>
                    <span className="pos-receipt-value">{receiptDetails.serviceName}</span>
                  </div>
                  <div className="pos-receipt-row">
                    <span className="pos-receipt-label">Client:</span>
                    <span className="pos-receipt-value">{receiptDetails.clientName}</span>
                  </div>
                  <div className="pos-receipt-row">
                    <span className="pos-receipt-label">Stylist:</span>
                    <span className="pos-receipt-value">{receiptDetails.stylistName}</span>
                  </div>
                  <div className="pos-receipt-row">
                    <span className="pos-receipt-label">Date:</span>
                    <span className="pos-receipt-value">{receiptDetails.date}</span>
                  </div>
                </div>
                <div className="pos-receipt-amount-section">
                  <div className="pos-receipt-row pos-receipt-row--amount">
                    <span className="pos-receipt-label">Action:</span>
                    <span className={`pos-receipt-value ${receiptDetails.mode === 'subtract' ? 'pos-receipt-value--negative' : 'pos-receipt-value--positive'}`}>
                      {receiptDetails.mode === 'add' ? 'Add' : 'Subtract'}: ₱{receiptDetails.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="pos-receipt-row pos-receipt-row--total">
                    <span className="pos-receipt-label">Revenue Change:</span>
                    <span className="pos-receipt-value pos-receipt-value--final">
                      {receiptDetails.mode === 'add' ? '+' : '-'}₱{Math.abs(receiptDetails.result).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pos-receipt-footer">
                <i className="bi bi-check-circle-fill me-1"></i>Adjustment recorded successfully
              </div>
              <button 
                className="pos-receipt-print-btn"
                onClick={handlePrintReceipt}
              >
                <i className="bi bi-printer me-1"></i>Print
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="pos-kpi-row">
        <KPITile icon="bi-cash"           label="Total Revenue"      value={totalRevenue} prefix="₱" color="#6366f1" badge="ALL TIME" badgeColor="#6366f1" />
        <KPITile icon="bi-check2-circle"  label="Earned Revenue"   value={earned}     prefix="₱" color="#10b981" badge="COLLECTED"  badgeColor="#10b981" />
        <KPITile icon="bi-hourglass-split" label="Potential Revenue" value={potential} prefix="₱" color="#f59e0b" badge="PIPELINE"   badgeColor="#f59e0b" />
        <KPITile icon="bi-x-circle"       label="Lost Revenue"     value={lost}      prefix="₱" color="#ef4444" badge="CANCELLED"  badgeColor="#ef4444" />
        <KPITile icon="bi-speedometer2"   label="Collection Rate"  value={rate}      prefix=""  suffix="%" color="#6366f1" badge={rate>=70?'🔥 EXCELLENT':rate>=40?'📈 GROWING':'⚠️ LOW'} badgeColor="#6366f1" />
        <KPITile icon="bi-calculator"     label="Avg per Service"  value={avgPerService} prefix="₱" color="#ec4899" badge="AVG"    badgeColor="#ec4899" />
        <KPITile icon="bi-calendar2-check" label="Total Appointments" value={totalCount} prefix="" color="#14b8a6" badge="ALL TIME" badgeColor="#14b8a6" />
      </div>

      {/* ── Revenue breakdown bar ── */}
      <div className="pos-breakdown-card">
        <div className="pos-breakdown-title">
          <i className="bi bi-bar-chart-steps me-2"></i>Revenue Breakdown
          <span className="pos-breakdown-total">Total: ₱{totalAll.toLocaleString()}</span>
        </div>
        <div className="pos-breakdown-bar">
          {earnedPct > 0    && <div className="pos-bb-seg pos-bb-earned"    style={{ width: `${earnedPct}%` }}><span>₱{earned.toLocaleString()}</span></div>}
          {potentialPct > 0 && <div className="pos-bb-seg pos-bb-potential" style={{ width: `${potentialPct}%` }}><span>₱{potential.toLocaleString()}</span></div>}
          {lostPct > 0      && <div className="pos-bb-seg pos-bb-lost"      style={{ width: `${lostPct}%` }}><span>₱{lost.toLocaleString()}</span></div>}
          {totalAll === 0   && <div className="pos-bb-seg pos-bb-empty"     style={{ width: '100%' }}><span>No data yet</span></div>}
        </div>
        <div className="pos-breakdown-legend">
          <span><span className="pos-dot pos-dot--earned"></span>Earned {Math.round(earnedPct)}%</span>
          <span><span className="pos-dot pos-dot--potential"></span>Potential {Math.round(potentialPct)}%</span>
          <span><span className="pos-dot pos-dot--lost"></span>Lost {Math.round(lostPct)}%</span>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="pos-charts-row">
        <div className="pos-chart-card pos-chart-card--wide">
          <div className="pos-chart-title"><i className="bi bi-graph-up-arrow me-2"></i>Monthly Revenue Trend</div>
          <div style={{ height: 220 }}>
            {data.monthlyRevenue.length > 0
              ? <Line data={monthlyChartData} options={chartOpts()} />
              : <div className="pos-no-data">No monthly data yet</div>}
          </div>
        </div>
        <div className="pos-chart-card">
          <div className="pos-chart-title"><i className="bi bi-pie-chart-fill me-2"></i>Revenue by Service</div>
          <div style={{ height: 220 }}>
            {data.serviceRevenue.some(s => s.revenue > 0)
              ? <Doughnut data={serviceChartData} options={donutOpts} />
              : <div className="pos-no-data">No service revenue yet</div>}
          </div>
        </div>
        <div className="pos-chart-card">
          <div className="pos-chart-title"><i className="bi bi-person-badge-fill me-2"></i>Revenue by Stylist</div>
          <div style={{ height: 220 }}>
            {data.stylistRevenue.some(s => s.revenue > 0)
              ? <Bar data={stylistChartData} options={chartOpts()} />
              : <div className="pos-no-data">No stylist revenue yet</div>}
          </div>
        </div>
      </div>

      {/* ── Leaderboards row ── */}
      <div className="pos-leaders-row">
        <LeaderBoard title="Top Services" icon="bi-stars" items={data.serviceRevenue.filter(s=>s.revenue>0).slice(0,5)} />
        <LeaderBoard title="Top Stylists" icon="bi-scissors" items={data.stylistRevenue.filter(s=>s.revenue>0).slice(0,5)} />
      </div>

      {/* ── Transactions table ── */}
      <div className="pos-table-card">
        <div className="pos-table-header">
          <div className="pos-table-title"><i className="bi bi-receipt me-2"></i>All Transactions</div>
          <div className="pos-table-controls">
            <input
              className="pos-search"
              placeholder="Search client, service, stylist…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="pos-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <div className="pos-filter-tabs">
              {['all','completed','pending','confirmed','cancelled'].map(s => (
                <button key={s} className={`pos-filter-tab ${filter===s?'active':''}`} onClick={() => setFilter(s)}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pos-table-wrap">
          <table className="pos-table">
            <thead>
              <tr>
                <th>#</th><th>Client</th><th>Stylist</th><th>Service</th>
                <th>Date</th><th>Price</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="pos-table-empty">
                  <i className="bi bi-inbox fs-3 d-block mb-2"></i>No transactions found
                </td></tr>
              )}
              {filtered.map((b, i) => (
                <tr key={b.id} className={b.status === 'completed' ? 'pos-row--completed' : ''}>
                  <td><span className="pos-row-id">#{b.id}</span></td>
                  <td>
                    <div className="pos-client-cell">
                      <div className="pos-avatar" style={{ background: `hsl(${(b.clientName?.charCodeAt(0)||65)*5},60%,55%)` }}>
                        {(b.clientName||'?').charAt(0).toUpperCase()}
                      </div>
                      <span>{b.clientName}</span>
                    </div>
                  </td>
                  <td className="text-muted">{b.stylistName}</td>
                  <td><span className="pos-service-tag">{b.serviceName}</span></td>
                  <td className="text-muted small">
                    {new Date(b.dateTime).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </td>
                  <td>
                    <span className={`pos-price ${b.status==='completed'?'pos-price--earned':b.status==='cancelled'?'pos-price--lost':''}`}>
                      ₱{Number(b.price).toLocaleString()}
                    </span>
                  </td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        className="pos-done-btn"
                        disabled={completing === b.id}
                        onClick={() => markComplete(b.id)}
                      >
                        {completing === b.id
                          ? <><i className="bi bi-arrow-repeat spin me-1"></i>Saving…</>
                          : <><i className="bi bi-check-lg me-1"></i>Mark Done</>}
                      </button>
                    )}
                    {b.status === 'completed' && <span className="pos-done-label"><i className="bi bi-patch-check-fill me-1"></i>Collected</span>}
                    {b.status === 'cancelled' && <span className="pos-cancelled-label"><i className="bi bi-x-circle me-1"></i>Cancelled</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pos-table-footer">
          Showing {filtered.length} of {bookings.length} transactions ·
          Earned: <strong style={{color:'#10b981'}}>₱{filtered.filter(b=>b.status==='completed').reduce((s,b)=>s+Number(b.price),0).toLocaleString()}</strong>
        </div>
      </div>

      </div>{/* end pos-page-body */}
    </div>
  );
}

/* ── KPI Tile ── */
function KPITile({ icon, label, value, prefix = '', suffix = '', color, badge, badgeColor }) {
  const animated = useCounter(value);
  return (
    <div className="pos-kpi-tile" style={{ '--kc': color }}>
      <div className="pos-kpi-tile-top">
        <div className="pos-kpi-icon"><i className={`bi ${icon}`}></i></div>
        <span className="pos-kpi-badge" style={{ background: `${badgeColor}18`, color: badgeColor }}>{badge}</span>
      </div>
      <div className="pos-kpi-value">{prefix}{animated.toLocaleString()}{suffix}</div>
      <div className="pos-kpi-label">{label}</div>
      <div className="pos-kpi-bar"><div className="pos-kpi-bar-fill"></div></div>
    </div>
  );
}

/* ── Leaderboard ── */
function LeaderBoard({ title, icon, items }) {
  const max = Math.max(...items.map(i => i.revenue), 1);
  const medals = ['🥇','🥈','🥉'];
  return (
    <div className="pos-leader-card">
      <div className="pos-leader-title"><i className={`bi ${icon} me-2`}></i>{title}</div>
      {items.length === 0 && <div className="pos-no-data">No data yet</div>}
      {items.map((item, i) => (
        <div key={i} className="pos-leader-row">
          <span className="pos-leader-medal">{medals[i] || `#${i+1}`}</span>
          <div className="pos-leader-info">
            <div className="pos-leader-name">{item.name}</div>
            <div className="pos-leader-bar">
              <div className="pos-leader-bar-fill" style={{ width: `${(item.revenue/max)*100}%` }}></div>
            </div>
          </div>
          <div className="pos-leader-stats">
            <div className="pos-leader-rev">₱{Number(item.revenue).toLocaleString()}</div>
            <div className="pos-leader-bk">{item.bookings} bookings</div>
          </div>
        </div>
      ))}
    </div>
  );
}
