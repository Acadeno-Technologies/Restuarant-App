import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { UserAvatarPlaceholder } from '../common/UserAvatarPlaceholder';

/**
 * AdminProfileModal
 *
 * Exact 1:1 visual match to the reference design:
 * - Slender vertical card with 26px rounded corners (#FFFFFF, max-width: 310px)
 * - Blurred and dimmed dashboard background
 * - Top-right close icon (X)
 * - Profile Header:
 *    - Left: Soft rounded avatar with minimalist outline silhouette
 *    - Right: "Admin" title and "T clock Owner" role/subtitle
 * - Form Fields:
 *    1. User Name: Borderless rounded text input with #F4F4F4 background
 *    2. Password: Borderless rounded password input with #F4F4F4 and eye toggle
 * - Full-width dark burgundy Save button (#230704)
 */
export const AdminProfileModal = ({ isOpen, onClose }) => {
  const { user, fetchProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const modalRef = useRef(null);

  // Load current profile data from Django backend on open
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccessMsg('');
      setShowPassword(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const data = await authApi.getProfile();
        if (data) {
          setUsername(data.username || '');
        }
      } catch (err) {
        if (user?.username) {
          setUsername(user.username);
        }
      }
      const savedPwd = localStorage.getItem('saved_pwd') || user?.savedPassword || '';
      setPassword(savedPwd);
    };

    loadProfile();
  }, [isOpen, user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please enter a username.');
      return;
    }

    const payload = { username: cleanUsername };
    if (password && password.trim()) {
      if (password.trim().length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
      payload.password = password.trim();
    }

    setIsSubmitting(true);
    try {
      await authApi.updateProfile(payload);
      if (payload.password) {
        localStorage.setItem('saved_pwd', payload.password);
      }
      if (fetchProfile) {
        await fetchProfile();
      }
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update admin profile:', err);
      const serverErr =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.username?.[0] ||
        'Failed to update profile. Please try again.';
      setError(serverErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : (user?.first_name || 'Admin');
  const displayRole = 'T clock Owner';

  return (
    <div className="admin-profile-modal-overlay" onClick={onClose}>
      <div
        className="admin-profile-modal-card"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          className="admin-profile-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={14} color="#8E8E93" strokeWidth={1.8} />
        </button>

        {/* Profile Header: Avatar + Name + Role */}
        <div className="admin-profile-header-box">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Admin"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
          ) : (
            <UserAvatarPlaceholder size={46} />
          )}
          <div className="admin-profile-info">
            <h3 className="admin-profile-name">{displayName}</h3>
            <p className="admin-profile-role">{displayRole}</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="admin-profile-alert error">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="admin-profile-alert success">
            <Check size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profile Update Form */}
        <form onSubmit={handleSubmit} className="admin-profile-form">
          {/* User Name */}
          <div className="admin-profile-form-group">
            <label className="admin-profile-label">User Name</label>
            <input
              type="text"
              className="admin-profile-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Admin"
              required
            />
          </div>

          {/* Password with Eye Toggle */}
          <div className="admin-profile-form-group">
            <label className="admin-profile-label">Password</label>
            <div className="admin-profile-pwd-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-profile-input pwd-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="admin-profile-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={15} color="#9CA3AF" strokeWidth={1.8} />
                ) : (
                  <Eye size={15} color="#9CA3AF" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          {/* Full-Width Save Button */}
          <button
            type="submit"
            className="admin-profile-save-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfileModal;
