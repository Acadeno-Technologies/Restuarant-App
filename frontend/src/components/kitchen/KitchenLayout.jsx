import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KitchenSidebar } from './KitchenSidebar';
import '../../styles/kitchenScreen.css';

export const KitchenLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Require authentication
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only allow Kitchen staff and Admin (prevent normal staff from accessing)
  if (user.role === 'staff') {
    return <Navigate to="/staff/tables" replace />;
  }

  return (
    <div className="kitchen-portal-root">
      <KitchenSidebar />
      <main className="kitchen-portal-main">
        <Outlet />
      </main>
    </div>
  );
};

export default KitchenLayout;
