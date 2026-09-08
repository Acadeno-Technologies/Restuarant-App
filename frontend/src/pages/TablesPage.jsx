import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tablesApi } from '../api/tablesApi';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, QrCode, Trash2, X } from 'lucide-react';

// Reusable status styling configuration matching reference image specs
const STATUS_STYLES = {
  available: {
    statusClass: 'available',
    label: 'Available',
    numColor: '#277832',
    badgeBg: '#CCD2A6',
    badgeText: '#277832',
    dotColor: '#277832',
    cardBg: '#E5E6D0',
  },
  occupied: {
    statusClass: 'occupied',
    label: 'Occupied',
    numColor: '#C92A20',
    badgeBg: '#F4B6AB',
    badgeText: '#BA2823',
    dotColor: '#BA2823',
    cardBg: '#F9DBD1',
  },
  reserved: {
    statusClass: 'reserved',
    label: 'Reserved',
    numColor: '#0B4F8C',
    badgeBg: '#729ACC',
    badgeText: '#FFFFFF',
    dotColor: '#FFFFFF',
    cardBg: '#D7DFE6',
  },
  billing: {
    statusClass: 'billing',
    label: 'Billing',
    numColor: '#C58A00',
    badgeBg: '#C58A00',
    badgeText: '#FFFFFF',
    dotColor: '#FFFFFF',
    cardBg: '#F7E3CC',
  },
  cleaning: {
    statusClass: 'billing',
    label: 'Cleaning',
    numColor: '#C58A00',
    badgeBg: '#C58C00',
    badgeText: '#FFFFFF',
    dotColor: '#FFFFFF',
    cardBg: '#F7E3CC',
  },
  no_service: {
    statusClass: 'no_service',
    label: 'No Service',
    numColor: '#6B5E55',
    badgeBg: '#6B5E55',
    badgeText: '#FFFFFF',
    dotColor: '#FFFFFF',
    cardBg: '#EBE8E4',
  },
  inactive: {
    statusClass: 'no_service',
    label: 'No Service',
    numColor: '#6B5E55',
    badgeBg: '#6B5E55',
    badgeText: '#FFFFFF',
    dotColor: '#FFFFFF',
    cardBg: '#EBE8E4',
  },
};

const getStatusConfig = (rawStatus) => {
  const key = rawStatus ? String(rawStatus).toLowerCase() : 'available';
  return (
    STATUS_STYLES[key] || {
      statusClass: 'available',
      label: rawStatus ? String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1) : 'Available',
      numColor: '#2C8238',
      badgeBg: '#C7CE9F',
      badgeText: '#2C8238',
      dotColor: '#2C8238',
      cardBg: '#E7E0C5',
    }
  );
};

export const TablesPage = () => {
  const navigate = useNavigate();
  const { setSelectedTable, setCustomerName, startNewOrderSession, viewTableOrderSession } = useOrder();
  const { user, openProfile } = useAuth();

  const [tables, setTables] = useState(() => {
    try {
      const cached = localStorage.getItem('staff_cached_tables');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [diningAreas, setDiningAreas] = useState([]);
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('staff_cached_tables');
      return !(cached && JSON.parse(cached).length > 0);
    } catch {
      return true;
    }
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter State
  const [activeFilter, setActiveFilter] = useState('All');

  // New Table Form State
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [floorSection, setFloorSection] = useState('indoor');

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

  // Fetch real database tables
  const loadTables = async () => {
    try {
      const data = await tablesApi.getTables();
      const loaded = data.results || data;
      if (Array.isArray(loaded)) {
        setTables(loaded);
        try {
          localStorage.setItem('staff_cached_tables', JSON.stringify(loaded));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load tables from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    loadDiningAreas();

    // Auto-sync table status changes live
    const handleSync = () => {
      if (!document.hidden) {
        loadTables();
        loadDiningAreas();
      }
    };
    window.addEventListener('focus', handleSync);
    window.addEventListener('tablesUpdated', handleSync);
    window.addEventListener('tableOptionsUpdated', handleSync);
    window.addEventListener('storage', handleSync);

    const interval = setInterval(() => {
      if (!document.hidden) {
        loadTables();
      }
    }, 8000);

    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('tablesUpdated', handleSync);
      window.removeEventListener('tableOptionsUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
      clearInterval(interval);
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

  const handleCreateTable = async (e) => {
    e.preventDefault();
    const cleanNum = String(tableNumber || '').trim().replace(/^Table\s*/i, '').replace(/^T\s*-?\s*/i, '').trim();
    const formattedNum = `T${cleanNum || '1'}`;
    try {
      await tablesApi.createTable({
        number: formattedNum,
        name: `Table ${cleanNum || '1'}`,
        capacity: parseInt(capacity),
        section: floorSection.toLowerCase(),
      });
      setShowAddModal(false);
      setTableNumber('');
      loadTables();
    } catch (err) {
      alert(err.response?.data?.number?.[0] || err.response?.data?.detail || 'Failed to create table');
    }
  };

  const handleDeleteTable = async (tableId, tableNumber) => {
    const formattedNum = formatTableNumber(tableNumber);
    if (window.confirm(`Are you sure you want to delete ${formattedNum}?`)) {
      try {
        await tablesApi.deleteTable(tableId);
        setSelectedAvailableTable(null);
        setSelectedOccupiedTable(null);
        setSelectedReservedTable(null);
        loadTables();
      } catch (err) {
        alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to delete table');
      }
    }
  };

  const getTableSeatingCategory = (table) => {
    if (!table) return 'Indoor Seating';
    const sec = String(
      table.section ||
      table.category ||
      table.type ||
      table.area ||
      table.seating_type ||
      table.floor_section ||
      ''
    ).trim();
    if (sec) {
      const formatted = sec.charAt(0).toUpperCase() + sec.slice(1);
      if (
        formatted.toLowerCase().endsWith('seating') ||
        formatted.toLowerCase().endsWith('area') ||
        formatted.toLowerCase().endsWith('room')
      ) {
        return formatted;
      }
      return `${formatted} Seating`;
    }
    return 'Indoor Seating';
  };

  // Selected Table Bottom Sheet State
  const [selectedOccupiedTable, setSelectedOccupiedTable] = useState(null);
  const [selectedReservedTable, setSelectedReservedTable] = useState(null);
  const [selectedAvailableTable, setSelectedAvailableTable] = useState(null);
  const [showReserveForm, setShowReserveForm] = useState(false);

  // Reservation Form State
  const [guestName, setGuestName] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [resError, setResError] = useState(null);
  const [resSuccess, setResSuccess] = useState(null);
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Lock body scroll when any modal is active
  useEffect(() => {
    const isModalOpen = Boolean(showAddModal || selectedOccupiedTable || selectedReservedTable || selectedAvailableTable || showReserveForm || showCancelConfirm);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showAddModal, selectedOccupiedTable, selectedReservedTable, selectedAvailableTable, showReserveForm, showCancelConfirm]);

  useEffect(() => {
    if (selectedReservedTable) {
      setGuestName(selectedReservedTable.active_reservation?.guest_name || '');
      setArrivalTime(selectedReservedTable.active_reservation?.arrival_time || '');
      setResError(null);
      setShowCancelConfirm(false);
    }
  }, [selectedReservedTable]);

  useEffect(() => {
    if (selectedAvailableTable) {
      setGuestName('');
      setArrivalTime('');
      setResError(null);
      setShowReserveForm(false);
    }
  }, [selectedAvailableTable]);

  const formatArrivalTime = (timeStr) => {
    if (!timeStr) return '';
    const parts = String(timeStr).split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      if (!isNaN(hours)) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
      }
    }
    return timeStr;
  };

  const handleSelectTableForOrder = (table) => {
    const status = (table.status || '').toLowerCase();

    // If status is "billing", directly open the corresponding table's bill
    if (status === 'billing') {
      setSelectedTable(table);
      setSelectedOccupiedTable(null);
      navigate('/billing', { state: { targetTableId: table.id, targetTableNumber: table.number } });
      return;
    }

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      if (status === 'occupied') {
        setSelectedOccupiedTable(table);
        return;
      }
      if (status === 'reserved') {
        setSelectedReservedTable(table);
        return;
      }
      if (status === 'available') {
        setSelectedAvailableTable(table);
        return;
      }
    }

    if (status === 'occupied') {
      handleViewOrder(table);
    } else {
      startNewOrderSession(table);
      navigate('/pos');
    }
  };

  const handleViewBill = (table) => {
    setSelectedTable(table);
    setSelectedOccupiedTable(null);
    navigate('/billing');
  };

  const handleViewOrder = async (table) => {
    setSelectedOccupiedTable(null);
    if (viewTableOrderSession) {
      await viewTableOrderSession(table);
    } else {
      setSelectedTable(table);
    }
    navigate('/pos', { state: { openOrderSheet: true, viewingPlacedOrder: true, tableId: table.id } });
  };

  const handleStartOrderFromReserved = async (table) => {
    const guest = table.active_reservation?.guest_name || guestName || '';
    if (guest && setCustomerName) {
      setCustomerName(guest);
    }
    const tableWithGuest = {
      ...table,
      guest_name: guest,
      active_reservation: {
        ...(table.active_reservation || {}),
        guest_name: guest,
      },
    };
    setSelectedTable(tableWithGuest);
    setSelectedReservedTable(null);
    navigate('/pos');
    try {
      if (tablesApi.updateStatus) {
        await tablesApi.updateStatus(table.id, 'occupied');
      }
      loadTables();
    } catch (err) {
      console.error('Failed to update table status to occupied:', err);
    }
  };

  const handleConfirmCancelReservation = async () => {
    if (!selectedReservedTable) return;
    try {
      if (selectedReservedTable.active_reservation?.id) {
        await tablesApi.cancelReservation(selectedReservedTable.active_reservation.id);
      } else {
        await tablesApi.updateStatus(selectedReservedTable.id, 'available');
      }
      setResSuccess('Reservation Cancelled');
      await loadTables();
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setShowCancelConfirm(false);
      setSelectedReservedTable(null);
      setTimeout(() => setResSuccess(null), 3000);
    }
  };

  const handleConfirmReservation = async (targetTable = null) => {
    const tableToReserve = targetTable || selectedReservedTable || selectedAvailableTable;
    if (!tableToReserve) return;

    if (!guestName.trim()) {
      setResError('Guest name is required');
      return;
    }
    if (!arrivalTime.trim()) {
      setResError('Arrival time is required');
      return;
    }

    setIsSubmittingRes(true);
    setResError(null);
    try {
      await tablesApi.createReservation(
        tableToReserve.id,
        guestName.trim(),
        arrivalTime.trim()
      );
      await loadTables();
      setSelectedReservedTable(null);
      setSelectedAvailableTable(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create reservation';
      setResError(msg);
    } finally {
      setIsSubmittingRes(false);
    }
  };

  // Filter out deactivated / no_service tables for Staff Dashboard
  const activeStaffTables = tables.filter((t) => {
    const st = (t.status || '').toLowerCase();
    return st !== 'no_service' && st !== 'inactive' && t.is_active !== false;
  });

  // Dynamic Statistics computed strictly from active tables on floor
  const freeCount = activeStaffTables.filter(
    (t) => (t.status || '').toLowerCase() === 'available'
  ).length;
  
  const occupiedCount = activeStaffTables.filter((t) =>
    ['occupied', 'billing', 'cleaning'].includes((t.status || '').toLowerCase())
  ).length;
  
  const totalCount = activeStaffTables.length;

  // Filter backend tables dynamically by section
  const filteredTables = activeStaffTables.filter((t) => {
    if (activeFilter === 'All') return true;
    const sec = (t.section || 'indoor').trim().toLowerCase();
    const filterLower = activeFilter.trim().toLowerCase();
    if (filterLower === 'indoor') {
      return sec.includes('indoor') || sec === 'main' || !t.section;
    }
    if (filterLower === 'outdoor' || filterLower === 'out door') {
      return sec.includes('outdoor') || sec.includes('terrace') || sec === 'out door';
    }
    return sec === filterLower;
  });

  // Natural sorting by table number: T 1, T 2, T 3, T 4...
  const sortedTables = [...filteredTables].sort((a, b) => {
    const numA = parseInt(String(a.number).replace(/\D/g, '')) || 0;
    const numB = parseInt(String(b.number).replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  // Format table number consistently (e.g. "T1" -> "T 1", "T-2" -> "T 2", "T 3" -> "T 3", "T_4" -> "T 4")
  const formatTableNumber = (num) => {
    if (!num) return 'T 1';
    const cleanNumber = String(num)
      .replace(/^Table\s*/i, '')
      .replace(/^T/i, '')
      .replace(/[-_\s]/g, '');
    return `T ${cleanNumber || '1'}`;
  };

  const getTableDisplayNum = (num) => {
    if (!num) return '1';
    return (
      String(num)
        .replace(/^Table\s*/i, '')
        .replace(/^T/i, '')
        .replace(/[-_\s]/g, '') || '1'
    );
  };

  // Seated person icon matching attached reference image
  const SeatedPersonIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ flexShrink: 0 }}
    >
      <circle cx="10" cy="3" r="2.2" />
      <path d="M 8.5 7 C 8.2 7 8 7.2 8.1 7.5 L 9.2 12.5 C 9.3 13 9.7 13.5 10.3 13.5 L 16.5 13.5 C 17.1 13.5 17.6 13.9 17.8 14.5 L 20 20 C 20.2 20.5 19.8 21 19.2 21 C 18.8 21 18.5 20.7 18.3 20.3 L 16.3 15.3 L 11.2 15.3 C 9.8 15.3 8.6 14.3 8.3 12.9 L 7.3 7.8 C 7.2 7.3 7.6 7 8.5 7 Z" />
      <path d="M 5 5 L 6.2 14.5 C 6.5 16.5 8 17.5 10 17.5 L 18 17.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="tables-overview-container">
      {/* Page Header with Dynamic User Avatar */}
      <div className="mobile-table-header">
        <div>
          <h1 className="table-title">Table Overview</h1>
          <p className="table-subtitle">Tap a table to view or start an order</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Mobile Profile Avatar Trigger */}
          <div
            onClick={openProfile}
            style={{ cursor: 'pointer' }}
            title="Open Profile"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="User Avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#F5F1EF', border: '1.5px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#350505' }}>
                {user?.username ? user.username[0].toUpperCase() : 'A'}
              </div>
            )}
          </div>

          <div className="desktop-only-actions" style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', color: '#171717', borderRadius: '14px' }} onClick={loadTables}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn btn-primary" style={{ background: '#350505', borderColor: '#350505', color: '#ffffff', borderRadius: '14px', fontWeight: 700 }} onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Table
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="unified-stats-row">
        <div className="mobile-stat-card">
          <span className="stat-num-free">{freeCount}</span>
          <span className="stat-label-text">AVAILABLE</span>
        </div>

        <div className="mobile-stat-card">
          <span className="stat-num-occupied">{occupiedCount}</span>
          <span className="stat-label-text">OCCUPIED</span>
        </div>

        <div className="mobile-stat-card">
          <span className="stat-num-total">{totalCount}</span>
          <span className="stat-label-text">TOTAL</span>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mobile-filter-pills">
        {filterOptions.map((filterName) => (
          <button
            key={filterName}
            className={`filter-pill ${activeFilter.toLowerCase() === filterName.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActiveFilter(filterName)}
          >
            {filterName}
          </button>
        ))}
      </div>

      {/* Table Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#786C65' }}>
          Loading dining floor tables...
        </div>
      ) : sortedTables.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#786C65', background: '#ffffff', borderRadius: '24px' }}>
          No tables match the selected filter.
        </div>
      ) : (
        <div className="unified-table-grid">
          {sortedTables.map((table) => {
            const statusConfig = getStatusConfig(table.status);
            const isReserved = (table.status || '').toLowerCase() === 'reserved';
            const isNoService = ['no_service', 'inactive'].includes((table.status || '').toLowerCase());
            
            const rawSec = (table.section || '').toLowerCase();
            let sectionText = table.section
              ? table.section.charAt(0).toUpperCase() + table.section.slice(1)
              : 'Indoor';

            return (
              <div
                key={table.id}
                className={`table-card-mobile ${statusConfig.statusClass}`}
                onClick={() => handleSelectTableForOrder(table)}
                style={{
                  backgroundColor: statusConfig.cardBg,
                  position: 'relative',
                  border: isReserved ? '1.5px solid #357EC3' : undefined
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div className="table-card-num" style={{ color: statusConfig.numColor }}>
                      {formatTableNumber(table.number)}
                    </div>
                    {user?.role === 'admin' && (
                      <button
                        title="Delete Table"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table.id, table.number);
                        }}
                        style={{
                          background: 'rgba(220, 38, 38, 0.12)',
                          border: 'none',
                          color: '#b91c1c',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="table-card-seats">
                    <SeatedPersonIcon />
                    <span>{table.capacity || 4} seats</span>
                  </div>

                  {(isReserved && table.active_reservation) ? (
                    <div className="table-card-section-row">
                      <span className="section-bullet">●</span>
                      <span>
                        {table.active_reservation.guest_name} · {formatArrivalTime(table.active_reservation.arrival_time)}
                      </span>
                    </div>
                  ) : sectionText ? (
                    <div className="table-card-section-row">
                      <span className="section-bullet">●</span>
                      <span>{sectionText}</span>
                    </div>
                  ) : null}
                </div>

                <div className="status-badge" style={{ backgroundColor: statusConfig.badgeBg, color: statusConfig.badgeText }}>
                  <span className="badge-dot" style={{ backgroundColor: statusConfig.dotColor }}></span>
                  <span>{statusConfig.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Table */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Dining Table</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTable}>
              <div className="form-group">
                <label>Table Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1 or T12"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Seating Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 4"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Floor Section</label>
                <select
                  className="form-select"
                  value={floorSection}
                  onChange={(e) => setFloorSection(e.target.value)}
                >
                  {filterOptions.filter((f) => f !== 'All').map((opt) => (
                    <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#E87500', borderColor: '#E87500' }}>
                Create Dining Table
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Occupied Table Bottom-Sheet Detail Modal */}
      {selectedOccupiedTable && (
        <div className="table-modal-overlay" onClick={() => setSelectedOccupiedTable(null)}>
          <div className="occupied-table-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="occupied-sheet-header">
              <span className="occupied-sheet-location">
                {getTableSeatingCategory(selectedOccupiedTable)}
              </span>
              <button
                className="occupied-sheet-close"
                onClick={() => setSelectedOccupiedTable(null)}
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="occupied-sheet-body">
              <div className="occupied-sheet-avatar">
                <img
                  src="/order-logo.png"
                  alt="Table Icon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/tables-icon.png';
                  }}
                />
              </div>
              <div className="occupied-sheet-info">
                <h3 className="occupied-sheet-title">
                  {`Table ${getTableDisplayNum(selectedOccupiedTable.number)}`}
                </h3>
                <div className="occupied-sheet-status">
                  <span className="status-dot"></span>
                  <span>
                    {(selectedOccupiedTable.status || '').toLowerCase() === 'billing'
                      ? 'Billing in Progress'
                      : 'Dining in Progress'}
                    {selectedOccupiedTable.active_order?.customer_name
                      ? ` · ${selectedOccupiedTable.active_order.customer_name}`
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="occupied-sheet-actions">
              <button
                className="btn-view-bill"
                onClick={() => handleViewBill(selectedOccupiedTable)}
              >
                View Bill
              </button>
              <button
                className="btn-view-order"
                onClick={() => handleViewOrder(selectedOccupiedTable)}
              >
                View Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Table Details Bottom Sheet Modal (Available & Reserved Table States) */}
      {(selectedAvailableTable || selectedReservedTable) && (() => {
        const table = selectedAvailableTable || selectedReservedTable;
        const isAvailable = Boolean(selectedAvailableTable);

        const statusDotClass = isAvailable ? 'green' : 'blue';
        const statusText = isAvailable
          ? 'Ready for service'
          : `Reserved by ${table.active_reservation?.guest_name || guestName || 'Guest'} · ${formatArrivalTime(table.active_reservation?.arrival_time || arrivalTime || '7:30 PM')}`;

        const primaryText = 'Start Order';
        const primaryAction = () => {
          if (isAvailable) {
            startNewOrderSession(table);
            setSelectedAvailableTable(null);
            navigate('/pos');
          } else {
            handleStartOrderFromReserved(table);
          }
        };

        const secondaryText = isAvailable ? 'Reserve this Table' : 'Cancel Reservation';
        const secondaryAction = () => {
          if (isAvailable) {
            setShowReserveForm(true);
          } else {
            handleConfirmCancelReservation();
          }
        };

        const handleClose = () => {
          setSelectedAvailableTable(null);
          setSelectedReservedTable(null);
          setShowReserveForm(false);
        };

        return (
          <div className="table-sheet-overlay" onClick={handleClose}>
            <div className="table-details-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="table-sheet-header">
                <span className="table-sheet-location">
                  {getTableSeatingCategory(table)}
                </span>
                <button
                  className="table-sheet-close"
                  onClick={handleClose}
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="table-sheet-body">
                <div className="table-sheet-avatar">
                  <img
                    src="/order-logo.png"
                    alt="Table Icon"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/tables-icon.png';
                    }}
                  />
                </div>
                <div className="table-sheet-info">
                  <h3 className="table-sheet-title">
                    Table {getTableDisplayNum(table.number)}
                  </h3>
                  <div className="table-sheet-status">
                    <span className={`table-status-dot ${statusDotClass}`}></span>
                    <span>{statusText}</span>
                  </div>
                </div>
              </div>

              {!showReserveForm ? (
                <div className="table-sheet-actions">
                  <button
                    className="table-modal-button primary-button"
                    onClick={primaryAction}
                  >
                    {primaryText}
                  </button>
                  <button
                    className="table-modal-button secondary-button"
                    onClick={secondaryAction}
                  >
                    {secondaryText}
                  </button>
                  {user?.role === 'admin' && isAvailable && (
                    <button
                      className="delete-table-btn"
                      style={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '999px',
                        background: 'rgba(220, 38, 38, 0.08)',
                        color: '#dc2626',
                        border: '1.5px solid rgba(220, 38, 38, 0.3)',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '4px'
                      }}
                      onClick={() => handleDeleteTable(table.id, table.number)}
                    >
                      <Trash2 size={16} /> Delete Table
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="reservation-form-group" style={{ marginTop: '14px' }}>
                    <label className="reservation-label">Guest Name</label>
                    <input
                      type="text"
                      className="reservation-input"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />

                    <label className="reservation-label" style={{ marginTop: '12px' }}>
                      Arrival Time
                    </label>
                    <input
                      type="time"
                      className="reservation-input"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                    />

                    {resError && <div className="reservation-error-msg">{resError}</div>}
                  </div>

                  <div className="table-sheet-actions" style={{ marginTop: '18px' }}>
                    <button
                      className="table-sheet-btn-primary"
                      onClick={() => handleConfirmReservation(table)}
                      disabled={isSubmittingRes}
                    >
                      {isSubmittingRes ? 'Confirming...' : 'Confirm Reservation'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Reservation Floating Toast */}
      {resSuccess && (
        <div className="order-sent-pill">
          <span>{resSuccess}</span>
        </div>
      )}
    </div>
  );
};
