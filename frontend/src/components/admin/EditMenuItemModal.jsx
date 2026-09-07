import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { menuApi } from '../../api/menuApi';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

/**
 * EditMenuItemModal
 *
 * Modal to edit an existing dish / menu item.
 */
export const EditMenuItemModal = ({ isOpen, onClose, item, categories = [], onItemUpdated }) => {
  useLockBodyScroll(isOpen);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [halfPrice, setHalfPrice] = useState('');
  const [quarterPrice, setQuarterPrice] = useState('');
  const [description, setDescription] = useState('');
  const [dietType, setDietType] = useState('veg'); // 'veg', 'non-veg', 'egg'
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef(null);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategoryId(item.category || (item.category_data && item.category_data.id) || (categories[0]?.id || ''));
      setPrice(item.price || '');
      setHalfPrice(item.half_price || '');
      setQuarterPrice(item.quarter_price || '');
      setDescription(item.description || '');
      setDietType(item.is_veg ? 'veg' : 'non-veg');
      setIsAvailable(item.is_available !== false);
      setImageFile(null);
      setError('');
    }
  }, [item, categories]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter item name.');
      return;
    }

    const cleanPrice = parseFloat(price);
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    setIsSubmitting(true);
    try {
      let payload;
      if (imageFile) {
        payload = new FormData();
        payload.append('name', cleanName);
        if (categoryId) payload.append('category', categoryId);
        payload.append('price', cleanPrice);
        if (halfPrice) payload.append('half_price', parseFloat(halfPrice));
        if (quarterPrice) payload.append('quarter_price', parseFloat(quarterPrice));
        payload.append('description', description.trim());
        payload.append('is_veg', dietType === 'veg');
        payload.append('is_available', isAvailable);
        payload.append('image', imageFile);
      } else {
        payload = {
          name: cleanName,
          category: categoryId || undefined,
          price: cleanPrice,
          half_price: halfPrice ? parseFloat(halfPrice) : null,
          quarter_price: quarterPrice ? parseFloat(quarterPrice) : null,
          description: description.trim(),
          is_veg: dietType === 'veg',
          is_available: isAvailable,
        };
      }

      const updated = await menuApi.updateMenuItem(item.id, payload);
      if (onItemUpdated) {
        onItemUpdated(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update menu item:', err);
      const serverErr =
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to update menu item.';
      setError(serverErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-add-modal-overlay" onClick={onClose}>
      <div
        className="admin-add-modal-card"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Top-right close */}
        <button
          type="button"
          className="admin-add-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={17} color="#8E8E93" strokeWidth={2.2} />
        </button>

        {/* Header */}
        <div className="admin-add-modal-header">
          <h2 className="admin-add-modal-title">Edit Menu Item</h2>
          <p className="admin-add-modal-subtitle">Update details for {item.name}</p>
        </div>

        {error && (
          <div className="admin-add-modal-error" style={{ margin: '0 0 16px 0' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-add-modal-form">
          {/* Dish Name */}
          <div className="admin-add-form-group">
            <label className="admin-add-form-label">Dish Name *</label>
            <input
              type="text"
              className="admin-add-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Biriyani"
              required
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className="admin-add-form-group">
              <label className="admin-add-form-label">Category</label>
              <select
                className="admin-add-form-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="admin-add-form-group">
              <label className="admin-add-form-label">Full Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-add-form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150"
                required
              />
            </div>
            <div className="admin-add-form-group">
              <label className="admin-add-form-label">Half (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-add-form-input"
                value={halfPrice}
                onChange={(e) => setHalfPrice(e.target.value)}
                placeholder="90"
              />
            </div>
            <div className="admin-add-form-group">
              <label className="admin-add-form-label">Quarter (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-add-form-input"
                value={quarterPrice}
                onChange={(e) => setQuarterPrice(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          {/* Diet Type */}
          <div className="admin-add-form-group">
            <label className="admin-add-form-label">Food Type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`admin-add-toggle-btn ${dietType === 'veg' ? 'active' : ''}`}
                onClick={() => setDietType('veg')}
                style={{ flex: 1 }}
              >
                🟢 Veg
              </button>
              <button
                type="button"
                className={`admin-add-toggle-btn ${dietType === 'non-veg' ? 'active' : ''}`}
                onClick={() => setDietType('non-veg')}
                style={{ flex: 1 }}
              >
                🔴 Non-Veg
              </button>
              <button
                type="button"
                className={`admin-add-toggle-btn ${dietType === 'egg' ? 'active' : ''}`}
                onClick={() => setDietType('egg')}
                style={{ flex: 1 }}
              >
                🟡 Egg
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="admin-add-form-group">
            <label className="admin-add-form-label">Description</label>
            <textarea
              className="admin-add-form-input"
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of the dish..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Optional Image Upload */}
          <div className="admin-add-form-group">
            <label className="admin-add-form-label">Dish Image</label>
            <input
              type="file"
              accept="image/*"
              className="admin-add-form-input"
              onChange={(e) => setImageFile(e.target.files[0] || null)}
              style={{ padding: '6px' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="admin-add-modal-actions">
            <button
              type="button"
              className="admin-add-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-add-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMenuItemModal;
