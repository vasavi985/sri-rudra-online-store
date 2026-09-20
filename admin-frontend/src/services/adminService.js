import axios from 'axios';
import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Firebase ID token to all outgoing requests
api.interceptors.request.use(
  async (config) => {
    // Wait for Firebase auth state to resolve if not yet initialized
    if (!auth.currentUser && typeof auth.authStateReady === 'function') {
      try {
        await auth.authStateReady();
      } catch (err) {
        console.warn('Error waiting for auth state ready:', err);
      }
    }

    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (err) {
        console.warn('Failed to obtain ID token for request:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh and consistent error normalization
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh token and retry on 401 Unauthorized once
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const user = auth.currentUser;
      if (user) {
        originalRequest._retry = true;
        try {
          const refreshedToken = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          console.warn('Token force-refresh failed:', refreshErr);
        }
      }
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        error.userFriendlyMessage = 'Your session has expired. Please sign in again.';
      } else if (status === 403) {
        error.userFriendlyMessage = "You don't have permission to perform this administrative action.";
      } else if (status === 404) {
        error.userFriendlyMessage = data?.message || 'Requested item was not found.';
      } else if (status === 429 || (data?.message && /quota|resource_exhausted/i.test(data.message))) {
        error.userFriendlyMessage = 'Store database quota exceeded. Please check Google Cloud / Firebase console.';
      } else if (status >= 400 && status < 500) {
        error.userFriendlyMessage = data?.message || 'Invalid request details. Please verify your inputs.';
      } else {
        error.userFriendlyMessage = data?.message || 'A server error occurred. Please try again later.';
      }
    } else if (error.request) {
      error.userFriendlyMessage = 'Unable to reach the store server. Please verify your connection.';
    } else {
      error.userFriendlyMessage = 'An unexpected error occurred. Please try again.';
    }

    return Promise.reject(error);
  }
);

/* ==========================================================================
   Admin API Service Functions
   ========================================================================== */

export const adminService = {
  // Overview Dashboard Metrics
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Products
  getAllProducts: async () => {
    const response = await api.get('/admin/products');
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id, hard = true) => {
    const url = hard ? `/products/${id}?hard=true` : `/products/${id}?hard=false`;
    const response = await api.delete(url);
    return response.data;
  },

  // Categories
  getAllCategories: async () => {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id, hard = false) => {
    const url = hard ? `/categories/${id}?hard=true` : `/categories/${id}`;
    const response = await api.delete(url);
    return response.data;
  },

  // Orders
  getAllOrders: async (status) => {
    const params = {};
    if (status && status !== 'ALL') {
      params.status = status;
    }
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, status, deliveryFee) => {
    const payload = {};
    if (status) payload.orderStatus = status;
    if (typeof deliveryFee === 'number') payload.deliveryFee = deliveryFee;

    try {
      const response = await api.patch(`/admin/orders/${id}/status`, payload);
      return response.data;
    } catch (err) {
      // Automatic fallback to PUT if PATCH encounters intermediate proxy restrictions
      if (err.response?.status === 405) {
        const fallbackResponse = await api.put(`/admin/orders/${id}/status`, payload);
        return fallbackResponse.data;
      }
      throw err;
    }
  },
};

export default adminService;
