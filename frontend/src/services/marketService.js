// frontend/src/services/marketService.js
import apiClient from './apiClient';

export const marketService = {
  /**
   * Fetch all active farmers markets
   */
  async getMarkets() {
    try {
      const res = await apiClient.get('/markets');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.value)) return res.value;
      return [];
    } catch (err) {
      console.warn('Failed to fetch markets, returning fallback array', err);
      return [];
    }
  },

  /**
   * Fetch market detail by ID
   */
  async getMarketById(id) {
    const res = await apiClient.get(`/markets/${id}`);
    return res.data || res;
  },

  /**
   * Fetch farmers assigned to stalls in a market
   */
  async getMarketFarmers(marketId) {
    try {
      const res = await apiClient.get(`/markets/${marketId}/farmers`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.value)) return res.value;
      return [];
    } catch (err) {
      console.warn(`Failed to fetch farmers for market ${marketId}`, err);
      return [];
    }
  },

  /**
   * Fetch pickup time slots for a market (optionally filter by farmerId)
   */
  async getPickupSlots(marketId, farmerId = null) {
    try {
      const query = farmerId ? `?farmerId=${farmerId}` : '';
      const res = await apiClient.get(`/markets/${marketId}/pickup-slots${query}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn(`Failed to fetch pickup slots for market ${marketId}`, err);
      return [];
    }
  },

  /**
   * Admin: Create a new market
   */
  async createMarket(marketData) {
    return apiClient.post('/admin/markets', marketData);
  },

  /**
   * Admin: Assign a farmer stall to a market
   */
  async assignFarmerStall(assignmentData) {
    return apiClient.post('/admin/markets/assignments', assignmentData);
  }
};

export default marketService;
