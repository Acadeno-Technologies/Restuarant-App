import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ProfileSheet } from './ProfileSheet';

export const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'kitchen') {
    return <Navigate to="/kitchen-screen" replace />;
  }

  const isStaff = user?.role === 'staff';

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1, width: '100%' }}>
        {!isStaff && <Sidebar />}
        <main className={`main-content ${isStaff ? 'staff-main-content' : ''}`}>
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <ProfileSheet />
    </div>
  );
};



