import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProfileSheet = () => {
  const { user, logout, isProfileOpen, closeProfile } = useAuth();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState(() => {
    return user?.savedPassword || localStorage.getItem('saved_pwd') || '••••••••';
  });

  useEffect(() => {
    if (user?.username) setUsername(user.username);
    const saved = user?.savedPassword || localStorage.getItem('saved_pwd');
    if (saved) {
      setPassword(saved);
    }
  }, [user, isProfileOpen]);

  if (!isProfileOpen) return null;

  const handleLogout = () => {
    logout();
    closeProfile();
    navigate('/login');
  };

  const userInitial = user?.username ? user.username[0].toUpperCase() : 'A';
  const displayName = user?.first_name || user?.username || 'Ashna';
  const displayRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Waiter';

  return (
    <>
      <style>{`
        .profile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(3px);
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        .profile-sheet {
          position: fixed;
          left: 2px;
          right: 2px;
          bottom: 0;
          z-index: 10001;
          height: auto;
          max-height: 85vh;
          background: #ffffff;
          border-radius: 28px 28px 0 0;
          padding: 24px 22px 28px 22px;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.18);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          animation: slideUp 0.3s ease-out;
          box-sizing: border-box;
        }

        .profile-sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .profile-sheet-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #171717;
          margin: 0;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .profile-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #171717;
          padding: 0;
          transition: background 0.15s ease;
        }

        .profile-close-btn:hover {
          background: #f8fafc;
        }

        .profile-user-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .profile-avatar-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #F5F1EF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: #350505;
          flex-shrink: 0;
        }

        .profile-user-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .profile-user-name {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.15rem;
        }

        .profile-user-role-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.88rem;
          color: #6F625C;
          font-weight: 500;
        }

        .role-bullet {
          font-size: 0.5rem;
          color: #171717;
          line-height: 1;
        }

        .profile-field-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 1.1rem;
        }

        .profile-field-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6F625C;
          margin-bottom: 0.4rem;
          text-align: left;
        }

        .profile-field-input {
          width: 100%;
          height: 40px;
          border: 1px solid #222222;
          border-radius: 9999px;
          background: #ffffff;
          padding: 0 1rem;
          font-size: 0.9rem;
          color: #171717;
          outline: none;
          box-shadow: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .profile-password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .profile-eye-btn {
          position: absolute;
          right: 0.85rem;
          background: none;
          border: none;
          color: #6F625C;
          cursor: pointer;
          padding: 0.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-logout-btn {
          width: 100%;
          height: 44px;
          background-color: #350505;
          color: #ffffff;
          border: none;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(53, 5, 5, 0.25);
          transition: all 0.2s ease;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .profile-logout-btn:active {
          transform: scale(0.98);
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Desktop Protection - Mobile Only */
        @media (min-width: 769px) {
          .profile-overlay,
          .profile-sheet {
            display: none !important;
          }
        }
      `}</style>

      {/* Dark/Blurred Overlay */}
      <div className="profile-overlay" onClick={closeProfile} />

      {/* Bottom Sheet Modal */}
      <div className="profile-sheet">
        <div>
          {/* Header */}
          <div className="profile-sheet-header">
            <h2 className="profile-sheet-title">Profile</h2>
            <button className="profile-close-btn" onClick={closeProfile} aria-label="Close Profile">
              <X size={18} />
            </button>
          </div>

          {/* User Info Row */}
          <div className="profile-user-row">
            <div className="profile-avatar-circle">
              {userInitial}
            </div>
            <div className="profile-user-info">
              <div className="profile-user-name">{displayName}</div>
              <div className="profile-user-role-row">
                <span className="role-bullet">●</span>
                <span>{displayRole}</span>
              </div>
            </div>
          </div>

          {/* User Name Field */}
          <div className="profile-field-group">
            <label className="profile-field-label">User Name</label>
            <input
              type="text"
              className="profile-field-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              readOnly
            />
          </div>

          {/* Password Field */}
          <div className="profile-field-group">
            <label className="profile-field-label">Password</label>
            <div className="profile-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="profile-field-input"
                style={{ paddingRight: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="profile-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button type="button" className="profile-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </>
  );
};
