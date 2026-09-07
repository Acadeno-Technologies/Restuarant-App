import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { menuApi } from '../api/menuApi';
import { tablesApi } from '../api/tablesApi';
import { ordersApi } from '../api/ordersApi';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import MenuItemCard from '../components/pos/MenuItemCard';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  ShoppingBag,
  SlidersHorizontal,
  ChevronUp,
  X,
  LogOut,
  Power,
  ShoppingCart
} from 'lucide-react';

export const POSPage = () => {
  const { logout, openProfile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortions, setSelectedPortions] = useState({}); // { itemId: 'Full' | 'Half' | 'Quarter' }
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showViewOrderButton, setShowViewOrderButton] = useState(true);
  const [placedOrderSnapshot, setPlacedOrderSnapshot] = useState(null);
  const [orderSeq, setOrderSeq] = useState(16);

  useEffect(() => {
    if (showMobileCart) {
      ordersApi.getOrders().then((res) => {
        const list = res.results || res;
        if (Array.isArray(list)) {
          setOrderSeq(list.length + 1);
        }
      }).catch(() => {});
    }
  }, [showMobileCart]);

  // Lock body scroll when any modal/sheet is active
  useEffect(() => {
    const isModalOpen = Boolean(showMobileCart || showLogoutModal || showTablePicker);
    if (isModalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showMobileCart, showLogoutModal, showTablePicker]);

  const {
    cartItems,
    hasDraftItems,
    selectedTable,
    setSelectedTable,
    activeTableOrder,
    loadingActiveOrder,
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    orderNotes,
    setOrderNotes,
    addToCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    placeOrder,
    isSubmitting,
  } = useOrder();

  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const [catsRes, itemsRes, tablesRes] = await Promise.allSettled([
        menuApi.getCategories(),
        menuApi.getMenuItems(),
        tablesApi.getTables(),
      ]);

      if (catsRes.status === 'fulfilled' && catsRes.value) {
        setCategories(catsRes.value.results || catsRes.value);
      }
      if (itemsRes.status === 'fulfilled' && itemsRes.value) {
        setMenuItems(itemsRes.value.results || itemsRes.value);
      }
      if (tablesRes.status === 'fulfilled' && tablesRes.value) {
        setTables(tablesRes.value.results || tablesRes.value);
      }
    } catch (err) {
      console.error('Error fetching POS dynamic data:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(true);

    // Auto-sync with Admin backend data updates on tab focus & periodic poll
    const handleFocus = () => {
      if (!document.hidden) fetchData(false);
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchData(false);
      }
    }, 12000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);


  useEffect(() => {
    if (location.state?.openOrderSheet) {
      setShowMobileCart(true);
    }
  }, [location.state]);

  const handlePlaceOrder = async () => {
    try {
      setOrderSuccess(null);
      setPlacedOrderSnapshot({
        items: [...cartItems],
        subtotal: subtotal,
      });
      await placeOrder();
      setShowViewOrderButton(false);
      setOrderSuccess('Order Sent to Kitchen 🔥');
      fetchData();
      setTimeout(() => {
        setOrderSuccess(null);
        setPlacedOrderSnapshot(null);
        setShowMobileCart(false);
      }, 2500);
    } catch (err) {
      setPlacedOrderSnapshot(null);
      const errorMsg =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : null) ||
        err.message ||
        'Failed to place order';
      console.error('Order error:', errorMsg);
      alert(errorMsg);
    }
  };

  const handlePortionSelect = (itemId, portion) => {
    setSelectedPortions((prev) => ({ ...prev, [itemId]: portion }));
  };

  const getPortion = (itemId) => selectedPortions[itemId] || 'Full';

  const getCartItem = (menuItemId, portion) => {
    return cartItems.find(
      (ci) => String(ci.menu_item?.id) === String(menuItemId) && ci.portion === portion
    );
  };

  // Filter items dynamically by category and search
  const filteredItems = menuItems.filter((item) => {
    const itemCatId = typeof item.category === 'object' ? item.category?.id : item.category;
    const matchesCategory =
      selectedCategory === 'all' ||
      itemCatId === parseInt(selectedCategory) ||
      itemCatId === selectedCategory ||
      item.category_name === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const taxAmount = subtotal * 0.05;
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="pos-page-wrapper">
      <style>{`
        .pos-page-wrapper {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
          min-height: calc(100vh - 2rem);
          padding-bottom: 5.5rem;
        }

        .pos-search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.85rem;
          margin-bottom: 1rem;
          width: 100%;
          box-sizing: border-box;
        }

        .search-input-box {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .search-input-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 30px;
          font-size: 0.95rem;
          color: #171717;
          outline: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          box-sizing: border-box;
        }

        .filter-btn-pill {
          padding: 0.75rem 1.25rem;
          border-radius: 30px;
          background: #350707;
          color: #ffffff;
          border: none;
          font-size: 0.88rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(53, 7, 7, 0.25);
          flex-shrink: 0;
        }

        .search-action-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #350707;
          color: #ffffff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(53, 7, 7, 0.25);
        }

        /* Horizontally scrollable category pills */
        .category-scroll-row {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          margin-bottom: 1.25rem;
          scrollbar-width: none;
          max-width: 100%;
        }

        .category-scroll-row::-webkit-scrollbar {
          display: none;
        }

        .category-pill {
          padding: 0.55rem 1.2rem;
          border-radius: 24px;
          font-size: 0.85rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #171717;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .category-pill.active {
          background: #350707;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(53, 7, 7, 0.25);
        }

        /* Food Grid Layout */
        .food-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 768px) and (max-width: 1199px) {
          .pos-page-container {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 320px;
            gap: 16px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .food-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }
        }

        @media (min-width: 1200px) {
          .pos-page-wrapper {
            padding-bottom: 1.5rem;
          }

          .pos-page-container {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 390px;
            gap: 20px;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
            align-items: start;
          }

          .food-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
        }

        .food-card {
          width: 100%;
          max-width: 160px;
          height: 295px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          padding: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          box-sizing: border-box;
        }

        .food-card-img {
          width: 100%;
          height: 145px;
          object-fit: cover;
          border-radius: 12px;
          background: #f8fafc;
          margin-bottom: 0.5rem;
        }

        .portion-pill-group {
          display: flex;
          gap: 0.2rem;
          margin-top: 0.35rem;
          margin-bottom: 0.5rem;
        }

        .portion-pill {
          flex: 1;
          padding: 0.2rem 0;
          font-size: 0.68rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          text-align: center;
        }

        .portion-pill.active {
          background: #B77D55;
          color: #ffffff;
          border-color: #B77D55;
        }

        .add-cart-btn {
          width: 137px;
          min-width: 137px;
          max-width: 137px;
          height: 26px;
          min-height: 26px;
          max-height: 26px;
          margin: 0 auto;
          padding: 0;
          border-radius: 10px;
          background: #B77D55;
          color: #ffffff;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          box-shadow: 0 4px 10px rgba(183, 125, 85, 0.25);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .add-cart-btn:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
        }

        .quantity-control-bar {
          width: 133px;
          min-width: 133px;
          max-width: 133px;
          height: 22px;
          min-height: 22px;
          max-height: 22px;
          margin: 0 auto;
          padding: 0;
          background: #FCE4D0;
          border: 1px solid #E5D5C8;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
        }

        .qty-btn {
          width: 32px;
          height: 22px;
          padding: 0;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 0;
          background: transparent;
          color: #171717;
          border: none;
          cursor: pointer;
          font-weight: 800;
          font-size: 14px;
        }

        /* Desktop Current Order Panel */
        .desktop-cart-panel {
          width: 390px;
          min-width: 390px;
          max-width: 390px;
          box-sizing: border-box;
          background: #ffffff;
          border-radius: 20px;
          padding: 1.25rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 1rem;
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          .desktop-cart-panel {
            display: none !important;
          }

          .pos-page-wrapper {
            padding-bottom: 90px !important;
          }

          .view-order-pill {
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            bottom: 90px;
            background: #350707;
            color: #ffffff;
            border-radius: 9999px;
            padding: 0.75rem 1.4rem;
            font-size: 0.925rem;
            font-weight: 700;
            box-shadow: 0 8px 24px rgba(53, 7, 7, 0.35);
            z-index: 9990;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            white-space: nowrap;
            transition: all 0.2s ease;
          }

          .view-order-pill:active {
            transform: translateX(-50%) scale(0.98);
          }
        }
      `}</style>

      <div className="pos-page-container">
        {/* Menu Area */}
        <div style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
          {orderSuccess && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.85rem 1rem', borderRadius: '14px', marginBottom: '1rem', fontWeight: 600 }}>
              {orderSuccess}
            </div>
          )}

          {/* Search Bar & Profile Avatar Row */}
          <div className="pos-mobile-top-bar">
            <div className="search-input-box">
              <Search size={18} className="search-icon-svg" />
              <input
                type="text"
                placeholder="Search coffee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Profile Avatar Trigger */}
            <div
              className="pos-mobile-avatar-trigger"
              onClick={openProfile}
              title="Open Profile"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              ) : (
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#F5F1EF', border: '1.5px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#350505' }}>
                  {user?.username ? user.username[0].toUpperCase() : 'A'}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="category-scroll-row">
            <button
              className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Dynamic Menu Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
              Loading dynamic menu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '16px', color: '#64748b' }}>
              <h4 style={{ color: '#171717', marginBottom: '0.5rem' }}>No menu items found</h4>
              <p style={{ fontSize: '0.85rem' }}>Items added by Admin will appear here automatically.</p>
            </div>
          ) : (
            <div className="food-grid">
              {filteredItems.map((item) => {
                const currentPortion = getPortion(item.id);
                const cartItem = getCartItem(item.id, currentPortion);

                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    currentPortion={currentPortion}
                    cartItem={cartItem}
                    onPortionSelect={handlePortionSelect}
                    onAdd={addToCart}
                    onUpdateQty={updateQuantity}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Current Order Panel (Hidden on Mobile screens <= 1024px) */}
        <div className="desktop-cart-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#171717', margin: 0 }}>
              Current Order
            </h3>

            {/* Table Badge Selector */}
            <select
              className="form-select"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#350707', fontWeight: 700 }}
              value={selectedTable?.id || ''}
              onChange={(e) => {
                const t = tables.find((tbl) => tbl.id === parseInt(e.target.value));
                setSelectedTable(t || null);
              }}
            >
              <option value="">Table --</option>
              {tables.map((tbl) => (
                <option key={tbl.id} value={tbl.id}>
                  Table {String(tbl.number).replace(/^T/i, '')}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem', width: '100%', boxSizing: 'border-box' }}
              placeholder="Cust. Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem', width: '100%', boxSizing: 'border-box' }}
              placeholder="Phone No"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          {/* Order Items List */}
          <div style={{ flex: 1, minHeight: '180px', maxHeight: '340px', overflowY: 'auto', marginBottom: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                No items added yet. Click Add on dishes to build ticket.
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={idx} style={{ padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
                  <img
                    src={resolveImageUrl(item.menu_item.image, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80')}
                    alt={item.menu_item.name}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: '#f8fafc', flexShrink: 0 }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#171717', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.menu_item.name} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({item.portion})</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#B77D55', fontWeight: 700 }}>
                      ₹{parseFloat(item.unit_price).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                    <button className="qty-btn" style={{ width: '22px', height: '22px' }} onClick={() => updateQuantity(item.menu_item.id, item.portion, -1)}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                    <button className="qty-btn" style={{ width: '22px', height: '22px' }} onClick={() => updateQuantity(item.menu_item.id, item.portion, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.85rem', minWidth: '50px', textAlign: 'right', color: '#171717', flexShrink: 0 }}>
                    ₹{(item.unit_price * item.quantity).toFixed(2)}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.menu_item.id, item.portion)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Summary Breakdown */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem', color: '#64748b' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 700, color: '#171717' }}>₹{subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.88rem', color: '#64748b' }}>
              <span>Tax (5%)</span>
              <span style={{ fontWeight: 700, color: '#171717' }}>₹{taxAmount.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 800 }}>
              <span style={{ color: '#171717' }}>Total</span>
              <span style={{ color: '#350707' }}>₹{grandTotal.toFixed(2)}</span>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', backgroundColor: '#350707', borderRadius: '14px', height: '48px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxSizing: 'border-box' }}
              disabled={cartItems.length === 0 || isSubmitting}
              onClick={handlePlaceOrder}
            >
              <Send size={18} />
              <span>{isSubmitting ? 'Processing...' : 'Proceed to Billing'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Floating View Order Pill */}
        {showViewOrderButton && hasDraftItems && (
          <div className="view-order-pill" onClick={() => setShowMobileCart(true)}>
            <span>View your Order 👀</span>
          </div>
        )}

        {/* Order Sent to Kitchen Success Toast */}
        {orderSuccess && (
          <div
            style={{
              position: 'fixed',
              bottom: '90px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#2D0806',
              color: '#ffffff',
              padding: '0.75rem 1.35rem',
              borderRadius: '30px',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 8px 24px rgba(45, 8, 6, 0.45)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <span>{orderSuccess}</span>
          </div>
        )}

        {/* Mobile Slide-Up Order Drawer Modal */}
        {showMobileCart && (
          <div
            className="order-overlay"
            onClick={() => setShowMobileCart(false)}
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
          >
            <div className="order-sheet" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="order-sheet-header">
                <h2 className="order-sheet-title">Your Order</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="order-sheet-order-id">
                    #{activeTableOrder?.id || orderSeq || '16'}
                  </span>
                  <button
                    className="order-sheet-close"
                    onClick={() => setShowMobileCart(false)}
                    aria-label="Close"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Table Info Pill Container */}
              <div className="order-table-card">
                <div className="order-table-card-left">
                  <img
                    src="/order-logo.png"
                    alt="Table Icon"
                    className="order-table-icon"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/tables-icon.png';
                    }}
                  />
                  <span className="order-table-name">
                    {selectedTable ? `Table ${String(selectedTable.number || '').replace(/^Table\s*/i, '').replace(/^T/i, '').replace(/[-_\s]/g, '') || '1'}` : 'Table 1'}
                  </span>
                </div>
                <div className="order-table-card-right">
                  <span>
                    {orderType === 'dine_in' ? 'Dine In' : 'Takeaway'} ·{' '}
                    {(selectedTable?.section || '').toLowerCase().includes('out') ? 'Outdoor' : 'Indoor'} ·{' '}
                    {selectedTable?.capacity || 4} seats
                  </span>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="order-cart-list">
                {(() => {
                  let displayItems = [];
                  if (orderSuccess && placedOrderSnapshot?.items) {
                    displayItems = placedOrderSnapshot.items;
                  } else if (cartItems.length > 0) {
                    displayItems = cartItems;
                  } else if (activeTableOrder && Array.isArray(activeTableOrder.items)) {
                    displayItems = activeTableOrder.items.map((item) => ({
                      order_item_id: item.id,
                      menu_item: {
                        id: item.menu_item,
                        name: item.menu_item_name || 'Item',
                        price: parseFloat(item.unit_price || 0),
                        image: item.menu_item_image || '',
                      },
                      quantity: item.quantity,
                      unit_price: parseFloat(item.unit_price || 0),
                      portion: item.portion || 'Full',
                      notes: item.notes || '',
                    }));
                  }

                  if (loadingActiveOrder) {
                    return (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#6F625C', fontSize: '14px', fontWeight: 600 }}>
                        Loading order...
                      </div>
                    );
                  }
                  if (displayItems.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#6F625C', fontSize: '14px' }}>
                        {selectedTable ? 'No active order items found for this table.' : 'Your cart is empty. Add food items to start an order.'}
                      </div>
                    );
                  }
                  return displayItems.map((item, idx) => {
                    const itemPrice = (item.unit_price || item.menu_item?.price || 0) * item.quantity;
                    return (
                      <div key={`${item.menu_item?.id || idx}-${item.portion}-${idx}`} className="order-cart-item">
                        <div className="order-item-left">
                          <span className="order-item-name">
                            {item.menu_item?.name || 'Item'}
                            {item.portion && item.portion !== 'Full' ? ` (${item.portion})` : ''}
                          </span>
                        </div>

                        <div className="order-item-qty">
                          <button
                            className="order-qty-btn"
                            onClick={() => updateQuantity(item.menu_item?.id || item.menu_item, item.portion, -1)}
                          >
                            −
                          </button>
                          <span className="order-qty-num">{item.quantity}</span>
                          <button
                            className="order-qty-btn"
                            onClick={() => updateQuantity(item.menu_item?.id || item.menu_item, item.portion, 1)}
                          >
                            +
                          </button>
                        </div>

                        <div className="order-item-right">
                          <span className="order-item-price">
                            ₹{itemPrice.toFixed(2)}
                          </span>
                          <button
                            className="order-item-remove"
                            onClick={() => removeFromCart(item.menu_item?.id || item.menu_item, item.portion)}
                            title="Remove item"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Order Summary Card */}
              {(() => {
                let displayItems = [];
                if (orderSuccess && placedOrderSnapshot?.items) {
                  displayItems = placedOrderSnapshot.items;
                } else if (cartItems.length > 0) {
                  displayItems = cartItems;
                } else if (activeTableOrder && Array.isArray(activeTableOrder.items)) {
                  displayItems = activeTableOrder.items.map((item) => ({
                    unit_price: parseFloat(item.unit_price || 0),
                    quantity: item.quantity,
                  }));
                }

                const currentSubtotal = displayItems.reduce(
                  (sum, item) => sum + (item.unit_price || item.menu_item?.price || 0) * item.quantity,
                  0
                );

                return (
                  <div className="order-summary-card" style={{ position: 'relative' }}>
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>₹{currentSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>GST (5%)</span>
                      <span>₹{(currentSubtotal * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row summary-total">
                      <span>Total</span>
                      <span>₹{(currentSubtotal * 1.05).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}


              {/* Notes for the Kitchen Section */}
              <div className="order-kitchen-notes-section">
                <div className="order-kitchen-notes-title">Notes for the Kitchen</div>
                <div className="order-kitchen-notes-box">
                  <textarea
                    id="order-kitchen-notes-input"
                    className="order-kitchen-notes-input"
                    placeholder="Any concerns? e.g. less spicy, no sugar in tea, nut allergy..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Floating Order Sent to Kitchen 🔥 Pill */}
              {orderSuccess && (
                <div className="order-sheet-sent-badge">
                  <span>{orderSuccess}</span>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="order-sheet-actions">
                <button
                  className="btn-add-item"
                  onClick={() => setShowMobileCart(false)}
                >
                  Add Item
                </button>
                <button
                  className="btn-place-order"
                  disabled={cartItems.length === 0 || isSubmitting}
                  onClick={handlePlaceOrder}
                >
                  {isSubmitting ? 'Placing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom-Sheet Logout Confirmation Modal */}
        {showLogoutModal && (
          <div
            className="logout-modal-backdrop"
            onClick={() => setShowLogoutModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              zIndex: 10010,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              className="logout-modal-sheet"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                height: '362px',
                width: '100%',
                maxWidth: '100vw',
                background: '#ffffff',
                borderRadius: '30px 30px 0 0',
                padding: '24px 24px calc(24px + env(safe-area-inset-bottom)) 24px',
                boxSizing: 'border-box',
                boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.15)',
                zIndex: 10011,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Power Icon Badge */}
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                flexShrink: 0
              }}>
                <Power size={22} color="#B77D55" strokeWidth={2} />
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#171717',
                textAlign: 'center',
                margin: '0 0 8px 0',
                lineHeight: 1.2
              }}>
                Logout?
              </h3>

              {/* Confirmation Text */}
              <p style={{
                fontSize: '13px',
                lineHeight: '18px',
                color: '#374151',
                textAlign: 'center',
                maxWidth: '280px',
                margin: '0 auto 24px auto',
                fontWeight: 400
              }}>
                Are you sure you want to log out of your session?
              </p>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '24px',
                  background: '#B77D55',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                  marginBottom: '16px'
                }}
              >
                Logout
              </button>

              {/* Stay Logged In Button */}
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  color: '#B77D55',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 12px'
                }}
              >
                Stay Logged In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};