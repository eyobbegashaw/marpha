import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useTenantConfig } from '../../theme/TenantThemeProvider';
import { useTranslation } from '../../i18n/I18nContext';
import { RoleOnboardingTour } from '../onboarding/RoleOnboardingTour';
import { ToastContainer } from '../ui/Toast';
import { MapPin, Phone, Mail, ShieldCheck, Heart, Send } from 'lucide-react';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { config } = useTenantConfig();
  const { t } = useTranslation();
  const location = useLocation();

  const isCatalogPage = location.pathname === '/catalog' || location.pathname.startsWith('/catalog');
  const isDashboardPage =
    location.pathname.startsWith('/owner') ||
    location.pathname.startsWith('/pharmacist') ||
    location.pathname.startsWith('/platform-admin');
  const isLoginPage =
    location.pathname === '/login' ||
    location.pathname.endsWith('/login');

  if (isLoginPage) {
    return (
      <>
        {children || <Outlet />}
        <ToastContainer />
      </>
    );
  }

  const showFooter = !isCatalogPage && !isDashboardPage;

  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle text-text-primary">
      <Navbar />

      <main
        className={
          isDashboardPage
            ? 'flex-1 w-full px-2 sm:px-4 py-4'
            : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'
        }
      >
        {children || <Outlet />}
      </main>

      {/* Role-Specific Interactive Onboarding Tour */}
      <RoleOnboardingTour />

      {/* Global Toast Notifications (Fixed at Bottom-Right) */}
      <ToastContainer />

      {/* Footer (Hidden on /catalog and dashboards) */}
      {showFooter && (
        <footer className="bg-surface border-t border-surface-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Pharmacy Brand column */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                  <Heart className="w-4 h-4 fill-white" />
                </div>
                <span className="text-base font-bold text-text-primary">
                  {config?.branding?.display_name || config?.branding?.pharmacy_name || config?.display_name || 'Pharmacy Platform'}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-md">
                {config?.content?.description ||
                  'Enterprise clinical pharmacy platform providing location-aware stock management, FEFO batch safety, and real-time public medicine availability.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>Verified Pharmaceutical License & Good Dispensing Practice (GDP)</span>
              </div>
            </div>

            {/* Quick Contact info */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                {t('contact.title', 'Contact & Location')}
              </h5>
              <div className="space-y-2 text-xs text-text-secondary">
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{config?.content?.address || 'Bole Road, Next to Edna Mall, Addis Ababa, Ethiopia'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                  <a href={`tel:${config?.content?.support_phone || '+251911234567'}`} className="hover:text-primary transition-colors">
                    {config?.content?.support_phone || '+251 911 234 567'}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-primary shrink-0" />
                  <a
                    href={`https://t.me/${(config?.content?.telegram || '@AbuCentralPharmacy').replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors font-medium text-primary"
                  >
                    {config?.content?.telegram || '@AbuCentralPharmacy'}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span>{config?.content?.support_email || 'support@pharmacy.com'}</span>
                </p>
              </div>
            </div>

            {/* System Standards */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-primary">Platform Standards</h5>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• Multi-Location Stock Rules (Shelf vs. Warehouse)</li>
                <li>• First-Expired, First-Out (FEFO) Batch Safety</li>
                <li>• Real-Time Stock Availability Lookup</li>
                <li>• Transparent Demand & ADS Restock Insights</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <p>{config?.content?.footer_text || '© 2026 Pharmacy Operations Platform. All rights reserved.'}</p>
            <div className="flex items-center gap-4">
              <span>Bilingual EN / AM</span>
              <span>•</span>
              <span>Tenant: {config?.tenant_code || config?.organization_code || 'SELAM-01'}</span>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};
