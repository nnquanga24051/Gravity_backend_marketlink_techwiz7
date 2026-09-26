// frontend/src/services/customerService.js
import apiClient, { formatImageUrl } from './apiClient';

export const customerService = {
  // ==========================================
  // 1. USER PROFILE & SETTINGS
  // ==========================================
  async getProfile() {
    try {
      const res = await apiClient.get('/users/profile');
      return res.data || res;
    } catch (err) {
      console.warn('Failed to fetch profile', err);
      return null;
    }
  },

  async updateProfile(profileData) {
    const res = await apiClient.put('/users/profile', profileData);
    return res.data || res;
  },

  async updateAvatar(avatarUrl) {
    const res = await apiClient.patch('/users/profile/avatar', { avatarUrl });
    return res.data || res;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await apiClient.put('/users/profile/change-password', {
      currentPassword,
      newPassword
    });
    return res.data || res;
  },

  // ==========================================
  // 2. FAVORITES / WISHLIST
  // ==========================================
  async getFavorites(targetType = '') {
    try {
      const query = targetType ? `?targetType=${targetType}` : '';
      const res = await apiClient.get(`/customer/favorites${query}`);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res && Array.isArray(res.data)) list = res.data;
      else if (res && res.data && Array.isArray(res.data.data)) list = res.data.data;

      return list.map((item) => ({
        ...item,
        targetImageUrl: formatImageUrl(item.targetImageUrl)
      }));
    } catch (err) {
      console.warn('Failed to fetch favorites', err);
      return [];
    }
  },

  async checkFavorite(targetType, targetId) {
    try {
      const res = await apiClient.get(`/customer/favorites/check?targetType=${targetType}&targetId=${targetId}`);
      if (res && res.data && typeof res.data.isFavorite === 'boolean') {
        return res.data.isFavorite;
      }
      if (res && typeof res.isFavorite === 'boolean') {
        return res.isFavorite;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  async addFavorite(targetType, targetId) {
    const res = await apiClient.post('/customer/favorites', {
      targetType,
      targetId: Number(targetId)
    });
    return res.data || res;
  },

  async removeFavorite(targetType, targetId) {
    const res = await apiClient.delete(`/customer/favorites?targetType=${targetType}&targetId=${targetId}`);
    return res.data || res;
  },

  // ==========================================
  // 3. FAMILY ACCOUNT (Gia đình đi chợ chung)
  // ==========================================
  async getFamilyMembers() {
    try {
      const res = await apiClient.get('/customer/family/members');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch family members', err);
      return [];
    }
  },

  async getFamilyInvitations() {
    try {
      const res = await apiClient.get('/customer/family/invitations');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch family invitations', err);
      return [];
    }
  },

  async inviteFamilyMember(inviteeEmail) {
    const res = await apiClient.post('/customer/family/invite', {
      inviteeEmail
    });
    return res.data || res;
  },

  async acceptFamilyInvitation(invitationToken) {
    const res = await apiClient.post('/customer/family/accept', {
      invitationToken
    });
    return res.data || res;
  },

  async rejectFamilyInvitation(invitationToken) {
    const res = await apiClient.post('/customer/family/reject', {
      invitationToken
    });
    return res.data || res;
  },

  async leaveFamily() {
    const res = await apiClient.delete('/customer/family/leave');
    return res.data || res;
  },

  async removeFamilyMember(memberId) {
    const res = await apiClient.delete(`/customer/family/members/${memberId}`);
    return res.data || res;
  },

  // ==========================================
  // 4. CUSTOMER ORDERS & REVIEWS
  // ==========================================
  async modifyOrder(orderId, modifyPayload) {
    const res = await apiClient.put(`/customer/orders/${orderId}/modify`, modifyPayload);
    return res.data || res;
  },

  async submitReview(reviewPayload) {
    const res = await apiClient.post('/customer/reviews', reviewPayload);
    return res.data || res;
  },

  async getMyReviews() {
    try {
      const res = await apiClient.get('/customer/reviews');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch reviews', err);
      return [];
    }
  },

  async getProductReviews(productId) {
    try {
      const res = await apiClient.get(`/reviews/product/${productId}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn(`Failed to fetch reviews for product ${productId}`, err);
      return [];
    }
  }
};

export default customerService;
