import api from './api';
import { setToken, setStoredUser } from './api';

export const authService = {
  login: async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    setToken(res.data.token);
    setStoredUser(res.data.user);
    return res.data;
  },
  getMe: () => api.get('/auth/me'),
};
