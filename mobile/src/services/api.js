import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change to your machine's IP when testing on a physical device
const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

export const menuAPI = {
  getCategories: () => api.get('/menu/categories'),
  getItems: (categoryId) => api.get('/menu/items', { params: { category_id: categoryId } }),
  getItem: (id) => api.get(`/menu/items/${id}`),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  // Courier
  getAvailable: () => api.get('/orders/available'),
  getAssigned: () => api.get('/orders/assigned'),
  accept: (id) => api.patch(`/orders/${id}/accept`),
  updateDelivery: (id, status) => api.patch(`/orders/${id}/delivery-status`, { status }),
};

export default api;
