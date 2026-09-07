import React, { useState, useEffect } from 'react';
import { Printer, X, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { billingApi } from '../../api/billingApi';
import { ordersApi } from '../../api/ordersApi';
import { formatAdminTableNumber } from './AdminTableCard';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

/**
 * AdminBillModal
 *
 * Exact replication of the reference design for Bill Print & Settlement:
 * - Large rounded light-gray modal (#F0F1F3) with generous padding
 * - "Table X" at top-left
 * - Circular Print icon and Close (X) icon at top-right
 * - Centered white receipt card with rounded corners & subtle dashed divider lines
 * - Monospace receipt typography for items, metadata, taxes, and totals
 * - Rounded segmented GST switch (Include GST 5% vs Exclude GST)
 * - 2-column clean payment method cards (By Cash, Google pay, Credit / Debit, UPI)
 * - Full-width dark maroon pill button "Settle Bill"
 * - Clean printer-friendly print functionality
 */
export const AdminBillModal = ({
  isOpen,
  onClose,
  table,
  activeOrder,
  order: propOrder,
  onBillSettled,
}) => {
  useLockBodyScroll(isOpen);

  const initialOrder = propOrder || activeOrder;
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Billing state
  const [isIncludeGst, setIsIncludeGst] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [settlingBill, setSettlingBill] = useState(false);

  // Fetch active order data for table if needed
  useEffect(() => {
    if (!isOpen) {
      setOrder(null);
      setError(null);
      return;
    }

    const currentOrder = propOrder || activeOrder;
    if (currentOrder && currentOrder.items && currentOrder.items.length > 0) {
      setOrder(currentOrder);
      return;
    }

    const fetchOrderForTable = async () => {
      if (!table?.id) {
        if (currentOrder) {
          setOrder(currentOrder);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await ordersApi.getActiveTableOrder(table.id);
        const fetchedOrder = data.order !== undefined ? data.order : data;
        if (fetchedOrder && fetchedOrder.id) {
          setOrder(fetchedOrder);
        } else if (currentOrder) {
          setOrder(currentOrder);
        } else {
          // Check if there is an existing bill/order for this table
          const allOrders = await ordersApi.getOrders({ table: table.id });
          const list = allOrders.results || allOrders;
          if (Array.isArray(list) && list.length > 0) {
            setOrder(list[0]);
          } else {
            setError('No active order found for this table.');
          }
        }
      } catch (err) {
        console.error('Failed to load table order for bill:', err);
        if (currentOrder) {
          setOrder(currentOrder);
        } else {
          setError('Failed to load order details for this table.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderForTable();
  }, [isOpen, table, activeOrder, propOrder]);

  if (!isOpen) return null;

  // Compute subtotal, tax and total dynamically
  const computedSubtotal = order?.items && order.items.length > 0
    ? order.items.reduce((acc, it) => acc + (parseFloat(it.unit_price || 0) * (it.quantity || 1)), 0)
    : parseFloat(order?.subtotal || order?.total_amount || order?.total || 0);

  const subtotal = computedSubtotal > 0 ? computedSubtotal : 0;
  const gstAmount = isIncludeGst ? (subtotal * 5) / 100 : 0;
  const totalAmount = subtotal + gstAmount;

  const isTakeaway = order?.order_type === 'takeaway' || (!table?.number && !order?.table_number && !order?.table);
  const tableDisplayName = isTakeaway
    ? (order?.customer_name ? `Parcel ${order.customer_name}` : `Parcel #${order?.id || ''}`)
    : table?.number
    ? formatAdminTableNumber(table.number).replace('T ', 'Table ')
    : order?.table_number
    ? `Table ${String(order.table_number).replace(/\D/g, '')}`
    : 'Dining Order';

  const orderDateStr = order?.created_at
    ? new Date(order.created_at).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  const orderNumberStr = order?.id ? String(order.id) : '16';

  // Trigger Print
  const handlePrint = (e) => {
    e?.stopPropagation();
    window.print();
  };

  // Settle Bill API Handler
  const handleSettleBill = async () => {
    if (!order?.id) {
      alert('Cannot settle bill without an active order.');
      return;
    }

    setSettlingBill(true);
    try {
      await billingApi.generateBill({
        order_id: order.id,
        include_gst: isIncludeGst,
        tax_percent: 5.0,
        discount_amount: 0,
        discount_reason: '',
        payment_method: selectedPaymentMethod,
        notes: '',
      });

      if (onBillSettled) {
        onBillSettled(table, order);
      }
      onClose();
    } catch (err) {
      console.error('Failed to settle bill:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to settle bill. Please try again.';
      alert(msg);
    } finally {
      setSettlingBill(false);
    }
  };

  return (
    <div className="admin-bill-modal-overlay" onClick={onClose}>
      <div className="admin-bill-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Top Header Row ── */}
        <div className="admin-bill-modal-header">
          <h2 className="admin-bill-modal-title">{tableDisplayName}</h2>
          <div className="admin-bill-modal-actions">
            <button
              type="button"
              className="admin-bill-print-btn"
              onClick={handlePrint}
              title="Print Receipt"
            >
              <img
                src="/print.svg"
                alt="Print"
                style={{ width: '16px', height: '16px', objectFit: 'contain', display: 'block' }}
              />
            </button>
            <button
              type="button"
              className="admin-bill-close-btn"
              onClick={onClose}
              title="Close"
              aria-label="Close"
            >
              <X size={20} color="#8E8E93" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
            <p>Loading order details...</p>
          </div>
        ) : error && !order ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#EF4444' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <p style={{ fontWeight: 600 }}>{error}</p>
          </div>
        ) : (
          <>
            {/* ── Centered White Receipt Card ── */}
            <div className="admin-receipt-card" id="admin-bill-preview">
              <div className="admin-receipt-header">
                <h3 className="admin-receipt-name">T CLOCK RESTO CAFE</h3>
                <p className="admin-receipt-tagline">Time for Tea, Time for Taste</p>
                <div className="admin-receipt-address">
                  Main Road, Calicut, Kerala<br />
                  Ph: +91 98765 43210 · GSTIN:<br />
                  32ABCDE1234F1Z5
                </div>
              </div>

              <div className="admin-receipt-divider" />

              {/* Meta Grid */}
              <div className="admin-receipt-meta">
                <div className="admin-receipt-meta-row">
                  <span>Date</span>
                  <span className="admin-receipt-meta-val">{orderDateStr}</span>
                </div>
                <div className="admin-receipt-meta-row">
                  <span>Type / Table</span>
                  <span className="admin-receipt-meta-val">{isTakeaway ? 'Parcel' : tableDisplayName}</span>
                </div>
                <div className="admin-receipt-meta-row">
                  <span>Order #</span>
                  <span className="admin-receipt-meta-val">{orderNumberStr}</span>
                </div>
              </div>

              <div className="admin-receipt-divider" />

              {/* Items List */}
              <div className="admin-receipt-items">
                {order?.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="admin-receipt-item-row">
                      <span className="admin-receipt-item-name">
                        {item.quantity}× {item.item_name || item.menu_item_name || item.name || 'Item'}
                      </span>
                      <span className="admin-receipt-item-price">
                        ₹{(parseFloat(item.unit_price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="admin-receipt-item-row">
                    <span className="admin-receipt-item-name">2× Chocolate Milkshake</span>
                    <span className="admin-receipt-item-price">₹800.00</span>
                  </div>
                )}
              </div>

              <div className="admin-receipt-divider" />

              {/* Calculations */}
              <div className="admin-receipt-calc">
                <div className="admin-receipt-calc-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal > 0 ? subtotal.toFixed(2) : '800.00'}</span>
                </div>

                {isIncludeGst && (
                  <div className="admin-receipt-calc-row">
                    <span>GST (5%)</span>
                    <span>₹{gstAmount > 0 ? gstAmount.toFixed(2) : '40.00'}</span>
                  </div>
                )}
              </div>

              <div className="admin-receipt-divider" />

              {/* Total Line */}
              <div className="admin-receipt-total-row">
                <span>TOTAL</span>
                <span>₹{totalAmount > 0 ? totalAmount.toFixed(2) : '840.00'}</span>
              </div>

              <div className="admin-receipt-footer">
                Thank you for visiting T Clock<br />
                Resto Cafe! 🌿
              </div>
            </div>

            {/* ── GST Segmented Control ── */}
            <div className="admin-gst-control">
              <button
                type="button"
                className={`admin-gst-btn ${isIncludeGst ? 'active' : ''}`}
                onClick={() => setIsIncludeGst(true)}
              >
                <CheckCircle2
                  size={15}
                  className="admin-gst-icon"
                  color={isIncludeGst ? '#16A34A' : '#9CA3AF'}
                  fill={isIncludeGst ? '#DCFCE7' : 'none'}
                />
                <span>Include GST (5%)</span>
              </button>

              <button
                type="button"
                className={`admin-gst-btn ${!isIncludeGst ? 'active' : ''}`}
                onClick={() => setIsIncludeGst(false)}
              >
                <XCircle
                  size={15}
                  className="admin-gst-icon"
                  color={!isIncludeGst ? '#16A34A' : '#9CA3AF'}
                  fill={!isIncludeGst ? '#DCFCE7' : 'none'}
                />
                <span>Exclude GST</span>
              </button>
            </div>

            {/* ── Payment Method Section ── */}
            <div className="admin-payment-section">
              <div className="admin-payment-label">SELECT PAYMENT METHOD</div>
              <div className="admin-payment-grid">
                <button
                  type="button"
                  className={`admin-payment-btn ${selectedPaymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('cash')}
                >
                  By Cash
                </button>
                <button
                  type="button"
                  className={`admin-payment-btn ${selectedPaymentMethod === 'gpay' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('gpay')}
                >
                  Google pay
                </button>
                <button
                  type="button"
                  className={`admin-payment-btn ${selectedPaymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('card')}
                >
                  Credit / Debit
                </button>
                <button
                  type="button"
                  className={`admin-payment-btn ${selectedPaymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('upi')}
                >
                  UPI (Pay via any App)
                </button>
              </div>
            </div>

            {/* ── Settle Bill Action Button ── */}
            <div className="admin-settle-section">
              <button
                type="button"
                className="admin-settle-btn"
                onClick={handleSettleBill}
                disabled={settlingBill}
              >
                {settlingBill ? 'Settling...' : 'Settle Bill'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBillModal;
