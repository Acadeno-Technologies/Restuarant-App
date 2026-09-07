import React, { useState } from 'react';
import { menuApi } from '../../api/menuApi';
import { X } from 'lucide-react';

/**
 * AddCategoryModal
 * Styled to exact perfection matching reference image:
 * - Rounded white card (border-radius: 28px)
 * - Centered "Add New Category" header & "Organize your menu into sections" subtitle
 * - "Category Name" input with rounded rectangle border
 * - Dark full-width "Save" button
 */
export const AddCategoryModal = ({ isOpen, onClose, onCategoryCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const newCategory = await menuApi.createCategory({
        name: name.trim(),
        description: '',
      });
      if (onCategoryCreated) onCategoryCreated(newCategory);
      setName('');
      onClose();
    } catch (err) {
      console.error('Failed to create category:', err);
      setError(
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.detail ||
        'Failed to create category'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="admin-category-modal-overlay" onClick={handleClose}>
      <div
        className="admin-category-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          className="admin-category-modal-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* Centered Header */}
        <div className="admin-category-modal-header">
          <h2 className="admin-category-modal-title">Add New Category</h2>
          <p className="admin-category-modal-subtitle">
            Organize your menu into sections
          </p>
        </div>

        {error && (
          <div className="admin-category-modal-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-category-form">
          <div className="admin-category-form-group">
            <label className="admin-category-label">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="admin-category-input"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="admin-category-save-btn"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
