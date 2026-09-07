import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Receipt, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar admin-sidebar">
      {/* ── Brand Header ── */}
      <div className="admin-brand-header">
        <div className="admin-brand-logo-wrap" style={{ width: '44px', height: '44px', minWidth: '44px', maxWidth: '44px', minHeight: '44px', maxHeight: '44px', borderRadius: '50%', overflow: 'hidden' }}>
          <img 
            src="/logo.png" 
            alt="T Clock" 
            className="admin-brand-logo-img"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/cart.png';
            }}
          />
        </div>
        <div className="admin-brand-text">
          <h2 className="admin-brand-title">T Clock</h2>
          <span className="admin-brand-subtitle">ADMIN PORTAL</span>
        </div>
      </div>

      {/* ── Nav Links ── */}
      <nav className="admin-nav-menu">
        <ul className="admin-nav-list">
          {/* Dashboard */}
          <li>
            <NavLink 
              to="/admin/dashboard" 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutGrid size={20} strokeWidth={2.2} className="admin-nav-icon" />
              <span>Dashboard</span>
            </NavLink>
          </li>

          {/* Menu Catalogue */}
          <li>
            <NavLink 
              to="/admin/menu" 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar2-active.svg" : "/sidebar2.svg"} 
                    alt="Menu Catalogue" 
                    className="admin-nav-icon"
                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                  />
                  <span>Menu Catalogue</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Kitchen Screen */}
          <li>
            <NavLink 
              to="/admin/kitchen" 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar4-active.svg" : "/sidebar4.svg"} 
                    alt="Kitchen Screen" 
                    className="admin-nav-icon"
                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                  />
                  <span>Kitchen Screen</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Order History */}
          <li>
            <NavLink 
              to="/admin/orders" 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar3-active.svg" : "/sidebar3.svg"} 
                    alt="Order History" 
                    className="admin-nav-icon"
                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                  />
                  <span>Order History</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Staffs */}
          <li>
            <NavLink 
              to="/admin/staffs" 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar5-active.svg" : "/sidebar5.svg"} 
                    alt="Staffs" 
                    className="admin-nav-icon"
                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                  />
                  <span>Staffs</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Settings */}
          <li>
            <NavLink 
              to="/admin/settings" 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar6-active.svg" : "/sidebar6.svg"} 
                    alt="Settings" 
                    className="admin-nav-icon"
                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                  />
                  <span>Settings</span>
                </>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* ── Fixed Bottom Logout Button ── */}
      <div className="admin-sidebar-footer">
        <button 
          type="button"
          className="admin-logout-btn" 
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
