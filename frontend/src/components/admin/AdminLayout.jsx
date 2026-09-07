import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminProfileModal } from './AdminProfileModal';
import '../../styles/admin.css';

export const AdminLayout = () => {
  const { user, loading, isProfileOpen, closeProfile } = useAuth();

  if (loading) {
    return null;
  }

  // Require authentication
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Require Admin role (Staff and Kitchen cannot access /admin/*)
  if (user.role !== 'admin') {
    if (user.role === 'kitchen') {
      return <Navigate to="/staff/kitchen" replace />;
    }
    return <Navigate to="/staff/tables" replace />;
  }

  return (
    <div className="admin-portal-root">
      <AdminSidebar />
      <main className="admin-portal-main">
        <Outlet />
      </main>

      {/* Centered Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileOpen}
        onClose={closeProfile}
      />
    </div>
  );
};

export default AdminLayout;
