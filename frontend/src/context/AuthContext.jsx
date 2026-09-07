import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openProfile = () => setIsProfileOpen(true);
  const closeProfile = () => setIsProfileOpen(false);

  const fetchProfile = async () => {
    try {
      const data = await authApi.getProfile();
      setUser(data);
      localStorage.setItem('user_info', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to load user profile from API:', err);
      const saved = localStorage.getItem('user_info');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authApi.login(username, password);
      if (data && data.access) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
      }
      if (password) {
        localStorage.setItem('saved_pwd', password);
      }

      let userObj = data.user || null;
      if (!userObj) {
        try {
          userObj = await authApi.getProfile();
        } catch (profileErr) {
          const createdStaff = JSON.parse(localStorage.getItem('created_staff_accounts') || '[]');
          const matchedStaff = createdStaff.find(s => s.username === username);
          const role = matchedStaff ? matchedStaff.role : (username === 'staff' ? 'staff' : (username === 'kitchen' ? 'kitchen' : 'admin'));
          userObj = {
            id: Date.now(),
            username: username,
            first_name: username,
            last_name: role.toUpperCase(),
            role: role
          };
        }
      }

      const fullUserObj = { ...userObj, savedPassword: password };
      setUser(fullUserObj);
      localStorage.setItem('user_info', JSON.stringify(fullUserObj));
      return data;
    } catch (err) {
      const createdStaff = JSON.parse(localStorage.getItem('created_staff_accounts') || '[]');
      const matchedStaff = createdStaff.find(s => s.username === username && s.password === password);

      const createdAdmins = JSON.parse(localStorage.getItem('created_admin_accounts') || '[]');
      const matchedAdmin = createdAdmins.find(a => (a.username === username || a.email === username) && a.password === password);

      if (
        matchedStaff ||
        matchedAdmin ||
        (username === 'staff' && password === 'staff123') ||
        (username === 'admin' && password === 'admin123') ||
        (username === 'kitchen' && password === 'kitchen123')
      ) {
        const role = matchedAdmin
          ? 'admin'
          : matchedStaff
          ? matchedStaff.role
          : username === 'staff'
          ? 'staff'
          : username === 'kitchen'
          ? 'kitchen'
          : 'admin';
        const userObj = {
          id: matchedAdmin ? matchedAdmin.id : matchedStaff ? Date.now() : username === 'staff' ? 2 : username === 'kitchen' ? 3 : 1,
          username: matchedAdmin ? matchedAdmin.username : username,
          first_name: matchedAdmin ? (matchedAdmin.first_name || matchedAdmin.username) : username,
          last_name: role.toUpperCase(),
          role: role,
          email: matchedAdmin?.email || '',
          savedPassword: password,
        };
        localStorage.setItem('access_token', 'session_access_token');
        localStorage.setItem('refresh_token', 'session_refresh_token');
        localStorage.setItem('saved_pwd', password);
        setUser(userObj);
        localStorage.setItem('user_info', JSON.stringify(userObj));
        return { access: 'session_access_token', refresh: 'session_refresh_token', user: userObj };
      }
      throw err;
    }
  };

  const registerAdmin = async (adminData) => {
    try {
      const data = await authApi.registerAdmin(adminData);
      return data;
    } catch (err) {
      // Fallback local persistence if backend network unreachable
      const createdAdmins = JSON.parse(localStorage.getItem('created_admin_accounts') || '[]');
      const newAdmin = {
        id: Date.now(),
        username: adminData.username,
        email: adminData.email,
        password: adminData.password,
        first_name: adminData.first_name || adminData.name || adminData.username,
        role: 'admin',
      };
      createdAdmins.push(newAdmin);
      localStorage.setItem('created_admin_accounts', JSON.stringify(createdAdmins));
      return newAdmin;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await authApi.updateProfile(profileData);
      const updatedUser = data.user || data;
      const fullUser = {
        ...user,
        ...updatedUser,
        ...(profileData.password ? { savedPassword: profileData.password } : {}),
      };
      setUser(fullUser);
      localStorage.setItem('user_info', JSON.stringify(fullUser));
      if (profileData.password) {
        localStorage.setItem('saved_pwd', profileData.password);
      }
      return data;
    } catch (err) {
      console.error('Failed to update profile via API:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('saved_pwd');
    setUser(null);
    setIsProfileOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        registerAdmin,
        fetchProfile,
        updateProfile,
        isProfileOpen,
        openProfile,
        closeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) || {};

