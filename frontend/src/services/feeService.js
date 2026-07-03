import api from './api';

export const feeService = {
  getAll: (params = '') => api.get(`/fees${params ? '?' + params : ''}`),
  create: (data) => api.post('/fees', data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  getUnpaid: () => api.get('/fees/unpaid'),
};

export const reminderService = {
  prepareWhatsapp: (studentId, feePaymentId) =>
    api.post('/reminders/whatsapp/prepare', { student_id: studentId, fee_payment_id: feePaymentId }),
  preparePhone: (studentId, feePaymentId) =>
    api.post('/reminders/phone/prepare', { student_id: studentId, fee_payment_id: feePaymentId }),
  confirm: (id) => api.put(`/reminders/${id}/confirm`, { status: 'confirmed_sent' }),
  getAll: (params = '') => api.get(`/reminders${params ? '?' + params : ''}`),
};

export const dashboardService = {
  getSummary: (params = '') => api.get(`/dashboard/summary${params ? '?' + params : ''}`),
};

export const reportService = {
  get: (params) => api.get(`/reports?${params}`),
};

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
