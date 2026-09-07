import React, { useState, useEffect } from 'react';
import { kitchenApi } from '../api/kitchenApi';
import { ChefHat, Clock, CheckCircle2, AlertCircle, RefreshCw, Flame } from 'lucide-react';

export const KitchenPage = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, all

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await kitchenApi.getQueue();
      setQueue(data.results || data);
    } catch (err) {
      console.error('Failed to load kitchen queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleOrderPreparing = async (orderId) => {
    try {
      await kitchenApi.markOrderPreparing(orderId);
      loadQueue();
    } catch (err) {
      alert('Failed to mark order as preparing');
    }
  };

  const handleOrderReady = async (orderId) => {
    try {
      await kitchenApi.markOrderReady(orderId);
      loadQueue();
    } catch (err) {
      alert('Failed to mark order as ready');
    }
  };

  const handleItemStatusChange = async (itemId, newStatus) => {
    try {
      await kitchenApi.updateKitchenItemStatus(itemId, newStatus);
      loadQueue();
    } catch (err) {
      alert('Failed to update kitchen item');
    }
  };

  const filteredOrders = queue.filter((order) => {
    if (filter === 'active') {
      return ['pending', 'confirmed', 'preparing'].includes(order.status);
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Kitchen Display System (KDS)</h1>
          <p>Live kitchen order tickets & preparation status updates</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('active')}
          >
            Active Tickets ({queue.filter(o => ['pending','preparing'].includes(o.status)).length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Tickets
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadQueue}>
            <RefreshCw size={14} /> Refresh Queue
          </button>
        </div>
      </div>

      {loading && queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading kitchen tickets...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <ChefHat size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No active orders in kitchen queue!</h3>
          <p>New incoming orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredOrders.map((order) => {
            const createdDate = new Date(order.created_at);
            const elapsedMins = Math.floor((new Date() - createdDate) / (1000 * 60));

            return (
              <div 
                key={order.id} 
                className="glass-card" 
                style={{
                  borderLeft: order.status === 'preparing' 
                    ? '4px solid var(--accent-amber)' 
                    : order.status === 'ready' 
                    ? '4px solid var(--status-success)' 
                    : '4px solid var(--status-danger)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem' }}>Order #{order.id}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                      {order.table ? `Table ${String(order.table).replace(/^Table\s*/i, '').replace(/^T/i, '').replace(/[-_\s]/g, '') || '1'}` : (order.order_type || '').toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span className={`badge ${order.status === 'preparing' ? 'badge-amber' : order.status === 'ready' ? 'badge-green' : 'badge-red'}`}>
                      {order.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={12} /> {elapsedMins}m ago
                    </span>
                  </div>
                </div>

                {order.customer_name && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Customer: {order.customer_name}
                  </div>
                )}

                {(order.kitchen_notes || order.notes) && (
                  <div style={{
                    fontSize: '0.82rem',
                    color: '#92400E',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    fontWeight: 600
                  }}>
                    📝 Kitchen Note: {order.kitchen_notes || order.notes}
                  </div>
                )}

                {/* Items List */}
                <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', margin: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {order.items?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 700, marginRight: '0.5rem', color: 'var(--accent-amber)' }}>
                          {item.quantity}x
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          {item.item_name || item.menu_item_name}
                        </span>
                        {item.portion && item.portion !== 'Full' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                            ({item.portion})
                          </span>
                        )}
                        {item.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--status-warning)', fontStyle: 'italic' }}>
                            Note: {item.notes}
                          </div>
                        )}
                      </div>

                      <select
                        className="form-select"
                        style={{ width: '100px', padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                        value={item.status}
                        onChange={(e) => handleItemStatusChange(item.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Order level status actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {order.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleOrderPreparing(order.id)}>
                      <Flame size={14} /> Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%', borderColor: 'var(--status-success)', color: 'var(--status-success)' }} onClick={() => handleOrderReady(order.id)}>
                      <CheckCircle2 size={14} /> Mark Order Ready
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
