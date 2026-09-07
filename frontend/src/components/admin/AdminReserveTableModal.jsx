import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatAdminTableNumber } from './AdminTableCard';

export const AdminReserveTableModal = ({
  isOpen,
  table,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [guestName, setGuestName] = useState('');
  const [arrivalTime, setArrivalTime] = useState('7:30 PM');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGuestName('');
      setArrivalTime('7:30 PM');
      setError('');
    }
  }, [isOpen, table]);

  if (!isOpen || !table) return null;

  const tableNumStr = formatAdminTableNumber(table.number).replace(/^T\s*/i, 'Table ');
  // E.g., "Reserved Table 3"
  const title = `Reserved ${tableNumStr}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter guest name');
      return;
    }
    if (!arrivalTime.trim()) {
      setError('Please enter arrival time');
      return;
    }
    setError('');
    onConfirm({
      tableId: table.id,
      guestName: guestName.trim(),
      arrivalTime: arrivalTime.trim(),
    });
  };

  return (
    <div className="admin-reserve-modal-backdrop" onClick={onClose}>
      <div
        className="admin-reserve-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="admin-reserve-header">
          <div className="admin-reserve-header-left">
            <div className="admin-reserve-icon-circle">
              {/* Table Icon matching reference */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="3" rx="1.5" fill="#8D5B38" />
                <path d="M5 9L3.5 18" stroke="#8D5B38" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M19 9L20.5 18" stroke="#8D5B38" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M8 9L7.5 18" stroke="#A87550" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 9L16.5 18" stroke="#A87550" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="admin-reserve-header-text">
              <h3 className="admin-reserve-title">{title}</h3>
              <div className="admin-reserve-subtitle">
                <span className="admin-reserve-blue-dot" />
                <span>Awaiting Guest</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="admin-reserve-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="admin-reserve-form">
          {error && <div className="admin-reserve-error">{error}</div>}

          {/* Field 1: Guest Name */}
          <div className="admin-reserve-field">
            <label className="admin-reserve-label">GUEST NAME</label>
            <input
              type="text"
              className="admin-reserve-input"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                if (error) setError('');
              }}
              placeholder=""
              autoFocus
            />
          </div>

          {/* Field 2: Arrival Time */}
          <div className="admin-reserve-field">
            <label className="admin-reserve-label">ARRIVAL TIME</label>
            <input
              type="text"
              className="admin-reserve-input"
              value={arrivalTime}
              onChange={(e) => {
                setArrivalTime(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. 7:30 PM"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="admin-reserve-confirm-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
};
