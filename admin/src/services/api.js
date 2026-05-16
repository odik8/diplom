import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (role) => api.get('/admin/users', { params: { role } }),
  createCourier: (data) => api.post('/admin/couriers', data),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`),
  getCategories: () => api.get('/admin/categories'),
  getMenuItems: () => api.get('/admin/menu-items'),
};

export const menuAPI = {
  createCategory: (data) => api.post('/menu/categories', data),
  updateCategory: (id, data) => api.patch(`/menu/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/menu/categories/${id}`),
  createItem: (data) => api.post('/menu/items', data),
  updateItem: (id, data) => api.patch(`/menu/items/${id}`, data),
  deleteItem: (id) => api.delete(`/menu/items/${id}`),
};

export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  getById: (id) => api.get(`/orders/${id}`),
};

export default api;
