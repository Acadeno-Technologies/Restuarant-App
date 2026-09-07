import React, { useState, useEffect } from 'react';
import { menuApi } from '../api/menuApi';
import { tablesApi } from '../api/tablesApi';
import { Utensils, Plus, Edit, Trash2, Leaf, Flame, Image, RefreshCw } from 'lucide-react';

export const MenuPage = () => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [qrFilter, setQrFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);

  // Item Form state
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [halfPrice, setHalfPrice] = useState('');
  const [quarterPrice, setQuarterPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState(1);
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);

  // Category Form state
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes, tablesRes] = await Promise.allSettled([
        menuApi.getCategories(),
        menuApi.getMenuItems(),
        tablesApi.getTables(),
      ]);
      if (catRes.status === 'fulfilled' && catRes.value) {
        setCategories(catRes.value.results || catRes.value);
      }
      if (itemRes.status === 'fulfilled' && itemRes.value) {
        setMenuItems(itemRes.value.results || itemRes.value);
      }
      if (tablesRes.status === 'fulfilled' && tablesRes.value) {
        const loadedTables = tablesRes.value.results || tablesRes.value;
        setTables(Array.isArray(loadedTables) ? loadedTables : []);
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemDesc(item.description || '');
      setItemPrice(item.price || '');
      setHalfPrice(item.half_price || '');
      setQuarterPrice(item.quarter_price || '');
      setItemCategory(item.category);
      setIsVeg(item.is_veg);
      setSpiceLevel(item.spice_level || 1);
      setIsAvailable(item.is_available);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDesc('');
      setItemPrice('');
      setHalfPrice('');
      setQuarterPrice('');
      setItemCategory(categories[0]?.id || '');
      setIsVeg(true);
      setSpiceLevel(1);
      setIsAvailable(true);
    }
    setImageFile(null);
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', itemName);
    formData.append('description', itemDesc);
    formData.append('price', itemPrice);
    if (halfPrice) formData.append('half_price', halfPrice);
    if (quarterPrice) formData.append('quarter_price', quarterPrice);
    if (itemCategory) formData.append('category', itemCategory);
    formData.append('is_veg', isVeg);
    formData.append('spice_level', spiceLevel);
    formData.append('is_available', isAvailable);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingItem) {
        await menuApi.updateMenuItem(editingItem.id, formData);
      } else {
        await menuApi.createMenuItem(formData);
      }
      setShowItemModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save menu item:', err);
      let errorMsg = 'Failed to save menu item.';
      const resData = err.response?.data;
      if (resData) {
        if (typeof resData === 'string') {
          if (resData.includes('<!DOCTYPE') || resData.includes('<html')) {
            errorMsg = `Server Error (${err.response.status}): Please verify backend logs or deployment environment.`;
          } else {
            errorMsg = resData;
          }
        } else if (typeof resData === 'object') {
          const messages = [];
          for (const [key, val] of Object.entries(resData)) {
            const valStr = Array.isArray(val) ? val.join(', ') : String(val);
            messages.push(`${key}: ${valStr}`);
          }
          errorMsg = messages.join('\n');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      alert(`Error saving menu item:\n${errorMsg}`);
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await menuApi.toggleAvailability(id);
      loadData();
    } catch (err) {
      alert('Failed to toggle availability');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this dish?')) {
      try {
        await menuApi.deleteMenuItem(id);
        loadData();
      } catch (err) {
        alert('Failed to delete menu item');
      }
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await menuApi.createCategory({ name: catName, description: catDesc });
      setShowCatModal(false);
      setCatName('');
      setCatDesc('');
      loadData();
    } catch (err) {
      alert('Failed to create category');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Menu & Dish Catalog Editor</h1>
          <p>Create dishes, manage prices, categories, and stock availability</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowCatModal(true)}>
            <Plus size={16} /> Add Category
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenItemModal()}>
            <Plus size={16} /> Add Dish Item
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading menu items...
        </div>
      ) : (
        <div className="grid-3">
          {menuItems.map((item) => (
            <div key={item.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'}
                  alt={item.name}
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span className={`badge ${item.is_veg ? 'badge-green' : 'badge-red'}`}>
                      {item.is_veg ? 'VEG' : 'NON-VEG'}
                    </span>
                    <span className="badge badge-amber">
                      Spice: {item.spice_level}🌶️
                    </span>
                  </div>

                  <button
                    className={`badge ${item.is_available ? 'badge-green' : 'badge-red'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleAvailability(item.id)}
                  >
                    {item.is_available ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {item.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                    ₹{parseFloat(item.price).toFixed(2)}{' '}
                    {(item.half_price || item.quarter_price) ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Full)</span>
                    ) : null}
                  </span>
                  {(item.half_price || item.quarter_price) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                      {item.half_price && <span>Half: ₹{parseFloat(item.half_price).toFixed(2)}</span>}
                      {item.quarter_price && <span>Qtr: ₹{parseFloat(item.quarter_price).toFixed(2)}</span>}
                    </div>
                  )}

                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleOpenItemModal(item)}>
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add/Edit Item */}
      {showItemModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Dish Item' : 'Add New Dish'}</h2>
              <button className="modal-close" onClick={() => setShowItemModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="form-group">
                <label>Dish Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-select"
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Full Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Full"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Half Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Optional"
                    value={halfPrice}
                    onChange={(e) => setHalfPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Quarter Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Optional"
                    value={quarterPrice}
                    onChange={(e) => setQuarterPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Spice Level (1 - 5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="form-input"
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                />
              </div>

              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Dietary Type</label>
                  <select className="form-select" value={isVeg ? 'true' : 'false'} onChange={(e) => setIsVeg(e.target.value === 'true')}>
                    <option value="true">🌱 Vegetarian</option>
                    <option value="false">🍗 Non-Vegetarian</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock Status</label>
                  <select className="form-select" value={isAvailable ? 'true' : 'false'} onChange={(e) => setIsAvailable(e.target.value === 'true')}>
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Dish Photo (Optional Upload)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingItem ? 'Update Dish' : 'Create Dish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Category */}
      {showCatModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Menu Category</h2>
              <button className="modal-close" onClick={() => setShowCatModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Beverages / Special Combos"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
