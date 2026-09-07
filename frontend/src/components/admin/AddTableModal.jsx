import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check, Plus } from 'lucide-react';
import { tablesApi } from '../../api/tablesApi';

/**
 * AddTableModal
 *
 * Exact replication of the attached reference design:
 * - Centered compact white modal with large rounded corners (#FFFFFF, border-radius: 26px)
 * - Blurred and dimmed dashboard background
 * - Top-right close icon (X)
 * - Centered Header:
 *    - Title: "Add New Table"
 *    - Subtitle: "Configure your dining space"
 * - Form Fields:
 *    1. Table Number: Text input with placeholder "e.g. 13 or T-13"
 *    2. Seat Capacity:
 *       - Dropdown trigger showing selected capacity or "Select seat capacity"
 *       - Dropdown option menu includes "+ Add new seats"
 *       - When "+ Add new seats" is clicked, conditionally shows the custom Seat Capacity row:
 *         Input placeholder "e.g. 4 Seats" + dark maroon "Add" button
 *    3. Dining Area:
 *       - Dropdown trigger showing selected area or "Select dining area"
 *       - Dropdown option menu includes "+ Add new dining area"
 *       - When "+ Add new dining area" is clicked, conditionally shows the custom Dining Area row:
 *         Input placeholder "e.g. Indoor, AC, Outdoor" + dark maroon "Add" button
 * - Full-width dark maroon "Add Table" button (#230704)
 * - Independent states: showCustomSeatInput & showCustomDiningAreaInput
 */
export const AddTableModal = ({ isOpen, onClose, onTableCreated }) => {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [diningArea, setDiningArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Dropdown states (ONLY populated from Django backend)
  const [openDropdown, setOpenDropdown] = useState(null); // 'capacity' | 'area' | null
  const [capacityOptions, setCapacityOptions] = useState([]);
  const [areaOptions, setAreaOptions] = useState([]);

  // Conditional custom input states (independent!)
  const [showCustomSeatInput, setShowCustomSeatInput] = useState(false);
  const [customCapacityInput, setCustomCapacityInput] = useState('');
  const [addingCapacity, setAddingCapacity] = useState(false);

  const [showCustomDiningAreaInput, setShowCustomDiningAreaInput] = useState(false);
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [addingArea, setAddingArea] = useState(false);

  const modalRef = useRef(null);

  // Fetch options from Django Backend on open
  useEffect(() => {
    if (!isOpen) {
      setOpenDropdown(null);
      setShowCustomSeatInput(false);
      setShowCustomDiningAreaInput(false);
      setCustomCapacityInput('');
      setCustomAreaInput('');
      setError('');
      return;
    }

    const loadOptions = async () => {
      try {
        const data = await tablesApi.getTableOptions();
        if (data) {
          setCapacityOptions(Array.isArray(data.capacities) ? data.capacities : []);
          setAreaOptions(Array.isArray(data.sections) ? data.sections : []);
        }
      } catch (err) {
        console.error('Failed to load table options from backend:', err);
      }
    };

    loadOptions();
  }, [isOpen]);

  // Close dropdown on click outside
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

  if (!isOpen) return null;

  // Handle adding custom seat capacity
  const handleAddCustomCapacity = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rawVal = customCapacityInput.trim();
    if (!rawVal) return;

    const cleanedDigits = rawVal.replace(/\D/g, '');
    if (!cleanedDigits || parseInt(cleanedDigits, 10) <= 0) {
      setError('Please enter a valid number of seats (e.g. 4 Seats or 14).');
      return;
    }

    setAddingCapacity(true);
    setError('');
    try {
      const res = await tablesApi.addTableOption('capacity', cleanedDigits);
      if (res?.options?.capacities) {
        setCapacityOptions(res.options.capacities);
      } else if (!capacityOptions.includes(cleanedDigits)) {
        setCapacityOptions((prev) =>
          [...prev, cleanedDigits].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        );
      }
      setCapacity(cleanedDigits);
      setCustomCapacityInput('');
      setShowCustomSeatInput(false);
      setOpenDropdown(null);
    } catch (err) {
      console.error('Failed to save custom capacity:', err);
      if (!capacityOptions.includes(cleanedDigits)) {
        setCapacityOptions((prev) =>
          [...prev, cleanedDigits].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        );
      }
      setCapacity(cleanedDigits);
      setCustomCapacityInput('');
      setShowCustomSeatInput(false);
      setOpenDropdown(null);
    } finally {
      setAddingCapacity(false);
    }
  };

  // Handle adding custom dining area
  const handleAddCustomArea = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rawVal = customAreaInput.trim();
    if (!rawVal) return;

    const formattedArea = rawVal.charAt(0).toUpperCase() + rawVal.slice(1);
    setAddingArea(true);
    setError('');
    try {
      const res = await tablesApi.addTableOption('section', formattedArea);
      if (res?.options?.sections) {
        setAreaOptions(res.options.sections);
      } else if (!areaOptions.includes(formattedArea)) {
        setAreaOptions((prev) => [...prev, formattedArea]);
      }
      setDiningArea(formattedArea);
      setCustomAreaInput('');
      setShowCustomDiningAreaInput(false);
      setOpenDropdown(null);
    } catch (err) {
      console.error('Failed to save custom dining area:', err);
      if (!areaOptions.includes(formattedArea)) {
        setAreaOptions((prev) => [...prev, formattedArea]);
      }
      setDiningArea(formattedArea);
      setCustomAreaInput('');
      setShowCustomDiningAreaInput(false);
      setOpenDropdown(null);
    } finally {
      setAddingArea(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanNum = String(tableNumber || '').trim().replace(/^Table\s*/i, '').replace(/^T\s*-?\s*/i, '').trim();
    if (!cleanNum) {
      setError('Please enter a valid table number (e.g. 13 or T-13).');
      return;
    }

    if (!capacity) {
      setError('Please select a seat capacity.');
      return;
    }

    if (!diningArea) {
      setError('Please select a dining area.');
      return;
    }

    const formattedNum = `T${cleanNum}`;

    setIsSubmitting(true);
    try {
      const newTable = await tablesApi.createTable({
        number: formattedNum,
        name: `Table ${cleanNum}`,
        capacity: parseInt(capacity, 10),
        section: diningArea.toLowerCase(),
        status: 'available',
      });

      // Reset form
      setTableNumber('');
      setCapacity('');
      setDiningArea('');
      setError('');
      setShowCustomSeatInput(false);
      setShowCustomDiningAreaInput(false);
      setOpenDropdown(null);
      onClose();

      if (onTableCreated) {
        onTableCreated(newTable);
      }
    } catch (err) {
      console.error('Failed to create table:', err);
      const serverErr =
        err.response?.data?.number?.[0] ||
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error;

      if (serverErr && (serverErr.includes('already exists') || serverErr.includes('unique'))) {
        setError(`Table ${cleanNum} already exists. Please enter a different number.`);
      } else {
        setError(serverErr || 'Failed to create table. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-add-modal-overlay" onClick={onClose}>
      <div
        className="admin-add-modal-card"
        ref={modalRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Top-right close button */}
        <button
          type="button"
          className="admin-add-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={17} color="#8E8E93" strokeWidth={2.2} />
        </button>

        {/* Centered Title & Subtitle */}
        <div className="admin-add-modal-header">
          <h2 className="admin-add-modal-title">Add New Table</h2>
          <p className="admin-add-modal-subtitle">Configure your dining space</p>
        </div>

        {error && <div className="admin-add-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-add-modal-form">
          {/* 1. Table Number */}
          <div className="admin-add-form-group">
            <label className="admin-add-form-label">Table Number</label>
            <input
              type="text"
              className="admin-add-form-input"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 13 or T-13"
              required
              autoFocus
            />
          </div>

          {/* 2. Seat Capacity (Dropdown + Conditional Inline Add Row) */}
          <div className="admin-add-form-group">
            <label className="admin-add-form-label">Seat Capacity</label>

            {/* Dropdown Selector */}
            <div className="admin-custom-select-container">
              <div
                className={`admin-custom-select-trigger ${openDropdown === 'capacity' ? 'is-active' : ''} ${!capacity ? 'is-placeholder' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown((prev) => (prev === 'capacity' ? null : 'capacity'));
                }}
              >
                <span>{capacity ? `${capacity} Seats` : 'Select seat capacity'}</span>
                <ChevronDown
                  size={16}
                  color={openDropdown === 'capacity' ? '#230704' : '#4B5563'}
                  className={`admin-custom-select-arrow ${openDropdown === 'capacity' ? 'is-open' : ''}`}
                />
              </div>

              {/* Absolute Dropdown Menu */}
              {openDropdown === 'capacity' && (
                <div className="admin-custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  {capacityOptions.length > 0 && (
                    <div className="admin-custom-dropdown-list">
                      {capacityOptions.map((opt) => (
                        <div
                          key={opt}
                          className={`admin-custom-dropdown-option ${capacity === opt ? 'selected' : ''}`}
                          onClick={() => {
                            setCapacity(opt);
                            setOpenDropdown(null);
                          }}
                        >
                          <span>{opt} Seats</span>
                          {capacity === opt && <Check size={14} color="#FFFFFF" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Seats trigger item inside dropdown */}
                  <div
                    className="admin-custom-dropdown-add-btn"
                    style={{
                      borderTop: capacityOptions.length > 0 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                      marginTop: capacityOptions.length > 0 ? '4px' : '0',
                    }}
                    onClick={() => {
                      setShowCustomSeatInput(true);
                      setOpenDropdown(null);
                    }}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Add new seats</span>
                  </div>
                </div>
              )}
            </div>

            {/* Conditionally Displayed Custom Seat Capacity Input Row */}
            {showCustomSeatInput && (
              <div className="admin-inline-add-row">
                <input
                  type="text"
                  className="admin-inline-add-input"
                  placeholder="e.g. 4 Seats"
                  value={customCapacityInput}
                  onChange={(e) => setCustomCapacityInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomCapacity(e);
                  }}
                />
                <button
                  type="button"
                  className="admin-inline-add-btn"
                  onClick={handleAddCustomCapacity}
                  disabled={addingCapacity || !customCapacityInput.trim()}
                >
                  {addingCapacity ? '...' : 'Add'}
                </button>
              </div>
            )}
          </div>

          {/* 3. Dining Area (Dropdown + Conditional Inline Add Row) */}
          <div className="admin-add-form-group">
            <label className="admin-add-form-label">Dining Area</label>

            {/* Dropdown Selector */}
            <div className="admin-custom-select-container">
              <div
                className={`admin-custom-select-trigger ${openDropdown === 'area' ? 'is-active' : ''} ${!diningArea ? 'is-placeholder' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown((prev) => (prev === 'area' ? null : 'area'));
                }}
              >
                <span>{diningArea || 'Select dining area'}</span>
                <ChevronDown
                  size={16}
                  color={openDropdown === 'area' ? '#230704' : '#4B5563'}
                  className={`admin-custom-select-arrow ${openDropdown === 'area' ? 'is-open' : ''}`}
                />
              </div>

              {/* Absolute Dropdown Menu */}
              {openDropdown === 'area' && (
                <div className="admin-custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  {areaOptions.length > 0 && (
                    <div className="admin-custom-dropdown-list">
                      {areaOptions.map((opt) => (
                        <div
                          key={opt}
                          className={`admin-custom-dropdown-option ${diningArea === opt ? 'selected' : ''}`}
                          onClick={() => {
                            setDiningArea(opt);
                            setOpenDropdown(null);
                          }}
                        >
                          <span>{opt}</span>
                          {diningArea === opt && <Check size={14} color="#FFFFFF" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Dining Area trigger item inside dropdown */}
                  <div
                    className="admin-custom-dropdown-add-btn"
                    style={{
                      borderTop: areaOptions.length > 0 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                      marginTop: areaOptions.length > 0 ? '4px' : '0',
                    }}
                    onClick={() => {
                      setShowCustomDiningAreaInput(true);
                      setOpenDropdown(null);
                    }}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Add new dining area</span>
                  </div>
                </div>
              )}
            </div>

            {/* Conditionally Displayed Custom Dining Area Input Row */}
            {showCustomDiningAreaInput && (
              <div className="admin-inline-add-row">
                <input
                  type="text"
                  className="admin-inline-add-input"
                  placeholder="e.g. Indoor, AC, Outdoor"
                  value={customAreaInput}
                  onChange={(e) => setCustomAreaInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomArea(e);
                  }}
                />
                <button
                  type="button"
                  className="admin-inline-add-btn"
                  onClick={handleAddCustomArea}
                  disabled={addingArea || !customAreaInput.trim()}
                >
                  {addingArea ? '...' : 'Add'}
                </button>
              </div>
            )}
          </div>

          {/* Full-width Add Table Button */}
          <button
            type="submit"
            className="admin-add-save-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding Table...' : 'Add Table'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTableModal;
