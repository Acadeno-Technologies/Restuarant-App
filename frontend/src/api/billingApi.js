import api from './axios';

export const billingApi = {
  getBills: async () => {
    const response = await api.get('billing/');
    return response.data;
  },
  getBillDetails: async (id) => {
    const response = await api.get(`billing/${id}/`);
    return response.data;
  },
  generateBill: async (data) => {
    const response = await api.post('billing/generate/', data);
    return response.data;
  },
  getBillByOrder: async (orderId) => {
    const response = await api.get(`billing/order/${orderId}/`);
    return response.data;
  },
  getWhatsAppText: async (billId) => {
    const response = await api.get(`billing/${billId}/whatsapp/`);
    return response.data;
  },
};
