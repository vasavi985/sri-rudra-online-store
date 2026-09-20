import axios from 'axios';
import { auth } from '../firebase';

const API_BASE_URL = 'http://localhost:8080/api/orders';

/**
 * Retrieves valid Authorization headers with the current Firebase ID token.
 */
const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Customer must be signed in to perform this order action.');
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Submits an order creation request to the backend.
 * @param {Object} orderData - { items: [{ productId, variantId, quantity }], address: { ... } }
 * @returns {Promise<Object>} Created order document
 */
export const createOrder = async (orderData) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(API_BASE_URL, orderData, { headers });
  return response.data;
};

/**
 * Fetches all orders belonging to the authenticated customer.
 * @returns {Promise<Array>} List of user orders
 */
export const getMyOrders = async () => {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${API_BASE_URL}/my-orders`, { headers });
  return response.data;
};

/**
 * Fetches a single order by ID for the authenticated customer.
 * @param {string} orderId
 * @returns {Promise<Object>} Order details
 */
export const getOrderById = async (orderId) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${API_BASE_URL}/${orderId}`, { headers });
  return response.data;
};

export default {
  createOrder,
  getMyOrders,
  getOrderById,
};
