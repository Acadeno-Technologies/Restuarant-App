import React, { useState, useEffect } from 'react';
import { tablesApi } from '../api/tablesApi';
import { Copy, Check, ArrowLeft } from 'lucide-react';

export const QRCodePage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedTable, setSelectedTable] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadTables = async () => {
    try {
      const data = await tablesApi.getTables();
      const loaded = data.results || data;
      if (Array.isArray(loaded)) {
        setTables(loaded);
      }
    } catch (err) {
      console.error('Failed to load tables for QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();

    const handleFocus = () => {
      if (!document.hidden) loadTables();
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      if (!document.hidden) loadTables();
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Dynamic filter logic (exclude deactivated / no_service tables)
  const activeTables = tables.filter((t) => {
    const st = (t.status || '').toLowerCase();
    return st !== 'no_service' && st !== 'inactive' && t.is_active !== false;
  });

  const filteredTables = activeTables.filter((t) => {
    if (activeFilter === 'All' || activeFilter === 'All tables') return true;
    const sec = (t.section || t.seating_type || '').toLowerCase();
    if (activeFilter === 'Indoor') {
      return sec === 'indoor' || sec === 'main' || sec === '' || !t.section;
    }
    if (activeFilter === 'Out door') {
      return sec === 'outdoor' || sec === 'terrace' || sec === 'out door';
    }
    return true;
  });

  // Natural sorting by table number
  const sortedTables = [...filteredTables].sort((a, b) => {
    const numA = parseInt(String(a.number).replace(/\D/g, '')) || 0;
    const numB = parseInt(String(b.number).replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const formatTableNumber = (num) => {
    if (!num) return 'T 1';
    const cleanNumber = String(num)
      .replace(/^Table\s*/i, '')
      .replace(/^T/i, '')
      .replace(/[-_\s]/g, '');
    return `T ${cleanNumber || '1'}`;
  };

  const getFullTableName = (num) => {
    if (!num) return 'Table 1';
    const cleanNumber = String(num)
      .replace(/^Table\s*/i, '')
      .replace(/^T/i, '')
      .replace(/[-_\s]/g, '');
    return `Table ${cleanNumber || '1'}`;
  };

  const getSectionLabel = (table, index) => {
    const rawSec = (table.section || table.seating_type || '').toLowerCase();
    if (rawSec.includes('out')) return 'Out door';
    if (rawSec.includes('in')) return 'Indoor';
    return index % 2 === 0 ? 'Indoor' : 'Out door';
  };

  const getStatusBadge = (rawStatus) => {
    const status = (rawStatus || 'available').toUpperCase();
    if (status === 'OCCUPIED') {
      return <span className="qr-status status-occupied">OCCUPIED</span>;
    }
    if (status === 'RESERVED') {
      return <span className="qr-status status-reserved">RESERVED</span>;
    }
    if (status === 'BILLING') {
      return <span className="qr-status status-billing">BILLING</span>;
    }
    return <span className="qr-status status-available">AVAILABLE</span>;
  };

  // Helper to generate dynamic QR image URL per table
  const getQrCodeUrl = (table) => {
    if (table.qr_code && typeof table.qr_code === 'string' && table.qr_code.startsWith('http')) {
      return table.qr_code;
    }
    if (table.qr_url && typeof table.qr_url === 'string' && table.qr_url.startsWith('http')) {
      return table.qr_url;
    }
    const tableId = table.id || table.number || '1';
    const qrToken = table.qr_token || `TBL-${table.number || tableId}-${tableId}`;
    const targetUrl = `${window.location.origin}/menu?table=${tableId}&qr=${encodeURIComponent(qrToken)}`;
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=29221F&bgcolor=FFFFFF&data=${encodeURIComponent(targetUrl)}`;
  };

  // Get table target URL string for detail view
  const getTableMenuUrl = (table) => {
    const tableId = table.id || table.number || '1';
    const qrToken = table.qr_token || `TBL-${table.number || tableId}-${tableId}`;
    return `${window.location.origin}/menu?table=${tableId}&qr=${encodeURIComponent(qrToken)}`;
  };

  const handleCopyUrl = (url) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Detail View Screen
  if (selectedTable) {
    const menuUrl = getTableMenuUrl(selectedTable);

    return (
      <div className="qr-page qr-detail-page">
        <div className="qr-content">
          {/* Header */}
          <div className="qr-detail-header">
            <div>
              <h1 className="qr-detail-title">Restaurant Menu QR</h1>
              <p className="qr-detail-subtitle">One QR. One Menu. Zero Hassle</p>
            </div>
          </div>

          {/* QR Detail Card */}
          <div className="qr-detail-card">
            <h2 className="qr-detail-table">{getFullTableName(selectedTable.number)}</h2>

            {/* Large QR Container */}
            <div className="qr-large-wrapper">
              <img
                src={getQrCodeUrl(selectedTable)}
                alt={`QR Code for ${selectedTable.number}`}
                className="qr-large-image"
              />
            </div>

            {/* URL Box */}
            <div className="qr-url-container">
              <span className="qr-url-link-icon">🔗</span>
              <span className="qr-url">{menuUrl}</span>
              <button
                className="qr-url-copy-btn"
                onClick={() => handleCopyUrl(menuUrl)}
                title="Copy menu URL"
              >
                {copied ? <Check size={16} color="#18834B" /> : <Copy size={16} color="#756B66" />}
              </button>
            </div>

            {/* Description */}
            <p className="qr-description-detail">
              One QR for the whole restaurant —<br />
              print it on table tents to let customers<br />
              view the menu.
            </p>
          </div>
        </div>

        {/* Copy Toast */}
        {copied && (
          <div className="qr-copy-toast">
            Menu link copied ✓
          </div>
        )}
      </div>
    );
  }

  // Grid View Screen
  return (
    <div className="qr-page">
      <div className="qr-content">
        {/* Header */}
        <div className="qr-header">
          <h1 className="qr-title">Table QR Code</h1>
          <p className="qr-description">
            One QR per table — guests go straight to their table’s menu.
          </p>

          {/* Filter Buttons */}
          <div className="qr-filter-container">
            {['All', 'Indoor', 'Out door'].map((filter) => (
              <button
                key={filter}
                className={`qr-filter ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* QR Grid */}
        {loading ? (
          <div className="qr-loading">Loading table QR codes...</div>
        ) : sortedTables.length === 0 ? (
          <div className="qr-empty">No tables match the selected filter.</div>
        ) : (
          <div className="qr-grid">
            {sortedTables.map((table, index) => (
              <div
                key={table.id || index}
                className="qr-card"
                onClick={() => setSelectedTable(table)}
                style={{ cursor: 'pointer' }}
              >
                {getStatusBadge(table.status)}

                <div className="qr-image-container">
                  <img
                    src={getQrCodeUrl(table)}
                    alt={`QR Code for ${table.number}`}
                    className="qr-image"
                  />
                </div>

                <div className="qr-table-number">
                  {formatTableNumber(table.number)}
                </div>

                <div className="qr-table-details">
                  {getSectionLabel(table, index)} · {table.capacity || 4} seats
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodePage;
