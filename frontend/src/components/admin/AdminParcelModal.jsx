import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import { ordersApi } from '../../api/ordersApi';
import { AdminBillModal } from './AdminBillModal';

/**
 * Format ISO datetime string to 12-hour time format (e.g. "12:45 PM")
 */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * AdminParcelModal
 *
 * Exact replica of the "Active Parcels" modal:
 * - Clean white card with rounded 28px corners
 * - Search bar with rounded pill shape
 * - List of active takeaway/parcel orders with peach bag icon, customer name, timestamp, and "View" button
 * - Clicking "View" opens the exact Bill & Settle modal for that parcel order
 */
export const AdminParcelModal = ({ isOpen, onClose, onViewBill, onOrderCreated }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [billModalOrder, setBillModalOrder] = useState(null);

  const loadParcelOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getOrders({ order_type: 'takeaway' });
      const list = res.results || res;
      if (Array.isArray(list)) {
        setOrders(list);
      }
    } catch (err) {
      console.error('Failed to load parcel orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadParcelOrders();
      setBillModalOrder(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Active parcel orders (not settled/cancelled)
  const activeOrders = orders.filter(
    (o) => o.status !== 'billed' && o.status !== 'cancelled'
  );

  // Filter by search query
  const filteredOrders = activeOrders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = (o.customer_name || '').toLowerCase().includes(query);
    const idMatch = String(o.id).includes(query);
    const itemMatch = (o.items || []).some((item) =>
      (item.item_name || item.menu_item_name || '').toLowerCase().includes(query)
    );
    return nameMatch || idMatch || itemMatch;
  });

  return (
    <>
      <div className="admin-active-parcels-overlay" onClick={onClose}>
        <div
          className="admin-active-parcels-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="admin-active-parcels-header">
            <h2 className="admin-active-parcels-title">Active Parcels</h2>
            <button
              type="button"
              className="admin-active-parcels-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="admin-active-parcels-search-wrap">
            <Search size={16} className="admin-active-parcels-search-icon" />
            <input
              type="text"
              className="admin-active-parcels-search-input"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Active Parcels List */}
          <div className="admin-active-parcels-list">
            {loading ? (
              <div className="admin-active-parcels-empty">
                <RefreshCw size={24} className="spin-icon" color="#78350F" />
                <p>Loading active parcels...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="admin-active-parcels-empty">
                <div className="admin-active-parcels-empty-icon">
                  <ShoppingBag size={32} color="#9CA3AF" />
                </div>
                <h4>No active parcel orders found</h4>
                <p>When new takeaway or parcel orders are placed, they will appear here.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="admin-active-parcel-row">
                  {/* Left Peach Shopping Bag Icon */}
                  <div className="admin-active-parcel-icon-box">
                    <img
                      src="/parcel.svg"
                      alt="Parcel"
                      className="admin-active-parcel-icon-img"
                    />
                  </div>

                  {/* Center Customer Name & Time */}
                  <div className="admin-active-parcel-info">
                    <div className="admin-active-parcel-name">
                      {order.customer_name || `Parcel Order #${order.id}`}
                    </div>
                    <div className="admin-active-parcel-time">
                      {formatTime(order.created_at)}
                    </div>
                  </div>

                  {/* Right View Button: Opens Bill Modal */}
                  <button
                    type="button"
                    className="admin-active-parcel-view-btn"
                    onClick={() => {
                      if (onViewBill) {
                        onViewBill(order);
                      } else {
                        setBillModalOrder(order);
                      }
                    }}
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bill & Settlement Modal for the selected Parcel Order */}
      {billModalOrder && (
        <AdminBillModal
          isOpen={!!billModalOrder}
          table={null}
          order={billModalOrder}
          onClose={() => setBillModalOrder(null)}
          onBillSettled={() => {
            setBillModalOrder(null);
            loadParcelOrders();
            if (onOrderCreated) onOrderCreated();
          }}
        />
      )}
    </>
  );
};

export default AdminParcelModal;
