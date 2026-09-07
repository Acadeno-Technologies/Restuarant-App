import api from './axios';

export const analyticsApi = {
  getDashboardSummary: async () => {
    const response = await api.get('analytics/dashboard/');
    return response.data;
  },
  getRevenueChart: async (days = 7) => {
    const response = await api.get(`analytics/revenue-chart/?days=${days}`);
    return response.data;
  },
  getTopItems: async () => {
    const response = await api.get('analytics/top-items/');
    return response.data;
  },
  getOrderTypes: async () => {
    const response = await api.get('analytics/order-types/');
    return response.data;
  },
};
