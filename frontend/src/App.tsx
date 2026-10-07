import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import { TenantThemeProvider } from './theme/TenantThemeProvider';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { PlatformAdminLoginPage } from './pages/auth/PlatformAdminLoginPage';
import { CatalogPage } from './pages/customer/CatalogPage';
import { CustomerPurchasesPage } from './pages/customer/CustomerPurchasesPage';
import { PosTerminalPage } from './pages/pharmacist/PosTerminalPage';
import { InventoryHubPage } from './pages/pharmacist/InventoryHubPage';
import { BatchesFefoPage } from './pages/pharmacist/BatchesFefoPage';
import { PurchasesProcurementPage } from './pages/pharmacist/PurchasesProcurementPage';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { StaffManagementPage } from './pages/owner/StaffManagementPage';
import { ExpensesPage } from './pages/owner/ExpensesPage';
import { PlatformAdminPage } from './pages/platform/PlatformAdminPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  allowedRoles?: string[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (allowedRoles?.includes('PLATFORM_ADMIN') && allowedRoles.length === 1) {
      return <Navigate to="/platform/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <TenantThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <AppLayout>
              <Routes>
                {/* Public & Customer Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Dedicated Platform Super-Admin Login Portal */}
                <Route path="/platform/admin/login" element={<PlatformAdminLoginPage />} />
                <Route path="/platform-admin/login" element={<PlatformAdminLoginPage />} />

                {/* Tenant-Specific Pharmacy Login (Owner & Pharmacist): /:pharmacySlug/login */}
                <Route path="/:pharmacySlug/login" element={<LoginPage />} />

                {/* Customer Routes */}
                <Route
                  path="/customer/purchases"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'PHARMACIST', 'PHARMACY_OWNER', 'PLATFORM_ADMIN']}>
                      <CustomerPurchasesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Pharmacist Operations */}
                <Route
                  path="/pharmacist/pos"
                  element={
                    <ProtectedRoute allowedRoles={['PHARMACIST', 'PHARMACY_OWNER', 'PLATFORM_ADMIN']}>
                      <PosTerminalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pharmacist/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['PHARMACIST', 'PHARMACY_OWNER', 'PLATFORM_ADMIN']}>
                      <InventoryHubPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pharmacist/batches"
                  element={
                    <ProtectedRoute allowedRoles={['PHARMACIST', 'PHARMACY_OWNER', 'PLATFORM_ADMIN']}>
                      <BatchesFefoPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pharmacist/purchases"
                  element={
                    <ProtectedRoute allowedRoles={['PHARMACIST', 'PHARMACY_OWNER', 'PLATFORM_ADMIN']}>
                      <PurchasesProcurementPage />
                    </ProtectedRoute>
                  }
                />

                {/* Pharmacy Owner Executive Routes */}
                <Route
                  path="/owner/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['PHARMACY_OWNER', 'PLATFORM_ADMIN']}>
                      <OwnerDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner/staff"
                  element={
                    <ProtectedRoute allowedRoles={['PHARMACY_OWNER', 'PLATFORM_ADMIN']}>
                      <StaffManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner/expenses"
                  element={
                    <ProtectedRoute allowedRoles={['PHARMACY_OWNER', 'PLATFORM_ADMIN']}>
                      <ExpensesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Platform Super-Admin Area */}
                <Route
                  path="/platform-admin"
                  element={
                    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                      <PlatformAdminPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </AuthProvider>
        </I18nProvider>
      </TenantThemeProvider>
    </Router>
  );
};

export default App;
