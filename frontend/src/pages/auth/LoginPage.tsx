import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useTenantTheme } from '../../theme/TenantThemeProvider';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { apiClient } from '../../services/apiClient';
import {
  Shield,
  Lock,
  User as UserIcon,
  Building,
  KeyRound,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, firstLoginChangePassword } = useAuth();
  const { t, lang } = useI18n();
  const { config, setTenantCode: setGlobalTenantCode } = useTenantTheme();
  const { pharmacySlug } = useParams<{ pharmacySlug?: string }>();
  const navigate = useNavigate();

  // Primary Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [tenantCode, setTenantCode] = useState(pharmacySlug || config?.tenant_code || 'SELAM-01');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forced Password Change State (First-time login)
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [tempUser, setTempUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState<{
    strategy: 'OWNER_RESET' | 'EMAIL_RESET';
    message: string;
    resetCode?: string;
  } | null>(null);

  // Email Reset Step 2
  const [emailResetCode, setEmailResetCode] = useState('');
  const [emailNewPassword, setEmailNewPassword] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (pharmacySlug) {
      setTenantCode(pharmacySlug);
      setGlobalTenantCode(pharmacySlug);
    }
  }, [pharmacySlug]);

  useEffect(() => {
    if (config?.organization_code && !pharmacySlug) {
      setTenantCode(config.organization_code);
    }
  }, [config?.organization_code, pharmacySlug]);

  const routeByRole = (role: string) => {
    if (role === 'PHARMACY_OWNER') {
      navigate('/owner/dashboard');
    } else if (role === 'PHARMACIST') {
      navigate('/pharmacist/pos');
    } else {
      navigate('/my-purchases');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const activeTenant = pharmacySlug || tenantCode;
      const user = await login(identifier.trim(), password, activeTenant);

      if (user.role === 'PLATFORM_ADMIN') {
        const msg = 'Platform Administrators must sign in through the dedicated Super-Admin Console at /platform/admin/login.';
        setError(msg);
        toast.error(msg, 'Access Denied');
        return;
      }

      if (config?.organization_id && user.organization_id && user.organization_id !== config.organization_id) {
        const msg = 'Access Denied: This account belongs to a different pharmacy. Please sign in via your own pharmacy portal.';
        setError(msg);
        toast.error(msg, 'Access Denied');
        return;
      }

      // Check if user is using default password and must change it before entering dashboard
      if (user.must_change_password) {
        setTempUser(user);
        setShowFirstLoginModal(true);
        toast.info('Default password detected. You must set your own password to proceed.', 'Password Change Required');
        return;
      }

      toast.success(`Welcome back, ${user.first_name || user.username || user.email}!`, 'Signed In');
      routeByRole(user.role);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      toast.error(errorMsg, 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.', 'Validation Error');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.', 'Validation Error');
      return;
    }

    setChangingPassword(true);
    try {
      await firstLoginChangePassword(newPassword);
      toast.success('Your permanent password has been set successfully!', 'Password Updated');
      setShowFirstLoginModal(false);
      if (tempUser) {
        routeByRole(tempUser.role);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update default password', 'Update Error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      toast.error('Please enter your username or email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', {
        identifier: forgotIdentifier.trim(),
        pharmacySlug: pharmacySlug || tenantCode,
      });

      const result = res.data;
      setForgotResult(result);
      if (result.strategy === 'EMAIL_RESET' && result.resetCode) {
        setEmailResetCode(result.resetCode);
      }
      toast.success(result.message || 'Request processed', 'Forgot Password');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to process forgot password request';
      toast.error(errorMsg, 'Error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleEmailResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailNewPassword !== emailConfirmPassword) {
      toast.error('Passwords do not match.', 'Validation Error');
      return;
    }
    if (emailNewPassword.length < 6) {
      toast.error('Password must be at least 6 characters.', 'Validation Error');
      return;
    }

    setResettingPassword(true);
    try {
      await apiClient.post('/auth/verify-and-reset-password', {
        identifier: forgotIdentifier.trim(),
        resetCode: emailResetCode.trim(),
        newPassword: emailNewPassword,
        confirmPassword: emailConfirmPassword,
        pharmacySlug: pharmacySlug || tenantCode,
      });

      toast.success('Password reset successfully! You can now sign in with your new password.', 'Password Reset');
      setShowForgotPassword(false);
      setForgotResult(null);
      setIdentifier(forgotIdentifier);
      setPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset password', 'Reset Error');
    } finally {
      setResettingPassword(false);
    }
  };

  const displayName =
    config?.branding?.display_name ||
    config?.branding?.pharmacy_name ||
    config?.display_name ||
    config?.organization_name ||
    (pharmacySlug ? pharmacySlug.replace(/[-_]/g, ' ').toUpperCase() : 'Pharmacy Staff Portal');

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-surface-subtle text-text-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex p-3.5 rounded-2xl bg-primary/10 text-primary mb-3 shadow-soft-sm">
          <Shield className="w-10 h-10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          {displayName}
        </h2>
        <p className="text-xs text-text-secondary mt-1 font-medium">
          Pharmacist & Owner Clinical Access System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-xl rounded-2xl border border-surface-border sm:px-10">
          {/* Main Error Box */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium flex flex-col gap-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              {error.includes('Platform Administrator') && (
                <Link
                  to="/platform/admin/login"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 underline"
                >
                  Go to Platform Admin Login <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {/* VIEW 1: Standard Sign In Form */}
          {!showForgotPassword && (
            <form className="space-y-4" onSubmit={handleLogin}>
              {!pharmacySlug && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-1">
                    {lang === 'am' ? 'የፋርማሲ ኮድ' : 'Tenant / Pharmacy Code'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={tenantCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setTenantCode(val);
                        setGlobalTenantCode(val);
                      }}
                      className="block w-full pl-9 pr-3 py-2 border border-surface-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-text-primary"
                      placeholder="e.g. SELAM-01 or BUTU-01"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-1">
                  {lang === 'am' ? 'የተጠቃሚ ስም ወይም ኢሜይል' : 'Username or Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-surface-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-text-primary"
                    placeholder="e.g. tadesse.pharma or pharmacist@selam.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-primary">
                    {lang === 'am' ? 'የይለፍ ቃል' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(identifier);
                      setForgotResult(null);
                      setShowForgotPassword(true);
                    }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {lang === 'am' ? 'የይለፍ ቃል ረሳሁ?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-surface-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-text-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" className="w-full justify-center rounded-xl font-semibold shadow-soft-sm" loading={loading}>
                  <KeyRound className="w-4 h-4 mr-2" />
                  {lang === 'am' ? 'ግባ' : 'Sign In'}
                </Button>
              </div>
            </form>
          )}

          {/* VIEW 2: Forgot Password Flow */}
          {showForgotPassword && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  {lang === 'am' ? 'የይለፍ ቃል ዳግም ማስጀመሪያ' : 'Reset Pharmacist Password'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotResult(null);
                  }}
                  className="text-xs font-semibold text-text-muted hover:text-text-primary hover:underline"
                >
                  Back to Sign In
                </button>
              </div>

              {!forgotResult && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Enter your pharmacist username or registered email address. The system will trigger the pharmacy's configured security reset strategy.
                  </p>

                  <div>
                    <label className="block text-xs font-bold uppercase text-text-primary mb-1">
                      Username or Email
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. tadesse.pharma or pharmacist@selam.com"
                      className="block w-full px-3 py-2 border border-surface-border rounded-lg text-sm bg-surface focus:ring-2 focus:ring-primary text-text-primary"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full rounded-xl" loading={forgotLoading}>
                    Send Reset Request
                  </Button>
                </form>
              )}

              {/* Strategy A Result: Owner Approval */}
              {forgotResult && forgotResult.strategy === 'OWNER_RESET' && (
                <div className="space-y-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="flex items-start gap-2.5">
                    <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-sm text-amber-950">Pharmacy Owner Approval Required</p>
                      <p className="leading-relaxed">
                        {forgotResult.message}
                      </p>
                      <p className="text-[11px] text-amber-800 pt-1">
                        Once your Pharmacy Owner approves and issues your default password, come back to sign in and set your new permanent password.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotResult(null);
                    }}
                  >
                    Return to Login
                  </Button>
                </div>
              )}

              {/* Strategy B Result: Self-Service Email Reset Code */}
              {forgotResult && forgotResult.strategy === 'EMAIL_RESET' && (
                <form onSubmit={handleEmailResetSubmit} className="space-y-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      {forgotResult.message}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-blue-900 mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={emailResetCode}
                      onChange={(e) => setEmailResetCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="block w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white font-mono text-center tracking-widest text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-blue-900 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={emailNewPassword}
                      onChange={(e) => setEmailNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-blue-900 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={emailConfirmPassword}
                      onChange={(e) => setEmailConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full rounded-xl" loading={resettingPassword}>
                    Save New Password & Sign In
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VIEW 3: Force Password Conversion Modal (First-time Login) */}
      {showFirstLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-soft-2xl border border-surface-border space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary leading-tight">
                  Set Your Personal Password
                </h3>
                <p className="text-xs text-text-muted">
                  First-time setup for @{tempUser?.username || tempUser?.email}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-0.5">Mandatory Security Policy:</p>
              You are currently using a default/temporary pharmacy password. You must create your own personal password to access the operational dispensary dashboard.
            </div>

            <form onSubmit={handleFirstLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="block w-full px-3.5 py-2.5 border border-surface-border rounded-xl text-sm bg-surface focus:ring-2 focus:ring-primary text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="block w-full px-3.5 py-2.5 border border-surface-border rounded-xl text-sm bg-surface focus:ring-2 focus:ring-primary text-text-primary"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/3 rounded-xl"
                  onClick={() => {
                    setShowFirstLoginModal(false);
                    setTempUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-2/3 rounded-xl justify-center font-semibold"
                  loading={changingPassword}
                >
                  Set Password & Enter Dashboard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
