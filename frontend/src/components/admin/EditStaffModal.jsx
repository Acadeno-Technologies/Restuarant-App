import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, ChevronDown, Check, Plus } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { validateEmail, validatePhone } from '../../utils/validation';

const CORE_ROLES = ['Staff', 'Chef', 'Admin'];

export const EditStaffModal = ({ isOpen, staff, onClose, onStaffUpdated }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    username: '',
    password: '',
    role: 'staff',
    role_title: 'Staff',
    email: '',
    phone: '',
  });

  const [roleOptions, setRoleOptions] = useState(CORE_ROLES);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [addingRole, setAddingRole] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (staff && isOpen) {
      // Determine role title
      let initialRoleTitle = 'Staff';
      if (staff.custom_role_data?.name) {
        initialRoleTitle = staff.custom_role_data.name;
      } else {
        const r = (staff.role || '').toLowerCase();
        if (r === 'admin') initialRoleTitle = 'Admin';
        else if (r === 'kitchen') initialRoleTitle = 'Chef';
        else initialRoleTitle = 'Staff';
      }

      setFormData({
        first_name: staff.first_name || staff.username || '',
        username: staff.username || '',
        password: staff.raw_password || '',
        role: staff.role || 'staff',
        role_title: initialRoleTitle,
        email: staff.email || '',
        phone: staff.phone || '',
      });
      setShowPassword(false);
      setOpenDropdown(false);
      setShowCustomRoleInput(false);
      setCustomRoleInput('');
      setError('');

      const fetchRoles = async () => {
        try {
          const res = await authApi.getRoles();
          const list = res.results || res;
          if (Array.isArray(list)) {
            const fetchedNames = list.map((r) => r.name);
            const merged = Array.from(new Set([...CORE_ROLES, ...fetchedNames, initialRoleTitle]));
            setRoleOptions(merged);
          }
        } catch (err) {
          console.error('Failed to load custom roles:', err);
        }
      };
      fetchRoles();
    }
  }, [staff, isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  const handleSelectRole = (selectedTitle) => {
    let baseRole = 'staff';
    const lower = selectedTitle.toLowerCase();
    if (lower === 'admin') baseRole = 'admin';
    else if (lower === 'chef' || lower === 'kitchen' || lower.includes('cook')) baseRole = 'kitchen';
    else baseRole = 'staff';

    setFormData((prev) => ({
      ...prev,
      role_title: selectedTitle,
      role: baseRole,
    }));
    setOpenDropdown(false);
  };

  const handleAddCustomRole = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const rawVal = customRoleInput.trim();
    if (!rawVal) return;

    const formattedRole = rawVal.charAt(0).toUpperCase() + rawVal.slice(1);
    setAddingRole(true);
    setError('');

    try {
      let baseAccess = 'staff';
      const lower = formattedRole.toLowerCase();
      if (lower.includes('chef') || lower.includes('cook') || lower.includes('kitchen')) {
        baseAccess = 'kitchen';
      }

      await authApi.createRole({ name: formattedRole, base_access: baseAccess });
      if (!roleOptions.includes(formattedRole)) {
        setRoleOptions((prev) => [...prev, formattedRole]);
      }
      handleSelectRole(formattedRole);
      setCustomRoleInput('');
      setShowCustomRoleInput(false);
    } catch (err) {
      console.error('Failed to create role in backend:', err);
      if (!roleOptions.includes(formattedRole)) {
        setRoleOptions((prev) => [...prev, formattedRole]);
      }
      handleSelectRole(formattedRole);
      setCustomRoleInput('');
      setShowCustomRoleInput(false);
    } finally {
      setAddingRole(false);
    }
  };

  const handlePhoneChange = (e) => {
    // Only allow numbers and limit to max 10 digits
    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: cleanDigits }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    const emailVal = formData.email.trim();
    if (emailVal) {
      const emailCheck = validateEmail(emailVal);
      if (!emailCheck.isValid) {
        setError(emailCheck.error);
        return;
      }
    }

    const phoneVal = formData.phone.trim();
    if (phoneVal) {
      const phoneCheck = validatePhone(phoneVal);
      if (!phoneCheck.isValid) {
        setError(phoneCheck.error);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        username: formData.username.trim(),
        email: emailVal,
        phone: phoneVal,
        role: formData.role,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      await authApi.updateStaff(staff.id, payload);

      if (onStaffUpdated) {
        onStaffUpdated();
      }
      onClose();
    } catch (err) {
      console.error('Failed to update staff:', err);
      const data = err.response?.data;
      let msg = 'Failed to update staff member.';
      if (typeof data === 'string') {
        msg = data;
      } else if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        if (Array.isArray(val) && val.length > 0) {
          msg = val[0];
        } else if (typeof val === 'string') {
          msg = val;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.error) {
          msg = data.error;
        }
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-staff-modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="admin-staff-modal-card" 
        onClick={(e) => {
          e.stopPropagation();
          setOpenDropdown(false);
        }}
      >
        {/* Top-Right Circular Close Button */}
        <button 
          type="button" 
          className="admin-staff-modal-close"
          onClick={onClose}
          title="Close"
        >
          <X size={14} color="#78716C" strokeWidth={2.2} />
        </button>

        {/* Centered Header */}
        <div className="admin-staff-modal-header">
          <h3 className="admin-staff-modal-title">
            Edit Staff
          </h3>
          <p className="admin-staff-modal-subtitle">
            Update this team members details
          </p>
        </div>

        {error && (
          <div className="admin-staff-modal-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-staff-modal-form">
          {/* Row 1: Full Name & Username */}
          <div className="admin-staff-modal-grid-2">
            <div>
              <label className="admin-staff-modal-label">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Sameesha"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="admin-staff-modal-input"
              />
            </div>

            <div>
              <label className="admin-staff-modal-label">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="sameesha"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="admin-staff-modal-input"
              />
            </div>
          </div>

          {/* Row 2: Password with Eye Toggle (Real Password) */}
          <div>
            <label className="admin-staff-modal-label">
              Password
            </label>
            <div className="admin-staff-modal-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="admin-staff-modal-input"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="admin-staff-modal-eye-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Row 3: Role Custom Dropdown (+ Add new role) */}
          <div>
            <label className="admin-staff-modal-label">
              Role
            </label>
            <div className="admin-custom-select-container">
              <div
                className={`admin-custom-select-trigger ${openDropdown ? 'is-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown((prev) => !prev);
                }}
                style={{ height: '42px', borderRadius: '12px', borderColor: '#EAE3DC' }}
              >
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#2D2926' }}>
                  {formData.role_title || 'Select Role'}
                </span>
                <ChevronDown 
                  size={15} 
                  color="#78716C" 
                  className={`admin-custom-select-arrow ${openDropdown ? 'is-open' : ''}`}
                />
              </div>

              {/* Dropdown Menu */}
              {openDropdown && (
                <div className="admin-custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-custom-dropdown-list">
                    {roleOptions.map((opt) => (
                      <div
                        key={opt}
                        className={`admin-custom-dropdown-option ${formData.role_title === opt ? 'selected' : ''}`}
                        onClick={() => handleSelectRole(opt)}
                      >
                        <span>{opt}</span>
                        {formData.role_title === opt && <Check size={14} color="#FFFFFF" />}
                      </div>
                    ))}
                  </div>

                  {/* + Add new role option */}
                  <div
                    className="admin-custom-dropdown-add-btn"
                    onClick={() => {
                      setShowCustomRoleInput(true);
                      setOpenDropdown(false);
                    }}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Add new role</span>
                  </div>
                </div>
              )}
            </div>

            {/* Conditionally Displayed Inline Custom Role Row */}
            {showCustomRoleInput && (
              <div className="admin-inline-add-row" style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  className="admin-inline-add-input"
                  placeholder="e.g. Supervisor, Bartender, Waiter"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomRole(e);
                  }}
                  style={{ height: '40px', borderRadius: '10px' }}
                />
                <button
                  type="button"
                  className="admin-inline-add-btn"
                  onClick={handleAddCustomRole}
                  disabled={addingRole || !customRoleInput.trim()}
                  style={{ height: '40px', borderRadius: '10px' }}
                >
                  {addingRole ? '...' : 'Add'}
                </button>
              </div>
            )}
          </div>

          {/* Row 4: Email & Phone */}
          <div className="admin-staff-modal-grid-2">
            <div>
              <label className="admin-staff-modal-label">
                Email
              </label>
              <input
                type="email"
                placeholder="sam@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="admin-staff-modal-input"
              />
            </div>

            <div>
              <label className="admin-staff-modal-label">
                Phone
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit number"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="admin-staff-modal-input"
              />
            </div>
          </div>

          {/* Bottom Save Button */}
          <button
            type="submit"
            disabled={submitting}
            className="admin-staff-modal-save-btn"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;
