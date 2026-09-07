import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menuApi';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

/**
 * EditCategoryModal
 * Styled to exact perfection matching reference design:
 * - Rounded white card (border-radius: 28px)
 * - Centered "Edit Category" header & "Organize your menu into sections" subtitle
 * - "Category Name" input with rounded rectangle border
 * - Dark full-width "Save" button
 */
const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const EditCategoryModal = ({ isOpen, category, onClose, onCategoryUpdated }) => {
  useLockBodyScroll(isOpen);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setError('');
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updatedCategory = await menuApi.updateCategory(category.id, {
        name: toTitleCase(name),
      });
      if (onCategoryUpdated) onCategoryUpdated(updatedCategory);
      onClose();
    } catch (err) {
      console.error('Failed to update category:', err);
      setError(
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.detail ||
        'Failed to update category'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-category-modal-overlay" onClick={onClose}>
      <div
        className="admin-category-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          className="admin-category-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* Centered Header */}
        <div className="admin-category-modal-header">
          <h2 className="admin-category-modal-title">Edit Category</h2>
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

export default EditCategoryModal;
