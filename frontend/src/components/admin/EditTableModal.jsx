import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Plus, Check } from 'lucide-react';
import { tablesApi } from '../../api/tablesApi';

/**
 * EditTableModal
 *
 * Exact replication of the reference design:
 * - Centered compact white modal with rounded corners (#FFFFFF, border-radius: 26px)
 * - Blurred and dimmed dashboard background
 * - Top-right close icon (X)
 * - Centered dynamic title (e.g. "Edit Table 2")
 * - Form Fields with custom dark maroon dropdowns:
 *    1. Table Name: Text input (pre-filled e.g. "T2")
 *    2. Seat Capacity: Custom dropdown with "+ Add new seats" trigger
 *       - When clicked, conditionally shows inline input row below:
 *         Input placeholder "e.g. 4 Seats" + dark maroon "Add" button
 *    3. Dining Area: Custom dropdown with "+ Add new dining area" trigger
 *       - When clicked, conditionally shows inline input row below:
 *         Input placeholder "e.g. Indoor, AC, Outdoor" + dark maroon "Add" button
 * - Full-width dark maroon Save button (#230704)
 * - Independent states: showCustomSeatInput & showCustomDiningAreaInput
 */
export const EditTableModal = ({ isOpen, table, onClose, onTableUpdated }) => {
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [diningArea, setDiningArea] = useState('Indoor');
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

  // Load table details and backend options
  useEffect(() => {
    if (!isOpen || !table) {
      setOpenDropdown(null);
      setShowCustomSeatInput(false);
      setShowCustomDiningAreaInput(false);
      setCustomCapacityInput('');
      setCustomAreaInput('');
      setError('');
      return;
    }

    const numStr = String(table.number || '2').replace(/^Table\s*/i, '').trim();
    const formattedNum = numStr.toUpperCase().startsWith('T')
      ? numStr.toUpperCase()
      : `T${numStr}`;
    setTableName(table.name || formattedNum);

    const capStr = String(table.capacity || 4);
    setCapacity(capStr);

    const sec = table.section
      ? table.section.charAt(0).toUpperCase() + table.section.slice(1).toLowerCase()
      : 'Indoor';
    setDiningArea(sec);

    // Fetch fresh options from backend
    tablesApi
      .getTableOptions()
      .then((data) => {
        if (data) {
          setCapacityOptions(Array.isArray(data.capacities) ? data.capacities : []);
          setAreaOptions(Array.isArray(data.sections) ? data.sections : []);
        }
      })
      .catch((err) => console.error('Failed to load table options:', err));
  }, [isOpen, table]);

  if (!isOpen || !table) return null;

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

  // Title formatting: "Edit Table 2"
  const cleanNumber =
    String(table.number || '2').replace(/\D/g, '') ||
    String(table.number || '2').replace(/^Table\s*/i, '');
  const modalTitle = `Edit Table ${cleanNumber}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const updated = await tablesApi.updateTable(table.id, {
        number: tableName.trim(),
        name: tableName.trim(),
        capacity: parseInt(capacity, 10) || 4,
        section: diningArea.toLowerCase(),
      });
      onClose();
      if (onTableUpdated) {
        onTableUpdated(
          updated || {
            ...table,
            number: tableName.trim(),
            name: tableName.trim(),
            capacity: parseInt(capacity, 10) || 4,
            section: diningArea.toLowerCase(),
          }
        );
      }
    } catch (err) {
      console.error('Failed to update table details:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to update table details. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-edit-modal-overlay" onClick={onClose}>
      <div className="admin-edit-modal-card" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Top-right close button */}
        <button
          type="button"
          className="admin-edit-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={17} color="#8E8E93" strokeWidth={2.2} />
        </button>

        {/* Centered Dynamic Title */}
        <h2 className="admin-edit-modal-title">{modalTitle}</h2>

        {error && <div className="admin-edit-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-edit-modal-form">
          {/* 1. Table Name */}
          <div className="admin-edit-form-group">
            <label className="admin-edit-form-label">Table Name</label>
            <input
              type="text"
              className="admin-edit-form-input"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. T2"
              required
            />
          </div>

          {/* 2. Seat Capacity (Dropdown + Conditional Inline Add Row) */}
          <div className="admin-edit-form-group">
            <label className="admin-edit-form-label">Seat Capacity</label>
            <div className="admin-custom-select-container">
              {/* Trigger */}
              <div
                className={`admin-custom-select-trigger ${openDropdown === 'capacity' ? 'is-active' : ''}`}
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

              {/* Dropdown Menu */}
              {openDropdown === 'capacity' && (
                <div className="admin-custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  {capacityOptions.length > 0 && (
                    <div className="admin-custom-dropdown-list">
                      {capacityOptions.map((opt) => (
                        <div
                          key={opt}
                          className={`admin-custom-dropdown-option ${String(capacity) === String(opt) ? 'selected' : ''}`}
                          onClick={() => {
                            setCapacity(opt);
                            setOpenDropdown(null);
                          }}
                        >
                          <span>{opt} Seats</span>
                          {String(capacity) === String(opt) && <Check size={14} color="#FFFFFF" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Seats Option */}
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
          <div className="admin-edit-form-group">
            <label className="admin-edit-form-label">Dining Area</label>
            <div className="admin-custom-select-container">
              {/* Trigger */}
              <div
                className={`admin-custom-select-trigger ${openDropdown === 'area' ? 'is-active' : ''}`}
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

              {/* Dropdown Menu */}
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

                  {/* Add New Area Option */}
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

          {/* Full-width Save Button */}
          <button
            type="submit"
            className="admin-edit-save-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTableModal;
