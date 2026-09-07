import React, { useState, useEffect } from 'react';
import { useOrder } from '../../context/OrderContext';
import { ordersApi } from '../../api/ordersApi';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

/**
 * AdminParcelOrderModal
 * Exact replica of the reference design for "View your Order 👀" in Admin Dashboard / Menu.
 * - Warm cream/beige background (#F4EFEA) with 28px rounded corners
 * - Header with "Parcel Order" and Order number #16
 * - Customer Name field
 * - Live item list with stepper, price, and remove X
 * - Subtotal and Total box with dashed line and 5% GST
 * - "Notes for the Kitchen" textarea
 * - Floating "Order Sent to Kitchen 🔥" confirmation badge
 * - "Add Item" and "Place Order" buttons
 */
export const AdminParcelOrderModal = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  useLockBodyScroll(isOpen);

  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    customerName,
    setCustomerName,
    orderNotes,
    setOrderNotes,
  } = useOrder();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSeq, setOrderSeq] = useState(16);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOrderSuccess(false);
      setError('');
      ordersApi.getOrders().then((res) => {
        const list = res.results || res;
        if (Array.isArray(list)) {
          setOrderSeq(list.length + 1);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unit_price || 0) * item.quantity,
    0
  );
  // 5% GST exactly matching the reference image calculation
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (!customerName?.trim()) {
      setError('Please enter the customer name.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Please add at least one item before placing the order.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        table: null,
        order_type: 'takeaway',
        customer_name: customerName.trim(),
        customer_phone: '',
        kitchen_notes: orderNotes?.trim() ? `[PARCEL] ${orderNotes.trim()}` : '[PARCEL]',
        notes: orderNotes?.trim() || '',
        items: cartItems.map((item) => ({
          menu_item: item.menu_item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          portion: item.portion || 'Full',
          notes: item.notes || '',
        })),
      };

      const createdOrder = await ordersApi.createOrder(payload);
      setOrderSuccess(true);

      setTimeout(() => {
        clearCart();
        if (onOrderPlaced) onOrderPlaced(createdOrder);
        onClose();
        setOrderSuccess(false);
      }, 1600);
    } catch (err) {
      console.error('Failed to place parcel order:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to place parcel order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-order-view-modal-overlay" onClick={onClose}>
      <div
        className="admin-order-view-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="admin-order-view-header">
          <h2 className="admin-order-view-title">Parcel Order</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="admin-order-view-num">#{orderSeq}</span>
            <button
              type="button"
              className="admin-order-view-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-order-view-error-msg">{error}</div>
        )}

        {/* Customer Name Field */}
        <div className="admin-order-view-field-group">
          <label className="admin-order-view-label">
            Name <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>
          </label>
          <input
            type="text"
            className={`admin-order-view-input ${error && !customerName?.trim() ? 'input-error' : ''}`}
            value={customerName || ''}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter customer name"
            required
            autoFocus
          />
        </div>

        {/* Order Items List */}
        <div className="admin-order-view-items-list">
          {cartItems.length === 0 ? (
            <div className="admin-order-view-empty-cart">
              No items selected yet. Click "Add Item" to add items from the menu.
            </div>
          ) : (
            cartItems.map((item) => {
              const portionSuffix =
                item.portion && item.portion !== 'Full'
                  ? ` (${item.portion})`
                  : '';
              const itemName = `${item.menu_item?.name || 'Item'}${portionSuffix}`;
              const itemTotal = (
                parseFloat(item.unit_price || 0) * item.quantity
              ).toFixed(2);

              return (
                <div
                  key={`${item.menu_item?.id}-${item.portion || 'Full'}`}
                  className="admin-order-view-item-row"
                >
                  <span className="admin-order-view-item-name">{itemName}</span>

                  {/* Quantity Stepper */}
                  <div className="admin-order-view-qty-stepper">
                    <button
                      type="button"
                      className="admin-order-view-stepper-btn minus"
                      onClick={() =>
                        updateQuantity(item.menu_item.id, item.portion, -1)
                      }
                    >
                      −
                    </button>
                    <span className="admin-order-view-stepper-val">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="admin-order-view-stepper-btn plus"
                      onClick={() =>
                        updateQuantity(item.menu_item.id, item.portion, 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <span className="admin-order-view-item-price">
                    ₹{itemTotal}
                  </span>

                  {/* Remove X Button */}
                  <button
                    type="button"
                    className="admin-order-view-item-remove"
                    onClick={() =>
                      removeFromCart(item.menu_item.id, item.portion)
                    }
                    title="Remove item"
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Subtotal & Total Box */}
        <div className="admin-order-view-totals-card">
          <div className="admin-order-view-totals-row subtotal">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="admin-order-view-totals-divider" />
          <div className="admin-order-view-totals-row grand-total">
            <span>Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Notes for the Kitchen */}
        <div className="admin-order-view-field-group">
          <label className="admin-order-view-notes-label">
            Notes for the Kitchen
          </label>
          <textarea
            className="admin-order-view-textarea"
            value={orderNotes || ''}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any concerns? e.g. less spicy, no sugar in tea, nut allergy..."
          />
        </div>

        {/* Floating Confirmation Pill: Order Sent to Kitchen 🔥 */}
        {orderSuccess && (
          <div className="admin-order-sent-badge">
            <span>Order Sent to Kitchen 🔥</span>
          </div>
        )}

        {/* Bottom Actions: Add Item & Place Order */}
        <div className="admin-order-view-actions-row">
          <button
            type="button"
            className="admin-order-view-add-item-btn"
            onClick={onClose}
          >
            Add Item
          </button>
          <button
            type="button"
            className="admin-order-view-place-order-btn"
            onClick={handlePlaceOrder}
            disabled={loading || cartItems.length === 0}
          >
            {loading ? 'Placing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminParcelOrderModal;
