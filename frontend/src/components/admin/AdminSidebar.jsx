import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Receipt, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="admin-portal-sidebar">
      {/* ── Top Brand Header ── */}
      <div className="admin-portal-brand">
        <div className="admin-portal-brand-logo">
          <img 
            src="/logo.png" 
            alt="T Clock" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/cart.png';
            }}
          />
        </div>
        <div className="admin-portal-brand-text">
          <h2 className="admin-portal-brand-title">T Clock</h2>
          <span className="admin-portal-brand-sub">ADMIN PORTAL</span>
        </div>
      </div>

      {/* ── Navigation Menu ── */}
      <nav className="admin-portal-nav">
        <ul className="admin-portal-nav-list">
          {/* Dashboard */}
          <li>
            <NavLink 
              to="/admin/dashboard" 
              className={({ isActive }) => `admin-portal-nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutGrid size={21} strokeWidth={2.2} />
              <span>Dashboard</span>
            </NavLink>
          </li>

          {/* Menu Catalogue */}
          <li>
            <NavLink 
              to="/admin/menu" 
              className={({ isActive }) => `admin-portal-nav-link ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar2-active.svg" : "/sidebar2.svg"} 
                    alt="Menu Catalogue" 
                    className="admin-portal-nav-img"
                  />
                  <span>Menu Catalogue</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Order History */}
          <li>
            <NavLink 
              to="/admin/orders" 
              className={({ isActive }) => `admin-portal-nav-link ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar3-active.svg" : "/sidebar3.svg"} 
                    alt="Order History" 
                    className="admin-portal-nav-img"
                  />
                  <span>Order History</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Kitchen Screen */}
          <li>
            <NavLink 
              to="/admin/kitchen" 
              className={({ isActive }) => `admin-portal-nav-link ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar4-active.svg" : "/sidebar4.svg"} 
                    alt="Kitchen Screen" 
                    className="admin-portal-nav-img"
                  />
                  <span>Kitchen Screen</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Staffs */}
          <li>
            <NavLink 
              to="/admin/staffs" 
              className={({ isActive }) => `admin-portal-nav-link ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar5-active.svg" : "/sidebar5.svg"} 
                    alt="Staffs" 
                    className="admin-portal-nav-img"
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
              className={({ isActive }) => `admin-portal-nav-link ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={isActive ? "/sidebar6-active.svg" : "/sidebar6.svg"} 
                    alt="Settings" 
                    className="admin-portal-nav-img"
                  />
                  <span>Settings</span>
                </>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* ── Bottom Logout Button ── */}
      <div className="admin-portal-sidebar-footer">
        <button 
          type="button"
          className="admin-portal-logout-btn" 
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
