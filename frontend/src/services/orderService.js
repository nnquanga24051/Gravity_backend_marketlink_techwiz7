// frontend/src/services/orderService.js
import apiClient from './apiClient';

export const orderService = {
  /**
   * Customer: Place a pre-reservation order
   */
  async createOrder(orderPayload) {
    const res = await apiClient.post('/customer/orders', orderPayload);
    return res.data || res;
  },

  /**
   * Customer: View personal pre-orders history with optional search keyword and status filter
   */
  async getMyOrders({ keyword = '', status = '' } = {}) {
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (status && status !== 'all') params.append('status', status);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get(`/customer/orders${qs}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch customer orders', err);
      return [];
    }
  },

  /**
   * Customer: Cancel an order before cutoff time
   */
  async cancelOrder(orderId) {
    const res = await apiClient.put(`/customer/orders/${orderId}/cancel`, {});
    return res.data || res;
  },

  /**
   * Customer: Reorder from past order
   */
  async reorder(orderId, reorderPayload) {
    const res = await apiClient.post(`/customer/orders/${orderId}/reorder`, reorderPayload);
    return res.data || res;
  },

  /**
   * Farmer: View incoming orders for their stall
   */
  async getFarmerOrders({ pickupDate = '', status = '', keyword = '' } = {}) {
    try {
      const params = new URLSearchParams();
      if (pickupDate) params.append('pickupDate', pickupDate);
      if (status && status !== 'all') params.append('status', status);
      if (keyword) params.append('keyword', keyword);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await apiClient.get(`/farmer/orders${qs}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch farmer orders', err);
      return [];
    }
  },

  /**
   * Farmer: Update order status (ACCEPTED, READY_FOR_PICKUP, COMPLETED, DECLINED)
   */
  async updateFarmerOrderStatus(orderId, newStatus, reason = '') {
    const res = await apiClient.put(`/farmer/orders/${orderId}/status`, {
      orderStatus: newStatus,
      newStatus,
      reason
    });
    return res.data || res;
  },

  /**
   * Farmer: Get summary statistics
   */
  async getFarmerSummary() {
    try {
      const res = await apiClient.get('/farmer/orders/summary');
      return res.data || res;
    } catch (err) {
      console.warn('Failed to fetch farmer summary', err);
      return null;
    }
  }
};

export default orderService;
