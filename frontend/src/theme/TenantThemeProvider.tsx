import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface TenantBranding {
  pharmacy_name: string;
  display_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}

export interface TenantContent {
  hero_title: string;
  hero_subtitle: string;
  support_phone: string;
  support_email: string;
  footer_text: string;
  welcome_message: string;
  description: string;
  address?: string;
  telegram?: string;
  image_url?: string;
}

export interface TenantFeatureFlags {
  allowPublicCatalog: boolean;
  allowPublicAvailabilityCheck: boolean;
  enableStockAlerts: boolean;
  enableFefoWarning: boolean;
  [key: string]: boolean;
}

export interface TenantSettings {
  currency: string;
  tax_rate: number;
  password_reset_strategy?: 'OWNER_RESET' | 'EMAIL_RESET';
  default_pharmacist_password?: string;
  [key: string]: any;
}

export interface TenantConfig {
  id?: string;
  organization_id: string;
  organization_name: string;
  organization_code: string;
  tenant_code?: string;
  pharmacy_name?: string;
  display_name?: string;
  branding: TenantBranding;
  content: TenantContent & Record<string, any>;
  feature_flags: TenantFeatureFlags;
  settings: TenantSettings;
  [key: string]: any;
}

interface TenantContextType {
  config: TenantConfig | null;
  isLoading: boolean;
  tenantCode: string;
  setTenantCode: (code: string) => void;
  refreshConfig: () => Promise<void>;
  getCmsText: (key: string, defaultText: string) => string;
  isFeatureEnabled: (featureKey: string) => boolean;
}

const defaultAbuConfig: TenantConfig = {
  id: 'org-abu-01',
  organization_id: 'org-abu-01',
  organization_name: 'Abu Central Pharmacy',
  organization_code: 'SELAM-01',
  tenant_code: 'SELAM-01',
  branding: {
    pharmacy_name: 'Abu Central Pharmacy',
    display_name: 'Abu Central Pharmacy',
    logo_url: '',
    favicon_url: '',
    primary_color: '#0D9488',
    secondary_color: '#0F766E',
    accent_color: '#F59E0B',
    background_color: '#F8FAFC',
    text_color: '#0F172A',
  },
  content: {
    hero_title: 'Verified Genuine Medicines & Real-Time Stock',
    hero_subtitle: 'Check availability across our licensed pharmacy branches',
    support_phone: '+251 911 234 567',
    support_email: 'support@abupharmacy.com',
    footer_text: '© 2026 Abu Central Pharmacy. Licensed Community Dispensary.',
    welcome_message: 'Welcome to Abu Central Pharmacy — Your trusted healthcare partner.',
    description: 'Premier licensed community healthcare dispensary dedicated to providing genuine prescription medicines, patient counseling, and verified pharmaceutical care.',
    address: 'Bole Road, Next to Edna Mall, Addis Ababa, Ethiopia',
    telegram: '@AbuCentralPharmacy',
    image_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&q=80',
  },
  feature_flags: {
    allowPublicCatalog: true,
    allowPublicAvailabilityCheck: true,
    enableStockAlerts: true,
    enableFefoWarning: true,
  },
  settings: {
    currency: 'ETB',
    tax_rate: 15.0,
  },
};

const TenantContext = createContext<TenantContextType>({
  config: defaultAbuConfig,
  isLoading: false,
  tenantCode: 'SELAM-01',
  setTenantCode: () => {},
  refreshConfig: async () => {},
  getCmsText: (_, def) => def,
  isFeatureEnabled: () => true,
});

export const TenantThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantCode, setTenantCodeState] = useState<string>(() => {
    return localStorage.getItem('tenant_code') || 'SELAM-01';
  });
  const [config, setConfig] = useState<TenantConfig | null>(defaultAbuConfig);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { language } = useTranslation();

  const applyThemeColors = (cfg: TenantConfig) => {
    const root = document.documentElement;
    const primary = cfg.branding?.primary_color || '#0D9488';
    const secondary = cfg.branding?.secondary_color || '#0F766E';
    const accent = cfg.branding?.accent_color || '#F59E0B';

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-accent', accent);
    
    document.title = `${cfg.branding?.display_name || cfg.branding?.pharmacy_name || 'Pharmacy Platform'}`;
  };

  const loadTenantConfig = async (codeToFetch: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/platform/config/public?tenantCode=${codeToFetch}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const raw = json.data;
          const merged: TenantConfig = {
            id: raw.id || raw.organization_id,
            organization_id: raw.organization_id || 'org-1',
            organization_name: raw.organization_name || 'Pharmacy',
            organization_code: raw.organization_code || codeToFetch,
            tenant_code: raw.tenant_code || raw.organization_code || codeToFetch,
            branding: {
              pharmacy_name: raw.branding?.pharmacy_name || raw.pharmacy_name || 'Pharmacy',
              display_name: raw.branding?.display_name || raw.display_name || 'Pharmacy',
              logo_url: raw.branding?.logo_url || '',
              favicon_url: raw.branding?.favicon_url || '',
              primary_color: raw.branding?.primary_color || raw.primary_color || '#0D9488',
              secondary_color: raw.branding?.secondary_color || raw.secondary_color || '#0F766E',
              accent_color: raw.branding?.accent_color || raw.accent_color || '#F59E0B',
              background_color: raw.branding?.background_color || '#F8FAFC',
              text_color: raw.branding?.text_color || '#0F172A',
            },
            content: {
              hero_title: raw.content?.hero_title || 'Verified Medicines',
              hero_subtitle: raw.content?.hero_subtitle || 'Real-time stock checking',
              support_phone: raw.content?.support_phone || raw.contact_phone || '+251 911 000 000',
              support_email: raw.content?.support_email || raw.contact_email || 'support@pharmacy.com',
              footer_text: raw.content?.footer_text || raw.footer_text || 'Regulated Healthcare Operations',
              welcome_message: raw.content?.welcome_message || raw.welcome_message || 'Welcome',
              description: raw.content?.description || raw.description || '',
              address: raw.content?.address || raw.address || 'Bole Road, Next to Edna Mall, Addis Ababa, Ethiopia',
              telegram: raw.content?.telegram || raw.telegram || '@AbuCentralPharmacy',
              image_url: raw.content?.image_url || raw.branding?.image_url || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&q=80',
            },
            feature_flags: raw.feature_flags || defaultAbuConfig.feature_flags,
            settings: raw.settings || defaultAbuConfig.settings,
          };
          setConfig(merged);
          applyThemeColors(merged);
        }
      }
    } catch (e) {
      applyThemeColors(defaultAbuConfig);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenantConfig(tenantCode);
  }, [tenantCode]);

  const setTenantCode = (newCode: string) => {
    setTenantCodeState(newCode);
    localStorage.setItem('tenant_code', newCode);
  };

  const refreshConfig = async () => {
    await loadTenantConfig(tenantCode);
  };

  const getCmsText = (key: string, defaultText: string): string => {
    if (config?.content?.[key]) {
      return config.content[key][language] || config.content[key]['en'] || config.content[key] || defaultText;
    }
    return defaultText;
  };

  const isFeatureEnabled = (featureKey: string): boolean => {
    if (!config?.feature_flags) return true;
    return config.feature_flags[featureKey] !== false;
  };

  return (
    <TenantContext.Provider
      value={{
        config,
        isLoading,
        tenantCode,
        setTenantCode,
        refreshConfig,
        getCmsText,
        isFeatureEnabled,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantConfig = () => useContext(TenantContext);
export const useTenantTheme = () => useContext(TenantContext);
