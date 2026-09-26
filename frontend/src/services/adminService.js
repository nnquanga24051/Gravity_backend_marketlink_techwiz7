// frontend/src/services/adminService.js
import apiClient from './apiClient';

export const adminService = {
  // ========================================================
  // 1. DASHBOARD & SYSTEM METRICS
  // ========================================================
  /**
   * Fetch core platform metrics (totals for farmers, customers, markets, orders, revenue, pending KYC)
   */
  async getPlatformMetrics() {
    try {
      const res = await apiClient.get('/admin/dashboard/metrics');
      return res.data || res;
    } catch (err) {
      console.warn('Failed to fetch platform metrics', err);
      return null;
    }
  },

  /**
   * Fetch market revenue and order reports
   */
  async getMarketRevenueReports() {
    try {
      const res = await apiClient.get('/admin/dashboard/reports/markets');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch market revenue reports', err);
      return [];
    }
  },

  /**
   * Fetch most active farmers leaderboard
   */
  async getMostActiveFarmers(limit = 10) {
    try {
      const res = await apiClient.get(`/admin/dashboard/reports/most-active-farmers?limit=${limit}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch active farmers', err);
      return [];
    }
  },

  // ========================================================
  // 2. USER MANAGEMENT & MODERATION
  // ========================================================
  /**
   * Fetch users with filters: keyword, role, status, kycStatus
   */
  async getUsers(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.keyword) query.append('keyword', params.keyword);
      if (params.role && params.role !== 'ALL') {
        const cleanRole = String(params.role).replace(/^ROLE_/, '');
        query.append('role', cleanRole);
      }
      if (params.status && params.status !== 'ALL') query.append('status', params.status);
      if (params.kycStatus && params.kycStatus !== 'ALL') query.append('kycStatus', params.kycStatus);

      const qs = query.toString();
      const res = await apiClient.get(`/admin/users${qs ? '?' + qs : ''}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch users', err);
      return [];
    }
  },

  /**
   * Get user detail including profile details and audit logs
   */
  async getUserDetail(userId) {
    const res = await apiClient.get(`/admin/users/${userId}`);
    return res.data || res;
  },

  /**
   * Update user status (ACTIVE, SUSPENDED)
   */
  async updateUserStatus(userId, status, note = '') {
    const res = await apiClient.patch(`/admin/users/${userId}/status`, {
      status,
      note
    });
    return res.data || res;
  },

  // ========================================================
  // 3. FARMER KYC VERIFICATION
  // ========================================================
  /**
   * Fetch pending farmer KYC verifications with optional keyword search
   */
  async getPendingKycList(keyword = '') {
    try {
      const qs = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
      const res = await apiClient.get(`/admin/kyc/pending${qs}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch pending KYC list', err);
      return [];
    }
  },

  /**
   * Fetch details of a farmer KYC submission
   */
  async getFarmerKycDetail(farmerId) {
    const res = await apiClient.get(`/admin/kyc/farmers/${farmerId}`);
    return res.data || res;
  },

  /**
   * Review farmer KYC (APPROVE, REJECT, REQUEST_REVISION)
   */
  async reviewFarmerKyc(farmerId, action = 'APPROVE', reason = '') {
    const payload = {
      action: action || 'APPROVE',
      reason: reason || (action === 'APPROVE' ? 'Hồ sơ chứng nhận VietGAP hợp lệ.' : '')
    };
    const res = await apiClient.post(`/admin/kyc/farmers/${farmerId}/review`, payload);
    return res.data || res;
  },

  // ========================================================
  // 4. PLATFORM ORDERS (ALL MARKETS & FARMERS)
  // ========================================================
  /**
   * Fetch all orders across platform for Admin oversight with server-side filters
   */
  async getAllOrders({ keyword = '', status = '', marketId = '', pickupDate = '' } = {}) {
    try {
      const query = new URLSearchParams();
      if (keyword) query.append('keyword', keyword);
      if (status && status !== 'ALL') query.append('status', status);
      if (marketId && marketId !== 'ALL') query.append('marketId', marketId);
      if (pickupDate) query.append('pickupDate', pickupDate);
      const qs = query.toString();
      const res = await apiClient.get(`/admin/orders${qs ? '?' + qs : ''}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch all orders for admin', err);
      return [];
    }
  },

  // ========================================================
  // 5. MARKETS & STALLS MANAGEMENT
  // ========================================================
  async getAllMarkets(status = 'ALL', search = '') {
    try {
      const query = new URLSearchParams();
      if (status && status !== 'ALL') query.append('status', status);
      if (search) query.append('search', search);

      const qs = query.toString();
      const res = await apiClient.get(`/admin/markets${qs ? '?' + qs : ''}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch admin markets', err);
      return [];
    }
  },

  async getMarketDetail(id) {
    const res = await apiClient.get(`/admin/markets/${id}`);
    return res.data || res;
  },

  async createMarket(data) {
    const res = await apiClient.post('/admin/markets', data);
    return res.data || res;
  },

  async updateMarket(id, data) {
    const res = await apiClient.put(`/admin/markets/${id}`, data);
    return res.data || res;
  },

  async updateMarketStatus(id, status) {
    const res = await apiClient.patch(`/admin/markets/${id}/status?status=${status}`, {});
    return res.data || res;
  },

  async deleteMarket(id) {
    const res = await apiClient.delete(`/admin/markets/${id}`);
    return res.data || res;
  },

  async assignStall(data) {
    const res = await apiClient.post('/admin/markets/assignments', data);
    return res.data || res;
  },

  async getMarketAssignments(marketId) {
    try {
      const res = await apiClient.get(`/admin/markets/${marketId}/assignments`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch market assignments', err);
      return [];
    }
  },

  async updateAssignmentStatus(assignmentId, status) {
    const res = await apiClient.patch(`/admin/markets/assignments/${assignmentId}/status?status=${status}`, {});
    return res.data || res;
  },

  async deleteAssignment(assignmentId) {
    const res = await apiClient.delete(`/admin/markets/assignments/${assignmentId}`);
    return res.data || res;
  },

  // ========================================================
  // 6. CATEGORIES MANAGEMENT
  // ========================================================
  async getAllCategories(keyword = '') {
    try {
      const qs = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
      const res = await apiClient.get(`/categories${qs}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch categories', err);
      return [];
    }
  },

  async createCategory(data) {
    const res = await apiClient.post('/categories', data);
    return res.data || res;
  },

  async updateCategory(id, data) {
    const res = await apiClient.put(`/categories/${id}`, data);
    return res.data || res;
  },

  async deleteCategory(id) {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data || res;
  },

  // ========================================================
  // 7. REVIEWS MODERATION
  // ========================================================
  async getAllReviews({ keyword = '', filter = '' } = {}) {
    try {
      const query = new URLSearchParams();
      if (keyword) query.append('keyword', keyword);
      if (filter && filter !== 'ALL') query.append('filter', filter);
      const qs = query.toString();
      const res = await apiClient.get(`/admin/reviews${qs ? '?' + qs : ''}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      // Fallback: If backend hasn't reloaded yet, try fetching farmer reviews
      try {
        const fallbackRes = await apiClient.get('/reviews/farmer/90');
        if (Array.isArray(fallbackRes)) return fallbackRes;
        if (fallbackRes && Array.isArray(fallbackRes.data)) return fallbackRes.data;
      } catch {}
      return [];
    }
  },

  async setReviewVisibility(reviewId, isHidden) {
    const res = await apiClient.patch(`/admin/reviews/${reviewId}/visibility?isHidden=${isHidden}`, {});
    return res.data || res;
  },

  // ========================================================
  // 8. SYSTEM ANNOUNCEMENTS
  // ========================================================
  async getAllAnnouncements({ keyword = '' } = {}) {
    try {
      const qs = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
      const res = await apiClient.get(`/admin/announcements${qs}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch announcements', err);
      return [];
    }
  },

  async createAnnouncement(data) {
    const res = await apiClient.post('/admin/announcements', data);
    return res.data || res;
  },

  async updateAnnouncement(id, data) {
    const res = await apiClient.put(`/admin/announcements/${id}`, data);
    return res.data || res;
  },

  async deleteAnnouncement(id) {
    const res = await apiClient.delete(`/admin/announcements/${id}`);
    return res.data || res;
  }
};

export default adminService;
