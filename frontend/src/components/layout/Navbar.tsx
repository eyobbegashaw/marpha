import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext';
import { useTenantConfig } from '../../theme/TenantThemeProvider';
import { useAuth } from '../../auth/AuthContext';
import { NotificationCenter } from '../ui/NotificationCenter';
import {
  Activity,
  ShoppingCart,
  Boxes,
  Truck,
  Layers,
  Users,
  BarChart3,
  Globe,
  LogOut,
  Menu,
  X,
  Receipt,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Navbar: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { config } = useTenantConfig();
  const { user, isAuthenticated, logout, isOwner, isPharmacist, isPlatformAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isDashboardPage =
    location.pathname.startsWith('/owner') ||
    location.pathname.startsWith('/pharmacist') ||
    location.pathname.startsWith('/platform-admin');

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-surface-border">
      {/* Main Navigation */}
      <div className={isDashboardPage ? 'w-full px-2 sm:px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            {config?.logo_url ? (
              <img src={config.logo_url} alt={config.display_name} className="h-9 w-auto object-contain rounded" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft-sm group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            )}
            <div className="space-y-0.5">
              <span className="text-base font-bold tracking-tight text-text-primary block leading-tight">
                {config?.display_name || config?.pharmacy_name || 'Pharmacy Platform'}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-primary block">
                {isOwner ? 'Executive Portal' : isPharmacist ? 'Dispensary & POS' : isPlatformAdmin ? 'Platform Admin' : 'Healthcare Dispensary'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {/* Public / Customer */}
            {!isOwner && !isPharmacist && !isPlatformAdmin && (
              <>
                <Link
                  to="/"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors',
                    isActive('/') && location.pathname === '/' ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  {t('nav.home', 'Home')}
                </Link>
                <Link
                  to="/catalog"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors',
                    isActive('/catalog') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  {t('nav.catalog', 'Medicine Catalog')}
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/my-purchases"
                    className={clsx(
                      'px-3 py-2 rounded-lg transition-colors',
                      isActive('/my-purchases') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                    )}
                  >
                    {t('nav.myPurchases', 'My Purchases')}
                  </Link>
                )}
              </>
            )}

            {/* Pharmacist Operational Links */}
            {isPharmacist && (
              <>
                <Link
                  to="/pharmacist/pos"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                    isActive('/pharmacist/pos') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t('nav.pos', 'POS Terminal')}
                </Link>
                <Link
                  to="/pharmacist/inventory"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                    isActive('/pharmacist/inventory') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  <Boxes className="w-4 h-4" />
                  {t('nav.inventory', 'Stock Hub')}
                </Link>
                <Link
                  to="/pharmacist/purchases"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                    isActive('/pharmacist/purchases') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  <Truck className="w-4 h-4" />
                  {t('nav.purchases', 'Procurement')}
                </Link>
                <Link
                  to="/pharmacist/batches"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                    isActive('/pharmacist/batches') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  <Layers className="w-4 h-4" />
                  {t('nav.batches', 'FEFO & Expiry')}
                </Link>
              </>
            )}

            {/* Owner Executive Links */}
            {isOwner && (
              <>
                <Link
                  to="/owner/dashboard"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                    isActive('/owner/dashboard') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  {t('nav.dashboard', 'Executive Dashboard')}
                </Link>
                <Link
                  to="/owner/staff"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                    isActive('/owner/staff') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  <Users className="w-4 h-4" />
                  {t('nav.staff', 'Staff & Access')}
                </Link>
                <Link
                  to="/owner/expenses"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                    isActive('/owner/expenses') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  <Receipt className="w-4 h-4" />
                  {t('nav.expenses', 'Expenses')}
                </Link>
                <Link
                  to="/pharmacist/inventory"
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                    isActive('/pharmacist/inventory') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  <Boxes className="w-4 h-4" />
                  {t('nav.inventory', 'Stock Overview')}
                </Link>
              </>
            )}

            {/* Platform Admin Link */}
            {isPlatformAdmin && (
              <Link
                to="/platform-admin"
                className={clsx(
                  'px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                  isActive('/platform-admin') ? 'text-primary font-semibold bg-primary-light/60' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                )}
              >
                <Settings className="w-4 h-4" />
                {t('nav.platformAdmin', 'Platform Admin')}
              </Link>
            )}
          </nav>

          {/* Right Action Icons & Language */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-surface-muted border border-surface-border/70 rounded-lg p-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-text-muted ml-0.5" />
              <button
                onClick={() => setLanguage('en')}
                className={clsx(
                  'px-2 py-0.5 rounded font-semibold text-xs transition-colors',
                  language === 'en' ? 'bg-primary text-white shadow-soft-sm' : 'hover:bg-surface text-text-secondary'
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('am')}
                className={clsx(
                  'px-2 py-0.5 rounded font-semibold font-amharic text-xs transition-colors',
                  language === 'am' ? 'bg-primary text-white shadow-soft-sm' : 'hover:bg-surface text-text-secondary'
                )}
              >
                አማርኛ
              </button>
            </div>

            {isAuthenticated && <NotificationCenter />}

            {isAuthenticated && (
              <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-text-primary leading-tight">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <span className="text-[10px] text-text-muted uppercase font-bold">{user?.role}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-border bg-surface p-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {!isOwner && !isPharmacist && !isPlatformAdmin && (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.home', 'Home')}
              </Link>
              <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.catalog', 'Medicine Catalog')}
              </Link>
              {isAuthenticated && (
                <Link to="/my-purchases" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                  {t('nav.myPurchases', 'My Purchases')}
                </Link>
              )}
            </>
          )}

          {isPharmacist && (
            <>
              <Link to="/pharmacist/pos" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.pos', 'POS Terminal')}
              </Link>
              <Link to="/pharmacist/inventory" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.inventory', 'Stock Hub')}
              </Link>
              <Link to="/pharmacist/purchases" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.purchases', 'Procurement')}
              </Link>
              <Link to="/pharmacist/batches" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.batches', 'FEFO & Expiry')}
              </Link>
            </>
          )}

          {isOwner && (
            <>
              <Link to="/owner/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.dashboard', 'Executive Dashboard')}
              </Link>
              <Link to="/owner/staff" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.staff', 'Staff & Roles')}
              </Link>
              <Link to="/owner/expenses" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-text-primary">
                {t('nav.expenses', 'Expenses')}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
