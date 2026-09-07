import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  ShoppingBag, 
  Grid, 
  ChefHat, 
  UtensilsCrossed, 
  Receipt, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileHeader = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout, openProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isKitchen = user?.role === 'kitchen' || user?.role === 'admin';

  return (
    <>
      <style>{`
        .mobile-header-bar {
          display: none;
        }

        @media (max-width: 1024px) {
          .mobile-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 64px;
            padding: 0 1rem;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            position: sticky;
            top: 0;
            z-index: 995;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          }

          .mobile-drawer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            z-index: 1000;
            animation: fadeIn 0.2s ease;
          }

          .mobile-drawer-content {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100vh;
            background: #ffffff;
            z-index: 1001;
            display: flex;
            flex-direction: column;
            padding: 1.5rem 1rem;
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.15);
            animation: slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }

        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Top Mobile Header */}
      <div className="mobile-header-bar">
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ background: 'none', border: 'none', color: '#171717', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
          aria-label="Open Navigation Drawer"
        >
          <Menu size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img
            src="/logo.png"
            alt="T-Clock Logo"
            style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '50%' }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.02em' }}>T-CLOCK</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#B77D55', textTransform: 'uppercase' }}>RESTO CAFE</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#350707', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Slide-In Mobile Navigation Drawer */}
      {drawerOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="mobile-drawer-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <img src="/logo.png" alt="T Clock Logo" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>T-CLOCK</h3>
                  <span style={{ fontSize: '0.7rem', color: '#B77D55', fontWeight: 700 }}>RESTO CAFE</span>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={22} />
              </button>
            </div>

            <ul className="nav-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none' }}>
              {isAdmin && (
                <li>
                  <NavLink to="/" onClick={() => setDrawerOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </NavLink>
                </li>
              )}

              {isStaff && (
                <li>
                  <NavLink to="/tables" onClick={() => setDrawerOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Grid size={20} />
                    <span>Tables</span>
                  </NavLink>
                </li>
              )}

              {isStaff && (
                <li>
                  <NavLink to="/pos" onClick={() => setDrawerOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <ShoppingBag size={20} />
                    <span>Orders</span>
                  </NavLink>
                </li>
              )}

              {isStaff && (
                <li>
                  <NavLink to="/billing" onClick={() => setDrawerOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Receipt size={20} />
                    <span>Billing</span>
                  </NavLink>
                </li>
              )}

              {isKitchen && (
                <li>
                  <NavLink to="/kitchen" onClick={() => setDrawerOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <ChefHat size={20} />
                    <span>Kitchen Display</span>
                  </NavLink>
                </li>
              )}

              {isAdmin && (
                <li>
                  <NavLink to="/menu" onClick={() => setDrawerOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <UtensilsCrossed size={20} />
                    <span>Menu Editor</span>
                  </NavLink>
                </li>
              )}

              {isAdmin && (
                <li>
                  <NavLink to="/settings" onClick={() => setDrawerOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Settings size={20} />
                    <span>Settings</span>
                  </NavLink>
                </li>
              )}
            </ul>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
                onClick={() => {
                  setDrawerOpen(false);
                  openProfile();
                }}
              >
                <div className="avatar-circle">
                  {user?.username ? user.username[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', margin: 0 }}>{user?.username}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
