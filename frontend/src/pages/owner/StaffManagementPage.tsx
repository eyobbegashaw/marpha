import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  Mail, 
  Phone, 
  RefreshCw,
  Power,
  KeyRound,
  AlertTriangle,
  AtSign,
  UserCheck
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface StaffUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: 'PHARMACY_OWNER' | 'PHARMACIST' | 'CUSTOMER';
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

interface ResetRequest {
  id: string;
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export const StaffManagementPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<StaffUser | null>(null);
  const [customTempPassword, setCustomTempPassword] = useState('Pharmacist@123');

  // New staff form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Pharmacist@123');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users');
      const usersData = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      const mapped: StaffUser[] = usersData.map((u: any) => ({
        id: u.id,
        fullName: u.fullName || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        username: u.username || u.email.split('@')[0],
        email: u.email,
        role: u.role || 'PHARMACIST',
        isActive: u.is_active !== undefined ? u.is_active : (u.isActive !== undefined ? u.isActive : true),
        mustChangePassword: u.must_change_password !== undefined ? u.must_change_password : (u.mustChangePassword ?? false),
        createdAt: u.created_at || u.createdAt || new Date().toISOString(),
      }));
      setStaffList(mapped);

      // Fetch pending password reset requests
      try {
        const reqRes = await apiClient.get('/users/reset-requests');
        const reqData = Array.isArray(reqRes.data) ? reqRes.data : (reqRes.data?.requests || []);
        setResetRequests(reqData);
      } catch {
        // Reset requests might be empty or not yet requested
      }
    } catch (err) {
      console.error('Failed to load staff members', err);
      // Fallback preview
      setStaffList([
        {
          id: 'u-1',
          fullName: 'Abebe Bikila (Lead Pharmacist)',
          username: 'abebe.bikila',
          email: 'pharmacist@selam.com',
          role: 'PHARMACIST',
          isActive: true,
          mustChangePassword: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'u-2',
          fullName: 'Chaltu Tadesse (Dispensing Pharmacist)',
          username: 'chaltu.t',
          email: 'chaltu@selam.com',
          role: 'PHARMACIST',
          isActive: true,
          mustChangePassword: true,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Pharmacist';

    try {
      await apiClient.post('/users', {
        firstName,
        lastName,
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        roleName: 'PHARMACIST',
        role: 'PHARMACIST',
      });
      const successText = `Created pharmacist account for ${fullName} (Username: ${username.trim().toLowerCase() || email.trim()}). Temporary default password assigned.`;
      setStatusMsg({ type: 'success', text: successText });
      toast.success(successText, 'Staff Management');
      setIsAddModalOpen(false);
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('Pharmacist@123');
      fetchStaff();
    } catch (err: any) {
      const errorText = err?.response?.data?.message || err?.message || 'Failed to create staff member';
      setStatusMsg({
        type: 'error',
        text: errorText
      });
      toast.error(errorText, 'Staff Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: StaffUser) => {
    try {
      const nextStatus = !user.isActive;
      await apiClient.patch(`/users/${user.id}/status`, {
        isActive: nextStatus,
        is_active: nextStatus,
      });
      const toggleText = `Pharmacist ${user.fullName} is now ${nextStatus ? 'Active' : 'Deactivated'}`;
      setStatusMsg({
        type: 'success',
        text: toggleText
      });
      toast.success(toggleText, 'Staff Status');
      setStaffList(prev => prev.map(u => u.id === user.id ? { ...u, isActive: nextStatus } : u));
    } catch (err: any) {
      const errorText = err?.response?.data?.message || err?.message || 'Failed to update user status';
      setStatusMsg({
        type: 'error',
        text: errorText
      });
      toast.error(errorText, 'Staff Error');
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalUser) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/users/${resetModalUser.id}/reset-password`, {
        temporaryPassword: customTempPassword.trim(),
      });
      const successText = `Password for ${resetModalUser.fullName} has been reset to "${customTempPassword}". They must change it upon their next login.`;
      setStatusMsg({ type: 'success', text: successText });
      toast.success(successText, 'Password Reset Successful');
      setResetModalUser(null);
      fetchStaff();
    } catch (err: any) {
      const errorText = err?.response?.data?.message || err?.message || 'Failed to reset password';
      setStatusMsg({ type: 'error', text: errorText });
      toast.error(errorText, 'Reset Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveResetRequest = async (request: ResetRequest) => {
    try {
      await apiClient.post(`/users/${request.user_id}/reset-password`, {
        temporaryPassword: 'Pharmacist@123',
      });
      const successText = `Approved password reset for ${request.full_name || request.username}. Temporary password is Pharmacist@123.`;
      toast.success(successText, 'Reset Request Approved');
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve reset request', 'Approval Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            {lang === 'am' ? 'የፋርማሲ ሠራተኞች አስተዳደር' : 'Pharmacy Staff & Access Control'}
          </h1>
          <p className="text-sm text-slate-600">
            {lang === 'am' 
              ? 'ፋርማሲስቶችን መመዝገብ፣ የተጠቃሚ ስም መስጠት፣ የይለፍ ቃል ማደስ እና ፈቃዳቸውን ማስተዳደር' 
              : 'Add pharmacists with usernames, assign default passwords, reset credentials, and manage operational access.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchStaff} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>

          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            {lang === 'am' ? 'አዲስ ፋርማሲስት መዝግብ' : 'Add Pharmacist'}
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">{statusMsg.text}</p>
        </div>
      )}

      {/* Pending Reset Requests Alert */}
      {resetRequests.filter(r => r.status === 'PENDING').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Pending Pharmacist Password Reset Requests ({resetRequests.filter(r => r.status === 'PENDING').length})
          </div>
          <p className="text-xs text-amber-800">
            The following pharmacists requested a password reset. Approving will assign the default temporary password and require them to convert it on next login.
          </p>
          <div className="divide-y divide-amber-200 border-t border-amber-200 pt-2">
            {resetRequests.filter(r => r.status === 'PENDING').map(req => (
              <div key={req.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-amber-950">{req.full_name || req.username}</div>
                  <div className="text-xs text-amber-700">Username: <span className="font-mono">{req.username}</span> • Email: {req.email}</div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleApproveResetRequest(req)}
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1" />
                  Approve & Reset Password
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{lang === 'am' ? 'ስም' : 'Staff Name'}</th>
                <th className="py-3.5 px-4">{lang === 'am' ? 'የተጠቃሚ ስም' : 'Username'}</th>
                <th className="py-3.5 px-4">{lang === 'am' ? 'ኢሜይል' : 'Email'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'am' ? 'ሚና' : 'Role'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'am' ? 'የይለፍ ቃል ሁኔታ' : 'Password Status'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'am' ? 'ሁኔታ' : 'Account Status'}</th>
                <th className="py-3.5 px-4 text-right">{lang === 'am' ? 'እርምጃ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staffList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {user.fullName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      <AtSign className="w-3 h-3 text-slate-400" />
                      {user.username || user.email.split('@')[0]}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                    {user.email}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={user.role === 'PHARMACY_OWNER' ? 'primary' : 'neutral'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {user.mustChangePassword ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        Default (Must Change)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Personal Active
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {user.role !== 'PHARMACY_OWNER' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setResetModalUser(user);
                            setCustomTempPassword('Pharmacist@123');
                          }}
                          title="Reset Password to Temporary Default"
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1 text-primary" />
                          Reset
                        </Button>

                        <Button
                          size="sm"
                          variant={user.isActive ? 'danger' : 'outline'}
                          onClick={() => handleToggleStatus(user)}
                        >
                          <Power className="w-3.5 h-3.5 mr-1" />
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Pharmacist Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={lang === 'am' ? 'አዲስ ፋርማሲስት መመዝገቢያ' : 'Register New Pharmacist'}
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
            <strong>First-Login Policy:</strong> The pharmacist can log in using their <strong>Username</strong> (or Email) and the initial default password. On first login, they will be automatically prompted to change it to their personal password.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (!username) {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.'));
                }
              }}
              placeholder="e.g. Dr. Abebe Kebede"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Username</label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="abebe.kebede"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abebe@selam.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Initial Default Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Pharmacist@123"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The pharmacist must change this password immediately on their first login.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              <UserCheck className="w-4 h-4 mr-1.5" />
              Create Pharmacist Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <Modal
          isOpen={true}
          onClose={() => setResetModalUser(null)}
          title={`Reset Password: ${resetModalUser.fullName}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Set a temporary password for <strong>{resetModalUser.fullName}</strong> (<span className="font-mono text-xs">@{resetModalUser.username}</span>). The pharmacist will be forced to change this password to their own personal password immediately upon logging in.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Temporary Password</label>
              <input
                type="text"
                required
                value={customTempPassword}
                onChange={(e) => setCustomTempPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setResetModalUser(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleResetPassword} loading={submitting}>
                <KeyRound className="w-4 h-4 mr-1.5" />
                Confirm Password Reset
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
