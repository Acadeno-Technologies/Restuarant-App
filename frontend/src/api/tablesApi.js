import api from './axios';

export const tablesApi = {
  getTables: async () => {
    const response = await api.get('tables/');
    return response.data;
  },
  createTable: async (data) => {
    const response = await api.post('tables/', data);
    return response.data;
  },
  updateTable: async (id, data) => {
    try {
      const response = await api.patch(`tables/${id}/`, data);
      return response.data;
    } catch (e) {
      const response = await api.put(`tables/${id}/`, data);
      return response.data;
    }
  },
  deleteTable: async (id) => {
    const response = await api.delete(`tables/${id}/`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`tables/${id}/status/`, { status });
    return response.data;
  },
  getByQRToken: async (qrToken) => {
    const response = await api.get(`tables/qr/${qrToken}/`);
    return response.data;
  },
  createReservation: async (tableId, guestName, arrivalTime) => {
    const response = await api.post('tables/reservations/', {
      table_id: tableId,
      guest_name: guestName,
      arrival_time: arrivalTime,
    });
    return response.data;
  },
  cancelReservation: async (reservationId) => {
    const response = await api.post(`tables/reservations/${reservationId}/cancel/`);
    return response.data;
  },
  getTableOptions: async () => {
    const response = await api.get('tables/options/');
    return response.data;
  },
  addTableOption: async (optionType, value) => {
    const response = await api.post('tables/options/', {
      option_type: optionType,
      value: value,
    });
    return response.data;
  },
};
