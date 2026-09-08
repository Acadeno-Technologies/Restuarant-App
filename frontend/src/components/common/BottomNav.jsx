import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const prefix = currentPath.startsWith('/staff') || user?.role === 'staff' ? '/staff' : '';

  const isTablesActive = currentPath.includes('tables') || currentPath === '/' || currentPath === '/staff' || currentPath === '/staff/';
  const isOrdersActive = currentPath.includes('pos') || currentPath.includes('orders');
  const isBillingActive = currentPath.includes('billing');
  const isQrActive = currentPath.includes('qr');

  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to={`${prefix}/tables`}
        className={`bottom-nav-item ${isTablesActive ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon-wrapper">
          <img
            src="/Dining table.png"
            alt="Tables"
            className="bottom-nav-icon-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/tables-icon.png';
            }}
          />
        </div>
        <span className="bottom-nav-label">Tables</span>
      </NavLink>

      <NavLink
        to={`${prefix}/pos`}
        className={`bottom-nav-item ${isOrdersActive ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon-wrapper">
          <img
            src="/order.png"
            alt="Orders"
            className="bottom-nav-icon-img"
          />
        </div>
        <span className="bottom-nav-label">Orders</span>
      </NavLink>

      <NavLink
        to={`${prefix}/billing`}
        className={`bottom-nav-item ${isBillingActive ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon-wrapper">
          <img
            src="/Bill.png"
            alt="Billing"
            className="bottom-nav-icon-img"
          />
        </div>
        <span className="bottom-nav-label">Billing</span>
      </NavLink>

      <NavLink
        to={`${prefix}/qr`}
        className={`bottom-nav-item ${isQrActive ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon-wrapper">
          <img
            src="/qr.png"
            alt="QR Code"
            className="bottom-nav-icon-img"
          />
        </div>
        <span className="bottom-nav-label">QR Code</span>
      </NavLink>
    </nav>
  );
};




