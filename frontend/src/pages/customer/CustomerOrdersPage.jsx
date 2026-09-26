import React, { useState, useEffect } from 'react';
import './CustomerOrdersPage.css';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import OrderModifyModal from '../../components/customer/OrderModifyModal';
import ReviewModal from '../../components/customer/ReviewModal';
import orderService from '../../services/orderService';
import customerService from '../../services/customerService';

export default function CustomerOrdersPage({
  onReorder,
  onNavigate
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [selectedModifyOrder, setSelectedModifyOrder] = useState(null);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
  const [selectedQrOrder, setSelectedQrOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Load real orders from backend
  const loadOrders = async () => {
    setLoading(true);
    try {
      const realOrders = await orderService.getMyOrders();
      if (realOrders && realOrders.length > 0) {
        setOrders(realOrders.map((o) => ({
          id: o.orderId || o.id,
          orderId: o.orderId || o.id,
          orderCode: o.orderCode || `ORD-${o.orderId || o.id}`,
          pickupMarket: o.marketName || 'Chợ Phiên Nông Sản',
          marketAddress: o.marketAddress || '',
          stallLocation: o.stallName ? `${o.stallName} (${o.marketAddress || ''})` : (o.marketAddress || 'Sạp nông dân'),
          pickupDate: o.pickupDate,
          pickupSlot: o.slotTimeRange || '07:00 - 08:00',
          pickupSlotLabel: o.slotTimeRange ? `Ca nhận hàng: ${o.slotTimeRange}` : 'Khung giờ sáng sớm',
          slotId: o.slotId,
          farmerId: o.farmerId,
          marketId: o.marketId,
          status: o.orderStatus || 'PLACED',
          totalAmount: o.totalAmount || 0,
          paymentMethod: o.paymentMethod || 'Thanh toán trực tiếp tại sạp',
          farmerName: o.farmerName || 'Nông Trại Hữu Cơ',
          farmerPhone: o.customerPhone || '0900000003',
          note: o.note || '',
          createdAt: o.createdAt ? String(o.createdAt).replace('T', ' ').substring(0, 16) : 'Hôm nay',
          canCancel: o.canCancel !== undefined ? o.canCancel : (o.orderStatus === 'PLACED'),
          items: (o.items || []).map((it) => ({
            id: it.productId || it.orderItemId,
            name: it.productName || 'Nông sản sạch',
            quantity: it.quantity || 1,
            price: it.unitPrice || 0,
            unit: it.productUnit || 'kg'
          })),
          reviewed: o.hasReview === true
        })));
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Error loading real orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'READY') return o.status === 'READY' || o.status === 'READY_FOR_PICKUP';
    if (activeTab === 'PENDING') return o.status === 'PENDING' || o.status === 'PLACED' || o.status === 'ACCEPTED';
    return o.status === activeTab;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY':
      case 'READY_FOR_PICKUP':
        return <Badge variant="ready" dot>Sẵn sàng tại sạp chợ</Badge>;
      case 'PENDING':
      case 'PLACED':
        return <Badge variant="pending" dot>Đang chờ sạp chốt đơn</Badge>;
      case 'ACCEPTED':
      case 'CONFIRMED':
        return <Badge variant="organic" dot>Đang thu hoạch & đóng gói</Badge>;
      case 'COMPLETED':
        return <Badge variant="completed">Đã nhận & thanh toán</Badge>;
      case 'CANCELLED':
      case 'DECLINED':
        return <Badge variant="cancelled">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Bạn có chắc muốn hủy đơn đặt trước này? Nông dân sẽ hoàn lại tồn kho cho khách hàng khác.')) {
      try {
        await orderService.cancelOrder(orderId);
        setActionMessage('Đã hủy đơn thành công. Tồn kho đã được hoàn lại.');
        setTimeout(() => setActionMessage(''), 4000);
        await loadOrders();
      } catch (err) {
        alert(err?.message || 'Không thể hủy đơn hàng vào lúc này.');
      }
    }
  };

  const handleSaveModification = async (orderId, newDetails) => {
    try {
      await customerService.modifyOrder(orderId, {
        pickupDate: newDetails.pickupDate,
        slotId: Number(newDetails.slotId),
        note: newDetails.note
      });
      setActionMessage('Đã điều chỉnh lịch nhận hàng thành công!');
      setTimeout(() => setActionMessage(''), 4000);
      await loadOrders();
    } catch (err) {
      alert(err?.message || 'Không thể thay đổi đơn hàng lúc này.');
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      await customerService.submitReview({
        orderId: Number(reviewData.orderId),
        productId: reviewData.productId ? Number(reviewData.productId) : null,
        rating: Number(reviewData.rating),
        comment: reviewData.comment
      });
      setActionMessage('Cảm ơn bạn đã gửi đánh giá cho sạp nông dân!');
      setTimeout(() => setActionMessage(''), 4000);
      // Reload from server so hasReview flag is accurate
      await loadOrders();
    } catch (err) {
      alert(err?.message || 'Không thể gửi đánh giá lúc này.');
    }
  };

  return (
    <div className="ml-orders-page">
      {/* Page Header */}
      <div className="ml-orders-banner">
        <div className="ml-container">
          <span className="ml-section-subtitle">Đơn Hàng Của Bạn</span>
          <h1 className="ml-orders-title">Quản Lý Đơn Đặt Trước Nông Sản</h1>
          <p className="ml-orders-subtitle">
            Theo dõi trạng thái thu hoạch và đóng gói từ nhà vườn, lấy mã QR xuất trình tại sạp và thanh toán tiền mặt trực tiếp khi đến chợ.
          </p>

          {/* Status Tabs */}
          <div className="ml-orders-tabs">
            {[
              { key: 'all', label: `Tất cả (${orders.length})` },
              { key: 'READY', label: '🌿 Sẵn sàng tại sạp' },
              { key: 'PENDING', label: '⏳ Chờ chốt đơn' },
              { key: 'COMPLETED', label: '✓ Đã nhận hàng' },
              { key: 'CANCELLED', label: '✕ Đã hủy' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`ml-order-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ml-container">
        {actionMessage && (
          <div className="ml-orders-loading" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
            ✓ {actionMessage}
          </div>
        )}

        {loading && <div className="ml-orders-loading">Đang tải dữ liệu đơn hàng thực tế từ hệ thống...</div>}

        {!loading && filteredOrders.length === 0 ? (
          <div className="ml-card ml-orders-empty">
            <span className="ml-orders-empty-icon">🧺</span>
            <h3>Chưa có đơn đặt trước nào</h3>
            <p>Các sạp nông dân họp chợ đang mở nhận đơn rau sạch sớm. Đặt trước để giữ phần ngon nhất!</p>
            <Button variant="primary" size="md" onClick={() => onNavigate && onNavigate('products')}>
              Khám phá nông sản mùa vụ
            </Button>
          </div>
        ) : (
          <div className="ml-orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="ml-card ml-order-card">
                {/* Header */}
                <div className="ml-order-header">
                  <div className="ml-order-identity">
                    <span className="ml-order-code">Mã: #{order.orderCode}</span>
                    <span className="ml-order-dot">•</span>
                    <span className="ml-order-time">Đặt lúc: {order.createdAt}</span>
                  </div>
                  <div className="ml-order-status-wrap">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Pickup Info Banner */}
                <div className="ml-order-pickup-box">
                  <div className="ml-pickup-grid">
                    <div className="ml-pickup-col">
                      <span className="ml-pickup-icon">🎪</span>
                      <div>
                        <div className="ml-pickup-label">Điểm hẹn chợ phiên:</div>
                        <div className="ml-pickup-val"><strong>{order.pickupMarket}</strong></div>
                        <div className="ml-pickup-sub">{order.stallLocation}</div>
                      </div>
                    </div>

                    <div className="ml-pickup-col">
                      <span className="ml-pickup-icon">⏰</span>
                      <div>
                        <div className="ml-pickup-label">Thời gian đến lấy hàng:</div>
                        <div className="ml-pickup-val"><strong>{order.pickupSlotLabel || order.pickupSlot}</strong></div>
                        <div className="ml-pickup-sub">Ngày: {order.pickupDate}</div>
                      </div>
                    </div>

                    <div className="ml-pickup-col">
                      <span className="ml-pickup-icon">👨‍🌾</span>
                      <div>
                        <div className="ml-pickup-label">Sạp nông dân:</div>
                        <div className="ml-pickup-val"><strong>{order.farmerName}</strong></div>
                        <div className="ml-pickup-sub">Hotline: {order.farmerPhone}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className="ml-order-items-table">
                  <div className="ml-table-head">
                    <span className="col-name">Nông sản đặt trước</span>
                    <span className="col-qty">Số lượng</span>
                    <span className="col-price">Đơn giá</span>
                    <span className="col-total">Tạm tính</span>
                  </div>
                  <div className="ml-table-body">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="ml-table-row">
                        <span className="col-name">🥬 {item.name}</span>
                        <span className="col-qty">{item.quantity} {item.unit}</span>
                        <span className="col-price">{formatCurrency(item.price)}</span>
                        <span className="col-total">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note */}
                {order.note && (
                  <div className="ml-order-note">
                    <strong>Ghi chú cho nông dân:</strong> "{order.note}"
                  </div>
                )}

                {/* Footer & Actions */}
                <div className="ml-order-footer">
                  <div className="ml-order-total-block">
                    <span className="ml-total-label">Tổng thanh toán tại sạp:</span>
                    <span className="ml-total-val">{formatCurrency(order.totalAmount)}</span>
                    <span className="ml-payment-tag">{order.paymentMethod}</span>
                  </div>

                  <div className="ml-order-actions">
                    {/* View Pickup QR Code button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQrOrder(order)}
                    >
                      📱 Xem mã QR nhận hàng
                    </Button>

                    {order.status === 'COMPLETED' && !order.reviewed && (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => setSelectedReviewOrder(order)}
                      >
                        ⭐ Đánh giá sạp
                      </Button>
                    )}

                    {order.status === 'COMPLETED' && order.reviewed && (
                      <span className="ml-reviewed-badge">✓ Đã đánh giá</span>
                    )}

                    {(order.status === 'PENDING' || order.status === 'PLACED') && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedModifyOrder(order)}
                        >
                          Đổi giờ lấy hàng
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-danger-text"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Hủy đơn
                        </Button>
                      </>
                    )}

                    {order.status === 'COMPLETED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onReorder && onReorder(order)}
                      >
                        🧺 Đặt lại đơn này
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pickup QR Code Modal */}
      {selectedQrOrder && (
        <Modal
          isOpen={!!selectedQrOrder}
          onClose={() => setSelectedQrOrder(null)}
          title="Mã Nhận Hàng Tại Sạp Chợ"
          subtitle={`Xuất trình mã này cho chủ sạp ${selectedQrOrder.farmerName}`}
          maxWidth="440px"
        >
          <div className="ml-qr-pickup-modal">
            <div className="ml-qr-code-text">#{selectedQrOrder.orderCode}</div>
            
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selectedQrOrder.orderCode)}`}
              alt="Mã QR đơn hàng"
              className="ml-qr-code-img"
            />

            <div className="ml-qr-stall-info">
              <div>🎪 <strong>Điểm hẹn:</strong> {selectedQrOrder.pickupMarket}</div>
              <div>📍 <strong>Vị trí sạp:</strong> {selectedQrOrder.stallLocation}</div>
              <div>⏰ <strong>Ca lấy hàng:</strong> {selectedQrOrder.pickupSlotLabel || selectedQrOrder.pickupSlot} ({selectedQrOrder.pickupDate})</div>
              <div>💵 <strong>Số tiền thanh toán:</strong> <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{formatCurrency(selectedQrOrder.totalAmount)}</span></div>
            </div>

            <p className="ml-qr-pickup-guide">
              Khi đến sạp, hãy đưa màn hình này cho nông dân quét hoặc đọc mã đơn để nhận giỏ nông sản đã đóng gói sẵn và kiểm tra trước khi trả tiền mặt.
            </p>

            <Button variant="primary" size="md" fullWidth onClick={() => setSelectedQrOrder(null)}>
              Đã hiểu & Đóng
            </Button>
          </div>
        </Modal>
      )}

      {/* Modify Modal */}
      {selectedModifyOrder && (
        <OrderModifyModal
          isOpen={!!selectedModifyOrder}
          onClose={() => setSelectedModifyOrder(null)}
          order={selectedModifyOrder}
          onSave={handleSaveModification}
          onSaveModification={handleSaveModification}
        />
      )}

      {/* Review Modal */}
      {selectedReviewOrder && (
        <ReviewModal
          isOpen={!!selectedReviewOrder}
          onClose={() => setSelectedReviewOrder(null)}
          order={selectedReviewOrder}
          onSubmit={handleSubmitReview}
          onSubmitReview={handleSubmitReview}
        />
      )}
    </div>
  );
}
