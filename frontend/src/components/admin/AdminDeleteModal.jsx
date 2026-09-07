import React from 'react';
import { Trash2, X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

/**
 * AdminDeleteModal
 *
 * Universal, reusable delete confirmation modal across the entire Admin Portal:
 * - Order History (Delete selected orders)
 * - Staff Management (Remove staff member)
 * - Menu Catalogue (Delete menu item / Delete category)
 * - Tables / Dashboard
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onConfirm: () => void | Promise<void>
 * - title: string
 * - description: string | ReactNode
 * - confirmText: string
 * - cancelText: string
 * - isDeleting: boolean
 */
export const AdminDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  description = 'Are you sure you want to permanently delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDeleting = false,
}) => {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="admin-delete-modal-overlay"
      onClick={() => !isDeleting && onClose && onClose()}
    >
      <div
        className="admin-delete-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          className="admin-delete-modal-close"
          onClick={onClose}
          disabled={isDeleting}
          title="Close"
        >
          <X size={14} color="#9CA3AF" strokeWidth={2.2} />
        </button>

        {/* Top Red Trash Icon Badge */}
        <div className="admin-delete-modal-icon-badge">
          <Trash2 size={22} color="#E11D48" strokeWidth={2} />
        </div>

        {/* Title */}
        <h3 className="admin-delete-modal-title">{title}</h3>

        {/* Description */}
        <p className="admin-delete-modal-desc">{description}</p>

        {/* Action Buttons */}
        <div className="admin-delete-modal-actions">
          <button
            type="button"
            className="admin-delete-modal-cancel-btn"
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="admin-delete-modal-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDeleteModal;
