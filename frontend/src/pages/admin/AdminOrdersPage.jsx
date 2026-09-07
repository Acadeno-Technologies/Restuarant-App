import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/ordersApi';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Armchair,
  CheckSquare,
  User,
  IndianRupee,
  FileText,
  Eye
} from 'lucide-react';
import { UserAvatarPlaceholder } from '../../components/common/UserAvatarPlaceholder';
import { AdminBillModal } from '../../components/admin/AdminBillModal';

export const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const { user, openProfile } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getOrders();
      const list = res.results || res;
      if (Array.isArray(list)) {
        setOrders(list);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filtered orders based on search query
  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const idMatch = String(o.id).includes(q);
    const tableMatch = String(o.table_number || o.table || '').toLowerCase().includes(q);
    const nameMatch = (o.customer_name || '').toLowerCase().includes(q);
    const typeMatch = (o.order_type || '').toLowerCase().includes(q);
    return idMatch || tableMatch || nameMatch || typeMatch;
  });

  // Calculate Metric Stats
  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter((o) =>
    ['billed', 'completed', 'served'].includes(o.status?.toLowerCase())
  ).length;
  const canceledOrdersCount = orders.filter((o) =>
    ['cancelled', 'canceled'].includes(o.status?.toLowerCase())
  ).length;
  const totalRevenue = orders
    .filter((o) => ['billed', 'completed'].includes(o.status?.toLowerCase()) || o.is_paid)
    .reduce((sum, o) => sum + parseFloat(o.total_amount || o.total || o.subtotal || 0), 0);

  return (
    <div className="admin-orders-page-root">
      {/* ═══════════════════════════════════════════════════════════════
          TOP HEADER ROW: Search Pill + Bell + Avatar
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-menu-top-header">
        <div className="admin-search-pill" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search......"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="admin-search-icon-btn" title="Search">
            <Search size={20} color="#FFFFFF" strokeWidth={2.5} />
          </button>
        </div>

        {/* Notification Bell */}
        <div className="admin-bell-circle" title="Notifications">
          <img src="/Bell.svg" alt="Notifications" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
        </div>

        {/* Admin Profile Avatar */}
        <div
          className="admin-profile-circle-btn"
          onClick={openProfile}
          title="Admin Profile"
        >
          <UserAvatarPlaceholder user={user} size={42} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          4 METRIC STATS CARDS GRID (Exact Reference Style)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-orders-metrics-grid">
        {/* 1. Total Orders */}
        <div className="admin-stat-item accent-purple">
          <div className="admin-stat-icon-box purple">
            <img src="/order-card.svg" alt="Total Orders" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
          </div>
          <div className="admin-stat-num">{totalOrdersCount}</div>
          <div className="admin-stat-label purple">Total Orders</div>
          <div className="admin-stat-sub">All tables in the restaurant</div>
        </div>

        {/* 2. Completed Orders */}
        <div className="admin-stat-item accent-green">
          <div className="admin-stat-icon-box green">
            <img src="/order-card1.svg" alt="Completed Orders" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
          </div>
          <div className="admin-stat-num">{completedOrdersCount}</div>
          <div className="admin-stat-label green">Completed Orders</div>
          <div className="admin-stat-sub">Ready for guests</div>
        </div>

        {/* 3. Canceled Orders */}
        <div className="admin-stat-item accent-red">
          <div className="admin-stat-icon-box red">
            <img src="/ordercardcancel.svg" alt="Canceled Orders" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
          </div>
          <div className="admin-stat-num">{canceledOrdersCount}</div>
          <div className="admin-stat-label red">Canceled Orders</div>
          <div className="admin-stat-sub">Currently in use</div>
        </div>

        {/* 4. Total Revenue */}
        <div className="admin-stat-item accent-blue">
          <div className="admin-stat-icon-box blue">
            <img src="/order-card4.svg" alt="Total Revenue" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
          </div>
          <div className="admin-stat-num">₹ {Math.round(totalRevenue)}</div>
          <div className="admin-stat-label blue">Total Revenue</div>
          <div className="admin-stat-sub">Total sales today</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN OVERVIEW CARD: Empty State or Orders Table
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-orders-overview-card">
        <div className="admin-orders-overview-header">
          <h2 className="admin-orders-overview-title">Menu Catalogue Overview</h2>
          <p className="admin-orders-overview-desc">
            Manage your menu items, categories, pricing, and availability
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#78716C' }}>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State Matching Screenshot */
          <div className="admin-orders-empty-state">
            <div className="admin-orders-empty-icon-wrap">
              <FileText size={26} color="#9C8E84" />
            </div>
            <h3 className="admin-orders-empty-title">No Orders Yet</h3>
            <p className="admin-orders-empty-desc">
              There are no active or previous orders recorded. New incoming orders will appear here in real-time.
            </p>
            <button
              type="button"
              className="admin-orders-empty-create-btn"
              onClick={() => navigate('/admin/menu')}
            >
              + Create Order
            </button>
          </div>
        ) : (
          /* Orders Table */
          <div className="admin-orders-table-wrapper">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Type / Table</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const isTakeaway = ord.order_type === 'takeaway' || (!ord.table && !ord.table_number);
                  const total = parseFloat(ord.total_amount || ord.total || ord.subtotal || 0);
                  const dateStr = ord.created_at
                    ? new Date(ord.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                    : '—';

                  return (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 700 }}>#{ord.id}</td>
                      <td>
                        {isTakeaway ? (
                          <span style={{ color: '#D97706', fontWeight: 600 }}>📦 Parcel</span>
                        ) : (
                          <span style={{ color: '#2563EB', fontWeight: 600 }}>
                            🍽️ Table {ord.table_number || ord.table}
                          </span>
                        )}
                      </td>
                      <td>{ord.customer_name || 'Walk-in Guest'}</td>
                      <td>{ord.items?.length || 0} items</td>
                      <td style={{ fontWeight: 700 }}>₹{total.toFixed(2)}</td>
                      <td>
                        <span
                          className={`admin-active-parcel-status-badge status-${ord.status}`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td style={{ color: '#78716C', fontSize: '12.5px' }}>{dateStr}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-orders-view-btn"
                          onClick={() => setSelectedBillOrder(ord)}
                        >
                          <Eye size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill & Settlement Modal when viewing an order */}
      {selectedBillOrder && (
        <AdminBillModal
          isOpen={!!selectedBillOrder}
          table={null}
          order={selectedBillOrder}
          onClose={() => setSelectedBillOrder(null)}
          onBillSettled={() => {
            setSelectedBillOrder(null);
            loadOrders();
          }}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
