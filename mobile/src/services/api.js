import axios from 'axios';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// In development the backend runs on the same machine as Metro, so reuse the
// bundler host — works on simulators, Android emulators and physical devices.
// The Metro script URL is the most reliable source in a dev client;
// Constants.expoConfig covers Expo Go.
const scriptHost = NativeModules.SourceCode?.scriptURL?.match(/^https?:\/\/([^:/]+)/)?.[1];
const devHost = scriptHost || Constants.expoConfig?.hostUri?.split(':')[0];
const BASE_URL = `http://${devHost || 'localhost'}:5001/api`;

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Registered by AuthContext so an expired session returns the user to login.
let onUnauthorized = null;
export const setOnUnauthorized = (handler) => { onUnauthorized = handler; };

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      onUnauthorized?.();
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
  getPopular: () => api.get('/menu/popular'),
};

export const paymentAPI = {
  create: (orderId) => api.post(`/payments/${orderId}/create`),
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
