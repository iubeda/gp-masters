import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('motogp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback((userData) => {
    setUser(userData);
    // Removed localStorage.setItem('motogp_token', jwtToken);
    localStorage.setItem('motogp_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed:', e);
    }
    setUser(null);
    localStorage.removeItem('motogp_user');
  }, []);

  // Helper function to perform authenticated API calls
  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Automatic logout on token expiration/invalidation
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }, [logout]);

  const contextValue = React.useMemo(() => ({
    user, login, logout, apiFetch, isAuthenticated: !!user
  }), [user, login, logout, apiFetch]);

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
