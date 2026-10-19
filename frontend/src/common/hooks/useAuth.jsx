import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isAdminPath);

  // Check server-side authenticated session via HTTP-only cookie
  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/auth/session');
      if (res && res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Zero background requests on public portfolio: only check session if in /admin space
    if (isAdminPath) {
      checkSession();
    } else {
      setLoading(false);
    }

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [checkSession, isAdminPath]);

  const loginSuccess = (adminUser) => {
    setUser(adminUser);
  };

  const logout = async () => {
    try {
      await apiRequest('/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request error:', err.message);
    } finally {
      setUser(null);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.dispatchEvent(new Event('auth:logout'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && user.role === 'SUPER_ADMIN',
        loading,
        loginSuccess,
        logout,
        refreshSession: checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
