import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { ShieldAlert, Lock, Mail, KeyRound, Sparkles, Server, CheckCircle2 } from 'lucide-react';

export const PlatformAdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@pharmaplatform.com');
  const [password, setPassword] = useState('PlatformAdmin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      if (user.role !== 'PLATFORM_ADMIN') {
        const msg = 'Access Denied: This secure portal is exclusively restricted to Platform Administrators.';
        setError(msg);
        toast.error(msg, 'Access Denied');
        return;
      }
      toast.success('Authenticated as Platform Super-Administrator', 'Welcome Admin');
      navigate('/platform-admin');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Platform administrator authentication failed.';
      setError(errorMsg);
      toast.error(errorMsg, 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-lg shadow-amber-500/5">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 mb-2">
          <Server className="w-3.5 h-3.5" />
          SECURE PLATFORM ADMIN CONSOLE
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Platform Administration
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Global multi-tenant pharmacy configuration & runtime white-labeling
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-950/80 border border-red-500/50 text-sm text-red-200 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-ping" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleAdminLogin}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Platform Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-500"
                  placeholder="admin@pharmaplatform.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-500 font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full justify-center bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-lg shadow-amber-500/20"
                loading={loading}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Authenticate Platform Super-Admin
              </Button>
            </div>
          </form>

          {/* Preset Demo Fill */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Default Super-Admin Credentials</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@pharmaplatform.com');
                setPassword('PlatformAdmin123!');
                setError('');
              }}
              className="w-full p-2.5 text-left bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-700/80 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-mono text-xs font-bold text-amber-300 group-hover:text-amber-200">admin@pharmaplatform.com</div>
                <div className="text-[11px] text-slate-400">Password: PlatformAdmin123!</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
