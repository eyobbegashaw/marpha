import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTenantConfig } from '../theme/TenantThemeProvider';

export interface User {
  id: string;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  role: 'PLATFORM_ADMIN' | 'PHARMACY_OWNER' | 'PHARMACIST' | 'CUSTOMER';
  organization_id?: string;
  branch_id?: string;
  language_preference?: 'en' | 'am';
  must_change_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (identifier: string, pass: string, tenantCode?: string) => Promise<User>;
  firstLoginChangePassword: (newPassword: string) => Promise<void>;
  logout: () => void;
  isOwner: boolean;
  isPharmacist: boolean;
  isCustomer: boolean;
  isPlatformAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  loading: true,
  login: async () => { throw new Error('Not implemented'); },
  firstLoginChangePassword: async () => { throw new Error('Not implemented'); },
  logout: () => {},
  isOwner: false,
  isPharmacist: false,
  isCustomer: false,
  isPlatformAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setTenantCode } = useTenantConfig();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, pass: string, tenantCode?: string): Promise<User> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass, tenantCode }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const authToken = json.data.token;
        const authUser: User = {
          id: json.data.user.id,
          email: json.data.user.email,
          username: json.data.user.username,
          first_name: json.data.user.first_name || json.data.user.fullName || 'User',
          last_name: json.data.user.last_name || '',
          role: json.data.user.role,
          organization_id: json.data.user.organization_id,
          branch_id: json.data.user.branch_id,
          language_preference: json.data.user.language_preference,
          must_change_password: Boolean(json.data.user.must_change_password),
        };

        setToken(authToken);
        setUser(authUser);
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(authUser));

        if (tenantCode) {
          setTenantCode(tenantCode);
        }

        return authUser;
      } else {
        throw new Error(json.message || 'Authentication failed');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Network error during login');
    }
  };

  const firstLoginChangePassword = async (newPassword: string): Promise<void> => {
    const authToken = token || localStorage.getItem('auth_token');
    const res = await fetch('/api/v1/auth/first-login-change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ newPassword, confirmPassword: newPassword }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update default password');
    }

    if (json.data?.token) {
      setToken(json.data.token);
      localStorage.setItem('auth_token', json.data.token);
    }

    if (user) {
      const updated = { ...user, must_change_password: false };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        loading: isLoading,
        login,
        firstLoginChangePassword,
        logout,
        isOwner: user?.role === 'PHARMACY_OWNER',
        isPharmacist: user?.role === 'PHARMACIST',
        isCustomer: user?.role === 'CUSTOMER',
        isPlatformAdmin: user?.role === 'PLATFORM_ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
