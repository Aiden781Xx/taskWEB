import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.get('/auth/me').then(res => {
        setUser(res.data.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
      }).catch(() => { logout(); });
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    const { user: u, token } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (name, email, password, role, adminKey) => {
    const res = await api.post('/auth/register', { name, email, password, role, adminKey });
    const { user: u, token } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (profile) => {
    const res = await api.patch('/users/me', profile);
    const updated = res.data.data.user;
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
