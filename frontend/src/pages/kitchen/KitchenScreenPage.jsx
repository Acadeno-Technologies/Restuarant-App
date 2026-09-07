import React, { useState, useEffect } from 'react';
import { kitchenApi } from '../../api/kitchenApi';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Bell, 
  Check, 
  X, 
  ChefHat, 
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import '../../styles/kitchenScreen.css';

export const KitchenScreenPage = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedOrderIds, setDismissedOrderIds] = useState(new Set());

  // Fetch live kitchen queue from backend
  const loadQueue = async () => {
    try {
      const data = await kitchenApi.getQueue();
      const loaded = data.results || data;
      if (Array.isArray(loaded)) {
        setQueue(loaded);
      }
    } catch (err) {
      console.error('Failed to load kitchen queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();

    // Auto-sync live kitchen tickets every 10 seconds (only when tab is visible)
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadQueue();
      }
    }, 10000);

    const handleFocus = () => {
      if (!document.hidden) loadQueue();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Toggle individual item completion (checked/unchecked)
  const handleToggleItem = async (orderId, itemId, currentStatus) => {
    const isCompleted = currentStatus === 'ready';
    const newStatus = isCompleted ? 'pending' : 'ready';

    // 1. Optimistic local update for instant UI feedback
    setQueue((prevQueue) =>
      prevQueue.map((order) => {
        if (order.id !== orderId) return order;

        const updatedItems = (order.items || []).map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item
        );

        const totalItems = updatedItems.length;
        const readyItemsCount = updatedItems.filter((i) => i.status === 'ready').length;

        let newOrderStatus = order.status;
        if (readyItemsCount === totalItems && totalItems > 0) {
          newOrderStatus = 'ready';
        } else if (readyItemsCount > 0) {
          newOrderStatus = 'preparing';
        } else if (newOrderStatus === 'ready') {
          newOrderStatus = 'preparing';
        }

        return {
          ...order,
          items: updatedItems,
          status: newOrderStatus,
        };
      })
    );

    // 2. Call backend API to persist
    try {
      await kitchenApi.updateKitchenItemStatus(itemId, newStatus);
    } catch (err) {
      console.error('Failed to update kitchen item status:', err);
      // Fallback reload if API failed
      loadQueue();
    }
  };

  // Action button clicks: Start Cooking, Preparing, or Ready to Serve
  const handleActionButton = async (order) => {
    const items = order.items || [];
    const doneCount = items.filter((i) => i.status === 'ready').length;
    const isAllDone = doneCount === items.length && items.length > 0;

    try {
      if (isAllDone || order.status === 'ready') {
        // Mark whole order as ready
        await kitchenApi.markOrderReady(order.id);
        loadQueue();
      } else if (doneCount === 0 || order.status === 'pending' || order.status === 'placed') {
        // Start Cooking -> transition to preparing
        await kitchenApi.markOrderPreparing(order.id);
        // Optimistically set order status to preparing
        setQueue((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: 'preparing' } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update order action:', err);
    }
  };

  // Dismiss a ticket temporarily from view
  const handleDismissCard = (orderId) => {
    setDismissedOrderIds((prev) => new Set([...prev, orderId]));
  };

  // Filter orders by search query and active status
  const filteredOrders = queue
    .filter((order) => !dismissedOrderIds.has(order.id))
    .filter((order) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const tableNum = String(order.table_number || order.table_name || order.table || '').toLowerCase();
      const formattedTable = `t-${tableNum.replace(/^t\s*-?\s*/i, '')}`;
      const orderIdStr = String(order.id);
      const orderIdWithHash = `#${order.id}`;
      const customer = (order.customer_name || '').toLowerCase();
      const orderType = (order.order_type || '').toLowerCase();
      const matchesDish = (order.items || []).some((item) =>
        (item.menu_item_name || '').toLowerCase().includes(q)
      );

      return (
        tableNum.includes(q) ||
        formattedTable.includes(q) ||
        orderIdStr.includes(q) ||
        orderIdWithHash.includes(q) ||
        customer.includes(q) ||
        orderType.includes(q) ||
        matchesDish
      );
    });

  // Helper to format table / parcel display title
  const getCardHeaderTitle = (order) => {
    const isParcel =
      order.order_type === 'takeaway' ||
      order.order_type === 'parcel' ||
      order.order_type === 'delivery' ||
      !order.table;

    if (isParcel) {
      return {
        isParcel: true,
        title: 'Parcel',
        customer: order.customer_name ? `by ${order.customer_name}` : '',
      };
    }

    const rawNum = String(order.table_number || order.table_name || order.table || '1')
      .replace(/^Table\s*/i, '')
      .replace(/^T\s*-?\s*/i, '')
      .trim();

    return {
      isParcel: false,
      title: `T-${rawNum || '1'}`,
      customer: order.customer_name ? `by ${order.customer_name}` : '',
    };
  };

  return (
    <>
      {/* ── Top Header with Search and Profile ── */}
      <header className="kitchen-portal-header">
        <div className="kitchen-search-bar">
          <input
            type="text"
            className="kitchen-search-input"
            placeholder="Search......"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="kitchen-search-btn" type="button" aria-label="Search">
            <Search size={17} strokeWidth={2.5} />
          </button>
        </div>

        <div className="kitchen-header-actions">
          <button
            className="kitchen-header-icon-btn"
            type="button"
            title="Notifications"
            onClick={loadQueue}
          >
            <img
              src="/Bell.svg"
              alt="Notifications"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </button>

          <button
            className="kitchen-header-avatar-btn"
            type="button"
            title={user?.username || 'Kitchen Staff'}
          >
            <img
              src="/profile.svg"
              alt="Profile"
              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
            />
          </button>
        </div>
      </header>

      {/* ── Main Kitchen Display Container ── */}
      <div className="kitchen-display-container">
        <div className="kitchen-display-header">
          <h1 className="kitchen-display-title">Kitchen Display</h1>
          <p className="kitchen-display-subtitle">Manage orders and track preparation</p>
        </div>

        {/* ── Order Cards Grid ── */}
        {loading && queue.length === 0 ? (
          <div className="kitchen-empty-queue">
            <RefreshCw className="kitchen-empty-icon animate-spin" />
            <h3 className="kitchen-empty-title">Loading Kitchen Tickets...</h3>
            <p className="kitchen-empty-sub">Connecting to live order queue</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="kitchen-empty-queue">
            <ChefHat className="kitchen-empty-icon" />
            <h3 className="kitchen-empty-title">No Active Kitchen Orders</h3>
            <p className="kitchen-empty-sub">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : 'All kitchen tickets are clear! New incoming orders will appear here live.'}
            </p>
          </div>
        ) : (
          <div className="kitchen-cards-grid">
            {filteredOrders.map((order) => {
              const header = getCardHeaderTitle(order);
              const items = order.items || [];
              const totalDishes = items.length;
              const doneDishes = items.filter((i) => i.status === 'ready').length;
              const isAllDone = doneDishes === totalDishes && totalDishes > 0;
              const isPartiallyDone = doneDishes > 0 && doneDishes < totalDishes;

              // Determine button state and label
              let btnClass = 'btn-start';
              let btnLabel = 'Start Cooking';

              if (isAllDone || order.status === 'ready') {
                btnClass = 'btn-ready';
                btnLabel = 'Ready to Serve';
              } else if (isPartiallyDone || order.status === 'preparing') {
                btnClass = 'btn-preparing';
                btnLabel = 'Preparing Order';
              }

              return (
                <div key={order.id} className="kitchen-order-card">
                  {/* Card Header: Table Number / Parcel + Order # + Close */}
                  <div>
                    <div className="kitchen-card-header">
                      <div className="kitchen-card-title-group">
                        <h2 className="kitchen-card-table-title">{header.title}</h2>
                        {header.customer && (
                          <span className="kitchen-card-customer-name">
                            {header.customer}
                          </span>
                        )}
                      </div>

                      <div className="kitchen-card-meta">
                        <span className="kitchen-card-order-num">#{order.id}</span>
                        <button
                          type="button"
                          className="kitchen-card-close-btn"
                          title="Dismiss Card"
                          onClick={() => handleDismissCard(order.id)}
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Dishes List with Checkboxes */}
                    <div className="kitchen-dishes-list">
                      {items.map((item) => {
                        const isDone = item.status === 'ready';
                        const portionStr = item.portion ? ` (${item.portion})` : '';

                        return (
                          <div
                            key={item.id}
                            className="kitchen-dish-item"
                            onClick={() => handleToggleItem(order.id, item.id, item.status)}
                          >
                            <div
                              className={`kitchen-checkbox ${isDone ? 'checked' : 'unchecked'}`}
                            >
                              {isDone && <Check size={12} strokeWidth={3} />}
                            </div>

                            <div className="kitchen-dish-text-wrapper">
                              <span className={`kitchen-dish-qty ${isDone ? 'checked' : 'unchecked'}`}>
                                {item.quantity}
                              </span>
                              <span className={`kitchen-dish-name ${isDone ? 'checked' : 'unchecked'}`}>
                                {item.menu_item_name}
                                <span className="kitchen-dish-portion">{portionStr}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer: Progress text & 3-state Action Button */}
                  <div className="kitchen-card-footer">
                    <p className="kitchen-card-progress-text">
                      {doneDishes}/{totalDishes} dishes marked done
                    </p>

                    <button
                      type="button"
                      className={`kitchen-card-action-btn ${btnClass}`}
                      onClick={() => handleActionButton(order)}
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
    </>
  );
};

export default KitchenScreenPage;
