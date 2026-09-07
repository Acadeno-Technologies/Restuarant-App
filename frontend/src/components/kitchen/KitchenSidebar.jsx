import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const KitchenSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="kitchen-portal-sidebar">
      {/* ── Top Brand Header ── */}
      <div>
        <div className="kitchen-portal-brand">
          <div className="kitchen-portal-brand-logo">
            <img
              src="/logo.png"
              alt="T Clock"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/cart.png';
              }}
            />
          </div>
          <div className="kitchen-portal-brand-text">
            <h2 className="kitchen-portal-brand-title">T Clock</h2>
            <span className="kitchen-portal-brand-sub">KITCHEN SCREEN</span>
          </div>
        </div>

        {/* ── Navigation Menu (Only 1 item: Kitchen Screen) ── */}
        <nav className="kitchen-portal-nav">
          <NavLink
            to="/kitchen-screen"
            className={({ isActive }) => `kitchen-portal-nav-link ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <img
                  src={isActive ? '/sidebar4-active.svg' : '/sidebar4.svg'}
                  alt="Kitchen Screen"
                  style={{ width: '21px', height: '21px', objectFit: 'contain' }}
                />
                <span>Kitchen Screen</span>
              </>
            )}
          </NavLink>
        </nav>
      </div>

      {/* ── Bottom Logout Button ── */}
      <div className="kitchen-portal-sidebar-footer">
        <button
          onClick={handleLogout}
          className="kitchen-portal-logout-btn"
          type="button"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
