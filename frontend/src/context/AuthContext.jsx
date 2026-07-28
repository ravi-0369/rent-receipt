import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('rrm_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('rrm_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await API.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('rrm_user', JSON.stringify(data.user));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('rrm_user', JSON.stringify(userData));
    localStorage.setItem('rrm_token', authToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rrm_user');
    localStorage.removeItem('rrm_token');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('rrm_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
