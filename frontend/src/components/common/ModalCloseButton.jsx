import React from 'react';
import { X } from 'lucide-react';

export const ModalCloseButton = ({ onClick, className = '', style = {} }) => {
  return (
    <button
      type="button"
      className={`shared-modal-close-btn ${className}`}
      onClick={onClick}
      aria-label="Close"
      style={style}
    >
      <X size={16} strokeWidth={2.5} />
    </button>
  );
};

export default ModalCloseButton;
