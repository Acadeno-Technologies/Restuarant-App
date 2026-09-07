import React from 'react';
import { Edit2, X, Printer, User, Armchair, Pencil, Ban } from 'lucide-react';

/**
 * Format table number into clean format e.g. "T 1", "T 2", etc.
 */
export const formatAdminTableNumber = (val) => {
  if (!val) return 'T 1';
  const str = String(val).trim();
  const digits = str.replace(/[^0-9]/g, '');
  if (digits) return `T ${digits}`;
  const clean = str
    .replace(/^Table\s*[-_]?\s*/i, '')
    .replace(/^T\s*[-_]?\s*/i, '')
    .trim();
  return `T ${clean || '1'}`;
};

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  if (str.toLowerCase().includes('am') || str.toLowerCase().includes('pm')) {
    return str;
  }
  const parts = str.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const mins = parts[1].slice(0, 2).padStart(2, '0');
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${mins} ${ampm}`;
    }
  }
  return str;
};

/**
 * AdminTableCard
 *
 * Dynamic reusable table card for the Admin Portal dashboard matching reference image specs:
 * - Available: Soft pastel green background, green title & badge, edit/delete action icons
 * - Reserved: Soft pastel blue background, blue title & badge, guest name & arrival time
 * - Occupied: Soft pastel pink/red background, red title & badge, section info
 * - Billing: Soft pastel cream/gold background, gold title & badge, print action icon, Total Bill amount
 */
export const AdminTableCard = ({
  table,
  activeOrder,
  onClick,
  onEdit,
  onToggleService,
  onDelete,
  onPrint,
}) => {
  const statusKey = (table.status || 'available').toLowerCase();
  const isNoService = statusKey === 'no_service' || statusKey === 'inactive';
  const isAvailable = statusKey === 'available';

  // Toggle handler: calls onToggleService or onDelete
  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggleService) {
      onToggleService(table);
    } else if (onDelete) {
      onDelete(table);
    }
  };

  // Guest & arrival info for reserved tables
  const guestName = table.active_reservation?.guest_name || table.guest_name || '';
  const rawArrival = table.active_reservation?.arrival_time || table.arrival_time || '';
  const arrivalTime = formatTime12h(rawArrival);
  const reservationText = guestName ? `• ${guestName}${arrivalTime ? ` · ${arrivalTime}` : ''}` : '• Reserved';

  // Bill amount for billing/occupied tables
  const billAmount = (() => {
    if (table.total_bill) return parseFloat(table.total_bill).toFixed(2);
    if (activeOrder) {
      const amt = activeOrder.total_amount || activeOrder.total || activeOrder.subtotal || 0;
      return parseFloat(amt).toFixed(2);
    }
    return null;
  })();

  const sectionName = table.section
    ? table.section.charAt(0).toUpperCase() + table.section.slice(1)
    : 'Indoor';

  return (
    <div
      className={`admin-table-card admin-table-card--${statusKey}`}
      onClick={() => onClick && onClick(table)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* ── Top Row: Table Number & Action Icons ── */}
      <div className="atc-header">
        <h3 className="atc-table-num">{formatAdminTableNumber(table.number)}</h3>

        <div className="atc-actions" onClick={(e) => e.stopPropagation()}>
          {(isAvailable || isNoService) && (
            <>
              {onEdit && (
                <button
                  type="button"
                  className={`atc-action-btn atc-action-btn--edit ${isNoService ? 'atc-action-btn--dark' : ''}`}
                  title="Edit Table"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(table);
                  }}
                >
                  <Pencil size={14} color={isNoService ? '#FFFFFF' : '#475569'} strokeWidth={2.2} />
                </button>
              )}
              <button
                type="button"
                className={`atc-action-btn atc-action-btn--ban ${isNoService ? 'atc-action-btn--deactivated' : ''}`}
                title={isNoService ? "Activate Table" : "Deactivate Table"}
                onClick={handleToggle}
              >
                <Ban size={14} color={isNoService ? '#FFFFFF' : '#DC2626'} strokeWidth={2.2} />
              </button>
            </>
          )}

          {statusKey === 'billing' && (
            <button
              type="button"
              className="atc-action-btn atc-action-btn--print"
              title="Print Receipt"
              onClick={(e) => {
                e.stopPropagation();
                if (onPrint) onPrint(table);
              }}
            >
              <img
                src="/print.svg"
                alt="Print"
                style={{ width: '18px', height: '18px', objectFit: 'contain' }}
              />
            </button>
          )}
        </div>
      </div>

      {/* ── Middle: Capacity & Details ── */}
      <div className="atc-body">
        <div className="atc-capacity">
          <img
            src="/Vector.png"
            alt="Seats"
            className="atc-chair-icon"
            style={{ width: '16px', height: '16px', objectFit: 'contain', flexShrink: 0 }}
          />
          <span>{table.capacity || 4} seats</span>
        </div>

        {statusKey === 'billing' && <div className="atc-billing-divider" />}

        <div className="atc-subtext">
          {statusKey === 'reserved' ? (
            <span className="atc-reservation-info" title={reservationText}>
              {reservationText}
            </span>
          ) : statusKey === 'billing' ? (
            <div className="atc-billing-info">
              <span className="atc-bill-label">Total Bill</span>
              <span className="atc-bill-value">₹ {billAmount || '0.00'}</span>
            </div>
          ) : (
            <span className="atc-section-info">• {sectionName}</span>
          )}
        </div>
      </div>

      {/* ── Bottom: Status Badge ── */}
      <div className="atc-footer">
        <div className={`atc-badge atc-badge--${statusKey}`}>
          <span className="atc-badge-dot">•</span>
          <span className="atc-badge-label">
            {isNoService
              ? 'No Service'
              : statusKey === 'available'
              ? 'Available'
              : statusKey === 'reserved'
              ? 'Reserved'
              : statusKey === 'occupied'
              ? 'Occupied'
              : statusKey === 'billing'
              ? 'Billing'
              : 'Available'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminTableCard;
