import React, { useState, useEffect } from 'react';
import './FarmerOrdersPage.css';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import farmerService from '../../services/farmerService';

export default function FarmerOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Decline modal state
  const [declineModal, setDeclineModal] = useState({
    isOpen: false,
    orderId: null,
    orderCode: '',
    reason: 'Rau đã hết đợt hái trong ngày'
  });

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    placedCount: 0,
    acceptedCount: 0,
    readyCount: 0,
    completedCount: 0,
    totalRevenue: 0
  });

  const showSuccess = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Load real farmer orders & summary with Server-Side Search & Filter
  const loadFarmerOrders = async () => {
    setLoading(true);
    try {
      let statusParam = '';
      if (activeTab === 'DECLINED_CANCELLED') {
        statusParam = 'DECLINED';
      } else if (activeTab !== 'all') {
        statusParam = activeTab;
      }

      const [orderList, summaryData] = await Promise.all([
        farmerService.getFarmerOrders({
          pickupDate: dateFilter,
          status: statusParam,
          keyword: searchQuery.trim()
        }),
        farmerService.getFarmerSummary()
      ]);

      if (orderList && Array.isArray(orderList)) {
        setOrders(orderList.map((o) => ({
          id: o.orderId || o.id,
          orderCode: o.orderCode || `ORD-${o.orderId}`,
          customerName: o.customerName || 'Khách hàng',
          customerPhone: o.customerPhone || '0900000000',
          pickupDate: o.pickupDate,
          pickupSession: o.slotTimeRange || '07:00 - 08:00',
          pickupSessionLabel: o.slotTimeRange ? `Ca: ${o.slotTimeRange}` : 'Ca nhận sáng',
          marketName: o.marketName || 'Chợ Nông Sản',
          status: o.orderStatus || 'PLACED',
          totalAmount: Number(o.totalAmount) || 0,
          paymentMethod: o.paymentMethod || 'CASH_ON_PICKUP',
          note: o.note || '',
          createdAt: o.createdAt ? o.createdAt.replace('T', ' ').substring(0, 16) : 'Hôm nay',
          items: (o.items || []).map((it) => ({
            name: it.productName || 'Nông sản',
            qty: it.quantity,
            unit: it.productUnit || 'kg',
            price: Number(it.unitPrice) || 0,
            subtotal: Number(it.subtotal) || 0
          }))
        })));
      } else {
        setOrders([]);
      }

      if (summaryData) {
        setSummary({
          placedCount: summaryData.placedCount || 0,
          acceptedCount: summaryData.acceptedCount || 0,
          readyCount: summaryData.readyCount || 0,
          completedCount: summaryData.completedCount || 0,
          totalRevenue: Number(summaryData.totalRevenue) || 0
        });
      }
    } catch (err) {
      console.warn('Error loading real farmer orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFarmerOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [dateFilter, activeTab, searchQuery]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const handleUpdateStatus = async (orderId, newStatus, reason = '') => {
    try {
      await farmerService.updateFarmerOrderStatus(orderId, newStatus, reason);
      
      const statusLabels = {
        ACCEPTED: 'Đã tiếp nhận đơn hàng thành công!',
        READY_FOR_PICKUP: 'Đơn hàng đã được đánh dấu đóng gói sẵn sàng tại sạp!',
        COMPLETED: 'Đã hoàn tất giao nông sản & thu tiền tại sạp!',
        DECLINED: 'Đã từ chối đơn hàng thành công.'
      };
      showSuccess(statusLabels[newStatus] || 'Đã cập nhật trạng thái đơn!');
      
      // Reload fresh data from backend
      await loadFarmerOrders();
    } catch (err) {
      console.error('Failed to update status on backend', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật trạng thái đơn hàng';
      alert('Không thể cập nhật trạng thái đơn: ' + errMsg);
    }
  };

  const confirmDecline = async (e) => {
    e.preventDefault();
    if (!declineModal.orderId) return;

    await handleUpdateStatus(declineModal.orderId, 'DECLINED', declineModal.reason);
    setDeclineModal({ isOpen: false, orderId: null, orderCode: '', reason: '' });
  };

  // Orders are searched and filtered entirely on server
  const filteredOrders = sessionFilter === 'all'
    ? orders
    : orders.filter((o) => o.pickupSession === sessionFilter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return <Badge variant="ready" dot>Sẵn sàng tại sạp</Badge>;
      case 'PENDING':
      case 'PLACED':
        return <Badge variant="pending" dot>Đơn mới (Chờ nhận)</Badge>;
      case 'ACCEPTED':
        return <Badge variant="organic" dot>Đang chuẩn bị tại vườn/sạp</Badge>;
      case 'COMPLETED':
        return <Badge variant="completed">Đã giao & thu tiền</Badge>;
      case 'DECLINED':
        return <Badge variant="cancelled">Chủ sạp từ chối</Badge>;
      case 'CANCELLED':
        return <Badge variant="cancelled">Khách đã hủy</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="ml-farmer-orders-page">
      {/* Header Banner */}
      <div className="ml-farmer-orders-banner">
        <div className="ml-container">
          <span className="ml-section-subtitle">Phân hệ Nông Dân / Chủ Sạp</span>
          <h1 className="ml-farmer-orders-title">Quản Lý Đơn Khách Đặt Trước Tại Sạp</h1>
          <p className="ml-farmer-orders-subtitle">
            Chuẩn bị trước phần nông sản tươi hái sớm theo từng ca đón khách. Đảm bảo đúng định lượng và chất lượng cam kết.
          </p>

          {/* Metrics Quick Strip */}
          <div className="ml-farmer-quick-strip">
            <div className="ml-strip-item">
              <span className="ml-strip-num">{summary.placedCount || orders.filter((o) => o.status === 'PENDING' || o.status === 'PLACED').length}</span>
              <span className="ml-strip-label">Đơn mới cần tiếp nhận</span>
            </div>
            <div className="ml-strip-sep"></div>
            <div className="ml-strip-item">
              <span className="ml-strip-num">{summary.acceptedCount || orders.filter((o) => o.status === 'ACCEPTED').length}</span>
              <span className="ml-strip-label">Đơn đang gói</span>
            </div>
            <div className="ml-strip-sep"></div>
            <div className="ml-strip-item">
              <span className="ml-strip-num">{summary.readyCount || orders.filter((o) => o.status === 'READY_FOR_PICKUP').length}</span>
              <span className="ml-strip-label">Sẵn sàng tại sạp</span>
            </div>
            <div className="ml-strip-sep"></div>
            <div className="ml-strip-item">
              <span className="ml-strip-num">
                {formatCurrency(summary.totalRevenue || orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}
              </span>
              <span className="ml-strip-label">Tổng doanh thu sạp</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-container ml-farmer-orders-body">
        {/* Success Alert */}
        {actionSuccessMsg && (
          <div className="ml-alert-success">
            ✓ {actionSuccessMsg}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="ml-card ml-farmer-filter-box">
          <div className="ml-farmer-search-row">
            <div className="ml-farmer-search-field">
              <span className="ml-farmer-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm theo mã đơn (#ORD-...), tên khách, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-farmer-search-input"
              />
            </div>

            <div className="ml-farmer-date-filter">
              <span className="ml-filter-label">📅 Ngày nhận:</span>
              <input
                type="date"
                className="ml-date-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button
                  type="button"
                  className="ml-clear-date-btn"
                  onClick={() => setDateFilter('')}
                >
                  Xóa lọc ngày
                </button>
              )}
            </div>
          </div>

          <div className="ml-farmer-tabs-row">
            <div className="ml-farmer-status-tabs">
              {[
                { key: 'all', label: `Tất cả (${orders.length})` },
                { key: 'PLACED', label: `Mới nhận (${orders.filter((o) => o.status === 'PLACED' || o.status === 'PENDING').length})` },
                { key: 'ACCEPTED', label: `Đang chuẩn bị (${orders.filter((o) => o.status === 'ACCEPTED').length})` },
                { key: 'READY_FOR_PICKUP', label: `Sẵn sàng tại sạp (${orders.filter((o) => o.status === 'READY_FOR_PICKUP').length})` },
                { key: 'COMPLETED', label: `Hoàn tất (${orders.filter((o) => o.status === 'COMPLETED').length})` },
                { key: 'DECLINED_CANCELLED', label: `Từ chối / Hủy (${orders.filter((o) => o.status === 'DECLINED' || o.status === 'CANCELLED').length})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`ml-farmer-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Listing */}
        {loading && <div className="ml-farmer-loading">Đang tải danh sách đơn từ sạp...</div>}

        {filteredOrders.length === 0 ? (
          <div className="ml-card ml-farmer-orders-empty">
            <span className="ml-farmer-empty-icon">🥬</span>
            <h3>Không có đơn hàng nào trong trạng thái này</h3>
            <p>Khách hàng thường đặt trước nông sản vào thứ Năm và thứ Sáu trước ngày phiên chợ họp.</p>
          </div>
        ) : (
          <div className="ml-farmer-orders-grid">
            {filteredOrders.map((order) => (
              <div key={order.id} className="ml-card ml-farmer-order-card">
                {/* Header */}
                <div className="ml-farmer-card-top">
                  <div>
                    <span className="ml-order-badge-code">#{order.orderCode}</span>
                    <span className="ml-order-badge-date">Ngày nhận: {order.pickupDate}</span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Customer Contact */}
                <div className="ml-farmer-customer-box">
                  <div className="ml-customer-avatar">👤</div>
                  <div className="ml-customer-details">
                    <div className="ml-customer-name">{order.customerName}</div>
                    <div className="ml-customer-phone">📞 {order.customerPhone}</div>
                  </div>
                  <div className="ml-session-tag">
                    ⏰ {order.pickupSessionLabel}
                  </div>
                </div>

                {/* Items */}
                <div className="ml-farmer-items-wrap">
                  <div className="ml-farmer-items-label">Mặt hàng cần soạn:</div>
                  <ul className="ml-farmer-items-list">
                    {order.items.map((it, idx) => (
                      <li key={idx} className="ml-farmer-item-row">
                        <span className="ml-item-name">🥦 {it.name}</span>
                        <span className="ml-item-qty">
                          <strong>{it.qty} {it.unit}</strong> ({formatCurrency(it.price * it.qty)})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Note */}
                {order.note && (
                  <div className="ml-farmer-order-note">
                    📝 <strong>Dặn dò của khách:</strong> {order.note}
                  </div>
                )}

                {/* Footer and Actions */}
                <div className="ml-farmer-card-footer">
                  <div className="ml-farmer-total">
                    <span className="ml-total-txt">Thu tại sạp ({order.paymentMethod === 'VNPAY' ? 'Đã thanh toán VNPay' : 'Tiền mặt tại sạp'}):</span>
                    <span className="ml-total-val">{formatCurrency(order.totalAmount)}</span>
                  </div>

                  <div className="ml-farmer-action-buttons">
                    {(order.status === 'PENDING' || order.status === 'PLACED') && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                        >
                          ✓ Tiếp nhận đơn
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-danger-text"
                          onClick={() => setDeclineModal({
                            isOpen: true,
                            orderId: order.id,
                            orderCode: order.orderCode,
                            reason: 'Rau đã hết đợt hái sớm trong ngày'
                          })}
                        >
                          ✕ Hết hàng
                        </Button>
                      </>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                      >
                        📦 Đã gói xong tại sạp
                      </Button>
                    )}

                    {order.status === 'READY_FOR_PICKUP' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      >
                        💰 Khách đã nhận & trả tiền
                      </Button>
                    )}

                    {order.status === 'COMPLETED' && (
                      <span className="ml-done-label">✓ Giao dịch thành công</span>
                    )}

                    {(order.status === 'DECLINED' || order.status === 'CANCELLED') && (
                      <span className="ml-cancelled-label">✕ Đã đóng</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {declineModal.isOpen && (
        <div className="ml-modal-overlay">
          <div className="ml-modal-box">
            <div className="ml-modal-header">
              <h3>Từ chối đơn hàng #{declineModal.orderCode}</h3>
              <button
                type="button"
                className="ml-modal-close"
                onClick={() => setDeclineModal({ isOpen: false, orderId: null, orderCode: '', reason: '' })}
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmDecline} className="ml-modal-form">
              <p className="ml-modal-tip">
                Vui lòng cung cấp lý do để hệ thống thông báo kịp thời cho khách hàng đặt trước.
              </p>

              <div className="ml-form-group">
                <label className="ml-form-label">Lý do từ chối:</label>
                <select
                  className="ml-form-input"
                  value={declineModal.reason}
                  onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
                  required
                >
                  <option value="Rau đã hết đợt hái sớm trong ngày">Rau đã hết đợt hái sớm trong ngày</option>
                  <option value="Thời tiết mưa bão không kịp thu hoạch">Thời tiết mưa bão không kịp thu hoạch</option>
                  <option value="Sản lượng không đạt chất lượng tươi ngon cam kết">Sản lượng không đạt chất lượng tươi ngon cam kết</option>
                  <option value="Khung giờ nhận không kịp chuẩn bị">Khung giờ nhận không kịp chuẩn bị</option>
                </select>
              </div>

              <div className="ml-modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeclineModal({ isOpen: false, orderId: null, orderCode: '', reason: '' })}
                >
                  Quay lại
                </Button>
                <Button type="submit" variant="primary" className="btn-danger-text">
                  Xác nhận từ chối
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
