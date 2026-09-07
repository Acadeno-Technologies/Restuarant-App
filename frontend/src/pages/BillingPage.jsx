import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { billingApi } from '../api/billingApi';
import { ordersApi } from '../api/ordersApi';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { Receipt, Printer, Share2, Plus, RefreshCw, CheckCircle, CreditCard, XCircle, X } from 'lucide-react';

const getTableDisplayNum = (val) => {
  if (!val) return '';
  return String(val)
    .replace(/^Table\s*/i, '')
    .replace(/^T/i, '')
    .replace(/[-_\s]/g, '');
};

export const BillingPage = () => {
  const location = useLocation();
  const { user, openProfile } = useAuth();
  const { selectedTable } = useOrder();
  const [bills, setBills] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasAutoOpenedRef = useRef(false);

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(null);

  // Generate Bill Form
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(5); // default 5% GST
  const [paymentMode, setPaymentMode] = useState('cash');

  // Mobile View Bill Bottom Sheet state
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);
  const [isIncludeGst, setIsIncludeGst] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [settlingBill, setSettlingBill] = useState(false);
  const [settleSuccessToast, setSettleSuccessToast] = useState(false);

  // Lock body scroll when any modal or sheet is open
  useEffect(() => {
    const isModalOpen = Boolean(selectedBillOrder || showGenerateModal || showReceiptModal);
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
  }, [selectedBillOrder, showGenerateModal, showReceiptModal]);

  const handleOpenViewBillSheet = (order) => {
    setSelectedBillOrder(order);
    setIsIncludeGst(true);
    setSelectedPaymentMethod('cash');
  };

  const handleSettleBill = async () => {
    if (!selectedBillOrder) return;
    setSettlingBill(true);
    try {
      await billingApi.generateBill({
        order_id: selectedBillOrder.id,
        include_gst: isIncludeGst,
        tax_percent: isIncludeGst ? 5 : 0,
        discount_amount: 0,
        payment_method: selectedPaymentMethod,
      });

      setSelectedBillOrder(null);
      setSettleSuccessToast(true);
      setTimeout(() => setSettleSuccessToast(false), 3000);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to settle bill');
    } finally {
      setSettlingBill(false);
    }
  };

  const isTableOrder = (o) => {
    if (!o) return false;
    const tableVal = o.table;
    const hasTable =
      tableVal !== null &&
      tableVal !== undefined &&
      tableVal !== '' &&
      tableVal !== 0;

    const hasTableNum =
      Boolean(o.table_number && String(o.table_number).trim() !== '') ||
      Boolean(o.table_name && String(o.table_name).trim() !== '');

    return Boolean(hasTable || hasTableNum);
  };

  const isTableBill = (b) => {
    if (!b) return false;
    const od = b.order_details;
    const hasDirectTable =
      (b.table !== null && b.table !== undefined && b.table !== '' && b.table !== 0) ||
      Boolean(b.table_number && String(b.table_number).trim() !== '');

    const hasOrderTable = od && (
      (od.table !== null && od.table !== undefined && od.table !== '' && od.table !== 0) ||
      Boolean(od.table_number && String(od.table_number).trim() !== '') ||
      Boolean(od.table_name && String(od.table_name).trim() !== '')
    );

    return Boolean(hasDirectTable || hasOrderTable);
  };


  const loadData = async () => {
    try {
      const [billsRes, ordersRes, settingsRes] = await Promise.allSettled([
        billingApi.getBills(),
        ordersApi.getOrders(),
        authApi.getSettings(),
      ]);

      if (billsRes.status === 'fulfilled' && billsRes.value) {
        const loadedBills = billsRes.value.results || billsRes.value;
        if (Array.isArray(loadedBills)) {
          // In staff billing section, strictly show bills generated for dining tables
          const tableBills = loadedBills.filter(isTableBill);
          setBills(tableBills);
        } else {
          setBills([]);
        }
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value) {
        const allOrders = ordersRes.value.results || ordersRes.value;
        if (Array.isArray(allOrders)) {
          // In staff billing section, strictly show active unbilled orders placed through tables
          const unbilledTableOrders = allOrders.filter(
            (o) =>
              o.status !== 'billed' &&
              o.status !== 'cancelled' &&
              Array.isArray(o.items) &&
              o.items.length > 0 &&
              isTableOrder(o)
          );
          setActiveOrders(unbilledTableOrders);
        } else {
          setActiveOrders([]);
        }
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        setSettings(settingsRes.value);
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto refresh every 6 seconds so incoming ready kitchen orders update live
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);


  // Auto-open target table bill on navigation if specified via location.state
  useEffect(() => {
    if (hasAutoOpenedRef.current) return;

    // Only auto-open if explicitly navigated with targetTableId/Number in location.state
    const targetTableId = location.state?.targetTableId;
    const targetTableNum = location.state?.targetTableNumber;

    if ((targetTableId || targetTableNum) && activeOrders.length > 0) {
      const match = activeOrders.find((ord) => {
        const ordTableId = typeof ord.table === 'object' ? ord.table?.id : ord.table;
        const ordTableNum = ord.table_number || (typeof ord.table === 'object' ? ord.table?.number : null);

        const cleanOrdNum = getTableDisplayNum(ordTableNum || ordTableId);
        const cleanTargetNum = getTableDisplayNum(targetTableNum || targetTableId);

        return (
          (targetTableId && String(ordTableId) === String(targetTableId)) ||
          (cleanTargetNum && cleanOrdNum && cleanTargetNum === cleanOrdNum)
        );
      });

      if (match) {
        if (window.innerWidth <= 768) {
          handleOpenViewBillSheet(match);
        } else {
          handleOpenGenerateForOrder(match.id);
        }
        hasAutoOpenedRef.current = true;
      }
    }
  }, [activeOrders, location.state]);

  const isKitchen = user?.role === 'kitchen' || user?.role === 'admin';

  const handleMarkReady = async (orderId) => {
    if (!isKitchen) {
      alert('Only kitchen staff can mark orders as ready.');
      return;
    }
    try {
      await ordersApi.updateOrderStatus(orderId, 'ready');
      loadData();
    } catch (err) {
      console.error('Failed to mark order as ready:', err);
    }
  };

  const handleMarkServed = async (orderId) => {
    try {
      await ordersApi.updateOrderStatus(orderId, 'served');
      loadData();
    } catch (err) {
      console.error('Failed to mark order as served:', err);
    }
  };

  const handleOpenGenerateForOrder = (orderId) => {
    setSelectedOrderId(String(orderId));
    setShowGenerateModal(true);
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      alert('Please select an order to generate bill for');
      return;
    }

    const orderObj = activeOrders.find((o) => o.id === parseInt(selectedOrderId));
    const subtotalVal = orderObj ? parseFloat(orderObj.subtotal || 0) : 0;
    const discountAmt = (subtotalVal * (parseFloat(discountPercent || 0) / 100)) || 0;

    try {
      const billData = await billingApi.generateBill({
        order_id: parseInt(selectedOrderId),
        tax_percent: parseFloat(taxPercent || 5),
        discount_amount: discountAmt,
        payment_method: paymentMode,
      });
      setShowGenerateModal(false);
      setShowReceiptModal(billData);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to generate bill');
    }
  };

  const handleShareWhatsApp = async (billId) => {
    try {
      const data = await billingApi.getWhatsAppText(billId);
      const text = data.whatsapp_text || data.text || '';
      const phone = (data.customer_phone || '').replace(/\D/g, '');
      const encodedText = encodeURIComponent(text);

      const targetPhone = phone.length === 10 ? `91${phone}` : phone;
      const whatsappUrl = targetPhone
        ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}`
        : `https://api.whatsapp.com/send?text=${encodedText}`;

      window.open(whatsappUrl, '_blank');
    } catch (err) {
      alert('Failed to open WhatsApp');
    }
  };

  return (
    <div className="billing-page-wrapper">
      {/* ==================== MOBILE BILLING VIEW ==================== */}
      <div className="mobile-billing-view">
        {/* Top Header Bar */}
        <div className="billing-header">
          <div className="billing-header-content">
            <h1 className="billing-title">Billing Counter</h1>
            <p className="billing-subtitle">
              {activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'} · track kitchen to payment
            </p>
          </div>
          <div
            className="billing-header-avatar-wrapper"
            onClick={openProfile}
            title="User Profile"
          >
            {user?.avatar || user?.avatar_url ? (
              <img
                src={user.avatar || user.avatar_url}
                alt="Profile"
                className="billing-header-avatar-img"
              />
            ) : (
              <div className="billing-avatar-initial">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Billing Cards List */}
        <div className="mobile-billing-list">
          {loading && activeOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#756B66', fontSize: '14px' }}>
              Loading billing counter orders...
            </div>
          ) : activeOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#756B66', fontSize: '14px', background: '#FFFFFF', borderRadius: '18px' }}>
              No active billing orders at the moment.
            </div>
          ) : (
            activeOrders.map((ord) => {
              const statusKey = (ord.status || '').toLowerCase();
              const isReady = statusKey === 'ready';
              const isServed = statusKey === 'served';
              const itemCount = ord.items ? ord.items.length : 0;
              const totalAmt = parseFloat(ord.total_amount || ord.total || ord.subtotal || 0);

              return (
                <div key={ord.id} className="mobile-billing-card">
                  {/* Card Header Row */}
                  <div className="mobile-card-top-row">
                    <span className="mobile-card-table-name">
                      {ord.table_number || ord.table ? `Table ${getTableDisplayNum(ord.table_number || ord.table)}` : (ord.order_type || 'Takeaway')}
                    </span>
                    <span className="mobile-card-bill-amount">
                      ₹{totalAmt % 1 === 0 ? totalAmt.toFixed(0) : totalAmt.toFixed(2)}
                    </span>
                  </div>

                  {/* Card Item Count Row */}
                  <div className="mobile-card-item-count">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </div>

                  {/* Card Badges Row */}
                  <div className="mobile-card-badges-row">
                    {isReady ? (
                      <span className="badge-ready-serve">Ready to Serve</span>
                    ) : isServed ? (
                      <span className="badge-served-order">Served</span>
                    ) : (
                      <span className="badge-kitchen-order">Order Sent to Kitchen 🔥</span>
                    )}

                    {ord.is_paid ? (
                      <span className="badge-payment-paid">Paid</span>
                    ) : (
                      <span className="badge-payment-unpaid">⏳ Unpaid</span>
                    )}
                  </div>

                  {/* Card Action Button */}
                  <div className="mobile-card-action-row">
                    {isReady ? (
                      <button
                        className="mobile-billing-btn"
                        onClick={() => handleMarkServed(ord.id)}
                      >
                        Mark as served
                      </button>
                    ) : isServed ? (
                      <button
                        className="mobile-billing-btn"
                        onClick={() => handleOpenViewBillSheet(ord)}
                      >
                        View Bill
                      </button>
                    ) : (
                      <button
                        className={`mobile-billing-btn ${!isKitchen ? 'disabled' : ''} preparing`}
                        disabled={!isKitchen}
                        onClick={isKitchen ? () => handleMarkReady(ord.id) : undefined}
                        title={isKitchen ? "Click when kitchen order is ready" : "Order is being prepared in the kitchen (Only kitchen can mark ready)"}
                        style={{
                          cursor: isKitchen ? 'pointer' : 'default',
                        }}
                      >
                        Preparing Your Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ==================== DESKTOP BILLING VIEW ==================== */}
      <div className="desktop-billing-view">
        <div className="page-header">
          <div className="page-title">
            <h1>Billing & Invoicing</h1>
            <p>Generate customer invoices, record payments, and print receipts</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={loadData}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)}>
              <Plus size={16} /> Generate New Bill
            </button>
          </div>
        </div>

        {/* ACTIVE UNBILLED ORDERS SECTION */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.85rem', color: '#171717', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="#d97706" />
            <span>Active Orders Pending Payment ({activeOrders.length})</span>
          </h2>

          {activeOrders.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              No pending orders waiting for payment. Incoming orders ready from kitchen will appear here automatically.
            </div>
          ) : (
            <div className="grid-3" style={{ gap: '1rem' }}>
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="glass-card"
                  style={{
                    borderLeft: ord.status === 'ready' ? '4px solid var(--status-success)' : '4px solid var(--accent-amber)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.15rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Order #{ord.id}</h3>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                          {ord.table ? `Table ${getTableDisplayNum(ord.table)}` : (ord.order_type || 'Dine-In').toUpperCase()}
                        </span>
                      </div>
                      <span className={`badge ${ord.status === 'ready' ? 'badge-green' : 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>
                        {ord.status}
                      </span>
                    </div>

                    {ord.customer_name && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Customer: <strong>{ord.customer_name}</strong>
                      </div>
                    )}

                    {/* Order items snippet */}
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                      {ord.items && ord.items.length > 0 ? (
                        ord.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.quantity}x {item.item_name || item.menu_item_name}</span>
                            <span>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        <span>Items summary in ticket</span>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subtotal</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#350707' }}>
                        ₹{parseFloat(ord.subtotal || 0).toFixed(2)}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      style={{ backgroundColor: '#350707', border: 'none', borderRadius: '12px', padding: '0.5rem 1rem' }}
                      onClick={() => handleOpenGenerateForOrder(ord.id)}
                    >
                      <Receipt size={14} /> Generate Bill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAID BILLS HISTORY TABLE */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.85rem', color: '#171717' }}>
          Invoices & Payment History
        </h2>

        {loading && bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading bills history...
          </div>
        ) : bills.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No generated invoices found yet. Click <strong>Generate Bill</strong> above to bill an order.
          </div>
        ) : (
          <div className="glass-card">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Bill #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Order Ref</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Bill</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                      #{bill.bill_number || bill.id}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      Order #{bill.order}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(bill.created_at).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-amber" style={{ textTransform: 'uppercase' }}>
                        {bill.payment_method || 'CASH'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1rem' }}>
                      ₹{parseFloat(bill.total || bill.total_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowReceiptModal(bill)}
                        >
                          <Printer size={14} /> Receipt
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleShareWhatsApp(bill.id)}
                          title="Share via WhatsApp"
                        >
                          <Share2 size={14} /> WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Generate Bill */}
      {showGenerateModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Generate Bill & Tax Invoice</h2>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>×</button>
            </div>

            <form onSubmit={handleGenerateBill}>
              <div className="form-group">
                <label>Select Order to Bill</label>
                <select
                  className="form-select"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Active Order --</option>
                  {activeOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      Order #{ord.id} - {ord.table ? `Table ${getTableDisplayNum(ord.table)}` : ord.order_type} (₹{ord.subtotal}) - {ord.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>GST Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="form-input"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI / GPay / Paytm</option>
                  <option value="card">💳 Credit / Debit Card</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Calculate & Create Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Receipt */}
      {showReceiptModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '450px', color: '#0f172a', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
            <div className="modal-header" style={{ borderColor: '#e2e8f0' }}>
              <h3 style={{ color: '#0f172a' }}>Official Tax Invoice</h3>
              <button className="modal-close" style={{ color: '#0f172a' }} onClick={() => setShowReceiptModal(null)}>×</button>
            </div>

            <div id="printable-receipt" style={{ textAlign: 'center', margin: '1rem 0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              <img
                src="/logo.png"
                alt="T-Clock Logo"
                style={{ width: '70px', height: '70px', objectFit: 'contain', margin: '0 auto 0.5rem auto' }}
              />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {settings?.name || 'T-CLOCK RESTO CAFE'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0' }}>
                {settings?.address || 'Main Road, Calicut, Kerala'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Ph: {settings?.phone || '+91 98765 43210'} | GSTIN: {settings?.gstin || '32ABCDE1234F1Z5'}
              </p>

              <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', margin: '1rem 0', padding: '0.5rem 0', textAlign: 'left' }}>
                <div>Invoice #: {showReceiptModal.bill_number || `B-${showReceiptModal.id}`}</div>
                <div>Order #: #{showReceiptModal.order}</div>
                <div>Date: {new Date(showReceiptModal.created_at || Date.now()).toLocaleString('en-IN')}</div>
                <div>Payment Mode: {(showReceiptModal.payment_method || 'cash').toUpperCase()}</div>
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Subtotal:</span>
                  <span>₹{parseFloat(showReceiptModal.subtotal || 0).toFixed(2)}</span>
                </div>
                {parseFloat(showReceiptModal.discount_amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Discount:</span>
                    <span>-₹{parseFloat(showReceiptModal.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST Tax ({showReceiptModal.tax_percent || 5}%):</span>
                  <span>+₹{parseFloat(showReceiptModal.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #0f172a' }}>
                  <span>GRAND TOTAL:</span>
                  <span>₹{parseFloat(showReceiptModal.total || showReceiptModal.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              <p style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.75rem' }}>
                {settings?.footer || 'Thank you for visiting T Clock Resto Cafe! 🌴'}
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>
      )}

      {/* ==================== VIEW BILL / SETTLEMENT BOTTOM SHEET ==================== */}
      {selectedBillOrder && (
        <div className="bill-sheet-overlay" onClick={() => setSelectedBillOrder(null)}>
          <div className="bill-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Sheet Header */}
            <div className="bill-sheet-header">
              <div className="bill-sheet-title">
                {selectedBillOrder.table_number || selectedBillOrder.table
                  ? `Table ${getTableDisplayNum(selectedBillOrder.table_number || selectedBillOrder.table)}`
                  : (selectedBillOrder.order_type || 'Takeaway')}
              </div>
              <div className="bill-sheet-header-actions">
                <button
                  type="button"
                  className="bill-sheet-print-btn"
                  onClick={() => window.print()}
                  title="Print Bill"
                >
                  <img
                    src="/print.svg"
                    alt="Print"
                    className="bill-sheet-print-icon"
                  />
                </button>

                <button
                  className="bill-sheet-close-btn"
                  onClick={() => setSelectedBillOrder(null)}
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Bill Preview White Card */}
            <div className="bill-preview">
              <div className="resto-header">
                <h3 className="resto-name">T CLOCK RESTO CAFE</h3>
                <p className="resto-tagline">Time for Tea, Time for Taste</p>
                <p className="resto-address">
                  Main Road, Calicut, Kerala<br />
                  Ph: +91 98765 43210 · GSTIN: 32ABCDE1234F1Z5
                </p>
              </div>
              <div className="bill-divider" />
              <div className="bill-meta-grid">
                <div className="bill-meta-row">
                  <span>Date</span>
                  <span className="bill-meta-val">
                    {new Date(selectedBillOrder.created_at || Date.now()).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="bill-meta-row">
                  <span>Type / Table</span>
                  <span className="bill-meta-val">
                    {selectedBillOrder.table_number || selectedBillOrder.table
                      ? `Table ${getTableDisplayNum(selectedBillOrder.table_number || selectedBillOrder.table)}`
                      : (selectedBillOrder.order_type || 'Takeaway')}
                  </span>
                </div>
                <div className="bill-meta-row">
                  <span>Order #</span>
                  <span className="bill-meta-val">{selectedBillOrder.id}</span>
                </div>
              </div>

              <div className="bill-divider" />

              {/* Items List */}
              <div className="bill-items-list">
                {selectedBillOrder.items && selectedBillOrder.items.length > 0 ? (
                  selectedBillOrder.items.map((it, idx) => (
                    <div key={idx} className="bill-item-line">
                      <span>
                        {it.quantity}× {it.item_name || it.menu_item_name || it.name}
                      </span>
                      <span>₹{(parseFloat(it.unit_price || 0) * it.quantity).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="bill-item-line">
                    <span>Order Items Summary</span>
                    <span>₹{parseFloat(selectedBillOrder.subtotal || selectedBillOrder.total_amount || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="bill-divider" />

              {/* Calculations */}
              <div className="bill-calc-row">
                <span>Subtotal</span>
                <span>
                  ₹{parseFloat(selectedBillOrder.subtotal || selectedBillOrder.total_amount || 0).toFixed(2)}
                </span>
              </div>

              {isIncludeGst && (
                <div className="bill-calc-row">
                  <span>GST (5%)</span>
                  <span>
                    ₹{((parseFloat(selectedBillOrder.subtotal || selectedBillOrder.total_amount || 0) * 5) / 100).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="bill-divider-thick" />

              <div className="bill-total-row">
                <span>TOTAL</span>
                <span>
                  ₹{(
                    parseFloat(selectedBillOrder.subtotal || selectedBillOrder.total_amount || 0) +
                    (isIncludeGst
                      ? (parseFloat(selectedBillOrder.subtotal || selectedBillOrder.total_amount || 0) * 5) / 100
                      : 0)
                  ).toFixed(2)}
                </span>
              </div>

              <div className="bill-footer-msg">
                Thank you for visiting T Clock<br />Resto Cafe! 🌿
              </div>
            </div>

            {/* GST Toggle Selector Segment */}
            <div className="gst-selector-container">
              <button
                className={`gst-option-btn ${isIncludeGst ? 'active' : ''}`}
                onClick={() => setIsIncludeGst(true)}
              >
                {isIncludeGst ? (
                  <CheckCircle size={15} color="#18834B" />
                ) : (
                  <XCircle size={15} color="#94A3B8" />
                )}
                <span>Include GST (5%)</span>
              </button>

              <button
                className={`gst-option-btn ${!isIncludeGst ? 'active' : ''}`}
                onClick={() => setIsIncludeGst(false)}
              >
                {!isIncludeGst ? (
                  <CheckCircle size={15} color="#18834B" />
                ) : (
                  <XCircle size={15} color="#94A3B8" />
                )}
                <span>Exclude GST</span>
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-method-container">
              <div className="payment-section-label">SELECT PAYMENT METHOD</div>
              <div className="payment-grid-2x2">
                <button
                  className={`payment-method-card ${selectedPaymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('cash')}
                >
                  By Cash
                </button>
                <button
                  className={`payment-method-card ${selectedPaymentMethod === 'gpay' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('gpay')}
                >
                  Google pay
                </button>
                <button
                  className={`payment-method-card ${selectedPaymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('card')}
                >
                  Credit / Debit
                </button>
                <button
                  className={`payment-method-card ${selectedPaymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('upi')}
                >
                  UPI (Pay via any App)
                </button>
              </div>
            </div>

            {/* Settle Bill Button */}
            <div className="settle-bill-container">
              <button
                className="settle-bill-btn"
                onClick={handleSettleBill}
                disabled={settlingBill}
              >
                {settlingBill ? 'Settling...' : 'Settle Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {settleSuccessToast && (
        <div className="settle-success-toast">
          Bill Settled Successfully ✓
        </div>
      )}
    </div>
  );
};
