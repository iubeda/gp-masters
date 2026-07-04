import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('motogp_token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('motogp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback((jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('motogp_token', jwtToken);
    localStorage.setItem('motogp_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('motogp_token');
    localStorage.removeItem('motogp_user');
  }, []);

  // Helper function to perform authenticated API calls
  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
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
  }, [token, logout]);

  const contextValue = React.useMemo(() => ({
    token, user, login, logout, apiFetch, isAuthenticated: !!token
  }), [token, user, login, logout, apiFetch]);

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
