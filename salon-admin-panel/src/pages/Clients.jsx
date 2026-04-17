import { useState, useEffect, useRef } from 'react';
import './Clients.css';

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#10b981',
  '#f59e0b','#3b82f6','#14b8a6','#f97316',
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 38 }) {
  const color = getAvatarColor(name);
  return (
    <div className="cl-avatar" style={{ width: size, height: size, minWidth: size, background: color }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function StatCard({ icon, label, value, color, delay = 0 }) {
  return (
    <div className="cl-stat-card" style={{ '--sc': color, animationDelay: `${delay}ms` }}>
      <div className="cl-stat-icon"><i className={`bi ${icon}`}></i></div>
      <div className="cl-stat-val">{value}</div>
      <div className="cl-stat-label">{label}</div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData]   = useState({ name: '', email: '', phone: '' });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const firstInputRef             = useRef(null);

  useEffect(() => { fetchClients(); }, []);
  useEffect(() => { if (showModal) setTimeout(() => firstInputRef.current?.focus(), 80); }, [showModal]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/clients');
      const data = await res.json();
      // newest first
      setClients([...data].sort((a, b) => b.id - a.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setFormData({ name: '', email: '', phone: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setFormData({ name: c.name, email: c.email, phone: c.phone });
    setEditingId(c.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url    = editingId ? `http://localhost:3001/api/clients/${editingId}` : 'http://localhost:3001/api/clients';
      const method = editingId ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data   = await res.json();
      if (res.ok) {
        await fetchClients();
        closeModal();
        showToast(editingId ? 'Client updated successfully.' : 'Client added successfully.');
      } else {
        showToast(data.message || 'Something went wrong.', 'error');
      }
    } catch (e) { console.error(e); showToast('Connection failed.', 'error'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`http://localhost:3001/api/clients/${deleteId}`, { method: 'DELETE' });
      await fetchClients();
      showToast('Client deleted.');
    } catch (e) { showToast('Delete failed.', 'error'); }
    finally { setDeleteId(null); }
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) return (
    <div className="cl-loading">
      <div className="cl-spinner"></div>
      <p>Loading clients…</p>
    </div>
  );

  return (
    <div className="cl-root">

      {/* ── Toast ── */}
      {toast && (
        <div className={`cl-toast cl-toast--${toast.type}`}>
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
          {toast.msg}
        </div>
      )}

      {/* ── Page Banner ── */}
      <div className="cl-banner">
        <div className="cl-banner-orb cl-banner-orb1"></div>
        <div className="cl-banner-orb cl-banner-orb2"></div>
        <div className="cl-banner-left">
          <div className="cl-banner-icon"><i className="bi bi-people-fill"></i></div>
          <div>
            <h1 className="cl-banner-title">Clients</h1>
            <p className="cl-banner-sub">Manage and track all your salon clients</p>
          </div>
        </div>
        <button className="cl-add-btn" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"></i>Add Client
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="cl-stats">
        <StatCard icon="bi-people-fill"       label="Total Clients"  value={clients.length}                                                                              color="#59226b" delay={0}   />
        <StatCard icon="bi-person-check-fill" label="With Account"   value={clients.filter(c => c.password).length}                                                      color="#10b981" delay={60}  />
        <StatCard icon="bi-calendar2-check"   label="This Month"     value={clients.filter(c => new Date(c.created_at) > new Date(Date.now() - 30*86400000)).length}     color="#e8a020" delay={120} />
        <StatCard icon="bi-search"            label="Filtered"       value={filtered.length}                                                                              color="#c0604a" delay={180} />
      </div>

      {/* ── Toolbar ── */}
      <div className="cl-toolbar">
        <div className="cl-search-wrap">
          <i className="bi bi-search cl-search-icon"></i>
          <input
            className="cl-search"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="cl-search-clear" onClick={() => setSearch('')}><i className="bi bi-x-lg"></i></button>}
        </div>
        <div className="cl-toolbar-right">
          <span className="cl-count-badge">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="cl-card">
        {filtered.length > 0 ? (
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Account</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ animationDelay: `${i * 35}ms` }}>
                    <td><span className="cl-row-id">#{c.id}</span></td>
                    <td>
                      <div className="cl-client-cell">
                        <Avatar name={c.name} />
                        <div>
                          <div className="cl-client-name">{c.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${c.email}`} className="cl-email-link">
                        <i className="bi bi-envelope me-1"></i>{c.email}
                      </a>
                    </td>
                    <td>
                      <span className="cl-phone">
                        <i className="bi bi-telephone me-1"></i>{c.phone}
                      </span>
                    </td>
                    <td className="cl-date">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <span className={`cl-account-badge ${c.password ? 'cl-account-badge--yes' : 'cl-account-badge--no'}`}>
                        <i className={`bi ${c.password ? 'bi-shield-check' : 'bi-shield-x'} me-1`}></i>
                        {c.password ? 'Active' : 'None'}
                      </span>
                    </td>
                    <td>
                      <div className="cl-actions">
                        <button className="cl-btn-edit" onClick={() => openEdit(c)} title="Edit">
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button className="cl-btn-delete" onClick={() => setDeleteId(c.id)} title="Delete">
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cl-empty">
            <i className="bi bi-people cl-empty-icon"></i>
            <p>{search ? 'No clients match your search.' : 'No clients yet. Add your first one!'}</p>
            {!search && <button className="cl-add-btn" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Add Client</button>}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="cl-modal">
            <div className="cl-modal-header">
              <div className="cl-modal-title">
                <div className="cl-modal-icon">
                  <i className={`bi ${editingId ? 'bi-pencil-fill' : 'bi-person-plus-fill'}`}></i>
                </div>
                <div>
                  <h2>{editingId ? 'Edit Client' : 'Add New Client'}</h2>
                  <p>{editingId ? 'Update client information' : 'Fill in the details below'}</p>
                </div>
              </div>
              <button className="cl-modal-close" onClick={closeModal}><i className="bi bi-x-lg"></i></button>
            </div>

            <form onSubmit={handleSubmit} className="cl-form">
              <div className="cl-form-group">
                <label><i className="bi bi-person me-2"></i>Full Name</label>
                <input ref={firstInputRef} type="text" placeholder="e.g. Jane Santos" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="cl-form-group">
                <label><i className="bi bi-envelope me-2"></i>Email Address</label>
                <input type="email" placeholder="e.g. jane@email.com" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="cl-form-group">
                <label><i className="bi bi-telephone me-2"></i>Phone Number</label>
                <input type="tel" placeholder="e.g. 09XX-XXX-XXXX" value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
              </div>

              <div className="cl-form-actions">
                <button type="button" className="cl-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="cl-btn-save" disabled={saving}>
                  {saving ? <><span className="cl-btn-spinner"></span>Saving…</> : <><i className={`bi ${editingId ? 'bi-check-lg' : 'bi-plus-lg'} me-2`}></i>{editingId ? 'Update Client' : 'Add Client'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="cl-modal cl-modal--sm">
            <div className="cl-delete-icon"><i className="bi bi-trash3-fill"></i></div>
            <h3 className="cl-delete-title">Delete Client?</h3>
            <p className="cl-delete-sub">This action cannot be undone. All booking data linked to this client will also be removed.</p>
            <div className="cl-form-actions">
              <button className="cl-btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="cl-btn-delete-confirm" onClick={confirmDelete}>
                <i className="bi bi-trash3-fill me-2"></i>Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
