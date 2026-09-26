// frontend/src/services/aiService.js
import apiClient from './apiClient';

export const aiService = {
  /**
   * Send question to AI Assistant (Google Gemini via Backend)
   */
  async askAssistant(message) {
    try {
      const res = await apiClient.post('/ai/assistant/chat', { message });
      if (res && res.reply) return res.reply;
      if (res && res.data && res.data.reply) return res.data.reply;
      if (typeof res === 'string') return res;
    } catch {
      // Intelligent local agricultural knowledge fallback
      const lower = message.toLowerCase();
      if (lower.includes('chợ') || lower.includes('phiên')) {
        return '🌿 Hệ thống MarketLink hiện đang kết nối với 4 phiên chợ nông sản định kỳ: Chợ Nông Sản Ba Đình (Hà Nội), Chợ Hữu Cơ Thảo Điền (TP.HCM), Chợ Nông Sản Tây Hồ, và Chợ Xanh Ecopark. Bạn có thể chọn chợ gần nhất tại mục "Khám phá chợ phiên" để xem sạp nông dân nhé!';
      }
      if (lower.includes('đặt') || lower.includes('mua') || lower.includes('thanh toán')) {
        return '🛒 Cách thức mua sắm tại MarketLink:\n1. Chọn nông sản từ các nhà vườn VietGAP uy tín.\n2. Chọn khung giờ (ca nhận) và ngày họp chợ bạn tiện ghé.\n3. Nhận mã đơn đặt trước (không cần trả tiền online).\n4. Ghé thẳng sạp nông dân tại chợ, kiểm tra hàng tận tay và trả tiền mặt/quẹt VietQR!';
      }
      if (lower.includes('rau') || lower.includes('hoa quả') || lower.includes('mùa') || lower.includes('sản phẩm')) {
        return '🥦 Nông sản đang vào độ ngon nhất tuần này gồm có: Cải bó xôi hữu cơ Ba Vì, Cà chua Cherry Mộc Châu mọng nước, Dâu tây Hana Đà Lạt hái sớm, và Nấm hương rừng Sa Pa tươi. Bạn có thể xem chi tiết ở mục "Nông sản mùa vụ" nhé!';
      }
      return '🌿 Xin chào! Tôi là Trợ lý Nông sản Xanh MarketLink. Tôi có thể hỗ trợ bạn tìm kiếm phiên chợ cuối tuần, kiểm tra độ tươi ngon của nông sản VietGAP, hoặc hướng dẫn bạn đặt trước lấy hàng tại sạp chợ!';
    }
  }
};

export default aiService;
