import api from './axios';

export const kitchenApi = {
  getQueue: async () => {
    const response = await api.get('kitchen/queue/');
    return response.data;
  },
  updateKitchenItemStatus: async (itemId, status) => {
    const response = await api.patch(`kitchen/item/${itemId}/`, { status });
    return response.data;
  },
  markOrderPreparing: async (orderId) => {
    const response = await api.patch(`kitchen/order/${orderId}/preparing/`);
    return response.data;
  },
  markOrderReady: async (orderId) => {
    const response = await api.patch(`kitchen/order/${orderId}/ready/`);
    return response.data;
  },
};

