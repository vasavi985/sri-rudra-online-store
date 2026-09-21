import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

export const getCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

export const getCategoryById = async (id) => {
  const response = await apiClient.get(`/categories/${id}`);
  return response.data;
};

export default {
  getCategories,
  getCategoryById,
};
