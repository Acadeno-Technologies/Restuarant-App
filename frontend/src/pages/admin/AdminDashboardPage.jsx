import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';
import { tablesApi } from '../../api/tablesApi';
import { ordersApi } from '../../api/ordersApi';
import { analyticsApi } from '../../api/analyticsApi';
import { AdminTableCard } from '../../components/admin/AdminTableCard';
import { AddTableModal } from '../../components/admin/AddTableModal';
import { EditTableModal } from '../../components/admin/EditTableModal';
import { AdminBillModal } from '../../components/admin/AdminBillModal';
import { UserAvatarPlaceholder } from '../../components/common/UserAvatarPlaceholder';
import {
  Search,
  Plus,
  Grid,
  CheckSquare,
  User,
  Receipt,
  TrendingUp
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { user, openProfile } = useAuth();
  const { setSelectedTable } = useOrder();
  const navigate = useNavigate();

  // Data States (with instant cache for 0ms initial load)
  const [tables, setTables] = useState(() => {
    try {
      const cached = localStorage.getItem('admin_cached_tables');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('admin_cached_tables');
      return !(cached && JSON.parse(cached).length > 0);
    } catch {
      return true;
    }
  });

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Indoor', 'Outdoor'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [billModalTable, setBillModalTable] = useState(null);
  const [billModalOrder, setBillModalOrder] = useState(null);

  const handleOpenBillModal = (tbl, ord = null) => {
    const activeOrd = ord || activeOrders.find(
      (o) =>
        String(o.table) === String(tbl.id) ||
        String(o.table_number) === String(tbl.number)
    );
    setBillModalTable(tbl);
    setBillModalOrder(activeOrd || null);
  };

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const rawName = user?.first_name || user?.username || 'Admin';
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const prefix = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    return `${prefix} , ${name}`;
  };

  const loadDashboardData = async () => {
    // 1. Fetch tables quickly and render immediately without blocking
    tablesApi
      .getTables()
      .then((res) => {
        const loadedTables = res.results || res;
        if (Array.isArray(loadedTables)) {
          setTables(loadedTables);
          try {
            localStorage.setItem('admin_cached_tables', JSON.stringify(loadedTables));
          } catch { }
        }
      })
      .catch((err) => console.error('Failed to load tables:', err))
      .finally(() => setLoading(false));

    // 2. Fetch orders concurrently
    ordersApi
      .getOrders()
      .then((res) => {
        const loadedOrders = res.results || res;
        if (Array.isArray(loadedOrders)) {
          const active = loadedOrders.filter(
            (o) => o.status !== 'billed' && o.status !== 'cancelled'
          );
          setActiveOrders(active);
        }
      })
      .catch((err) => console.error('Failed to load orders:', err));

    // 3. Fetch summary concurrently
    analyticsApi
      .getDashboardSummary()
      .then((res) => {
        if (res) setSummary(res);
      })
      .catch((err) => console.error('Failed to load summary:', err));
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-sync dashboard every 8 seconds
    const interval = setInterval(loadDashboardData, 8000);
    const handleFocus = () => loadDashboardData();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Filter tables by Section & Search Query
  const filteredTables = tables.filter((table) => {
    const sec = (table.section || 'indoor').toLowerCase();
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Indoor' && sec.includes('indoor')) ||
      (activeFilter === 'Outdoor' && (sec.includes('outdoor') || sec.includes('terrace')));

    const tableNumStr = String(table.number || '').toLowerCase();
    const guestName = (table.active_reservation?.guest_name || table.guest_name || '').toLowerCase();
    const matchesSearch =
      !searchQuery ||
      tableNumStr.includes(searchQuery.toLowerCase()) ||
      table.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guestName.includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Sort tables numerically: T 1, T 2, T 3, T 4, T 5...
  const sortedFilteredTables = [...filteredTables].sort((a, b) => {
    const numA = parseInt(String(a.number).replace(/[^0-9]/g, ''), 10) || 0;
    const numB = parseInt(String(b.number).replace(/[^0-9]/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    return String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
  });

  // Calculate live metrics from fetched original data
  const totalTablesCount = tables.length;
  const availableCount = tables.filter((t) => (t.status || '').toLowerCase() === 'available').length;
  const occupiedCount = tables.filter((t) => (t.status || '').toLowerCase() === 'occupied').length;
  const billingCount = tables.filter((t) => (t.status || '').toLowerCase() === 'billing').length;

  const todaySales = summary?.today_revenue
    ? parseFloat(summary.today_revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : '0';

  const todayOrders = summary?.today_orders || summary?.today_bills_count || 0;

  // Table click handler
  const handleTableClick = (table) => {
    const status = (table.status || 'available').toLowerCase();
    if (status === 'no_service' || status === 'inactive') {
      // Table is deactivated: prevent starting/placing orders
      return;
    }
    setSelectedTable(table);

    if (status === 'billing') {
      navigate('/admin/orders', { state: { targetTableId: table.id, targetTableNumber: table.number } });
    } else if (status === 'occupied') {
      navigate('/admin/orders', { state: { targetTableId: table.id } });
    } else {
      navigate('/admin/orders');
    }
  };

  const handleToggleTableService = async (table) => {
    const rawStatus = (table.status || '').toLowerCase();
    const isCurrentlyInactive = rawStatus === 'no_service' || rawStatus === 'inactive';
    const newStatus = isCurrentlyInactive ? 'available' : 'no_service';

    // Optimistically update UI immediately so user sees the change with 0 latency
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, status: newStatus } : t))
    );

    try {
      await tablesApi.updateStatus(table.id, newStatus);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to toggle table status via updateStatus:', err);
      try {
        await tablesApi.updateTable(table.id, {
          number: table.number,
          name: table.name,
          capacity: table.capacity,
          section: table.section || 'indoor',
          status: newStatus,
        });
        await loadDashboardData();
      } catch (err2) {
        console.error('Failed to update table status:', err2);
        // Revert on error
        setTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, status: table.status } : t))
        );
        alert(err2.response?.data?.error || err2.response?.data?.detail || err2.message || 'Failed to update table status');
      }
    }
  };

  const handleTableUpdated = (updatedTable) => {
    if (updatedTable && updatedTable.id) {
      setTables((prev) =>
        prev.map((t) => (t.id === updatedTable.id ? { ...t, ...updatedTable } : t))
      );
    }
    loadDashboardData();
  };

  const handleTableCreated = (newTable) => {
    if (newTable && newTable.id) {
      setTables((prev) => [...prev, newTable]);
    }
    loadDashboardData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* ═══════════════════════════════════════════════════════════════
          TOP HEADER ROW: Welcome Greeting + Search + Bell + Avatar
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-top-header">
        <div className="admin-top-greeting">
          <h1>{getGreeting()}</h1>
          <p>Your floor. Your control. Everything at a glance.</p>
        </div>

        <div className="admin-top-actions">
          {/* Search Bar with Circle Button */}
          <div className="admin-search-pill">
            <input
              type="text"
              placeholder="Search......"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="button" className="admin-search-icon-btn" title="Search">
              <Search size={18} color="#FFFFFF" strokeWidth={2.1} />
            </button>
          </div>

          {/* Notification Bell */}
          <div className="admin-bell-circle" title="Notifications">
            <img src="/Bell.svg" alt="Notifications" style={{ width: '21px', height: '21px', objectFit: 'contain' }} />
          </div>

          {/* Admin Profile Avatar */}
          <div
            className="admin-profile-circle-btn"
            onClick={openProfile}
            title="Admin Profile"
            style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <UserAvatarPlaceholder user={user} size={46} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          6 COMPACT STATISTIC CARDS (1 ROW ON DESKTOP)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-stats-row">
        {/* 1. Total Tables */}
        <div className="admin-stat-item accent-purple">
          <div className="admin-stat-icon-box purple">
            <img src='/card1.png' alt='' />
          </div>
          <div className="admin-stat-num">{totalTablesCount}</div>
          <div className="admin-stat-label purple">Total Tables</div>
          <div className="admin-stat-sub">All tables in the restaurant</div>
        </div>

        {/* 2. Available Tables */}
        <div className="admin-stat-item accent-green">
          <div className="admin-stat-icon-box green">
            <img src='/card2.png' alt='' />
          </div>
          <div className="admin-stat-num">{availableCount}</div>
          <div className="admin-stat-label green">Available Tables</div>
          <div className="admin-stat-sub">Ready for guests</div>
        </div>

        {/* 3. Occupied Tables */}
        <div className="admin-stat-item accent-red">
          <div className="admin-stat-icon-box red">
            <img src='/card3.png' alt='' />
          </div>
          <div className="admin-stat-num">{occupiedCount}</div>
          <div className="admin-stat-label red">Occupied Tables</div>
          <div className="admin-stat-sub">Currently in use</div>
        </div>

        {/* 4. Billing Pending */}
        <div className="admin-stat-item accent-amber">
          <div className="admin-stat-icon-box amber">
            <img src='/card4.png' alt='' />
          </div>
          <div className="admin-stat-num">{billingCount}</div>
          <div className="admin-stat-label amber">Billing Pending</div>
          <div className="admin-stat-sub">Waiting for payment</div>
        </div>

        {/* 5. Today's Sales */}
        <div className="admin-stat-item accent-blue">
          <div className="admin-stat-icon-box blue">
            <img src='/card5.png' alt='' />
          </div>
          <div className="admin-stat-num">₹ {todaySales}</div>
          <div className="admin-stat-label blue">Today's Sales</div>
          <div className="admin-stat-sub">Total sales today</div>
        </div>

        {/* 6. Today's Orders */}
        <div className="admin-stat-item accent-teal">
          <div className="admin-stat-icon-box teal">
            <img src='/card6.png' alt='' />

          </div>
          <div className="admin-stat-num">{todayOrders}</div>
          <div className="admin-stat-label teal">Today's Orders</div>
          <div className="admin-stat-sub">Total orders today</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM CARD: Table Overview + Filters / Empty State
      ═══════════════════════════════════════════════════════════════ */}
      <section className="admin-portal-card admin-overview-card">
        {/* Header: Title + Controls (controls shown when tables exist) */}
        <div className="admin-overview-header">
          <div className="admin-overview-title">
            <h2>Table Overview</h2>
            <p>Tap a table to view or start an order</p>
          </div>

          {tables.length > 0 && (
            <div className="admin-overview-controls">
              {/* Filter Pills */}
              <div className="admin-filter-pill-container">
                {['All', 'Indoor', 'Outdoor'].map((filterName) => (
                  <button
                    key={filterName}
                    type="button"
                    className={`admin-filter-pill-btn ${activeFilter === filterName ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filterName)}
                  >
                    {filterName}
                  </button>
                ))}
              </div>

              {/* + Add New Table Button */}
              <button
                type="button"
                className="admin-add-table-pill"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add New Table</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Conditional Rendering: Empty State vs Tables Grid ── */}
        {tables.length === 0 ? (
          <div className="admin-table-empty-container">
            <div className="admin-table-empty-icon-circle">
              <img
                src="/admin-empty.png"
                alt="No tables added"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              />
            </div>
            <h3 className="admin-table-empty-heading">No tables added yet</h3>
            <p className="admin-table-empty-desc">
              Start setting up your restaurant floor by adding your first table. You can assign seats and locations.
            </p>
            <button
              type="button"
              className="admin-table-empty-btn"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add New Table</span>
            </button>
          </div>
        ) : sortedFilteredTables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#756B66' }}>
            <h3>No tables found in this section</h3>
            <p>Click "+ Add New Table" to create a new dining table.</p>
          </div>
        ) : (
          <div className="admin-table-grid">
            {sortedFilteredTables.map((table) => {
              const activeOrd = activeOrders.find(
                (o) =>
                  String(o.table) === String(table.id) ||
                  String(o.table_number) === String(table.number)
              );

              return (
                <AdminTableCard
                  key={table.id}
                  table={table}
                  activeOrder={activeOrd}
                  onClick={handleTableClick}
                  onEdit={(tbl) => setEditingTable(tbl)}
                  onToggleService={handleToggleTableService}
                  onDelete={handleToggleTableService}
                  onPrint={(tbl) => handleOpenBillModal(tbl, activeOrd)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ── Modals ── */}
      <AddTableModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTableCreated={handleTableCreated}
      />

      <EditTableModal
        isOpen={Boolean(editingTable)}
        table={editingTable}
        onClose={() => setEditingTable(null)}
        onTableUpdated={handleTableUpdated}
      />

      <AdminBillModal
        isOpen={Boolean(billModalTable)}
        table={billModalTable}
        activeOrder={billModalOrder}
        onClose={() => {
          setBillModalTable(null);
          setBillModalOrder(null);
        }}
        onBillSettled={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
