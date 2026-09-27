// frontend/src/services/marketService.js
import apiClient, { formatImageUrl } from './apiClient';

export const marketService = {
  /**
   * Fetch all active farmers markets with optional keyword search and filters
   */
  async getMarkets({ search = '', city = '', dayOfWeek = '' } = {}) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (city && city !== 'all') params.append('city', city);
      if (dayOfWeek && dayOfWeek !== 'all') params.append('dayOfWeek', dayOfWeek);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get(`/markets${qs}`);
      const rawList = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : (res && Array.isArray(res.value) ? res.value : []));
      return rawList.map(m => ({
        ...m,
        imageUrl: formatImageUrl(m.imageUrl)
      }));
    } catch (err) {
      console.warn('Failed to fetch markets, returning fallback array', err);
      return [];
    }
  },

  /**
   * Fetch farmer stalls across all markets or by marketId with search keyword
   */
  async getStalls({ search = '', marketId = '' } = {}) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (marketId && marketId !== 'all') params.append('marketId', marketId);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get(`/markets/stalls${qs}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.value)) return res.value;
      return [];
    } catch (err) {
      console.warn('Failed to fetch stalls from backend', err);
      return [];
    }
  },

  /**
   * Fetch market detail by ID
   */
  async getMarketById(id) {
    const res = await apiClient.get(`/markets/${id}`);
    const data = res.data || res;
    if (data && typeof data === 'object') {
      data.imageUrl = formatImageUrl(data.imageUrl);
    }
    return data;
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
