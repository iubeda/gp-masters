import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import i18n from '../i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('motogp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    // Restore token from sessionStorage (persists on page reload, cleared on tab close)
    return sessionStorage.getItem('motogp_token') || null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);  // Store token in memory
    localStorage.setItem('motogp_user', JSON.stringify(userData));
    sessionStorage.setItem('motogp_token', jwtToken);  // Persist for page reloads
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed:', e);
    }
    setUser(null);
    setToken(null);  // Clear token from memory
    localStorage.removeItem('motogp_user');
    sessionStorage.removeItem('motogp_token');  // Clear from sessionStorage
  }, []);

  // Helper function to perform authenticated API calls
  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    };

    // Add Authorization header for cross-domain support
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',  // Still send cookies for same-domain
    });

    if (response.status === 401) {
      // Automatic logout on token expiration/invalidation
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();
    if (!response.ok) {
      if (data.error_code) {
        throw new Error(i18n.t(`backend_errors.${data.error_code}`, data.error));
      }
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }, [logout, token]);  // Add token dependency

  const contextValue = React.useMemo(() => ({
    user, token, login, logout, apiFetch, isAuthenticated: !!user
  }), [user, token, login, logout, apiFetch]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
