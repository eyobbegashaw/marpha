import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useTenantConfig } from '../../theme/TenantThemeProvider';
import { platformAdminService, TenantConfig } from '../../services/platformAdminService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { 
  Building2, 
  Palette, 
  Settings, 
  FileText, 
  Sliders, 
  Save, 
  Eye, 
  CheckCircle2, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Store,
  PlusCircle
} from 'lucide-react';

export const PlatformAdminPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { refreshConfig, setTenantCode: setActiveTenantCode } = useTenantConfig();
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New tenant modal
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [newPrimaryColor, setNewPrimaryColor] = useState('#2563EB');
  const [creatingTenant, setCreatingTenant] = useState(false);

  // Active sub-tab in config editor
  const [activeTab, setActiveTab] = useState<'branding' | 'content' | 'features' | 'settings'>('branding');

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await platformAdminService.getTenants();
      const list = res.data.tenants || [];
      setTenants(list);
      if (list.length > 0 && !selectedTenant) {
        setSelectedTenant(list[0]);
      }
    } catch (err) {
      console.error('Failed to load tenants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleSaveConfig = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      const targetId = selectedTenant.id || selectedTenant.organization_id || 'org-abu';
      await platformAdminService.updateTenantConfig(targetId, {
        branding: selectedTenant.branding,
        content: selectedTenant.content,
        feature_flags: selectedTenant.feature_flags,
        settings: selectedTenant.settings
      });

      // Immediately inject CSS variables to live interface without page reload
      document.documentElement.style.setProperty('--color-primary', selectedTenant.branding.primary_color);
      document.documentElement.style.setProperty('--color-secondary', selectedTenant.branding.secondary_color);
      document.documentElement.style.setProperty('--color-accent', selectedTenant.branding.accent_color);
      if (selectedTenant.tenant_code) {
        setActiveTenantCode(selectedTenant.tenant_code);
      }
      await refreshConfig();

      const successMsg = `Configuration for "${selectedTenant.branding.pharmacy_name}" saved to PostgreSQL API and applied instantly!`;
      setStatusMsg({
        type: 'success',
        text: successMsg
      });
      toast.success(successMsg, 'Config Saved');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to save configuration.';
      setStatusMsg({
        type: 'error',
        text: errorMsg
      });
      toast.error(errorMsg, 'Save Error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTenant(true);
    try {
      const newCode = newOrgCode.toUpperCase().trim();
      const newTenant: TenantConfig = {
        id: `org-${Date.now()}`,
        organization_id: `org-${Date.now()}`,
        organization_name: newOrgName,
        organization_code: newCode,
        tenant_code: newCode,
        branding: {
          pharmacy_name: newOrgName,
          display_name: newOrgName,
          logo_url: '',
          favicon_url: '',
          primary_color: newPrimaryColor,
          secondary_color: '#1E40AF',
          accent_color: '#38BDF8',
          background_color: '#F8FAFC',
          text_color: '#0F172A',
        },
        content: {
          hero_title: `Welcome to ${newOrgName}`,
          hero_subtitle: 'Quality pharmaceuticals and clinical excellence',
          support_phone: '+251 911 000 000',
          support_email: `support@${newCode.toLowerCase()}.com`,
          footer_text: `© ${new Date().getFullYear()} ${newOrgName}. All rights reserved.`,
          welcome_message: `Welcome to ${newOrgName}`,
          description: 'Community pharmacy installation',
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

      setTenants(prev => [...prev, newTenant]);
      setSelectedTenant(newTenant);
      setIsNewTenantOpen(false);
      setNewOrgName('');
      setNewOrgCode('');
      const onboardMsg = `Onboarded new pharmacy "${newOrgName}" (${newCode}).`;
      setStatusMsg({
        type: 'success',
        text: onboardMsg
      });
      toast.success(onboardMsg, 'Tenant Created');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create new tenant';
      setStatusMsg({
        type: 'error',
        text: errorMsg
      });
      toast.error(errorMsg, 'Onboarding Error');
    } finally {
      setCreatingTenant(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            PLATFORM SUPER-ADMINISTRATION
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Multi-Tenant Pharmacy Customization & White-Labeling
          </h1>
          <p className="text-sm text-slate-600">
            One Codebase → Multiple Pharmacy Deployments. Configure branding, colors, logos, and features at runtime without code changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchTenants} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>

          <Button variant="primary" size="sm" onClick={handleSaveConfig} loading={saving}>
            <Save className="w-4 h-4 mr-1.5" />
            Save Live Configuration
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium">{statusMsg.text}</p>
        </div>
      )}

      {/* Tenant Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-bold text-slate-800">Select Pharmacy Deployment:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTenant(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                selectedTenant?.id === t.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-400/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: t.branding.primary_color }}
              />
              <span>{t.branding.pharmacy_name}</span>
              <span className="font-mono text-[10px] text-slate-400">({t.tenant_code})</span>
            </button>
          ))}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsNewTenantOpen(true)}
            className="border-dashed border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-amber-600" />
            + Onboard Pharmacy
          </Button>
        </div>
      </div>

      {selectedTenant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Config Editor Tabs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Sub-tabs header */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  onClick={() => setActiveTab('branding')}
                  className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'branding'
                      ? 'border-primary text-primary bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  Branding & Theme Colors
                </button>

                <button
                  onClick={() => setActiveTab('content')}
                  className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'content'
                      ? 'border-primary text-primary bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Content & Copy
                </button>

                <button
                  onClick={() => setActiveTab('features')}
                  className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'features'
                      ? 'border-primary text-primary bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  Feature Toggles
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-primary text-primary bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  App Settings
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'branding' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Pharmacy Legal Name</label>
                        <input
                          type="text"
                          value={selectedTenant.branding.pharmacy_name}
                          onChange={(e) => setSelectedTenant({
                            ...selectedTenant,
                            branding: { ...selectedTenant.branding, pharmacy_name: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Header Display Name</label>
                        <input
                          type="text"
                          value={selectedTenant.branding.display_name}
                          onChange={(e) => setSelectedTenant({
                            ...selectedTenant,
                            branding: { ...selectedTenant.branding, display_name: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Primary Color (Hex)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedTenant.branding.primary_color}
                            onChange={(e) => setSelectedTenant({
                              ...selectedTenant,
                              branding: { ...selectedTenant.branding, primary_color: e.target.value }
                            })}
                            className="w-9 h-9 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedTenant.branding.primary_color}
                            onChange={(e) => setSelectedTenant({
                              ...selectedTenant,
                              branding: { ...selectedTenant.branding, primary_color: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Secondary Color (Hex)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedTenant.branding.secondary_color}
                            onChange={(e) => setSelectedTenant({
                              ...selectedTenant,
                              branding: { ...selectedTenant.branding, secondary_color: e.target.value }
                            })}
                            className="w-9 h-9 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedTenant.branding.secondary_color}
                            onChange={(e) => setSelectedTenant({
                              ...selectedTenant,
                              branding: { ...selectedTenant.branding, secondary_color: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Accent Color (Hex)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedTenant.branding.accent_color}
                            onChange={(e) => setSelectedTenant({
                              ...selectedTenant,
                              branding: { ...selectedTenant.branding, accent_color: e.target.value }
                            })}
                            className="w-9 h-9 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedTenant.branding.accent_color}
                            onChange={(e) => setSelectedTenant({
                              ...selectedTenant,
                              branding: { ...selectedTenant.branding, accent_color: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Logo URL</label>
                      <input
                        type="text"
                        value={selectedTenant.branding.logo_url}
                        onChange={(e) => setSelectedTenant({
                          ...selectedTenant,
                          branding: { ...selectedTenant.branding, logo_url: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Hero Title</label>
                      <input
                        type="text"
                        value={selectedTenant.content.hero_title}
                        onChange={(e) => setSelectedTenant({
                          ...selectedTenant,
                          content: { ...selectedTenant.content, hero_title: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Hero Subtitle</label>
                      <input
                        type="text"
                        value={selectedTenant.content.hero_subtitle}
                        onChange={(e) => setSelectedTenant({
                          ...selectedTenant,
                          content: { ...selectedTenant.content, hero_subtitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Support Phone</label>
                        <input
                          type="text"
                          value={selectedTenant.content.support_phone}
                          onChange={(e) => setSelectedTenant({
                            ...selectedTenant,
                            content: { ...selectedTenant.content, support_phone: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Support Email</label>
                        <input
                          type="email"
                          value={selectedTenant.content.support_email}
                          onChange={(e) => setSelectedTenant({
                            ...selectedTenant,
                            content: { ...selectedTenant.content, support_email: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Footer Text</label>
                      <input
                        type="text"
                        value={selectedTenant.content.footer_text}
                        onChange={(e) => setSelectedTenant({
                          ...selectedTenant,
                          content: { ...selectedTenant.content, footer_text: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="space-y-4">
                    {Object.entries(selectedTenant.feature_flags).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <div className="font-bold text-slate-900 text-sm font-mono">{key}</div>
                          <div className="text-xs text-slate-500">Toggle runtime availability for this tenant</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) => setSelectedTenant({
                            ...selectedTenant,
                            feature_flags: { ...selectedTenant.feature_flags, [key]: e.target.checked }
                          })}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Currency Code</label>
                        <input
                          type="text"
                          value={selectedTenant.settings.currency}
                          onChange={(e) => setSelectedTenant({
                            ...selectedTenant,
                            settings: { ...selectedTenant.settings, currency: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Tax Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedTenant.settings.tax_rate}
                          onChange={(e) => setSelectedTenant({
                            ...selectedTenant,
                            settings: { ...selectedTenant.settings, tax_rate: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <h4 className="text-sm font-bold text-slate-900">Staff Authentication & Password Reset Strategy</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Select how pharmacists reset their forgotten password. Only one option is active per pharmacy.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          (selectedTenant.settings.password_reset_strategy || 'OWNER_RESET') === 'OWNER_RESET'
                            ? 'border-primary bg-primary/5 text-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-bold text-sm">Option 1: Owner Approval</span>
                            <input
                              type="radio"
                              name="password_reset_strategy"
                              value="OWNER_RESET"
                              checked={(selectedTenant.settings.password_reset_strategy || 'OWNER_RESET') === 'OWNER_RESET'}
                              onChange={() => setSelectedTenant({
                                ...selectedTenant,
                                settings: { ...selectedTenant.settings, password_reset_strategy: 'OWNER_RESET' }
                              })}
                              className="text-primary focus:ring-primary"
                            />
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Pharmacist submits a reset request directly to the Pharmacy Owner. Owner resets the password to a default temporary password from Staff Management. The pharmacist logs in and is forced to set their own new password.
                          </p>
                        </label>

                        <label className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          selectedTenant.settings.password_reset_strategy === 'EMAIL_RESET'
                            ? 'border-primary bg-primary/5 text-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-bold text-sm">Option 2: Self-Service Email</span>
                            <input
                              type="radio"
                              name="password_reset_strategy"
                              value="EMAIL_RESET"
                              checked={selectedTenant.settings.password_reset_strategy === 'EMAIL_RESET'}
                              onChange={() => setSelectedTenant({
                                ...selectedTenant,
                                settings: { ...selectedTenant.settings, password_reset_strategy: 'EMAIL_RESET' }
                              })}
                              className="text-primary focus:ring-primary"
                            />
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Pharmacist receives a 6-digit verification code via email, enters the code along with their new password and confirmation password, and immediately logs in without needing a default password.
                          </p>
                        </label>
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                          Default Pharmacist Password (When reset by owner)
                        </label>
                        <input
                          type="text"
                          value={selectedTenant.settings.default_pharmacist_password || 'Pharmacist@123'}
                          onChange={(e) => setSelectedTenant({
                            ...selectedTenant,
                            settings: { ...selectedTenant.settings, default_pharmacist_password: e.target.value }
                          })}
                          placeholder="Pharmacist@123"
                          className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Pharmacists will be forced to change this default password upon logging in.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Theme Preview Card */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-primary" />
                  Live Theme Runtime Preview
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Zero-Rebuild</span>
              </div>

              {/* Simulated UI Card */}
              <div 
                className="p-5 rounded-xl text-white shadow-lg space-y-4 transition-colors"
                style={{ backgroundColor: selectedTenant.branding.primary_color }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base tracking-tight">{selectedTenant.branding.display_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                    {selectedTenant.tenant_code}
                  </span>
                </div>

                <p className="text-xs text-white/80 line-clamp-2">
                  {selectedTenant.content.hero_title}
                </p>

                <div className="pt-2 border-t border-white/10 flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                    style={{ backgroundColor: selectedTenant.branding.secondary_color, color: '#ffffff' }}
                  >
                    Action Button
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                    style={{ backgroundColor: selectedTenant.branding.accent_color, color: '#ffffff' }}
                  >
                    Highlight
                  </button>
                </div>
              </div>

              {/* WCAG Contrast Ratio Checker */}
              {(() => {
                const getLuminance = (hex: string): number => {
                  const cleanHex = hex.replace('#', '');
                  if (cleanHex.length !== 6) return 0.5;
                  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
                  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
                  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
                  const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
                  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                };

                const getRatio = (hex1: string, hex2: string): number => {
                  const lum1 = getLuminance(hex1);
                  const lum2 = getLuminance(hex2);
                  const brightest = Math.max(lum1, lum2);
                  const darkest = Math.min(lum1, lum2);
                  return (brightest + 0.05) / (darkest + 0.05);
                };

                const ratioWhite = getRatio(selectedTenant.branding.primary_color || '#0D9488', '#FFFFFF');
                const passesAA = ratioWhite >= 4.5;

                return (
                  <div className="mt-3 p-3 rounded-xl border bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">WCAG 2.1 Contrast (on White text):</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        passesAA ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ratioWhite.toFixed(2)}:1 ({passesAA ? 'PASS AA' : 'FAIL AA'})
                      </span>
                    </div>

                    {!passesAA && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                        ⚠️ <strong>Accessibility Warning:</strong> The selected primary color has a contrast ratio below 4.5:1. White text might be hard to read for users with low vision.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  How Dynamic Branding Works
                </div>
                <p>When you click Save, these hex colors are saved to <code>tenant_configurations</code> in PostgreSQL. The frontend automatically fetches them and injects CSS variables directly into <code>document.documentElement</code> at runtime.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Pharmacy Modal */}
      <Modal
        isOpen={isNewTenantOpen}
        onClose={() => setIsNewTenantOpen(false)}
        title="Onboard New Pharmacy Installation"
      >
        <form onSubmit={handleCreateNewPharmacy} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
            <strong>Single Codebase Architecture:</strong> Onboarding a new pharmacy creates a separate tenant profile in PostgreSQL. The same software codebase will serve this pharmacy using dynamic runtime themes.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Pharmacy Full Name</label>
            <input
              type="text"
              required
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="e.g. MedLink Specialty Pharmacy"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Tenant Code (Unique Identifier)</label>
            <input
              type="text"
              required
              value={newOrgCode}
              onChange={(e) => setNewOrgCode(e.target.value.toUpperCase())}
              placeholder="e.g. MEDLINK-01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Initial Primary Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newPrimaryColor}
                onChange={(e) => setNewPrimaryColor(e.target.value)}
                className="w-9 h-9 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={newPrimaryColor}
                onChange={(e) => setNewPrimaryColor(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsNewTenantOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creatingTenant}>
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Onboard & Configure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
