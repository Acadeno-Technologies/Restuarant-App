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

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8E8DA' }}>
      <main className="staff-main-content" style={{ flex: 1, width: '100%', padding: 0, margin: 0, background: '#F8E8DA' }}>
        <Outlet />
      </main>
      <BottomNav />
      <ProfileSheet />
    </div>
  );
};



