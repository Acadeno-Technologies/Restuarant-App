import api from './axios';

export const authApi = {
  login: async (username, password) => {
    const response = await api.post('auth/login/', { username, password });
    return response.data;
  },
  registerAdmin: async (adminData) => {
    const response = await api.post('auth/admin/register/', adminData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('auth/profile/');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.patch('auth/profile/', profileData);
    return response.data;
  },
  getStaffList: async () => {
    const response = await api.get('auth/staff/');
    return response.data;
  },
  getStaffUsers: async () => {
    const response = await api.get('auth/staff/');
    return response.data;
  },
  createStaff: async (staffData) => {
    const response = await api.post('auth/register/', staffData);
    return response.data;
  },
  updateStaff: async (id, staffData) => {
    const response = await api.patch(`auth/staff/${id}/`, staffData);
    return response.data;
  },
  deleteStaff: async (id) => {
    const response = await api.delete(`auth/staff/${id}/`);
    return response.data;
  },
  getRoles: async () => {
    const response = await api.get('auth/roles/');
    return response.data;
  },
  createRole: async (roleData) => {
    const response = await api.post('auth/roles/', roleData);
    return response.data;
  },
  getSettings: async () => {
    const response = await api.get('auth/settings/');
    return response.data;
  },
  updateSettings: async (settingsData) => {
    const response = await api.put('auth/settings/', settingsData);
    return response.data;
  },
};
