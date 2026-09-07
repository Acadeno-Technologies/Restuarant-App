import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/ordersApi';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Calendar,
  ChevronDown,
  Trash2,
  FileText,
  X,
} from 'lucide-react';
import { UserAvatarPlaceholder } from '../../components/common/UserAvatarPlaceholder';
import { AdminBillModal } from '../../components/admin/AdminBillModal';
import { AdminDeleteModal } from '../../components/admin/AdminDeleteModal';
import '../../styles/admin.css';

export const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const { user, openProfile } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('today'); // 'today' | 'weekly' | 'monthly' | 'all' | 'custom'
  const [selectedDate, setSelectedDate] = useState('');
  const dateInputRef = useRef(null);

  const handleOpenDatePicker = (e) => {
    e?.preventDefault?.();
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch (err) {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } else {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredOrders.map((o) => o.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleDeleteClick = () => {
    if (!isDeleteMode) {
      setIsDeleteMode(true);
      return;
    }

    if (selectedOrderIds.length === 0) {
      setIsDeleteMode(false);
      return;
    }

    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedOrderIds.length === 0) return;

    setDeleting(true);
    try {
      await Promise.all(selectedOrderIds.map((id) => ordersApi.deleteOrder(id)));
      setSelectedOrderIds([]);
      setShowDeleteModal(false);
      setIsDeleteMode(false);
      await loadOrders();
    } catch (err) {
      console.error('Failed to delete orders:', err);
      alert('Failed to delete some orders. Please try again.');
      await loadOrders();
    } finally {
      setDeleting(false);
    }
  };

  // Helper date matchers
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && dateStr.includes('-') && dateStr.length === 10) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = parseLocalDate(dateString);
      if (!d || isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatOrderDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      const timeStr = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const dateStr = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `${timeStr} , ${dateStr}`;
    } catch {
      return '—';
    }
  };

  const formatOrderAmount = (amount) => {
    const num = parseFloat(amount || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  };

  const todayFormattedPill = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Filtered orders based on Time/Date Filter and Search
  const filteredOrders = orders.filter((o) => {
    // 1. Time / Date Filter
    if (selectedDate) {
      if (!o.created_at) return false;
      const orderDate = new Date(o.created_at);
      const sel = parseLocalDate(selectedDate);
      if (!sel || !isSameDay(orderDate, sel)) return false;
    } else if (timeFilter === 'today') {
      if (o.created_at) {
        const orderDate = new Date(o.created_at);
        const today = new Date();
        if (!isSameDay(orderDate, today)) return false;
      }
    } else if (timeFilter === 'weekly') {
      if (o.created_at) {
        const orderDate = new Date(o.created_at);
        const now = new Date();
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      }
    } else if (timeFilter === 'monthly') {
      if (o.created_at) {
        const orderDate = new Date(o.created_at);
        const now = new Date();
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 30 || diffDays < 0) return false;
      }
    }

    // 2. Search Query Filter
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
          <UserAvatarPlaceholder user={user} size={46} />
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
          MAIN OVERVIEW CARD: Filter Tabs + Orders Table / Empty State
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-orders-overview-card">
        <div className="admin-orders-overview-header">
          <h2 className="admin-orders-overview-title">Track your order records</h2>
          <p className="admin-orders-overview-desc">
            View and manage all past orders
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#78716C' }}>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State when no orders exist at all */
          <div className="admin-orders-empty-state">
            <div className="admin-orders-empty-icon-wrap">
              <img 
                src="/ordersection.png" 
                alt="Orders" 
                style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
              />
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
          <>
            {/* Filter Tabs & Date Filter Row */}
            <div className="admin-orders-filter-row">
              <div className="admin-orders-pill-tabs">
                <button
                  type="button"
                  className={`admin-orders-pill-tab ${timeFilter === 'today' && !selectedDate ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter('today');
                    setSelectedDate('');
                  }}
                >
                  Today's Orders
                </button>
                <button
                  type="button"
                  className={`admin-orders-pill-tab ${timeFilter === 'weekly' && !selectedDate ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter('weekly');
                    setSelectedDate('');
                  }}
                >
                  Weekly Orders
                </button>
                <button
                  type="button"
                  className={`admin-orders-pill-tab ${timeFilter === 'monthly' && !selectedDate ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter('monthly');
                    setSelectedDate('');
                  }}
                >
                  Monthly Orders
                </button>
              </div>

              <div className="admin-orders-filter-actions">
                <div className="admin-orders-date-pill-wrapper">
                  <button
                    type="button"
                    className={`admin-orders-date-pill ${selectedDate ? 'has-date' : ''}`}
                    onClick={handleOpenDatePicker}
                  >
                    <Calendar size={14} color={selectedDate ? '#FFFFFF' : '#78716C'} />
                    <span>{selectedDate ? formatDisplayDate(selectedDate) : todayFormattedPill}</span>
                    <ChevronDown size={14} color={selectedDate ? '#FFFFFF' : '#78716C'} />
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setTimeFilter('custom');
                    }}
                    className="admin-orders-hidden-date-input"
                  />
                  {selectedDate && (
                    <button
                      type="button"
                      className="admin-orders-date-clear-btn"
                      title="Clear date filter"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate('');
                        setTimeFilter('today');
                      }}
                    >
                      <X size={13} color="#78716C" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className={`admin-orders-trash-btn ${isDeleteMode ? 'active' : ''}`}
                  title={
                    !isDeleteMode
                      ? 'Delete orders (select)'
                      : selectedOrderIds.length > 0
                      ? `Delete ${selectedOrderIds.length} selected orders`
                      : 'Exit delete mode'
                  }
                  onClick={handleDeleteClick}
                  disabled={deleting}
                >
                  <Trash2 size={15} color={isDeleteMode ? '#FFFFFF' : '#EF4444'} strokeWidth={2} />
                  {selectedOrderIds.length > 0 && (
                    <span className="admin-orders-trash-badge">{selectedOrderIds.length}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Orders Table Container */}
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#78716C' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E1B18', marginBottom: '6px' }}>
                  No orders found for this period
                </p>
                <p style={{ fontSize: '12.5px', color: '#78716C', marginBottom: '14px' }}>
                  Try switching to Weekly/Monthly Orders or clearing the date filter.
                </p>
                <button
                  type="button"
                  className="admin-orders-pill-tab"
                  onClick={() => {
                    setSelectedDate('');
                    setTimeFilter('all');
                  }}
                >
                  View All Orders
                </button>
              </div>
            ) : (
              <div className="admin-orders-table-wrapper">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      {isDeleteMode && (
                        <th style={{ width: '48px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="admin-orders-checkbox"
                            checked={
                              filteredOrders.length > 0 &&
                              filteredOrders.every((o) => selectedOrderIds.includes(o.id))
                            }
                            onChange={handleToggleSelectAll}
                          />
                        </th>
                      )}
                      <th>ORDER ID</th>
                      <th>TABLE</th>
                      <th>TYPE</th>
                      <th>AMOUNT</th>
                      <th>DATE / TIME</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const isTakeaway = ord.order_type === 'takeaway' || (!ord.table && !ord.table_number);
                      const tableText = isTakeaway ? 'Parcel' : `Table ${ord.table_number || ord.table}`;
                      const typeText = isTakeaway ? 'Take away' : 'Dine In';
                      const amountStr = formatOrderAmount(ord.total_amount || ord.total || ord.subtotal || 0);
                      const dateStr = formatOrderDateTime(ord.created_at);
                      const isSelected = selectedOrderIds.includes(ord.id);

                      return (
                        <tr key={ord.id} className={isSelected ? 'is-selected' : ''}>
                          {isDeleteMode && (
                            <td style={{ width: '48px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                className="admin-orders-checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOrder(ord.id)}
                              />
                            </td>
                          )}
                          <td className="admin-orders-cell-id">#{ord.id}</td>
                          <td className="admin-orders-cell-table">{tableText}</td>
                          <td className="admin-orders-cell-type">{typeText}</td>
                          <td className="admin-orders-cell-amount">{amountStr}</td>
                          <td className="admin-orders-cell-datetime">{dateStr}</td>
                          <td>
                            <button
                              type="button"
                              className="admin-orders-view-btn"
                              onClick={() => setSelectedBillOrder(ord)}
                            >
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
          </>
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

      {/* Delete Confirmation Modal (Adapts for Delete All vs Delete Selected) */}
      {(() => {
        const isAllSelected =
          selectedOrderIds.length > 0 &&
          (selectedOrderIds.length === filteredOrders.length ||
            selectedOrderIds.length === orders.length);

        const modalTitle = isAllSelected ? 'Delete All Orders' : 'Delete Selected Orders';
        const modalDesc = isAllSelected ? (
          <>
            Warning: This action cannot be undone. All{' '}
            <strong>{selectedOrderIds.length} active orders</strong> and associated kitchen
            tickets will be permanently removed from today's system.
          </>
        ) : (
          <>
            Are you sure you want to permanently delete these orders?
            <br />
            This will immediately remove them from today's active service.
          </>
        );
        const confirmBtnText = isAllSelected
          ? `Delete All (${selectedOrderIds.length} Orders)`
          : `Delete (${selectedOrderIds.length} Order${selectedOrderIds.length > 1 ? 's' : ''})`;

        return (
          <AdminDeleteModal
            isOpen={showDeleteModal}
            onClose={() => !deleting && setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title={modalTitle}
            description={modalDesc}
            confirmText={confirmBtnText}
            cancelText="Cancel"
            isDeleting={deleting}
          />
        );
      })()}
    </div>
  );
};

export default AdminOrdersPage;


