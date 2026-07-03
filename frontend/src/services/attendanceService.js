import api from './api';

export const attendanceService = {
  createSession: (classId, qrMinutes) =>
    api.post('/attendance-sessions', { class_id: classId, qr_time_limit_minutes: qrMinutes }),
  getSession: (token) => api.get(`/attendance-sessions/${token}`),
  closeSession: (sessionId) => api.put(`/attendance-sessions/${sessionId}/close`),
  markAttendance: (sessionToken, deviceToken) =>
    api.post('/attendance/mark', { session_token: sessionToken, device_token: deviceToken }),
  manualAttendance: (data) => api.post('/attendance/manual', data),
  getRecords: (params = '') => api.get(`/attendance${params ? '?' + params : ''}`),
};

export const deviceService = {
  request: (data) => api.post('/devices/request', data),
  getStatus: () => api.get('/devices/status'),
  getAll: (params = '') => api.get(`/devices${params ? '?' + params : ''}`),
  approve: (id) => api.put(`/devices/${id}/approve`),
  reject: (id, reason) => api.put(`/devices/${id}/reject`, { reason }),
};
