import apiClient from './apiClient';

/**
 * Service phục vụ đọc và xem thông báo / tin tức hệ thống cho người dùng và khách.
 */
const announcementService = {
  /**
   * Lấy danh sách thông báo hệ thống đang kích hoạt
   * @param {Object} params - { keyword, type, targetRole }
   */
  async getActiveAnnouncements({ keyword = '', type = '', targetRole = '' } = {}) {
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (type && type !== 'all') params.append('type', type);
      if (targetRole && targetRole !== 'all') params.append('targetRole', targetRole);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get(`/announcements${qs}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to load active announcements', err);
      return [];
    }
  },

  /**
   * Lấy chi tiết một bài viết thông báo
   * @param {number|string} id
   */
  async getAnnouncementById(id) {
    try {
      const res = await apiClient.get(`/announcements/${id}`);
      return res.data || res;
    } catch (err) {
      console.error('Failed to load announcement detail', err);
      throw err;
    }
  }
};

export default announcementService;
