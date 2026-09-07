import React, { useState, useEffect } from 'react';
import { kitchenApi } from '../../api/kitchenApi';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  ClipboardList, 
  RefreshCw, 
  Check, 
  X 
} from 'lucide-react';
import { UserAvatarPlaceholder } from '../../components/common/UserAvatarPlaceholder';

export const AdminKitchenPage = () => {
  const { user, openProfile } = useAuth();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Local state to track individually checked dishes per order { [orderId]: { [itemId]: boolean } }
  const [checkedItems, setCheckedItems] = useState({});

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await kitchenApi.getQueue();
      const list = data.results || data;
      if (Array.isArray(list)) {
        setQueue(list);
      }
    } catch (err) {
      console.error('Failed to load kitchen queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter active tickets
  const activeOrders = queue.filter((order) => {
    const isActive = ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status?.toLowerCase());
    if (!isActive) return false;
    if (!search.trim()) return true;

    const q = search.toLowerCase();
    const idMatch = String(order.id).includes(q);
    const tableMatch = String(order.table_number || order.table || '').toLowerCase().includes(q);
    const customerMatch = (order.customer_name || '').toLowerCase().includes(q);
    const typeMatch = (order.order_type || '').toLowerCase().includes(q);

    return idMatch || tableMatch || customerMatch || typeMatch;
  });

  // Toggle single item checked state
  const toggleItemDone = (orderId, itemId) => {
    setCheckedItems((prev) => {
      const orderChecks = prev[orderId] || {};
      return {
        ...prev,
        [orderId]: {
          ...orderChecks,
          [itemId]: !orderChecks[itemId],
        },
      };
    });
  };

  // Handle main action button click
  const handleActionClick = async (order, totalItems, doneCount) => {
    const isAllDone = totalItems > 0 && doneCount === totalItems;
    const status = (order.status || 'pending').toLowerCase();

    if (status === 'pending') {
      // Transition from Start Cooking -> Preparing
      try {
        await kitchenApi.markOrderPreparing(order.id);
        loadQueue();
      } catch (err) {
        alert('Failed to update order status');
      }
    } else if (isAllDone || status === 'preparing') {
      // Mark as Ready
      try {
        await kitchenApi.markOrderReady(order.id);
        loadQueue();
      } catch (err) {
        alert('Failed to mark order ready');
      }
    }
  };

  // Dismiss / close ticket
  const handleDismissTicket = (orderId) => {
    setQueue((prev) => prev.filter((o) => o.id !== orderId));
  };

  return (
    <div className="admin-kitchen-page-root">
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
          MAIN KITCHEN DISPLAY CARD
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-kitchen-overview-card">
        <div className="admin-kitchen-header">
          <h2 className="admin-kitchen-title">Kitchen Display</h2>
          <p className="admin-kitchen-desc">
            Manage orders and track preparation
          </p>
        </div>

        {loading && activeOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#78716C' }}>
            <p>Loading kitchen tickets...</p>
          </div>
        ) : activeOrders.length === 0 ? (
          /* Empty State */
          <div className="admin-kitchen-empty-state">
            <div className="admin-kitchen-empty-icon-wrap">
              <ClipboardList size={26} color="#9C8E84" />
            </div>
            <h3 className="admin-kitchen-empty-title">No Active Orders</h3>
            <p className="admin-kitchen-empty-desc">
              All caught up! New incoming kitchen orders will appear here in real-time.
            </p>
            <button
              type="button"
              className="admin-kitchen-refresh-btn"
              onClick={loadQueue}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        ) : (
          /* Active Kitchen Tickets Cards Matching Screenshot */
          <div className="admin-kitchen-cards-grid">
            {activeOrders.map((order) => {
              const isTakeaway = order.order_type === 'takeaway' || (!order.table && !order.table_number);
              const tableNumRaw = String(order.table_number || order.table || '').replace(/^Table\s*/i, '').replace(/^T\s*/i, '');
              const displayTitle = isTakeaway ? 'Parcel' : `T ${tableNumRaw || order.id}`;
              const items = order.items || [];
              const totalItems = items.length;

              // Calculate how many dishes are marked done
              const orderChecks = checkedItems[order.id] || {};
              const doneCount = items.filter((item, idx) => {
                const key = item.id || idx;
                return orderChecks[key] || item.status === 'ready' || order.status === 'ready';
              }).length;

              const isAllDone = totalItems > 0 && doneCount === totalItems;
              const status = (order.status || 'pending').toLowerCase();

              // Determine Button Variant & Label
              let btnClass = 'start-cooking';
              let btnLabel = 'Start Cooking';

              if (status === 'ready' || isAllDone) {
                btnClass = 'ready-to-serve';
                btnLabel = 'Ready to Serve';
              } else if (status === 'preparing' || doneCount > 0) {
                btnClass = 'preparing-order';
                btnLabel = 'Preparing Order';
              }

              return (
                <div key={order.id} className="admin-kds-card">
                  <div>
                    {/* Top Row: Title + Customer + Order ID + Close */}
                    <div className="admin-kds-card-header">
                      <div className="admin-kds-card-header-left">
                        <h3 className="admin-kds-card-title">{displayTitle}</h3>
                        {order.customer_name && (
                          <span className="admin-kds-card-customer">
                            by {order.customer_name}
                          </span>
                        )}
                      </div>
                      <div className="admin-kds-card-header-right">
                        <span className="admin-kds-order-num">#{order.id}</span>
                        <button
                          type="button"
                          className="admin-kds-close-btn"
                          onClick={() => handleDismissTicket(order.id)}
                          title="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Items Checklist */}
                    <div className="admin-kds-items-list">
                      {items.map((item, idx) => {
                        const key = item.id || idx;
                        const isDone = !!orderChecks[key] || item.status === 'ready' || status === 'ready';
                        const itemName = item.item_name || item.menu_item_name || 'Dish Item';
                        const portionStr = item.portion && item.portion !== 'Regular' ? ` (${item.portion})` : '';

                        return (
                          <div
                            key={key}
                            className="admin-kds-item-row"
                            onClick={() => toggleItemDone(order.id, key)}
                          >
                            <div className={`admin-kds-checkbox ${isDone ? 'checked' : ''}`}>
                              {isDone && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className={`admin-kds-item-qty ${isDone ? 'checked' : ''}`}>
                              {item.quantity}
                            </span>
                            <span className={`admin-kds-item-name ${isDone ? 'checked' : ''}`}>
                              {itemName}{portionStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    {/* Dishes Marked Done Summary */}
                    <div className="admin-kds-dishes-status">
                      {doneCount}/{totalItems} dishes marked done
                    </div>

                    {/* Bottom Action Button */}
                    <button
                      type="button"
                      className={`admin-kds-action-btn ${btnClass}`}
                      onClick={() => handleActionClick(order, totalItems, doneCount)}
                    >
                      {btnLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKitchenPage;
