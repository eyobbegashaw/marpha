import { ApiClient } from './apiClient';
import { TenantConfig } from '../theme/TenantThemeProvider';

export type { TenantConfig };

export const platformAdminService = {
  async getTenants(): Promise<{ success: boolean; data: { tenants: TenantConfig[] } }> {
    try {
      const res = await ApiClient.get<any>('/platform/pharmacies');
      const raw = Array.isArray(res.data) ? res.data : [];
      const tenants: TenantConfig[] = raw.map((org: any) => ({
        id: org.id,
        organization_id: org.id,
        organization_name: org.name,
        organization_code: org.code,
        tenant_code: org.code,
        branding: {
          pharmacy_name: org.name || 'Pharmacy',
          display_name: org.name || 'Pharmacy',
          logo_url: org.logoUrl || '',
          favicon_url: '',
          primary_color: org.primaryColor || '#0D9488',
          secondary_color: org.secondaryColor || '#0F766E',
          accent_color: '#F59E0B',
          background_color: '#F8FAFC',
          text_color: '#0F172A',
        },
        content: {
          hero_title: 'Genuine Medicines & Verified Stock',
          hero_subtitle: 'Check availability across our branch locations',
          support_phone: '+251 911 000 000',
          support_email: 'support@pharmacy.com',
          footer_text: 'Licensed Community Dispensary',
          welcome_message: 'Welcome',
          description: '',
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
      }));

      if (tenants.length === 0) {
        return {
          success: true,
          data: {
            tenants: [
              {
                id: 'org-abu',
                organization_id: 'org-abu',
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
                  hero_title: 'Abu Central Pharmacy — Genuine Healthcare',
                  hero_subtitle: 'Real-time stock checking and verified dispensing',
                  support_phone: '+251 911 112 233',
                  support_email: 'info@abupharmacy.com',
                  footer_text: '© 2026 Abu Central Pharmacy. All rights reserved.',
                  welcome_message: 'Welcome to Abu Central Pharmacy',
                  description: 'Central distribution hub',
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
              },
              {
                id: 'org-butu',
                organization_id: 'org-butu',
                organization_name: 'Butu Community Pharmacy',
                organization_code: 'BUTU-01',
                tenant_code: 'BUTU-01',
                branding: {
                  pharmacy_name: 'Butu Community Pharmacy',
                  display_name: 'Butu Community Pharmacy',
                  logo_url: '',
                  favicon_url: '',
                  primary_color: '#1E40AF',
                  secondary_color: '#1E3A8A',
                  accent_color: '#3B82F6',
                  background_color: '#F8FAFC',
                  text_color: '#0F172A',
                },
                content: {
                  hero_title: 'Butu Community Pharmacy — Caring for You',
                  hero_subtitle: 'Affordable medicines and professional consultations',
                  support_phone: '+251 922 445 566',
                  support_email: 'contact@butupharmacy.com',
                  footer_text: '© 2026 Butu Community Pharmacy. Licensed Dispensary.',
                  welcome_message: 'Welcome to Butu Community Pharmacy',
                  description: 'Local neighborhood pharmacy branch',
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
              },
            ],
          },
        };
      }

      return { success: true, data: { tenants } };
    } catch (e) {
      return {
        success: true,
        data: {
          tenants: [],
        },
      };
    }
  },

  async updateTenantConfig(tenantId: string, payload: any) {
    return ApiClient.put(`/platform/pharmacies/${tenantId}/configuration`, payload);
  },

  async listPharmacies() {
    const res = await ApiClient.get<any[]>('/platform/pharmacies');
    return res.data;
  },

  async getConfiguration(organizationId: string) {
    const res = await ApiClient.get<any>(`/platform/pharmacies/${organizationId}/configuration`);
    return res.data;
  },

  async updateBranding(organizationId: string, brandingData: any) {
    const res = await ApiClient.patch<any>(`/platform/pharmacies/${organizationId}/branding`, brandingData);
    return res.data;
  },

  async updateContent(organizationId: string, contentMap: Record<string, { en: string; am?: string }>) {
    const res = await ApiClient.patch<any>(`/platform/pharmacies/${organizationId}/content`, { content: contentMap });
    return res.data;
  },

  async updateFeatures(organizationId: string, featuresMap: Record<string, boolean>) {
    const res = await ApiClient.patch<any>(`/platform/pharmacies/${organizationId}/features`, featuresMap);
    return res.data;
  },

  async preview(organizationId: string, overrides: any) {
    const res = await ApiClient.post<any>(`/platform/pharmacies/${organizationId}/preview`, overrides);
    return res.data;
  },

  async onboardPharmacy(data: any) {
    const res = await ApiClient.post<any>('/platform/pharmacies', data);
    return res.data;
  },
};
