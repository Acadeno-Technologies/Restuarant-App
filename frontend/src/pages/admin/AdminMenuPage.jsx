import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';
import { menuApi } from '../../api/menuApi';
import { UserAvatarPlaceholder } from '../../components/common/UserAvatarPlaceholder';
import { AddMenuItemModal } from '../../components/admin/AddMenuItemModal';
import { AddCategoryModal } from '../../components/admin/AddCategoryModal';
import { EditCategoryModal } from '../../components/admin/EditCategoryModal';
import { EditMenuItemModal } from '../../components/admin/EditMenuItemModal';
import { AdminParcelModal } from '../../components/admin/AdminParcelModal';
import { AdminParcelOrderModal } from '../../components/admin/AdminParcelOrderModal';
import { AdminBillModal } from '../../components/admin/AdminBillModal';
import { Search, Pencil, Trash2, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../../utils/imageUrl';

/**
 * Resolve backend image URL strictly from database record
 */
const getFoodImage = (item) => {
  return resolveImageUrl(item?.image, null);
};

/**
 * AdminMenuPage
 *
 * Menu Catalogue Overview strictly rendering backend values:
 * - Categories strictly from backend database
 * - Dishes, descriptions, portion prices, veg/non-veg strictly from backend
 * - Backend image resolution with clean neutral placeholder fallback
 */
export const AdminMenuPage = () => {
  const { user, openProfile } = useAuth();
  const { cartItems, addToCart, updateQuantity } = useOrder();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Diet Type filter state (strictly from backend values)
  const [selectedDietType, setSelectedDietType] = useState('All');
  const [isDietDropdownOpen, setIsDietDropdownOpen] = useState(false);
  const [dietTypeOptions, setDietTypeOptions] = useState(['All', 'Veg', 'Non-Veg']);

  // Modals
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  const [isOrderViewModalOpen, setIsOrderViewModalOpen] = useState(false);
  const [billModalOrder, setBillModalOrder] = useState(null);


  const loadMenuData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes, optRes] = await Promise.allSettled([
        menuApi.getCategories(),
        menuApi.getMenuItems(),
        menuApi.getMenuOptions(),
      ]);

      if (catRes.status === 'fulfilled') {
        const list = catRes.value.results || catRes.value;
        if (Array.isArray(list)) setCategories(list);
      }

      if (itemRes.status === 'fulfilled') {
        const list = itemRes.value.results || itemRes.value;
        if (Array.isArray(list)) setMenuItems(list);
      }

      if (optRes.status === 'fulfilled' && optRes.value?.diet_types && Array.isArray(optRes.value.diet_types)) {
        const cleanDiets = optRes.value.diet_types.filter(Boolean);
        setDietTypeOptions(['All', ...cleanDiets]);
      } else if (itemRes.status === 'fulfilled') {
        const list = itemRes.value.results || itemRes.value;
        if (Array.isArray(list)) {
          const backendDiets = Array.from(
            new Set(
              list
                .map((i) => i.diet_type || (i.is_veg ? 'Veg' : 'Non-Veg'))
                .filter(Boolean)
            )
          );
          setDietTypeOptions(['All', ...backendDiets]);
        }
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadMenuData();
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      setIsDietDropdownOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Filter items strictly against backend category id / name & diet type
  const filteredItems = menuItems.filter((item) => {
    const itemCatName = (item.category_name || (item.category_data && item.category_data.name) || '').toLowerCase();
    const itemCatId = String(item.category || (item.category_data && item.category_data.id) || '');

    const matchesCat =
      activeCategory === 'All' ||
      itemCatId === String(activeCategory) ||
      itemCatName === String(activeCategory).toLowerCase();

    const matchesSearch =
      !search ||
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase());

    const matchesDiet = (() => {
      if (selectedDietType === 'All') return true;
      if (selectedDietType.toLowerCase() === 'veg') {
        return item.is_veg === true || (item.diet_type && item.diet_type.toLowerCase() === 'veg');
      }
      if (selectedDietType.toLowerCase() === 'non-veg') {
        return item.is_veg === false || (item.diet_type && item.diet_type.toLowerCase() === 'non-veg');
      }
      return item.diet_type && item.diet_type.toLowerCase() === selectedDietType.toLowerCase();
    })();

    return matchesCat && matchesSearch && matchesDiet;
  });


  const [selectedPortions, setSelectedPortions] = useState({});

  // Calculate live quantity for a menu item in cart
  const getItemQuantity = (itemId, portion) => {
    if (!cartItems || !Array.isArray(cartItems)) return 0;
    const itemEntries = cartItems.filter((c) => {
      const matchId = String(c.menu_item?.id || c.menu_item) === String(itemId);
      if (!matchId) return false;
      if (portion) return (c.portion || 'Full') === portion;
      return true;
    });
    return itemEntries.reduce((total, c) => total + (c.quantity || 0), 0);
  };

  // Total items in order
  const totalOrderCount = (cartItems || []).reduce((acc, item) => acc + (item.quantity || 0), 0);

  // Delete item handler
  const handleDeleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await menuApi.deleteMenuItem(item.id);
        setMenuItems((prev) => prev.filter((i) => i.id !== item.id));
      } catch (err) {
        console.error('Failed to delete item:', err);
        alert('Failed to delete menu item');
      }
    }
  };

  // Delete category handler
  const handleDeleteCategory = async (cat, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      try {
        await menuApi.deleteCategory(cat.id);
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        if (
          activeCategory === cat.id ||
          String(activeCategory).toLowerCase() === cat.name.toLowerCase()
        ) {
          setActiveCategory('All');
        }
      } catch (err) {
        console.error('Failed to delete category:', err);
        alert('Failed to delete category');
      }
    }
  };

  // Category updated handler
  const handleCategoryUpdated = (updatedCat) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
    if (activeCategory === updatedCat.id) {
      setActiveCategory(updatedCat.id);
    }
  };

  // Strict backend categories list
  const displayCategories = [
    { id: 'All', name: 'All Items' },
    ...categories.map((c) => ({ id: c.id, name: c.name, description: c.description })),
  ];

  return (
    <div className="admin-menu-page-root">
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
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <UserAvatarPlaceholder user={user} size={42} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN WHITE CONTENT CONTAINER
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-menu-main-card">
        {/* Header */}
        <div className="admin-menu-header-row">
          <div>
            <h1 className="admin-menu-title">Menu Catalogue Overview</h1>
            <p className="admin-menu-subtitle">Manage your menu items, categories, pricing, and availability</p>
          </div>

          <div className="admin-menu-header-actions">
            <button
              type="button"
              className="admin-menu-btn-parcel-orders"
              onClick={() => setIsParcelModalOpen(true)}
            >
              Parcel Orders
            </button>
            <button
              type="button"
              className="admin-menu-btn-add-category"
              onClick={() => setIsAddCatModalOpen(true)}
            >
              + Add Category
            </button>
            <button
              type="button"
              className="admin-menu-btn-add-item"
              onClick={() => setIsAddItemModalOpen(true)}
            >
              + Add New Item
            </button>
          </div>
        </div>

        {/* Category Tabs & Diet Type Filter Row */}
        <div className="admin-menu-tabs-and-filter-row">
          {/* Category Tabs Row (Strictly Backend Categories with Edit/Delete) */}
          <div className="admin-menu-category-tabs-row">
            {displayCategories.map((cat) => {
              const isActive =
                activeCategory === cat.id ||
                (activeCategory === 'All' && cat.id === 'All') ||
                String(activeCategory).toLowerCase() === cat.name.toLowerCase();

              const isAll = cat.id === 'All';

              return (
                <div
                  key={cat.id}
                  className={`admin-menu-category-pill ${isAll ? 'all-items' : ''} ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="admin-category-pill-name">{cat.name}</span>

                  {!isAll && (
                    <div className="admin-category-pill-actions">
                      <button
                        type="button"
                        className="admin-category-pill-action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(cat);
                        }}
                        title={`Edit ${cat.name}`}
                      >
                        <Pencil size={11.5} color="#1F2937" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        className="admin-category-pill-action-btn delete"
                        onClick={(e) => handleDeleteCategory(cat, e)}
                        title={`Delete ${cat.name}`}
                      >
                        <Trash2 size={11.5} color="#DC2626" strokeWidth={2.4} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Diet Type Dropdown on Right */}
          <div className="admin-diet-filter-wrap">
            <button
              type="button"
              className={`admin-diet-filter-btn ${selectedDietType !== 'All' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsDietDropdownOpen(!isDietDropdownOpen);
              }}
            >
              <img
                src="/diet.png"
                alt="Diet Type"
                className="admin-diet-icon-img"
              />
              <span className="admin-diet-filter-label">
                {selectedDietType === 'All' ? 'Diet Type' : selectedDietType}
              </span>
              <ChevronDown
                size={14}
                color="#4B5563"
                style={{
                  transform: isDietDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>


            {isDietDropdownOpen && (
              <div
                className="admin-diet-dropdown-menu"
                onClick={(e) => e.stopPropagation()}
              >
                {dietTypeOptions.map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    className={`admin-diet-dropdown-item ${selectedDietType === dt ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDietType(dt);
                      setIsDietDropdownOpen(false);
                    }}
                  >
                    <span>{dt === 'All' ? 'All Diet Types' : dt}</span>
                    {selectedDietType === dt && <span className="admin-diet-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>



        {/* Subtle Horizontal Divider */}
        <div className="admin-menu-tabs-divider" />

        {/* Content Area */}
        {loading ? (
          <div className="admin-menu-loading-box">
            <p>Loading menu catalogue...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* ── Empty State ── */
          <div className="admin-menu-empty-state">
            <div className="admin-menu-empty-icon-box">
              <img
                src="/menu-empty.png"
                alt="No items found"
                style={{
                  width: '46px',
                  height: '46px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <h2 className="admin-menu-empty-title">No Items Found</h2>
            <p className="admin-menu-empty-desc">
              There are no dishes in this category yet. Add your first one to get started.
            </p>
            <button
              type="button"
              className="admin-menu-empty-btn"
              onClick={() => setIsAddItemModalOpen(true)}
            >
              + Add Your First Item
            </button>
          </div>
        ) : (
          /* ── Responsive Menu Items Grid ── */
          <div className="admin-menu-cards-grid">
            {filteredItems.map((item) => {
              const hasPortions = Boolean(item.half_price || item.quarter_price);
              const currentPortion = hasPortions ? (selectedPortions[item.id] || 'Full') : 'Full';

              const displayPrice = (() => {
                if (hasPortions) {
                  if (currentPortion === 'Half' && item.half_price) return parseFloat(item.half_price).toFixed(2);
                  if (currentPortion === 'Quarter' && item.quarter_price) return parseFloat(item.quarter_price).toFixed(2);
                }
                return parseFloat(item.price).toFixed(2);
              })();

              const qty = getItemQuantity(item.id, currentPortion);
              const foodImg = getFoodImage(item);

              return (
                <div key={item.id} className="admin-menu-food-card">
                  {/* Food Image Container */}
                  <div className="admin-menu-card-image-wrap">
                    {foodImg ? (
                      <img
                        src={foodImg}
                        alt={item.name}
                        className="admin-menu-card-image"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="admin-menu-card-image-placeholder">
                        <UtensilsCrossed size={38} color="#A88B7B" strokeWidth={1.8} />
                      </div>
                    )}

                    {/* Top-Left Veg / Non-Veg Badge */}
                    <div className="admin-menu-card-badge">
                      <span className={`admin-badge-dot ${item.is_veg ? 'veg' : 'non-veg'}`}>●</span>
                      <span>{item.is_veg ? 'Veg' : 'Non-Veg'}</span>
                    </div>

                    {/* Top-Right Edit & Delete Action Buttons */}
                    <div className="admin-menu-card-actions">
                      <button
                        type="button"
                        className="admin-menu-card-action-btn edit"
                        onClick={() => setEditingItem(item)}
                        title="Edit Item"
                      >
                        <Pencil size={14} color="#374151" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        className="admin-menu-card-action-btn delete"
                        onClick={() => handleDeleteItem(item)}
                        title="Delete Item"
                      >
                        <Trash2 size={14} color="#DC2626" strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="admin-menu-card-body">
                    <h3 className="admin-menu-card-name">{item.name}</h3>
                    <div className="admin-menu-card-price">
                      ₹ {displayPrice}
                    </div>

                    {/* Portion Badges: Rendered for multi-portion dishes */}
                    {hasPortions && (
                      <div className="admin-menu-card-portions">
                        <button
                          type="button"
                          className={`admin-portion-pill ${currentPortion === 'Full' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPortions((prev) => ({ ...prev, [item.id]: 'Full' }));
                          }}
                        >
                          Full
                        </button>
                        {item.half_price && (
                          <button
                            type="button"
                            className={`admin-portion-pill ${currentPortion === 'Half' ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPortions((prev) => ({ ...prev, [item.id]: 'Half' }));
                            }}
                          >
                            Half
                          </button>
                        )}
                        {item.quarter_price && (
                          <button
                            type="button"
                            className={`admin-portion-pill ${currentPortion === 'Quarter' ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPortions((prev) => ({ ...prev, [item.id]: 'Quarter' }));
                            }}
                          >
                            Quarter
                          </button>
                        )}
                      </div>
                    )}

                    {/* Short Description (Only from Backend) */}
                    {item.description ? (
                      <p className="admin-menu-card-desc">{item.description}</p>
                    ) : null}

                    {/* Add Button or Quantity Selector */}
                    <div className="admin-menu-card-action-wrap">
                      {qty === 0 ? (
                        <button
                          type="button"
                          className="admin-menu-card-add-btn"
                          onClick={() => addToCart(item, currentPortion)}
                        >
                          Add
                        </button>
                      ) : (
                        <div className="admin-menu-card-qty-selector">
                          <button
                            type="button"
                            className="admin-menu-qty-btn minus"
                            onClick={() => updateQuantity(item.id, currentPortion, -1)}
                          >
                            −
                          </button>
                          <span className="admin-menu-qty-val">{qty}</span>
                          <button
                            type="button"
                            className="admin-menu-qty-btn plus"
                            onClick={() => updateQuantity(item.id, currentPortion, 1)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Fixed "View your Order" Action (Visible immediately without scrolling) */}
        {totalOrderCount > 0 && (
          <div className="admin-menu-bottom-order-bar">
            <button
              type="button"
              className="admin-menu-view-order-btn"
              onClick={() => setIsOrderViewModalOpen(true)}
            >
              <span>View your Order</span>
              <span>👀</span>
            </button>
          </div>
        )}

      </div>


      {/* ── Modals ── */}
      <AddCategoryModal
        isOpen={isAddCatModalOpen}
        onClose={() => setIsAddCatModalOpen(false)}
        onCategoryCreated={(newCat) => {
          setCategories((prev) => [...prev, newCat]);
          setActiveCategory(newCat.id);
        }}
      />

      <EditCategoryModal
        isOpen={!!editingCategory}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onCategoryUpdated={handleCategoryUpdated}
      />

      <AddMenuItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        categories={categories}
        onItemCreated={() => {
          loadMenuData();
        }}
      />

      <EditMenuItemModal
        isOpen={!!editingItem}
        item={editingItem}
        categories={categories}
        onClose={() => setEditingItem(null)}
        onItemUpdated={() => {
          loadMenuData();
        }}
      />

      <AdminParcelModal
        isOpen={isParcelModalOpen}
        onClose={() => setIsParcelModalOpen(false)}
        onViewBill={(order) => {
          setIsParcelModalOpen(false);
          setBillModalOrder(order);
        }}
        onOrderCreated={() => {
          loadMenuData();
        }}
      />

      {/* Bill & Settlement Modal */}
      <AdminBillModal
        isOpen={!!billModalOrder}
        table={null}
        order={billModalOrder}
        onClose={() => {
          setBillModalOrder(null);
          setIsParcelModalOpen(true);
        }}
        onBillSettled={() => {
          setBillModalOrder(null);
          setIsParcelModalOpen(true);
          loadMenuData();
        }}
      />

      {/* Parcel Order (View Order) Modal matching user reference */}
      <AdminParcelOrderModal
        isOpen={isOrderViewModalOpen}
        onClose={() => setIsOrderViewModalOpen(false)}
        onOrderPlaced={() => {
          loadMenuData();
          setIsOrderViewModalOpen(false);
        }}
      />
    </div>
  );
};

export default AdminMenuPage;

