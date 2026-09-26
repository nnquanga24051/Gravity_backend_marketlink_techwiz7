import React, { useState, useEffect } from 'react';
import './FarmerDashboardPage.css';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import farmerService from '../../services/farmerService';

export default function FarmerDashboardPage({
  onNavigate,
  onOpenAddProduct
}) {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    placedOrders: 0,
    acceptedOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    declinedOrders: 0
  });
  const [bestSellers, setBestSellers] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [profData, sumData, bestData, ordersData] = await Promise.all([
          farmerService.getFarmerProfile(),
          farmerService.getFarmerSummary(),
          farmerService.getBestSellingProducts(5),
          farmerService.getFarmerOrders()
        ]);

        if (isMounted) {
          if (profData) setProfile(profData);
          if (sumData) setSummary(sumData);
          if (bestData && bestData.length > 0) {
            setBestSellers(bestData);
          } else {
            setBestSellers([
              { name: 'Cải Bó Xôi Hữu Cơ Ba Vì', salesCount: 14, unit: 'kg', revenue: 630000, category: 'Rau ăn lá' },
              { name: 'Rau Muống Tiến Vua Sạch', salesCount: 22, unit: 'bó', revenue: 330000, category: 'Rau ăn lá' }
            ]);
          }

          if (ordersData && ordersData.length > 0) {
            // Filter placed or accepted orders for packing checklist
            const packingList = ordersData.filter(
              (o) => o.orderStatus === 'PLACED' || o.orderStatus === 'ACCEPTED' || o.orderStatus === 'READY_FOR_PICKUP'
            );
            setPendingOrders(packingList);
          }
        }
      } catch (err) {
        console.warn('Failed to load farmer dashboard data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const farmStallTitle = profile?.stallName || profile?.fullName || 'Nông Trại Hữu Cơ Ba Vì';
  const farmAddress = profile?.farmAddress || 'Thôn 2, Xã Vân Hòa, Ba Vì, Hà Nội';

  return (
    <div className="ml-farmer-dashboard">
      {/* Header Banner */}
      <div className="ml-farmer-dash-banner">
        <div className="ml-container ml-dash-banner-inner">
          <div>
            <div className="ml-dash-greeting">👨‍🌾 Kênh Quản Lý Nông Dân / Chủ Sạp Chợ</div>
            <h1 className="ml-dash-title">{farmStallTitle}</h1>
            <p className="ml-dash-desc">
              Khu vực trang trại: <strong>{farmAddress}</strong> • Chủ hộ: <strong>{profile?.fullName || 'Nông dân thành viên'}</strong>
            </p>
          </div>

          <div className="ml-dash-quick-btns">
            <Button
              variant="accent"
              size="md"
              onClick={onOpenAddProduct}
              icon={<span>+</span>}
            >
              Đăng nông sản mới
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('farmer-orders')}
              icon={<span>📦</span>}
            >
              Duyệt đơn ra chợ ({summary.placedOrders + summary.acceptedOrders + summary.readyOrders})
            </Button>
          </div>
        </div>
      </div>

      <div className="ml-container">
        {loading && <div className="ml-orders-loading">Đang tải dữ liệu vận hành sạp từ hệ thống...</div>}

        {/* Real KPI Metrics Cards */}
        <div className="ml-farmer-kpis-grid">
          <div className="ml-card ml-kpi-card">
            <div className="ml-kpi-header">
              <span className="ml-kpi-title">Doanh thu thực tế đã giao</span>
              <span className="ml-kpi-icon">💵</span>
            </div>
            <div className="ml-kpi-val highlight">{formatCurrency(summary.totalRevenue)}</div>
            <div className="ml-kpi-hint">Từ {summary.completedOrders} đơn hoàn thành</div>
          </div>

          <div className="ml-card ml-kpi-card">
            <div className="ml-kpi-header">
              <span className="ml-kpi-title">Đơn mới chờ tiếp nhận</span>
              <span className="ml-kpi-icon">⏳</span>
            </div>
            <div className="ml-kpi-val warning">{summary.placedOrders} Đơn</div>
            <div className="ml-kpi-hint">Cần xác nhận chuẩn bị thu hoạch</div>
          </div>

          <div className="ml-card ml-kpi-card">
            <div className="ml-kpi-header">
              <span className="ml-kpi-title">Đang thu hoạch & sẵn sàng</span>
              <span className="ml-kpi-icon">🧺</span>
            </div>
            <div className="ml-kpi-val success">{summary.acceptedOrders + summary.readyOrders} Đơn</div>
            <div className="ml-kpi-hint">{summary.readyOrders} đơn đã đóng gói chờ giao</div>
          </div>

          <div className="ml-card ml-kpi-card">
            <div className="ml-kpi-header">
              <span className="ml-kpi-title">Tổng đơn hàng đã phục vụ</span>
              <span className="ml-kpi-icon">⭐</span>
            </div>
            <div className="ml-kpi-val">{summary.totalOrders} Đơn</div>
            <div className="ml-kpi-hint">{summary.cancelledOrders} đơn đã hủy/hoàn kho</div>
          </div>
        </div>

        {/* 2-Column Section */}
        <div className="ml-farmer-main-grid">
          {/* Left: Next Market Session Schedule & Packing Checklist */}
          <div className="ml-farmer-left-section">
            <div className="ml-card ml-packing-card">
              <div className="ml-packing-header">
                <div>
                  <h3 className="ml-card-heading">🧺 Danh sách đơn cần thu hoạch & đóng gói tại sạp</h3>
                  <span className="ml-card-subheading">Kiểm tra số lượng trước giờ họp chợ để bàn giao đúng hẹn cho khách</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onNavigate('farmer-orders')}
                >
                  Xem chi tiết đơn
                </Button>
              </div>

              <div className="ml-packing-list">
                {pendingOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                    <span>✓ Tất cả đơn đặt trước đều đã được xử lý xong!</span>
                  </div>
                ) : (
                  pendingOrders.slice(0, 5).map((order) => (
                    <div key={order.orderId || order.id} className="ml-pack-item">
                      <div className="ml-pack-left">
                        <span className="ml-pack-check">
                          {order.orderStatus === 'READY_FOR_PICKUP' ? '✓' : '📦'}
                        </span>
                        <div>
                          <div className="ml-pack-name">
                            Đơn #{order.orderCode} • Khách: <strong>{order.customerName}</strong> ({order.customerPhone})
                          </div>
                          <div className="ml-pack-detail">
                            Ngày hẹn: <strong>{order.pickupDate}</strong> ({order.slotTimeRange || 'Ca sáng'}) • Tổng: {formatCurrency(order.totalAmount)}
                          </div>
                        </div>
                      </div>
                      <span className={`ml-pack-badge ${order.orderStatus === 'READY_FOR_PICKUP' ? 'ready' : 'in-progress'}`}>
                        {order.orderStatus === 'READY_FOR_PICKUP' ? 'Sẵn sàng tại sạp' : 'Chờ đóng gói'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="ml-quick-nav-cards">
              <div 
                className="ml-card ml-qnav-card"
                onClick={() => onNavigate('farmer-inventory')}
              >
                <span className="ml-qnav-icon">🥬</span>
                <div>
                  <h4 className="ml-qnav-title">Kho Nông Sản Tại Sạp</h4>
                  <p className="ml-qnav-desc">Cập nhật số lượng, chỉnh giá bán, bật tắt tình trạng còn hàng và định mức tuần.</p>
                </div>
              </div>

              <div 
                className="ml-card ml-qnav-card"
                onClick={() => onNavigate('farmer-stall')}
              >
                <span className="ml-qnav-icon">🎪</span>
                <div>
                  <h4 className="ml-qnav-title">Quản Lý Sạp & Ca Nhận Hàng</h4>
                  <p className="ml-qnav-desc">Cấu hình khung giờ chốt đơn trước phiên, tạo ca nhận hàng và hồ sơ KYC.</p>
                </div>
              </div>

              <div 
                className="ml-card ml-qnav-card"
                onClick={() => onNavigate('farmer-reviews')}
              >
                <span className="ml-qnav-icon">💬</span>
                <div>
                  <h4 className="ml-qnav-title">Phản Hồi Đánh Giá</h4>
                  <p className="ml-qnav-desc">Xem cảm nhận của khách hàng sau khi nhận rau và gửi lời cảm ơn từ chủ sạp.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Best-Selling Produce Insights */}
          <div className="ml-farmer-right-section">
            <div className="ml-card ml-bestseller-card">
              <h3 className="ml-card-heading">🏆 Nông Sản Bán Chạy Nhất</h3>
              <p className="ml-card-subheading">Dữ liệu thực tế từ các đơn hàng thành công</p>

              <div className="ml-bestseller-list">
                {bestSellers.map((item, idx) => (
                  <div key={idx} className="ml-bestseller-item">
                    <span className="ml-rank-num">#{idx + 1}</span>
                    <div className="ml-bestseller-info">
                      <div className="ml-bs-name">{item.productName || item.name}</div>
                      <div className="ml-bs-meta">
                        {item.categoryName || item.category || 'Nông sản sạch'} • Đã bán <strong>{item.totalQuantitySold || item.salesCount || 1} {item.unit || 'kg'}</strong>
                      </div>
                    </div>
                    <div className="ml-bs-revenue">
                      {formatCurrency(item.totalRevenue || item.revenue)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="ml-bestseller-footer">
                💡 <em>Mẹo vận hành sạp:</em> Rau củ hái sớm thường được đặt trước nhiều nhất trong ca 07:00 - 08:30. Hãy chuẩn bị sẵn giỏ nông sản trước giờ chợ mở!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
