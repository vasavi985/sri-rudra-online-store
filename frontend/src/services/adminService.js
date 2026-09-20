import axios from 'axios';
import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Retrieves valid Authorization headers with the current Firebase ID token.
 */
const getAdminHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Administrator authentication required.');
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getAdminStats = async () => {
  const headers = await getAdminHeaders();
  const response = await axios.get(`${API_BASE_URL}/admin/stats`, { headers });
  return response.data;
};

export const getAdminOrders = async (status = '') => {
  const headers = await getAdminHeaders();
  const params = status && status !== 'ALL' ? { status } : {};
  const response = await axios.get(`${API_BASE_URL}/admin/orders`, { headers, params });
  return response.data;
};

export const getAdminOrderById = async (id) => {
  const headers = await getAdminHeaders();
  const response = await axios.get(`${API_BASE_URL}/admin/orders/${id}`, { headers });
  return response.data;
};

export const updateOrderStatus = async (id, updateData) => {
  const headers = await getAdminHeaders();
  try {
    const response = await axios.patch(`${API_BASE_URL}/admin/orders/${id}/status`, updateData, { headers });
    return response.data;
  } catch (err) {
    if (err.response?.status === 405 || err.response?.status === 403) {
      const fallbackResponse = await axios.put(`${API_BASE_URL}/admin/orders/${id}/status`, updateData, { headers });
      return fallbackResponse.data;
    }
    throw err;
  }
};

export const getAdminProducts = async () => {
  const headers = await getAdminHeaders();
  const response = await axios.get(`${API_BASE_URL}/admin/products`, { headers });
  return response.data;
};

export const createProduct = async (productData) => {
  const headers = await getAdminHeaders();
  const response = await axios.post(`${API_BASE_URL}/products`, productData, { headers });
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const headers = await getAdminHeaders();
  const response = await axios.put(`${API_BASE_URL}/products/${id}`, productData, { headers });
  return response.data;
};

export const deleteProduct = async (id) => {
  const headers = await getAdminHeaders();
  const response = await axios.delete(`${API_BASE_URL}/products/${id}`, { headers });
  return response.data;
};

export const getAdminCategories = async () => {
  const headers = await getAdminHeaders();
  const response = await axios.get(`${API_BASE_URL}/admin/categories`, { headers });
  return response.data;
};

export const createCategory = async (categoryData) => {
  const headers = await getAdminHeaders();
  const response = await axios.post(`${API_BASE_URL}/categories`, categoryData, { headers });
  return response.data;
};

export const updateCategory = async (id, categoryData) => {
  const headers = await getAdminHeaders();
  const response = await axios.put(`${API_BASE_URL}/categories/${id}`, categoryData, { headers });
  return response.data;
};

export const deleteCategory = async (id) => {
  const headers = await getAdminHeaders();
  const response = await axios.delete(`${API_BASE_URL}/categories/${id}`, { headers });
  return response.data;
};

export default {
  getAdminStats,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
