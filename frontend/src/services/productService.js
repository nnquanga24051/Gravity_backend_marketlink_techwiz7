// frontend/src/services/productService.js
import apiClient, { formatImageUrl } from './apiClient';

export const productService = {
  /**
   * Fetch products with optional filters
   */
  async getProducts({ categoryId = '', farmerId = '', marketId = '', stallNumber = '', keyword = '', status = 'AVAILABLE' } = {}) {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (farmerId) params.append('farmerId', farmerId);
      if (marketId) params.append('marketId', marketId);
      if (stallNumber) params.append('stallNumber', stallNumber);
      if (keyword) params.append('keyword', keyword);
      if (status) params.append('status', status);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get(`/products${qs}`);
      
      let rawList = [];
      if (Array.isArray(res)) rawList = res;
      else if (res && Array.isArray(res.data)) rawList = res.data;
      else if (res && Array.isArray(res.value)) rawList = res.value;

      return rawList.map((p) => ({
        ...p,
        id: p.productId || p.id,
        imageUrl: formatImageUrl(p.imageUrl),
        farmerName: p.farmerStallName || p.farmerName || 'Nông Trại Thành Viên',
        stallNumber: p.stallNumber || p.stallCode || 'Sạp Tiêu Chuẩn',
        stallCode: p.stallNumber || p.stallCode || 'Sạp Tiêu Chuẩn',
        marketId: p.marketId,
        marketName: p.marketName || 'Chợ Phiên Nông Sản'
      }));
    } catch (err) {
      console.warn('Failed to fetch products from backend', err);
      return [];
    }
  },

  /**
   * Fetch all categories
   */
  async getCategories() {
    try {
      const res = await apiClient.get('/categories');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Failed to fetch categories from backend', err);
      return [];
    }
  },

  /**
   * Fetch single product details
   */
  async getProductById(id) {
    const res = await apiClient.get(`/products/${id}`);
    const p = res.data || res;
    return {
      ...p,
      id: p.productId || p.id,
      imageUrl: formatImageUrl(p.imageUrl),
      farmerName: p.farmerStallName || p.farmerName || 'Nông Trại Thành Viên'
    };
  }
};

export default productService;
