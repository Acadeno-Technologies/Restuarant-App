import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';

// Staff (Mobile) Layout & Pages
import { ProtectedLayout } from './components/common/ProtectedLayout';
import { LoginPage } from './pages/LoginPage';
import { TablesPage } from './pages/TablesPage';
import { POSPage } from './pages/POSPage';
import { BillingPage } from './pages/BillingPage';
import { KitchenPage } from './pages/KitchenPage';
import { MenuPage } from './pages/MenuPage';
import { QRCodePage } from './pages/QRCodePage';
import { SettingsPage } from './pages/SettingsPage';

// Admin (Desktop) Layout & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminRegisterPage } from './pages/admin/AdminRegisterPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminMenuPage } from './pages/admin/AdminMenuPage';
import { AdminStaffsPage } from './pages/admin/AdminStaffsPage';
import { AdminKitchenPage } from './pages/admin/AdminKitchenPage';
import { AdminAggregatorsPage } from './pages/admin/AdminAggregatorsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Kitchen Portal Layout & Pages
import { KitchenLayout } from './components/kitchen/KitchenLayout';
import { KitchenScreenPage } from './pages/kitchen/KitchenScreenPage';

/**
 * RootGateway directs user to the correct portal based on role
 */
const RootGateway = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'staff') {
    return <Navigate to="/staff/tables" replace />;
  }
  if (user.role === 'kitchen') {
    return <Navigate to="/kitchen-screen" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrderProvider>
          <Routes>
            {/* ── Public Auth (Staff & Kitchen) ── */}
            <Route path="/login" element={<LoginPage />} />

            {/* ── Public Auth (Admin Portal) ── */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/register" element={<AdminRegisterPage />} />

            {/* ── Root Gateway ── */}
            <Route path="/" element={<RootGateway />} />

            {/* ═══════════════════════════════════════════════════════════════
                ADMIN PORTAL (Desktop Reference Design)
            ═══════════════════════════════════════════════════════════════ */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="menu" element={<AdminMenuPage />} />
              <Route path="staffs" element={<AdminStaffsPage />} />
              <Route path="kitchen" element={<AdminKitchenPage />} />
              <Route path="swiggy-zomato" element={<AdminAggregatorsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* ═══════════════════════════════════════════════════════════════
                KITCHEN PORTAL (Dedicated Kitchen Screen - Kitchen Role)
            ═══════════════════════════════════════════════════════════════ */}
            <Route element={<KitchenLayout />}>
              <Route path="/kitchen-screen" element={<KitchenScreenPage />} />
              <Route path="/kitchen" element={<KitchenScreenPage />} />
            </Route>

            {/* ═══════════════════════════════════════════════════════════════
                STAFF PORTAL (Existing Mobile Application - 100% Intact)
            ═══════════════════════════════════════════════════════════════ */}
            {/* Scoped under /staff/* */}
            <Route path="/staff" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="/staff/tables" replace />} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="pos" element={<POSPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="kitchen" element={<KitchenPage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="qr" element={<QRCodePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Direct aliases for backward-compatibility */}
            <Route element={<ProtectedLayout />}>
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/qr" element={<QRCodePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OrderProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
