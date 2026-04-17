import { useState, useEffect, useCallback, useRef } from 'react';
import './Stylists.css';

const API = 'http://localhost:3001';

function Stylists() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    status: 'active',
    password: '',
    years_of_experience: 0,
    bio: '',
    profile_image: '',
    achievements: '',
  });
  const [editingId, setEditingId] = useState(null);

  const fetchStylists = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/stylists`);
      const data = await response.json();
      setStylists(data);
    } catch (error) {
      console.error('Error fetching stylists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStylists();
    const interval = setInterval(fetchStylists, 5000);

    // WebSocket for real-time push events
    try {
      wsRef.current = new WebSocket('ws://localhost:3001');
      wsRef.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (['stylist_added', 'stylist_updated', 'stylist_deleted'].includes(msg.type)) {
            fetchStylists();
          }
        } catch {}
      };
    } catch {}

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchStylists]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `${API}/api/stylists/${editingId}`
        : `${API}/api/stylists`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchStylists();
        resetForm();
        alert(editingId ? 'Stylist updated successfully!' : 'Stylist added successfully!');
      } else {
        alert('Error saving stylist: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving stylist:', error);
      alert('Error saving stylist: ' + error.message);
    }
  };

  const handleEdit = (stylist) => {
    setFormData({
      name: stylist.name,
      email: stylist.email,
      phone: stylist.phone,
      specialization: stylist.specialization,
      status: stylist.status,
      password: '',
      years_of_experience: stylist.years_of_experience || 0,
      bio: stylist.bio || '',
      profile_image: stylist.profile_image || '',
      achievements: stylist.achievements || '',
    });
    setImagePreview(stylist.profile_image || null);
    setEditingId(stylist.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stylist?')) {
      try {
      await fetch(`${API}/api/stylists/${id}`, { method: 'DELETE' });
        fetchStylists();
        alert('Stylist deleted successfully!');
      } catch (error) {
        console.error('Error deleting stylist:', error);
        alert('Error deleting stylist');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      status: 'active',
      password: '',
      years_of_experience: 0,
      bio: '',
      profile_image: '',
      achievements: '',
    });
    setImagePreview(null);
    setEditingId(null);
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, profile_image: base64String }));
      };
      reader.onerror = () => alert('Error reading file');
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      profile_image: ''
    }));
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="stylists-page">
      {/* Enhanced Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">✂️</span>
            <span>Stylists Management</span>
          </h1>
          <p className="page-subtitle">Manage your talented salon stylists and their profiles</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <span>🔲</span>
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <span>📋</span>
            </button>
          </div>
          <button 
            className="add-stylist-btn"
            onClick={() => setShowModal(true)}
          >
            <span className="btn-icon">+</span>
            <span>Add Stylist</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="stylists-grid">
          {stylists.map((stylist) => (
            <div key={stylist.id} className={`stylist-card ${stylist.status}`}>
              <div className="card-header">
                <div className="stylist-avatar">
                  {stylist.profile_image ? (
                    <img src={stylist.profile_image} alt={stylist.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {stylist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="status-indicator">
                  <span className={`status-badge status-${stylist.status}`}>
                    {stylist.status === 'active' ? '🟢' : '🔴'} {stylist.status}
                  </span>
                </div>
              </div>

              <div className="card-body">
                <h3 className="stylist-name">{stylist.name}</h3>
                <p className="stylist-specialization">
                  <span className="spec-icon">💼</span>
                  {stylist.specialization}
                </p>

                {stylist.years_of_experience > 0 && (
                  <div className="experience-badge">
                    <span className="exp-icon">⭐</span>
                    <span>{stylist.years_of_experience} years experience</span>
                  </div>
                )}

                {stylist.bio && (
                  <p className="stylist-bio">{stylist.bio}</p>
                )}

                <div className="stylist-stats">
                  <div className="stat-item">
                    <span className="stat-icon">⭐</span>
                    <span className="stat-value">{Number(stylist.rating) > 0 ? Number(stylist.rating).toFixed(1) : '—'}</span>
                    <span className="stat-label">Rating</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">📅</span>
                    <span className="stat-value">{stylist.total_bookings || 0}</span>
                    <span className="stat-label">Bookings</span>
                  </div>
                </div>

                {stylist.achievements && (
                  <div className="achievements">
                    <h4>🏆 Achievements</h4>
                    <p>{stylist.achievements}</p>
                  </div>
                )}

                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <span className="contact-text">{stylist.email}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📱</span>
                    <span className="contact-text">{stylist.phone}</span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(stylist)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(stylist.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card">
          {stylists.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stylists.map((stylist) => (
                  <tr key={stylist.id}>
                    <td>
                      <div className="table-name">
                        {stylist.profile_image ? (
                          <img src={stylist.profile_image} alt={stylist.name} className="table-avatar" />
                        ) : (
                          <div className="table-avatar-placeholder">
                            {stylist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                        )}
                        <span>{stylist.name}</span>
                      </div>
                    </td>
                    <td>{stylist.email}</td>
                    <td>{stylist.phone}</td>
                    <td>{stylist.specialization}</td>
                    <td>{stylist.years_of_experience || 0} years</td>
                    <td>
                      <span className="rating-badge">⭐ {Number(stylist.rating) > 0 ? Number(stylist.rating).toFixed(1) : '—'}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-${stylist.status}`}>
                        {stylist.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-secondary"
                          onClick={() => handleEdit(stylist)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(stylist.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✂️</div>
              <h3>No Stylists Yet</h3>
              <p>Add your first stylist to get started!</p>
              <button 
                className="btn-primary"
                onClick={() => setShowModal(true)}
              >
                Add First Stylist
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Modal */}
      {showModal && (
        <div className="stylist-modal-overlay" onClick={(e) => {
          if (e.target.className === 'stylist-modal-overlay') {
            resetForm();
          }
        }}>
          <div className="stylist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stylist-modal-header">
              <h2>{editingId ? 'Edit Stylist' : 'Add New Stylist'}</h2>
              <button 
                className="stylist-close-btn" 
                onClick={resetForm}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stylist-form">
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter stylist name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="stylist@salon.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="555-0000"
                    />
                  </div>

                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Specialization *</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g., Hair Cutting, Coloring"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Profile Details</h3>

                <div className="form-group">
                  <label>Profile Image</label>
                  <div className="image-upload-container">
                    {imagePreview ? (
                      <div className="image-preview-wrapper">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                        <button 
                          type="button" 
                          className="remove-image-btn"
                          onClick={removeImage}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder">
                        <span className="upload-icon">📷</span>
                        <span className="upload-text">Click to upload image</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="image-input"
                      id="profile-image-input"
                    />
                    <label htmlFor="profile-image-input" className="image-upload-label">
                      {imagePreview ? 'Change Image' : 'Choose Image'}
                    </label>
                  </div>
                  <small>Max size: 2MB. Formats: JPG, PNG, GIF</small>
                </div>

                <div className="form-group">
                  <label>Bio / Description</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Brief description about the stylist..."
                  />
                </div>

                <div className="form-group">
                  <label>Achievements</label>
                  <textarea
                    name="achievements"
                    value={formData.achievements}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Certifications, awards, special skills..."
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Security</h3>

                <div className="form-group">
                  <label>Password {!editingId && <span style={{ color: '#f44336' }}>*</span>}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password for stylist"
                    required={!editingId}
                  />
                  {!editingId && (
                    <small>Share this password with the stylist securely</small>
                  )}
                  {editingId && (
                    <small>Leave blank to keep current password</small>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update Stylist' : 'Add Stylist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stylists;
