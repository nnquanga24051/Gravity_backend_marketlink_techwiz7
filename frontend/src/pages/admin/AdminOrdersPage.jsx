import React, { useState, useEffect } from 'react';
import './AdminOrdersPage.css';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import adminService from '../../services/adminService';

export default function AdminOrdersPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMarketFilter, setSelectedMarketFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Selected Order for Modal Detail
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load orders for admin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Compute Unique Markets for filter dropdown
  const uniqueMarkets = Array.from(new Set(orders.map((o) => o.marketName).filter(Boolean)));

  // KPIs
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.orderStatus === 'COMPLETED');
  const readyOrders = orders.filter((o) => o.orderStatus === 'READY_FOR_PICKUP');
  const pendingOrders = orders.filter((o) => o.orderStatus === 'PLACED' || o.orderStatus === 'ACCEPTED');
  const totalGMV = completedOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Filtered List
  const filteredOrders = orders.filter((o) => {
    // Status tab
    if (activeTab === 'PENDING' && o.orderStatus !== 'PLACED' && o.orderStatus !== 'ACCEPTED') return false;
    if (activeTab === 'READY_FOR_PICKUP' && o.orderStatus !== 'READY_FOR_PICKUP') return false;
    if (activeTab === 'COMPLETED' && o.orderStatus !== 'COMPLETED') return false;
    if (activeTab === 'CANCELLED' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'DECLINED') return false;

    // Market filter
    if (selectedMarketFilter !== 'ALL' && o.marketName !== selectedMarketFilter) return false;

    // Date filter
    if (selectedDateFilter && o.pickupDate !== selectedDateFilter) return false;

    // Search keyword
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchCode = o.orderCode && o.orderCode.toLowerCase().includes(kw);
      const matchCust = o.customerName && o.customerName.toLowerCase().includes(kw);
      const matchPhone = o.customerPhone && o.customerPhone.includes(kw);
      const matchFarmer = o.farmerName && o.farmerName.toLowerCase().includes(kw);
      const matchStall = o.stallName && o.stallName.toLowerCase().includes(kw);
      if (!matchCode && !matchCust && !matchPhone && !matchFarmer && !matchStall) return false;
    }

    return true;
  });

  const renderOrderStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
        return <Badge variant="neutral" dot>Chờ sạp tiếp nhận</Badge>;
      case 'ACCEPTED':
        return <Badge variant="pending" dot>Sạp đã tiếp nhận</Badge>;
      case 'READY_FOR_PICKUP':
        return <Badge variant="accent" dot>Đã sẵn sàng tại sạp</Badge>;
      case 'COMPLETED':
        return <Badge variant="ready" dot>Hoàn tất nhận hàng</Badge>;
      case 'DECLINED':
        return <Badge variant="cancelled" dot>Sạp từ chối</Badge>;
      case 'CANCELLED':
        return <Badge variant="cancelled" dot>Đã hủy đơn</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="ml-admin-orders-page">
      {/* Banner */}
      <div className="ml-admin-orders-banner">
        <div className="ml-container ml-admin-orders-banner-inner">
          <div>
            <span className="ml-section-subtitle" style={{ color: '#86efac' }}>
              Ban Quản Trị Hệ Thống MarketLink
            </span>
            <h1 className="ml-admin-orders-title">Giám Sát Đơn Đặt Trước Toàn Sàn</h1>
            <p className="ml-admin-orders-desc">
              Theo dõi toàn bộ luồng đơn hàng đặt trước nông sản tại các phiên chợ, tình trạng chuẩn bị tại sạp và giải quyết khiếu nại giữa các bên.
            </p>
          </div>

          <div className="ml-admin-orders-stats-strip">
            <div className="ml-admin-stat-pill">
              <span className="ml-admin-stat-num">{totalOrders}</span>
              <span className="ml-admin-stat-lbl">Tổng đơn hàng</span>
            </div>
            <div className="ml-admin-stat-pill">
              <span className="ml-admin-stat-num" style={{ color: '#fde047' }}>{pendingOrders.length}</span>
              <span className="ml-admin-stat-lbl">Chờ chuẩn bị</span>
            </div>
            <div className="ml-admin-stat-pill">
              <span className="ml-admin-stat-num" style={{ color: '#4ade80' }}>{formatCurrency(totalGMV)}</span>
              <span className="ml-admin-stat-lbl">Doanh thu giao dịch</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-container ml-admin-orders-content">
        {/* Navigation & Status Filter Tabs */}
        <div className="ml-inv-main-tabs" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            📋 Tất cả đơn ({orders.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            ⏳ Chờ chuẩn bị ({pendingOrders.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'READY_FOR_PICKUP' ? 'active' : ''}`}
            onClick={() => setActiveTab('READY_FOR_PICKUP')}
          >
            📦 Sẵn sàng tại sạp ({readyOrders.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            ✅ Đã hoàn tất ({completedOrders.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CANCELLED')}
          >
            🚫 Hủy / Từ chối ({orders.filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'DECLINED').length})
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="ml-card ml-mod-controls" style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label className="ml-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Tìm kiếm đơn hàng:</label>
              <input
                type="text"
                className="ml-form-input"
                placeholder="Mã đơn, Tên khách, SĐT, Nhà vườn..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            <div>
              <label className="ml-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Điểm chợ phiên:</label>
              <select
                className="ml-form-select"
                value={selectedMarketFilter}
                onChange={(e) => setSelectedMarketFilter(e.target.value)}
              >
                <option value="ALL">Tất cả điểm chợ ({uniqueMarkets.length})</option>
                {uniqueMarkets.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="ml-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Ngày hẹn nhận hàng:</label>
              <input
                type="date"
                className="ml-form-input"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => {
                  setSearchKeyword('');
                  setSelectedMarketFilter('ALL');
                  setSelectedDateFilter('');
                  loadOrders();
                }}
              >
                🔄 Đặt lại bộ lọc
              </Button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="ml-inv-loading">Đang nạp toàn bộ đơn hàng hệ thống...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="ml-card" style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            Không tìm thấy đơn đặt trước nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="ml-card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Mã đơn & Thời gian</th>
                  <th style={{ padding: '12px 16px' }}>Khách hàng</th>
                  <th style={{ padding: '12px 16px' }}>Sạp hàng & Nhà vườn</th>
                  <th style={{ padding: '12px 16px' }}>Chợ & Ca nhận hàng</th>
                  <th style={{ padding: '12px 16px' }}>Tổng tiền</th>
                  <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.orderId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1b5e20' }}>{o.orderCode}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>
                        {o.createdAt ? o.createdAt.replace('T', ' ').substring(0, 16) : ''}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{o.customerName}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>📞 {o.customerPhone || 'N/A'}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>🏡 {o.stallName || o.farmerName}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Chủ sạp: {o.farmerName}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#1e293b', fontWeight: 500 }}>🎪 {o.marketName}</div>
                      <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                        📅 {o.pickupDate} • 🕒 {o.slotTimeRange || '08:00 - 09:00'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{formatCurrency(o.totalAmount)}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {o.paymentMethod === 'PAY_AT_PICKUP' ? '💵 Trả tại sạp' : o.paymentMethod}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {renderOrderStatusBadge(o.orderStatus)}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(o)}
                      >
                        👁️ Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: ORDER DETAIL (CHI TIẾT ĐƠN HÀNG)
          ======================================================== */}
      {isDetailModalOpen && selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Chi Tiết Đơn Đặt Trước: ${selectedOrder.orderCode}`}
          subtitle={`Đặt lúc: ${selectedOrder.createdAt ? selectedOrder.createdAt.replace('T', ' ').substring(0, 16) : ''}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 13 }}>
              <div><strong>Khách hàng:</strong> {selectedOrder.customerName} (📞 {selectedOrder.customerPhone || 'N/A'})</div>
              <div><strong>Gian hàng:</strong> {selectedOrder.stallName || selectedOrder.farmerName}</div>
              <div><strong>Điểm chợ:</strong> {selectedOrder.marketName}</div>
              <div><strong>Hẹn nhận:</strong> {selectedOrder.pickupDate} ({selectedOrder.slotTimeRange})</div>
              <div><strong>Hạn chốt đơn:</strong> {selectedOrder.cutoffTime ? selectedOrder.cutoffTime.replace('T', ' ').substring(0, 16) : 'Không'}</div>
              <div><strong>Trạng thái:</strong> {renderOrderStatusBadge(selectedOrder.orderStatus)}</div>
            </div>

            {/* Note from customer */}
            {selectedOrder.note && (
              <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', padding: 10, borderRadius: 6, fontSize: 13, color: '#854d0e' }}>
                💬 <strong>Ghi chú từ khách hàng:</strong> "{selectedOrder.note}"
              </div>
            )}

            {/* Order Items Table */}
            <div className="ml-card" style={{ padding: 12 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#166534' }}>
                🥬 Danh sách mặt hàng đặt trước ({selectedOrder.items?.length || 0} sản phẩm):
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={it.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120'}
                        alt={it.productName}
                        style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{it.productName}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {formatCurrency(it.unitPrice)} / {it.productUnit || 'kg'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        x {it.quantity} {it.productUnit || 'kg'}
                      </div>
                      <div style={{ fontWeight: 700, color: '#166534' }}>
                        {formatCurrency(it.subtotal || it.quantity * it.unitPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #e2e8f0', marginTop: 12, paddingTop: 10, fontSize: 16 }}>
                <strong>Tổng thanh toán tại sạp:</strong>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#1b5e20' }}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>
                Đóng lại
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
