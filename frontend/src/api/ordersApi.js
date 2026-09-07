import api from './axios';

export const ordersApi = {
  getOrders: async (params = {}) => {
    const response = await api.get('orders/', { params });
    return response.data;
  },
  getOrderDetails: async (id) => {
    const response = await api.get(`orders/${id}/`);
    return response.data;
  },
  createOrder: async (data) => {
    const response = await api.post('orders/', data);
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`orders/${id}/status/`, { status });
    return response.data;
  },
  addItemsToOrder: async (id, payload) => {
    const data = Array.isArray(payload) ? { items: payload } : payload;
    const response = await api.post(`orders/${id}/add-items/`, data);
    return response.data;
  },
  getActiveTableOrder: async (tableId) => {
    const response = await api.get(`orders/table/${tableId}/active/`);
    return response.data;
  },
  updateOrderItem: async (itemId, data) => {
    const response = await api.patch(`orders/items/${itemId}/`, data);
    return response.data;
  },
};
