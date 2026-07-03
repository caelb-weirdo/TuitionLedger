import api from './api';

export const studentService = {
  getAll: (params = '') => api.get(`/students${params ? '?' + params : ''}`),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};
