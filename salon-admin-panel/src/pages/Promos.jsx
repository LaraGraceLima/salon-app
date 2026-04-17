import { useState, useEffect } from 'react';
import './Promos.css';

function Promos() {
  const [promos, setPromos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percentage: '',
    discount_amount: '',
    start_date: '',
    end_date: '',
    terms_conditions: '',
    is_active: true
  });

  console.log('Promos component rendered, showForm:', showForm);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/promos');
      const data = await response.json();
      setPromos(data);
    } catch (error) {
      console.error('Error fetching promos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPromo 
        ? `http://localhost:3001/api/promos/${editingPromo.id}`
        : 'http://localhost:3001/api/promos';
      
      const method = editingPromo ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchPromos();
        resetForm();
        alert(editingPromo ? 'Promo updated successfully!' : 'Promo added successfully!');
      }
    } catch (error) {
      console.error('Error saving promo:', error);
      alert('Error saving promo');
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description,
      discount_percentage: promo.discount_percentage,
      discount_amount: promo.discount_amount || '',
      start_date: promo.start_date.split('T')[0],
      end_date: promo.end_date.split('T')[0],
      terms_conditions: promo.terms_conditions || '',
      is_active: promo.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promo?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/promos/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchPromos();
          alert('Promo deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting promo:', error);
        alert('Error deleting promo');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount_percentage: '',
      discount_amount: '',
      start_date: '',
      end_date: '',
      terms_conditions: '',
      is_active: true
    });
    setEditingPromo(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isPromoActive = (promo) => {
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    return promo.is_active && now >= startDate && now <= endDate;
  };

  return (
    <div className="promos-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🎉</span>
            Promos & Special Offers
          </h1>
          <p className="page-subtitle">Manage promotional campaigns and special discounts</p>
        </div>
        <button 
          className="btn btn-primary add-promo-btn"
          onClick={() => {
            console.log('Add Promo button clicked');
            setShowForm(true);
          }}
          type="button"
        >
          <span className="btn-icon">+</span>
          <span>Add New Promo</span>
        </button>
      </div>

      {showForm && (
        <div className="promo-modal-overlay" onClick={(e) => {
          if (e.target.className === 'promo-modal-overlay') {
            resetForm();
          }
        }}>
          <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="promo-modal-header">
              <h2>{editingPromo ? 'Edit Promo' : 'Add New Promo'}</h2>
              <button 
                className="promo-close-btn" 
                onClick={resetForm}
                type="button"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="promo-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Spring Special"
                  />
                </div>
                
                <div className="form-group">
                  <label>Discount Percentage *</label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g., 20"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Describe the promo offer..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Fixed Discount Amount (₱)</label>
                <input
                  type="number"
                  name="discount_amount"
                  value={formData.discount_amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Optional fixed amount discount"
                />
              </div>

              <div className="form-group">
                <label>Terms & Conditions</label>
                <textarea
                  name="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter terms and conditions..."
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Active Promo
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPromo ? 'Update Promo' : 'Add Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="promos-grid">
        {promos.map((promo) => (
          <div key={promo.id} className={`promo-card ${isPromoActive(promo) ? 'active' : 'inactive'}`}>
            <div className="promo-header">
              <h3>{promo.title}</h3>
              <div className="promo-status">
                {isPromoActive(promo) ? (
                  <span className="status-badge active">🟢 Active</span>
                ) : (
                  <span className="status-badge inactive">🔴 Inactive</span>
                )}
              </div>
            </div>
            
            <div className="promo-discount">
              <span className="discount-value">{promo.discount_percentage}% OFF</span>
              {promo.discount_amount && (
                <span className="discount-amount">or ₱{promo.discount_amount}</span>
              )}
            </div>
            
            <p className="promo-description">{promo.description}</p>
            
            <div className="promo-dates">
              <div className="date-range">
                <span className="date-label">Valid:</span>
                <span className="date-value">
                  {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                </span>
              </div>
            </div>
            
            {promo.terms_conditions && (
              <div className="promo-terms">
                <details>
                  <summary>Terms & Conditions</summary>
                  <p>{promo.terms_conditions}</p>
                </details>
              </div>
            )}
            
            <div className="promo-actions">
              <button 
                className="btn btn-edit"
                onClick={() => handleEdit(promo)}
              >
                ✏️ Edit
              </button>
              <button 
                className="btn btn-delete"
                onClick={() => handleDelete(promo.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {promos.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No Promos Yet</h3>
          <p>Create your first promotional offer to attract customers!</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add First Promo
          </button>
        </div>
      )}
    </div>
  );
}

export default Promos;