import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, AlertCircle, ChevronDown, Check, Plus } from 'lucide-react';
import { menuApi } from '../../api/menuApi';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

/**
 * AddMenuItemModal
 *
 * Exact visual match to the reference design with custom dropdown functionality:
 * - Header: "Add New Menu Dish" + subtitle + circular 'X' close button
 * - Dish Name (full width text input)
 * - Category Dropdown:
 *    - Custom styled dropdown with dynamic categories from backend
 *    - "+ Add New Category" option showing inline input + Add button below
 *    - Persists new categories to Django backend immediately
 * - Status Dropdown:
 *    - Custom styled dropdown with "Available" / "Unavailable" options
 * - Portion Pricing (₹) light peach card: Full Portion (*), Half Portion, Quarter
 * - Diet Type Dropdown:
 *    - Custom styled dropdown with "Veg", "Non-Veg", "Egg" + custom diet types
 *    - "+ Add New Diet Type" option showing inline input + Add button below
 * - Spice Level Dropdown:
 *    - Custom styled dropdown with "Mild", "Medium", "Hot" + custom spice levels
 *    - "+ Add New Spice Level" option showing inline input + Add button below
 * - Dish Photo (Upload from System / Computer) box with circular upload icon & "Max 5MB"
 * - Description multi-line textarea with matching placeholder
 * - Full-width dark maroon "Save Dish" button
 * - Independent state management for each dropdown and inline add input
 */
const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const AddMenuItemModal = ({ isOpen, onClose, categories: initialCategories = [], onItemCreated }) => {
  useLockBodyScroll(isOpen);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('available'); // 'available' | 'unavailable'
  const [price, setPrice] = useState(''); // Full portion
  const [halfPrice, setHalfPrice] = useState(''); // Half portion
  const [quarterPrice, setQuarterPrice] = useState(''); // Quarter portion
  const [dietType, setDietType] = useState('Veg');
  const [spiceLevel, setSpiceLevel] = useState('Medium');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [description, setDescription] = useState('');

  // Dropdown options (from backend)
  const [categoryList, setCategoryList] = useState([]);
  const [dietOptions, setDietOptions] = useState(['Veg', 'Non-Veg', 'Egg']);
  const [spiceOptions, setSpiceOptions] = useState(['Mild', 'Medium', 'Hot']);

  // Single active open dropdown state ('category' | 'status' | 'dietType' | 'spiceLevel' | null)
  const [openDropdown, setOpenDropdown] = useState(null);

  // Independent custom input states
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [showCustomDietTypeInput, setShowCustomDietTypeInput] = useState(false);
  const [customDietTypeInput, setCustomDietTypeInput] = useState('');
  const [addingDietType, setAddingDietType] = useState(false);

  const [showCustomSpiceLevelInput, setShowCustomSpiceLevelInput] = useState(false);
  const [customSpiceLevelInput, setCustomSpiceLevelInput] = useState('');
  const [addingSpiceLevel, setAddingSpiceLevel] = useState(false);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch / Sync options on open
  useEffect(() => {
    if (!isOpen) {
      setOpenDropdown(null);
      setShowCustomCategoryInput(false);
      setShowCustomDietTypeInput(false);
      setShowCustomSpiceLevelInput(false);
      setCustomCategoryInput('');
      setCustomDietTypeInput('');
      setCustomSpiceLevelInput('');
      setError('');
      return;
    }

    const loadData = async () => {
      try {
        // 1. Fetch categories
        const catData = await menuApi.getCategories();
        if (Array.isArray(catData)) {
          setCategoryList(catData);
          if (catData.length > 0 && !categoryId) {
            setCategoryId(catData[0].id);
          }
        } else if (initialCategories && initialCategories.length > 0) {
          setCategoryList(initialCategories);
          if (!categoryId) setCategoryId(initialCategories[0].id);
        }

        // 2. Fetch diet & spice options
        const optData = await menuApi.getMenuOptions();
        if (optData) {
          if (Array.isArray(optData.diet_types) && optData.diet_types.length > 0) {
            setDietOptions(optData.diet_types);
          }
          if (Array.isArray(optData.spice_levels) && optData.spice_levels.length > 0) {
            setSpiceOptions(optData.spice_levels);
          }
        }
      } catch (err) {
        console.error('Failed to load menu options:', err);
        if (initialCategories && initialCategories.length > 0) {
          setCategoryList(initialCategories);
          if (!categoryId) setCategoryId(initialCategories[0].id);
        }
      }
    };

    loadData();
  }, [isOpen]);

  // Click outside to close open dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset form fields when opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setPrice('');
      setHalfPrice('');
      setQuarterPrice('');
      setDietType('Veg');
      setSpiceLevel('Medium');
      setStatus('available');
      setImageFile(null);
      setImagePreview('');
      setDescription('');
      setError('');
      setOpenDropdown(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── 1. Custom Category Add Handler ──
  const handleAddCustomCategory = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const rawVal = customCategoryInput.trim();
    if (!rawVal) return;

    const formattedName = toTitleCase(rawVal);
    const exists = categoryList.some(
      (c) => c.name.toLowerCase() === rawVal.toLowerCase()
    );
    if (exists) {
      const match = categoryList.find(
        (c) => c.name.toLowerCase() === rawVal.toLowerCase()
      );
      if (match) setCategoryId(match.id);
      setShowCustomCategoryInput(false);
      setCustomCategoryInput('');
      setOpenDropdown(null);
      return;
    }

    setAddingCategory(true);
    setError('');
    try {
      const newCat = await menuApi.createCategory({
        name: formattedName,
        description: `${formattedName} dishes`,
      });

      if (newCat && newCat.id) {
        setCategoryList((prev) => [...prev, newCat]);
        setCategoryId(newCat.id);
      }
      setCustomCategoryInput('');
      setShowCustomCategoryInput(false);
      setOpenDropdown(null);
    } catch (err) {
      console.error('Failed to save category:', err);
      setError('Failed to create category. Please try again.');
    } finally {
      setAddingCategory(false);
    }
  };

  // ── 2. Custom Diet Type Add Handler ──
  const handleAddCustomDietType = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const rawVal = customDietTypeInput.trim();
    if (!rawVal) return;

    const formatted = toTitleCase(rawVal);
    setAddingDietType(true);
    setError('');
    try {
      const res = await menuApi.addMenuOption('diet_type', formatted);
      if (res?.options?.diet_types) {
        setDietOptions(res.options.diet_types);
      } else if (!dietOptions.includes(formatted)) {
        setDietOptions((prev) => [...prev, formatted]);
      }
      setDietType(formatted);
      setCustomDietTypeInput('');
      setShowCustomDietTypeInput(false);
      setOpenDropdown(null);
    } catch (err) {
      console.error('Failed to save diet type:', err);
      if (!dietOptions.includes(formatted)) {
        setDietOptions((prev) => [...prev, formatted]);
      }
      setDietType(formatted);
      setCustomDietTypeInput('');
      setShowCustomDietTypeInput(false);
      setOpenDropdown(null);
    } finally {
      setAddingDietType(false);
    }
  };

  // ── 3. Custom Spice Level Add Handler ──
  const handleAddCustomSpiceLevel = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const rawVal = customSpiceLevelInput.trim();
    if (!rawVal) return;

    const formatted = toTitleCase(rawVal);
    setAddingSpiceLevel(true);
    setError('');
    try {
      const res = await menuApi.addMenuOption('spice_level', formatted);
      if (res?.options?.spice_levels) {
        setSpiceOptions(res.options.spice_levels);
      } else if (!spiceOptions.includes(formatted)) {
        setSpiceOptions((prev) => [...prev, formatted]);
      }
      setSpiceLevel(formatted);
      setCustomSpiceLevelInput('');
      setShowCustomSpiceLevelInput(false);
      setOpenDropdown(null);
    } catch (err) {
      console.error('Failed to save spice level:', err);
      if (!spiceOptions.includes(formatted)) {
        setSpiceOptions((prev) => [...prev, formatted]);
      }
      setSpiceLevel(formatted);
      setCustomSpiceLevelInput('');
      setShowCustomSpiceLevelInput(false);
      setOpenDropdown(null);
    } finally {
      setAddingSpiceLevel(false);
    }
  };

  // Handle image upload & preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Selected Category Name
  const selectedCategoryObj = categoryList.find((c) => String(c.id) === String(categoryId));
  const categoryDisplayName = selectedCategoryObj ? selectedCategoryObj.name : 'Select Category';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a dish name');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError('Please enter a valid full portion price');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let selectedCatId = categoryId;
      if (!selectedCatId && categoryList.length > 0) {
        selectedCatId = categoryList[0].id;
      }

      // Auto-fallback category
      if (!selectedCatId) {
        try {
          const newCat = await menuApi.createCategory({ name: 'Main Course', description: 'Main dishes' });
          selectedCatId = newCat.id;
        } catch (catErr) {
          console.error('Failed to auto-create category:', catErr);
        }
      }

      const isVegBool = String(dietType || '').toLowerCase() === 'veg';
      const isAvailBool = status === 'available';

      const formData = new FormData();
      formData.append('name', toTitleCase(name));
      if (selectedCatId) {
        formData.append('category', selectedCatId);
      }
      formData.append('price', parseFloat(price).toFixed(2));

      if (halfPrice && !isNaN(parseFloat(halfPrice)) && parseFloat(halfPrice) > 0) {
        formData.append('half_price', parseFloat(halfPrice).toFixed(2));
      }
      if (quarterPrice && !isNaN(parseFloat(quarterPrice)) && parseFloat(quarterPrice) > 0) {
        formData.append('quarter_price', parseFloat(quarterPrice).toFixed(2));
      }
      formData.append('is_veg', isVegBool);
      formData.append('diet_type', toTitleCase(dietType) || 'Veg');
      formData.append('spice_level', toTitleCase(spiceLevel) || 'Medium');

      formData.append('is_available', isAvailBool);
      formData.append('description', description.trim());

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const createdItem = await menuApi.createMenuItem(formData);

      if (onItemCreated) {
        onItemCreated(createdItem);
      }

      onClose();
    } catch (err) {
      console.error('Failed to create menu item:', err);
      let detail = 'Failed to add dish. Please check your inputs and try again.';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          detail = data;
        } else if (data.detail) {
          detail = data.detail;
        } else if (typeof data === 'object') {
          const messages = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
          if (messages) detail = messages;
        }
      }
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="admin-add-dish-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="admin-add-dish-modal"
        onClick={(e) => {
          e.stopPropagation();
          setOpenDropdown(null);
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ── */}
        <div className="admin-add-dish-header">
          <div>
            <h2 className="admin-add-dish-title">Add New Menu Dish</h2>
            <p className="admin-add-dish-subtitle">Set category, pricing, and upload a dish photo.</p>
          </div>
          <button
            type="button"
            className="admin-add-dish-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="admin-add-dish-error">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-add-dish-form">
          {/* ── Dish Name ── */}
          <div className="admin-add-dish-group">
            <label className="admin-add-dish-label">Dish Name</label>
            <input
              type="text"
              className="admin-add-dish-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Biriyani"
              required
              autoFocus
            />
          </div>

          {/* ── Category & Status (2 Columns with Custom Dropdowns) ── */}
          <div className="admin-add-dish-grid-2">
            {/* 1. Category Dropdown */}
            <div className="admin-add-dish-group">
              <label className="admin-add-dish-label">Category</label>
              <div className="admin-custom-select-container">
                <div
                  className={`admin-custom-select-trigger ${openDropdown === 'category' ? 'is-active' : ''} ${!categoryId ? 'is-placeholder' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown((prev) => (prev === 'category' ? null : 'category'));
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {categoryDisplayName}
                  </span>
                  <ChevronDown
                    size={16}
                    color={openDropdown === 'category' ? '#230704' : '#6B5E55'}
                    className={`admin-custom-select-arrow ${openDropdown === 'category' ? 'is-open' : ''}`}
                  />
                </div>

                {/* Dropdown Menu */}
                {openDropdown === 'category' && (
                  <div className="admin-custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    {categoryList.length > 0 && (
                      <div className="admin-custom-dropdown-list">
                        {categoryList.map((cat) => (
                          <div
                            key={cat.id}
                            className={`admin-custom-dropdown-option ${String(categoryId) === String(cat.id) ? 'selected' : ''}`}
                            onClick={() => {
                              setCategoryId(cat.id);
                              setOpenDropdown(null);
                            }}
                          >
                            <span>{cat.name}</span>
                            {String(categoryId) === String(cat.id) && <Check size={14} color="#FFFFFF" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* + Add New Category inside Dropdown Menu */}
                    {showCustomCategoryInput ? (
                      <div className="admin-dropdown-inline-add">
                        <input
                          type="text"
                          className="admin-dropdown-inline-input"
                          placeholder="e.g. Appetizers"
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCustomCategory(e);
                          }}
                        />
                        <button
                          type="button"
                          className="admin-dropdown-inline-add-btn"
                          onClick={handleAddCustomCategory}
                          disabled={addingCategory || !customCategoryInput.trim()}
                        >
                          {addingCategory ? '...' : 'Add'}
                        </button>
                      </div>
                    ) : (
                      <div
                        className="admin-custom-dropdown-add-btn"
                        style={{
                          borderTop: categoryList.length > 0 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                          marginTop: categoryList.length > 0 ? '4px' : '0',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCustomCategoryInput(true);
                        }}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Add new category</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Status Dropdown */}
            <div className="admin-add-dish-group">
              <label className="admin-add-dish-label">Status</label>
              <div className="admin-custom-select-container">
                <div
                  className={`admin-custom-select-trigger ${openDropdown === 'status' ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown((prev) => (prev === 'status' ? null : 'status'));
                  }}
                >
                  <span>{status === 'available' ? 'Available' : 'Unavailable'}</span>
                  <ChevronDown
                    size={16}
                    color={openDropdown === 'status' ? '#230704' : '#6B5E55'}
                    className={`admin-custom-select-arrow ${openDropdown === 'status' ? 'is-open' : ''}`}
                  />
                </div>

                {openDropdown === 'status' && (
                  <div className="admin-custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-custom-dropdown-list">
                      <div
                        className={`admin-custom-dropdown-option ${status === 'available' ? 'selected' : ''}`}
                        onClick={() => {
                          setStatus('available');
                          setOpenDropdown(null);
                        }}
                      >
                        <span>Available</span>
                        {status === 'available' && <Check size={14} color="#FFFFFF" />}
                      </div>
                      <div
                        className={`admin-custom-dropdown-option ${status === 'unavailable' ? 'selected' : ''}`}
                        onClick={() => {
                          setStatus('unavailable');
                          setOpenDropdown(null);
                        }}
                      >
                        <span>Unavailable</span>
                        {status === 'unavailable' && <Check size={14} color="#FFFFFF" />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Portion Pricing (₹) Card ── */}
          <div className="admin-add-dish-portion-card">
            <div className="admin-add-dish-portion-title">Portion Pricing (₹) :</div>
            <div className="admin-add-dish-portion-grid">
              <div className="admin-add-dish-portion-item">
                <label className="admin-add-dish-portion-label">Full Portion (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="admin-add-dish-portion-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="380"
                  required
                />
              </div>

              <div className="admin-add-dish-portion-item">
                <label className="admin-add-dish-portion-label">Half Portion (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="admin-add-dish-portion-input"
                  value={halfPrice}
                  onChange={(e) => setHalfPrice(e.target.value)}
                  placeholder="220"
                />
              </div>

              <div className="admin-add-dish-portion-item">
                <label className="admin-add-dish-portion-label">Quarter (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="admin-add-dish-portion-input"
                  value={quarterPrice}
                  onChange={(e) => setQuarterPrice(e.target.value)}
                  placeholder="130"
                />
              </div>
            </div>
          </div>

          {/* ── Diet Type & Spice Level (2 Columns with Custom Dropdowns) ── */}
          <div className="admin-add-dish-grid-2">
            {/* 3. Diet Type Dropdown */}
            <div className="admin-add-dish-group">
              <label className="admin-add-dish-label">Diet Type</label>
              <div className="admin-custom-select-container">
                <div
                  className={`admin-custom-select-trigger ${openDropdown === 'dietType' ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown((prev) => (prev === 'dietType' ? null : 'dietType'));
                  }}
                >
                  <span>{dietType}</span>
                  <ChevronDown
                    size={16}
                    color={openDropdown === 'dietType' ? '#230704' : '#6B5E55'}
                    className={`admin-custom-select-arrow ${openDropdown === 'dietType' ? 'is-open' : ''}`}
                  />
                </div>

                {openDropdown === 'dietType' && (
                  <div className="admin-custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-custom-dropdown-list">
                      {dietOptions.map((opt) => (
                        <div
                          key={opt}
                          className={`admin-custom-dropdown-option ${dietType.toLowerCase() === opt.toLowerCase() ? 'selected' : ''}`}
                          onClick={() => {
                            setDietType(opt);
                            setOpenDropdown(null);
                          }}
                        >
                          <span>{opt}</span>
                          {dietType.toLowerCase() === opt.toLowerCase() && <Check size={14} color="#FFFFFF" />}
                        </div>
                      ))}
                    </div>

                    {/* + Add New Diet Type inside Dropdown Menu */}
                    {showCustomDietTypeInput ? (
                      <div className="admin-dropdown-inline-add">
                        <input
                          type="text"
                          className="admin-dropdown-inline-input"
                          placeholder="e.g. Vegan, Jain"
                          value={customDietTypeInput}
                          onChange={(e) => setCustomDietTypeInput(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCustomDietType(e);
                          }}
                        />
                        <button
                          type="button"
                          className="admin-dropdown-inline-add-btn"
                          onClick={handleAddCustomDietType}
                          disabled={addingDietType || !customDietTypeInput.trim()}
                        >
                          {addingDietType ? '...' : 'Add'}
                        </button>
                      </div>
                    ) : (
                      <div
                        className="admin-custom-dropdown-add-btn"
                        style={{
                          borderTop: dietOptions.length > 0 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                          marginTop: dietOptions.length > 0 ? '4px' : '0',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCustomDietTypeInput(true);
                        }}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Add new diet type</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Spice Level Dropdown */}
            <div className="admin-add-dish-group">
              <label className="admin-add-dish-label">Spice Level</label>
              <div className="admin-custom-select-container">
                <div
                  className={`admin-custom-select-trigger ${openDropdown === 'spiceLevel' ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown((prev) => (prev === 'spiceLevel' ? null : 'spiceLevel'));
                  }}
                >
                  <span>{spiceLevel}</span>
                  <ChevronDown
                    size={16}
                    color={openDropdown === 'spiceLevel' ? '#230704' : '#6B5E55'}
                    className={`admin-custom-select-arrow ${openDropdown === 'spiceLevel' ? 'is-open' : ''}`}
                  />
                </div>

                {openDropdown === 'spiceLevel' && (
                  <div className="admin-custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-custom-dropdown-list">
                      {spiceOptions.map((opt) => (
                        <div
                          key={opt}
                          className={`admin-custom-dropdown-option ${spiceLevel.toLowerCase() === opt.toLowerCase() ? 'selected' : ''}`}
                          onClick={() => {
                            setSpiceLevel(opt);
                            setOpenDropdown(null);
                          }}
                        >
                          <span>{opt}</span>
                          {spiceLevel.toLowerCase() === opt.toLowerCase() && <Check size={14} color="#FFFFFF" />}
                        </div>
                      ))}
                    </div>

                    {/* + Add New Spice Level inside Dropdown Menu */}
                    {showCustomSpiceLevelInput ? (
                      <div className="admin-dropdown-inline-add">
                        <input
                          type="text"
                          className="admin-dropdown-inline-input"
                          placeholder="e.g. Extra Spicy"
                          value={customSpiceLevelInput}
                          onChange={(e) => setCustomSpiceLevelInput(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCustomSpiceLevel(e);
                          }}
                        />
                        <button
                          type="button"
                          className="admin-dropdown-inline-add-btn"
                          onClick={handleAddCustomSpiceLevel}
                          disabled={addingSpiceLevel || !customSpiceLevelInput.trim()}
                        >
                          {addingSpiceLevel ? '...' : 'Add'}
                        </button>
                      </div>
                    ) : (
                      <div
                        className="admin-custom-dropdown-add-btn"
                        style={{
                          borderTop: spiceOptions.length > 0 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                          marginTop: spiceOptions.length > 0 ? '4px' : '0',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCustomSpiceLevelInput(true);
                        }}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Add new spice level</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* ── Dish Photo Upload Area ── */}
          <div className="admin-add-dish-group">
            <label className="admin-add-dish-label">Dish Photo (Upload from System / Computer)</label>
            <div
              className="admin-add-dish-upload-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="admin-add-dish-upload-icon-circle">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="admin-add-dish-upload-preview"
                  />
                ) : (
                  <Upload size={18} color="#6B5E55" strokeWidth={2.2} />
                )}
              </div>
              <div className="admin-add-dish-upload-text-wrap">
                <span className="admin-add-dish-upload-title">
                  {imageFile ? imageFile.name : 'Upload Photo'}
                </span>
                <span className="admin-add-dish-upload-sub">Max 5MB</span>
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="admin-add-dish-group">
            <label className="admin-add-dish-label">Description</label>
            <textarea
              className="admin-add-dish-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of aromatic ingredients & cooking style..."
              rows={3}
            />
          </div>

          {/* ── Full-Width Save Dish Button ── */}
          <button
            type="submit"
            className="admin-add-dish-save-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Dish...' : 'Save Dish'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddMenuItemModal;

