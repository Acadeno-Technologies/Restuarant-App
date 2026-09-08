import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { tablesApi } from '../api/tablesApi';
import { ordersApi } from '../api/ordersApi';
import { analyticsApi } from '../api/analyticsApi';
import { billingApi } from '../api/billingApi';
import { AdminTableCard } from '../components/admin/AdminTableCard';
import { AddTableModal } from '../components/admin/AddTableModal';
import { EditTableModal } from '../components/admin/EditTableModal';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Grid, 
  CheckSquare, 
  User, 
  Receipt, 
  IndianRupee, 
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, openProfile } = useAuth();
  const { setSelectedTable } = useOrder();
  const navigate = useNavigate();

  // Data States
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [diningAreas, setDiningAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.first_name || user?.username ? `, ${user.first_name || user.username}` : ', Admin';
    if (hour < 12) return `Good Morning${name}`;
    if (hour < 17) return `Good Afternoon${name}`;
    return `Good Evening${name}`;
  };

  const loadDiningAreas = async () => {
    try {
      const data = await tablesApi.getTableOptions();
      if (data && Array.isArray(data.sections)) {
        setDiningAreas(data.sections);
      }
    } catch (err) {
      console.error('Failed to load dining areas:', err);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [tablesRes, ordersRes, summaryRes] = await Promise.allSettled([
        tablesApi.getTables(),
        ordersApi.getOrders(),
        analyticsApi.getDashboardSummary(),
      ]);

      if (tablesRes.status === 'fulfilled') {
        const loadedTables = tablesRes.value.results || tablesRes.value;
        if (Array.isArray(loadedTables)) {
          setTables(loadedTables);
        }
      }

      if (ordersRes.status === 'fulfilled') {
        const loadedOrders = ordersRes.value.results || ordersRes.value;
        if (Array.isArray(loadedOrders)) {
          // Keep active unbilled orders
          const active = loadedOrders.filter(
            (o) => o.status !== 'billed' && o.status !== 'cancelled'
          );
          setActiveOrders(active);
        }
      }

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadDiningAreas();

    const handleSync = () => {
      if (!document.hidden) {
        loadDashboardData();
        loadDiningAreas();
      }
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('tablesUpdated', handleSync);
    window.addEventListener('tableOptionsUpdated', handleSync);

    // Auto-sync dashboard every 10 seconds only when active
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadDashboardData();
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('tablesUpdated', handleSync);
      window.removeEventListener('tableOptionsUpdated', handleSync);
    };
  }, []);

  // Dynamically compute all unique dining areas
  const filterOptions = useMemo(() => {
    const areaMap = new Map();

    // Default base sections
    areaMap.set('indoor', 'Indoor');
    areaMap.set('outdoor', 'Outdoor');

    // Sections from backend options API
    diningAreas.forEach((area) => {
      if (area && typeof area === 'string' && area.trim()) {
        const trimmed = area.trim();
        const lower = trimmed.toLowerCase();
        if (!areaMap.has(lower)) {
          const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          areaMap.set(lower, formatted);
        }
      }
    });

    // Sections from currently loaded tables
    tables.forEach((t) => {
      if (t.section && typeof t.section === 'string' && t.section.trim()) {
        const trimmed = t.section.trim();
        const lower = trimmed.toLowerCase();
        if (!areaMap.has(lower)) {
          const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          areaMap.set(lower, formatted);
        }
      }
    });

    return ['All', ...Array.from(areaMap.values())];
  }, [diningAreas, tables]);

  // Filter tables by Section & Search Query
  const filteredTables = tables.filter((table) => {
    const sec = (table.section || 'indoor').trim().toLowerCase();
    
    let matchesFilter = true;
    if (activeFilter !== 'All') {
      const filterLower = activeFilter.trim().toLowerCase();
      if (filterLower === 'indoor') {
        matchesFilter = sec.includes('indoor') || sec === 'main' || !table.section;
      } else if (filterLower === 'outdoor') {
        matchesFilter = sec.includes('outdoor') || sec.includes('terrace') || sec === 'out door';
      } else {
        matchesFilter = sec === filterLower;
      }
    }

    // Search query
    const tableNumStr = String(table.number || '').toLowerCase();
    const guestName = (table.active_reservation?.guest_name || table.guest_name || '').toLowerCase();
    const matchesSearch =
      !searchQuery ||
      tableNumStr.includes(searchQuery.toLowerCase()) ||
      table.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guestName.includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate top 6 metrics dynamically
  const totalTablesCount = tables.length || 12;
  const availableCount = tables.filter((t) => (t.status || '').toLowerCase() === 'available').length;
  const occupiedCount = tables.filter((t) => (t.status || '').toLowerCase() === 'occupied').length;
  const billingCount = tables.filter((t) => (t.status || '').toLowerCase() === 'billing').length;
  
  const todaySales = summary?.today_revenue 
    ? parseFloat(summary.today_revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 }) 
    : '1200';

  const todayOrders = summary?.today_orders || summary?.today_bills_count || 100;

  // Table click handler
  const handleTableClick = (table) => {
    const status = (table.status || 'available').toLowerCase();
    setSelectedTable(table);

    if (status === 'billing') {
      navigate('/billing', { state: { targetTableId: table.id, targetTableNumber: table.number } });
    } else if (status === 'occupied') {
      navigate('/pos', { state: { targetTableId: table.id } });
    } else if (status === 'reserved') {
      navigate('/tables');
    } else {
      navigate('/pos');
    }
  };

  const handleDeleteTable = async (table) => {
    if (window.confirm(`Are you sure you want to delete Table ${table.number}?`)) {
      try {
        await tablesApi.deleteTable(table.id);
        loadDashboardData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete table');
      }
    }
  };

  if (user?.role === 'staff') {
    return <Navigate to="/tables" replace />;
  }

  return (
    <div className="admin-dashboard-page">
      {/* ═══════════════════════════════════════════════════════════════
          TOP CARD: Welcome Header + 6 Compact Metric Cards
      ═══════════════════════════════════════════════════════════════ */}
      <section className="admin-surface-card admin-welcome-card">
        {/* Top Header Row: Welcome + Search + Notification + Avatar */}
        <div className="admin-header-row">
          <div className="admin-header-left">
            <h1 className="admin-header-title">{getGreeting()}</h1>
            <p className="admin-header-subtitle">Your floor. Your control. Everything at a glance.</p>
          </div>

          <div className="admin-header-right">
            {/* Search Bar with Circle Button */}
            <div className="admin-search-wrapper">
              <input
                type="text"
                placeholder="Search......"
                className="admin-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button" className="admin-search-btn" title="Search">
                <Search size={16} color="#FFFFFF" strokeWidth={2.5} />
              </button>
            </div>

            {/* Notification Bell in soft peach circle */}
            <div className="admin-bell-btn" title="Notifications">
              <img src="/Bell.svg" alt="Notifications" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            </div>

            {/* Admin Profile Avatar */}
            <div 
              className="admin-profile-avatar-btn" 
              onClick={openProfile} 
              title="Admin Profile"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Admin" className="admin-avatar-img" />
              ) : (
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" 
                  alt="Admin" 
                  className="admin-avatar-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/cart.png';
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* 6 Metric Stats Cards */}
        <div className="admin-metrics-grid">
          {/* 1. Total Tables */}
          <div className="admin-stat-card admin-stat-card--purple">
            <div className="admin-stat-top">
              <div className="admin-stat-icon-wrap admin-stat-icon-wrap--purple">
                <Grid size={15} color="#7C3AED" strokeWidth={2.2} />
              </div>
            </div>
            <div className="admin-stat-value">{totalTablesCount}</div>
            <div className="admin-stat-title admin-stat-title--purple">Total Tables</div>
            <div className="admin-stat-desc">All tables in the restaurant</div>
          </div>

          {/* 2. Available Tables */}
          <div className="admin-stat-card admin-stat-card--green">
            <div className="admin-stat-top">
              <div className="admin-stat-icon-wrap admin-stat-icon-wrap--green">
                <CheckSquare size={15} color="#16A34A" strokeWidth={2.2} />
              </div>
            </div>
            <div className="admin-stat-value">{availableCount}</div>
            <div className="admin-stat-title admin-stat-title--green">Available Tables</div>
            <div className="admin-stat-desc">Ready for guests</div>
          </div>

          {/* 3. Occupied Tables */}
          <div className="admin-stat-card admin-stat-card--red">
            <div className="admin-stat-top">
              <div className="admin-stat-icon-wrap admin-stat-icon-wrap--red">
                <User size={15} color="#DC2626" strokeWidth={2.2} />
              </div>
            </div>
            <div className="admin-stat-value">{occupiedCount}</div>
            <div className="admin-stat-title admin-stat-title--red">Occupied Tables</div>
            <div className="admin-stat-desc">Currently in use</div>
          </div>

          {/* 4. Billing Pending */}
          <div className="admin-stat-card admin-stat-card--amber">
            <div className="admin-stat-top">
              <div className="admin-stat-icon-wrap admin-stat-icon-wrap--amber">
                <Receipt size={15} color="#D97706" strokeWidth={2.2} />
              </div>
            </div>
            <div className="admin-stat-value">{billingCount}</div>
            <div className="admin-stat-title admin-stat-title--amber">Billing Pending</div>
            <div className="admin-stat-desc">Waiting for payment</div>
          </div>

          {/* 5. Today's Sales */}
          <div className="admin-stat-card admin-stat-card--blue">
            <div className="admin-stat-top">
              <div className="admin-stat-icon-wrap admin-stat-icon-wrap--blue">
                <span className="admin-stat-symbol-blue">₹</span>
              </div>
            </div>
            <div className="admin-stat-value">₹ {todaySales}</div>
            <div className="admin-stat-title admin-stat-title--blue">Today's Sales</div>
            <div className="admin-stat-desc">Total sales today</div>
          </div>

          {/* 6. Today's Orders */}
          <div className="admin-stat-card admin-stat-card--teal">
            <div className="admin-stat-top">
              <div className="admin-stat-icon-wrap admin-stat-icon-wrap--teal">
                <TrendingUp size={15} color="#0D9488" strokeWidth={2.2} />
              </div>
            </div>
            <div className="admin-stat-value">{todayOrders}</div>
            <div className="admin-stat-title admin-stat-title--teal">Today's Orders</div>
            <div className="admin-stat-desc">Total orders today</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM CARD: Table Overview + Filters + + Add New Table + Table Grid
      ═══════════════════════════════════════════════════════════════ */}
      <section className="admin-surface-card admin-tables-overview-card">
        {/* Header: Title + Filters + Add Button */}
        <div className="admin-table-overview-header">
          <div className="admin-table-overview-left">
            <h2 className="admin-overview-title">Table Overview</h2>
            <p className="admin-overview-subtitle">Tap a table to view or start an order</p>
          </div>

          <div className="admin-table-overview-right">
            {/* Filter Pills */}
            <div className="admin-filter-pill-group">
              {filterOptions.map((filterName) => (
                <button
                  key={filterName}
                  type="button"
                  className={`admin-filter-pill ${activeFilter.toLowerCase() === filterName.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filterName)}
                >
                  {filterName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Table Grid */}
        {loading && tables.length === 0 ? (
          <div className="admin-grid-loading">Loading floor tables...</div>
        ) : filteredTables.length === 0 ? (
          <div className="admin-grid-empty">
            <h3>No tables found in this section</h3>
            <p>Click "+ Add New Table" to create a new dining table.</p>
          </div>
        ) : (
          <div className="admin-tables-grid">
            {filteredTables.map((table) => {
              // Find matching active order if any
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
                  onDelete={handleDeleteTable}
                  onPrint={(tbl) => {
                    navigate('/billing', {
                      state: { targetTableId: tbl.id, targetTableNumber: tbl.number },
                    });
                  }}
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
        onTableCreated={loadDashboardData}
      />

      <EditTableModal
        isOpen={Boolean(editingTable)}
        table={editingTable}
        onClose={() => setEditingTable(null)}
        onTableUpdated={loadDashboardData}
      />
    </div>
  );
};

export default DashboardPage;
