import { useState, useEffect, useRef, useCallback } from 'react';
import './Services.css';

const API      = 'http://localhost:3001/api/services';
const STYL_API = 'http://localhost:3001/api/stylists';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80';

const EMPTY = { name: '', description: '', price: '', duration: '', service_image_url: '' };

function getImg(svc) { return svc.service_image_url || FALLBACK_IMG; }

export default function Services() {
  const [services, setServices]     = useState([]);
  const [stylists, setStylists]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('name');
  const [viewMode, setViewMode]     = useState('grid');
  const [form, setForm]             = useState(EMPTY);
  const [imgPreview, setImgPreview] = useState('');
  const nameRef    = useRef(null);
  const toastTimer = useRef(null);

  const fire = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, stRes] = await Promise.all([fetch(API), fetch(STYL_API)]);
      setServices(sRes.ok ? await sRes.json() : []);
      setStylists(stRes.ok ? await stRes.json() : []);
    } catch { fire('Failed to load data.', 'error'); }
    finally { setLoading(false); }
  }, [fire]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (showModal) setTimeout(() => nameRef.current?.focus(), 80); }, [showModal]);

  const openAdd = () => {
    setForm(EMPTY); setImgPreview('');
    setEditingId(null); setShowModal(true);
  };
  const openEdit = svc => {
    setForm({ name: svc.name, description: svc.description || '', price: svc.price, duration: svc.duration, service_image_url: svc.service_image_url || '' });
    setImgPreview(svc.service_image_url || '');
    setEditingId(svc.id); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(EMPTY); setImgPreview(''); };

  const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleImageFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { fire('Image must be under 5MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImgPreview(reader.result);
      setForm(f => ({ ...f, service_image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editingId ? `${API}/${editingId}` : API;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price), duration: Number(form.duration) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      await fetchAll(); closeModal();
      fire(editingId ? 'Service updated.' : 'Service added.');
    } catch (err) { fire(err.message || 'Something went wrong.', 'error'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API}/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchAll(); fire('Service deleted.');
    } catch { fire('Delete failed.', 'error'); }
    finally { setDeleteId(null); }
  };

  // Match stylists to service by name keywords
  const getAssigned = svc =>
    stylists.filter(st =>
      st.status === 'active' &&
      st.specialization?.toLowerCase().split(/[\s,&]+/).some(kw =>
        kw.length > 2 && svc.name?.toLowerCase().includes(kw)
      )
    ).slice(0, 4);

  const filtered = services
    .filter(s => {
      const q = search.toLowerCase();
      return s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'price')    return Number(a.price) - Number(b.price);
      if (sortBy === 'bookings') return (b.total_bookings || 0) - (a.total_bookings || 0);
      return a.name?.localeCompare(b.name);
    });

  const totalBookings = services.reduce((s, x) => s + (x.total_bookings || 0), 0);
  const maxBook = Math.max(...services.map(s => s.total_bookings || 0), 1);

  if (loading) return (
    <div className="sv-loading">
      <div className="sv-ring"><div/><div/><div/><div/></div>
      <p>Loading services…</p>
    </div>
  );

  return (
    <div className="sv-root">

      {/* Toast */}
      {toast && (
        <div className={`sv-toast sv-toast--${toast.type}`}>
          <span className="sv-toast-ico">{toast.type === 'success' ? '✅' : '❌'}</span>
          <div className="sv-toast-body">
            <strong>{toast.type === 'success' ? 'Success' : 'Error'}</strong>
            <span>{toast.msg}</span>
          </div>
          <div className="sv-toast-bar" />
        </div>
      )}

      {/* Banner */}
      <div className="sv-banner">
        <div className="sv-banner-orb sv-banner-orb1" />
        <div className="sv-banner-orb sv-banner-orb2" />
        <div className="sv-banner-content">
          <div className="sv-banner-left">
            <div className="sv-banner-icon">✂️</div>
            <div>
              <h1 className="sv-banner-title">Salon <span>Services</span></h1>
              <p className="sv-banner-sub">Manage your complete service catalog</p>
            </div>
          </div>
          <button className="sv-add-btn" onClick={openAdd}>+ Add Service</button>
        </div>
      </div>

      {/* Stats */}
      <div className="sv-stats">
        <div className="sv-stat" style={{'--sl':'rgba(89,34,103,0.08)'}}>
          <div className="sv-stat-icon" style={{background:'rgba(89,34,103,0.08)'}}>💇‍♀️</div>
          <div><div className="sv-stat-val">{services.length}</div><div className="sv-stat-lbl">Total Services</div></div>
        </div>
        <div className="sv-stat" style={{'--sl':'#d1fae5'}}>
          <div className="sv-stat-icon" style={{background:'#d1fae5'}}>📅</div>
          <div><div className="sv-stat-val">{totalBookings}</div><div className="sv-stat-lbl">Total Bookings</div></div>
        </div>
        <div className="sv-stat" style={{'--sl':'rgba(232,160,32,0.1)'}}>
          <div className="sv-stat-icon" style={{background:'rgba(232,160,32,0.1)'}}>👥</div>
          <div><div className="sv-stat-val">{stylists.filter(s => s.status === 'active').length}</div><div className="sv-stat-lbl">Active Stylists</div></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sv-toolbar">
        <div className="sv-search-wrap">
          <span className="sv-search-ico">🔍</span>
          <input className="sv-search" placeholder="Search services…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="sv-search-x" onClick={() => setSearch('')}>✕</button>}
        </div>
        <select className="sv-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Name A–Z</option>
          <option value="price">Price ↑</option>
          <option value="bookings">Most Booked</option>
        </select>
        <div className="sv-view-toggle">
          <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>⊞</button>
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>☰</button>
        </div>
      </div>

      {/* Results */}
      <div className="sv-results-bar">
        <span className="sv-results-count"><span className="sv-results-dot" />{filtered.length} service{filtered.length !== 1 ? 's' : ''}</span>
        {search && <button className="sv-clear-btn" onClick={() => setSearch('')}>✕ Clear</button>}
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="sv-empty">
          <div className="sv-empty-ico">✂️</div>
          <h3>{search ? 'No results found' : 'No services yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Add your first service to get started.'}</p>
          {!search && <button className="sv-add-btn sv-add-btn--solid" onClick={openAdd}>+ Add Service</button>}
        </div>

      ) : viewMode === 'grid' ? (
        <div className="sv-grid">
          {filtered.map((svc, i) => {
            const assigned = getAssigned(svc);
            return (
              <div className="sv-card" key={svc.id} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="sv-card-img-wrap">
                  <img className="sv-card-img" src={getImg(svc)} alt={svc.name}
                    onError={e => { e.target.src = FALLBACK_IMG; }} />
                  <div className="sv-card-img-overlay" />
                  <div className="sv-card-hover-actions">
                    <button className="sv-hbtn sv-hbtn--edit" onClick={() => openEdit(svc)}>✏️ Edit</button>
                    <button className="sv-hbtn sv-hbtn--del"  onClick={() => setDeleteId(svc.id)}>🗑️ Delete</button>
                  </div>
                </div>
                <div className="sv-card-body">
                  <h3 className="sv-card-name">{svc.name}</h3>
                  <p className="sv-card-desc">{svc.description || 'No description provided.'}</p>
                  <div className="sv-chips">
                    <span className="sv-chip sv-chip--green">₱{Number(svc.price).toLocaleString()}</span>
                    <span className="sv-chip sv-chip--blue">⏱ {svc.duration} min</span>
                    <span className="sv-chip sv-chip--amber">📅 {svc.total_bookings || 0} booked</span>
                  </div>
                  {assigned.length > 0 && (
                    <div className="sv-assigned">
                      <span className="sv-assigned-lbl">Assigned Stylists</span>
                      <div className="sv-assigned-list">
                        {assigned.map(st => (
                          <div key={st.id} className="sv-stylist-pill">
                            <div className="sv-stylist-av">
                              {st.profile_image
                                ? <img src={st.profile_image} alt={st.name} onError={e => { e.target.style.display = 'none'; }} />
                                : st.name?.[0]?.toUpperCase()}
                            </div>
                            <span>{st.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="sv-card-footer">
                    <button className="sv-btn-edit" onClick={() => openEdit(svc)}>✏️ Edit</button>
                    <button className="sv-btn-del"  onClick={() => setDeleteId(svc.id)}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr><th>Service</th><th>Price</th><th>Duration</th><th>Bookings</th><th>Stylists</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((svc, i) => {
                const assigned = getAssigned(svc);
                const pct = Math.round(((svc.total_bookings || 0) / maxBook) * 100);
                return (
                  <tr key={svc.id} style={{ animationDelay: `${i * 30}ms` }}>
                    <td>
                      <div className="sv-row-svc">
                        <img className="sv-row-thumb" src={getImg(svc)} alt={svc.name} onError={e => { e.target.src = FALLBACK_IMG; }} />
                        <div>
                          <div className="sv-row-name">{svc.name}</div>
                          <div className="sv-row-desc">{svc.description || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="sv-row-price">₱{Number(svc.price).toLocaleString()}</span></td>
                    <td><span className="sv-row-dur">⏱ {svc.duration} min</span></td>
                    <td>
                      <div className="sv-row-book">
                        <span>{svc.total_bookings || 0}</span>
                        <div className="sv-row-bar"><div style={{ width: `${pct}%` }} /></div>
                      </div>
                    </td>
                    <td>
                      <div className="sv-row-avs">
                        {assigned.length > 0 ? assigned.map(st => (
                          <div key={st.id} className="sv-row-av" title={st.name}>
                            {st.profile_image
                              ? <img src={st.profile_image} alt={st.name} onError={e => { e.target.style.display = 'none'; }} />
                              : st.name?.[0]?.toUpperCase()}
                          </div>
                        )) : <span className="sv-row-none">—</span>}
                      </div>
                    </td>
                    <td>
                      <div className="sv-row-acts">
                        <button className="sv-row-btn sv-row-btn--edit" onClick={() => openEdit(svc)}>✏️</button>
                        <button className="sv-row-btn sv-row-btn--del"  onClick={() => setDeleteId(svc.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="sv-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="sv-modal">
            <div className="sv-modal-head">
              <div className="sv-modal-head-ico">{editingId ? '✏️' : '➕'}</div>
              <div>
                <h2>{editingId ? 'Edit Service' : 'New Service'}</h2>
                <p>{editingId ? 'Update service details' : 'Fill in the details below'}</p>
              </div>
              <button className="sv-modal-close" onClick={closeModal}>✕</button>
            </div>

            {/* Image upload area */}
            <div className="sv-img-upload-area">
              {imgPreview ? (
                <div className="sv-img-preview-wrap">
                  <img src={imgPreview} alt="preview" onError={e => { e.target.src = FALLBACK_IMG; }} />
                  <button type="button" className="sv-img-remove" onClick={() => { setImgPreview(''); setForm(f => ({ ...f, service_image_url: '' })); }}>✕</button>
                </div>
              ) : (
                <label className="sv-img-placeholder" htmlFor="svc-img-file">
                  <span className="sv-img-placeholder-ico">🖼️</span>
                  <span>Click to upload image</span>
                  <span className="sv-img-placeholder-hint">JPG, PNG — max 5MB</span>
                </label>
              )}
              <input id="svc-img-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
              {imgPreview && (
                <label className="sv-img-change-btn" htmlFor="svc-img-file">Change Image</label>
              )}
            </div>

            <form className="sv-form" onSubmit={handleSubmit}>
              <div className="sv-fg">
                <label>Service Name *</label>
                <input ref={nameRef} required placeholder="e.g. Haircut, Nail Art, Facial…" value={form.name}
                  onChange={e => setField('name', e.target.value)} />
              </div>

              <div className="sv-form-row">
                <div className="sv-fg">
                  <label>Price (₱) *</label>
                  <input required type="number" min="0" placeholder="0" value={form.price}
                    onChange={e => setField('price', e.target.value)} />
                </div>
                <div className="sv-fg">
                  <label>Duration (min) *</label>
                  <input required type="number" min="1" placeholder="60" value={form.duration}
                    onChange={e => setField('duration', e.target.value)} />
                </div>
              </div>

              <div className="sv-fg">
                <label>Description</label>
                <textarea rows={3} placeholder="Short description of the service…" value={form.description}
                  onChange={e => setField('description', e.target.value)} />
              </div>

              <div className="sv-form-actions">
                <button type="button" className="sv-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="sv-btn-save" disabled={saving}>
                  {saving && <span className="sv-spinner" />}
                  {saving ? 'Saving…' : editingId ? '✓ Update' : '+ Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="sv-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="sv-modal sv-modal--sm">
            <div className="sv-del-ico">🗑️</div>
            <h3 className="sv-del-title">Delete this service?</h3>
            <p className="sv-del-sub">This action cannot be undone.</p>
            <div className="sv-form-actions">
              <button className="sv-btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="sv-btn-danger" onClick={confirmDelete}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
