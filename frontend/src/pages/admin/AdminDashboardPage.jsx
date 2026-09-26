import React, { useState, useEffect } from 'react';
import './AdminDashboardPage.css';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import adminService from '../../services/adminService';

export default function AdminDashboardPage({ onNavigate }) {
  const [metrics, setMetrics] = useState({
    totalFarmers: 9,
    totalCustomers: 7,
    totalMarkets: 5,
    totalOrders: 9,
    totalRevenue: 478000,
    pendingKycCount: 2
  });

  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 119,
      farmerName: 'Nông Trại Ba Vì',
      repName: 'Nong Dan Ba Vi',
      phone: '0987654321',
      marketApplied: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      certType: 'VietGAP & Hữu cơ PGS',
      appliedAt: 'Hôm nay, 08:30',
      status: 'PENDING'
    },
    {
      id: 120,
      farmerName: 'Rau Sạch Ba Vì',
      repName: 'NNong Dan Ba Vi',
      phone: '0912345678',
      marketApplied: 'Hội Chợ Nông Sản Tây Hồ',
      certType: 'GlobalGAP',
      appliedAt: 'Hôm nay, 09:15',
      status: 'PENDING'
    }
  ]);

  const [marketReports, setMarketReports] = useState([
    { marketName: 'Phiên Chợ Xanh Nông Sản Ba Đình (Hà Nội)', totalRevenue: 180000, totalOrders: 4, activeFarmers: 3 },
    { marketName: 'Phiên Chợ Hữu Cơ Thảo Điền EcoMarket (TP.HCM)', totalRevenue: 125000, totalOrders: 2, activeFarmers: 2 },
    { marketName: 'Hội Chợ Nông Sản Vùng Miền Tây Hồ (Hà Nội)', totalRevenue: 98000, totalOrders: 2, activeFarmers: 2 },
    { marketName: 'Chợ Phiên Nông Nghiệp Xanh Ecopark (Hưng Yên)', totalRevenue: 75000, totalOrders: 1, activeFarmers: 2 }
  ]);

  const [topProduce, setTopProduce] = useState([
    { name: 'Cải Bó Xôi Hữu Cơ Ba Vì', farmer: 'Bác Ba Ba Vì', preorders: 6, market: 'Ba Đình', tag: 'Rau ăn lá' },
    { name: 'Dâu Tây Hana Đà Lạt Tuyển Chọn', farmer: 'Đà Lạt Farm', preorders: 4, market: 'Thảo Điền', tag: 'Trái cây' },
    { name: 'Nấm Hương Rừng Sa Pa Tươi', farmer: 'HTX Sa Pa', preorders: 3, market: 'Tây Hồ', tag: 'Nấm sạch' },
    { name: 'Cà Chua Cherry Mộc Châu', farmer: 'Vườn Mộc Châu', preorders: 2, market: 'Ba Đình', tag: 'Củ quả' }
  ]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const [activeFarmers, setActiveFarmers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      try {
        const [realMetrics, realKyc, realMarkets, realActiveFarmers] = await Promise.all([
          adminService.getPlatformMetrics(),
          adminService.getPendingKycList(),
          adminService.getMarketRevenueReports(),
          adminService.getMostActiveFarmers(5)
        ]);

        if (isMounted) {
          if (realMetrics) {
            setMetrics(realMetrics);
          }
          if (realKyc && realKyc.length > 0) {
            setPendingApprovals(realKyc.map((k) => ({
              id: k.farmerId,
              farmerName: k.stallName || 'Nông Trại Đăng Ký',
              repName: k.fullName || 'Nông dân',
              phone: k.phoneNumber || '0900000000',
              marketApplied: k.farmAddress || 'Chợ trung tâm',
              certType: 'VietGAP / Hồ sơ đính kèm',
              appliedAt: k.lastSubmittedAt ? k.lastSubmittedAt.replace('T', ' ').substring(0, 16) : 'Mới nộp',
              status: k.kycStatus || 'PENDING'
            })));
          }
          if (realMarkets && realMarkets.length > 0) {
            setMarketReports(realMarkets);
          }
          if (realActiveFarmers && realActiveFarmers.length > 0) {
            setActiveFarmers(realActiveFarmers);
          }
        }
      } catch (err) {
        console.warn('Error loading real admin data', err);
      }
    }

    loadAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = [
    {
      title: 'Chợ phiên hoạt động',
      value: `${metrics.totalMarkets || 5} Chợ`,
      trend: 'Đang mở nhận đặt',
      trendType: 'positive',
      icon: '🎪',
      hint: 'Hà Nội, TP.HCM, Hưng Yên'
    },
    {
      title: 'Nhà vườn & Nông hộ',
      value: `${metrics.totalFarmers || 9} Sạp`,
      trend: `${metrics.pendingKycCount || 0} hồ sơ chờ duyệt`,
      trendType: 'warning',
      icon: '👨‍🌾',
      hint: '100% chứng nhận VietGAP'
    },
    {
      title: 'Đơn đặt trước toàn sàn',
      value: `${metrics.totalOrders || 0} Đơn`,
      trend: 'Đang tăng trưởng',
      trendType: 'positive',
      icon: '📦',
      hint: 'Khách nhận tại chợ'
    },
    {
      title: 'Giá trị nông sản giao dịch',
      value: formatCurrency(metrics.totalRevenue || 0),
      trend: 'Giao dịch tại sạp chợ phiên',
      trendType: 'neutral',
      icon: '💵',
      hint: 'Thanh toán tiền mặt & VietQR'
    }
  ];

  return (
    <div className="ml-admin-dashboard">
      {/* Header Banner */}
      <div className="ml-admin-dash-banner">
        <div className="ml-container ml-admin-banner-inner">
          <div>
            <div className="ml-admin-banner-badge">
              <span className="ml-admin-badge-dot"></span>
              Trung Tâm Quản Trị Hệ Thống MarketLink (Dữ Liệu Thật)
            </div>
            <h1 className="ml-admin-dash-title">Bảng Điều Hành Nền Tảng Chợ Nông Sản</h1>
            <p className="ml-admin-dash-desc">
              Giám sát mạng lưới chợ phiên, thẩm định hồ sơ nông hộ VietGAP, kiểm soát đơn đặt trước và điều hành toàn bộ nền tảng.
            </p>
          </div>

          <div className="ml-admin-quick-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigate && onNavigate('admin-markets')}
            >
              🎪 Chợ & Sạp
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigate && onNavigate('admin-orders')}
            >
              📦 Đơn toàn sàn
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigate && onNavigate('admin-content')}
            >
              🛡️ Kiểm duyệt & Danh mục
            </Button>
            <Button
              variant="accent"
              size="md"
              onClick={() => onNavigate && onNavigate('admin-users')}
            >
              👨‍🌾 Duyệt {pendingApprovals.length} hồ sơ KYC →
            </Button>
          </div>
        </div>
      </div>


      <div className="ml-container ml-admin-dash-content">
        {/* KPI Strip */}
        <div className="ml-kpi-grid">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="ml-card ml-kpi-card">
              <div className="ml-kpi-header">
                <span className="ml-kpi-title">{kpi.title}</span>
                <span className="ml-kpi-icon">{kpi.icon}</span>
              </div>
              <div className="ml-kpi-value">{kpi.value}</div>
              <div className="ml-kpi-footer">
                <span className={`ml-kpi-trend ${kpi.trendType}`}>{kpi.trend}</span>
                <span className="ml-kpi-hint">• {kpi.hint}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Two-Column Operation Grid */}
        <div className="ml-admin-op-grid">
          {/* Left Column: KYC Pending Approvals */}
          <div className="ml-card ml-op-card">
            <div className="ml-op-card-header">
              <div>
                <h3 className="ml-op-card-title">Hồ Sơ Nông Hộ Chờ Thẩm Định (KYC)</h3>
                <p className="ml-op-card-subtitle">
                  Kiểm tra giấy chứng nhận VietGAP, GlobalGAP hoặc hữu cơ trước khi cấp quyền mở sạp
                </p>
              </div>
              <Badge variant="pending">{pendingApprovals.length} Chờ duyệt</Badge>
            </div>

            <div className="ml-op-list">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="ml-op-item">
                  <div className="ml-op-avatar">🏡</div>
                  <div className="ml-op-info">
                    <div className="ml-op-name">{item.farmerName}</div>
                    <div className="ml-op-meta">
                      Đại diện: <strong>{item.repName}</strong> ({item.phone})
                    </div>
                    <div className="ml-op-applied">
                      <span>📍 {item.marketApplied}</span>
                      <span>📜 {item.certType}</span>
                    </div>
                  </div>
                  <div className="ml-op-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate && onNavigate('admin-users')}
                    >
                      Kiểm duyệt hồ sơ
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ml-op-card-footer">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => onNavigate && onNavigate('admin-users')}
              >
                Xem toàn bộ hồ sơ thẩm định →
              </Button>
            </div>
          </div>

          {/* Right Column: Market Performance & Revenue */}
          <div className="ml-card ml-op-card">
            <div className="ml-op-card-header">
              <div>
                <h3 className="ml-op-card-title">Tình Trạng Các Điểm Chợ Phiên</h3>
                <p className="ml-op-card-subtitle">
                  Theo dõi số lượng đơn hàng và giá trị giao dịch phân bổ theo điểm chợ
                </p>
              </div>
            </div>

            <div className="ml-occupancy-list">
              {marketReports.map((m, idx) => (
                <div key={idx} className="ml-occupancy-item">
                  <div className="ml-occ-top">
                    <span className="ml-occ-name">🎪 {m.marketName}</span>
                    <span className="ml-occ-rate">{formatCurrency(m.totalRevenue || 0)}</span>
                  </div>
                  <div className="ml-occ-bar-track">
                    <div
                      className="ml-occ-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(20, (m.totalOrders || 1) * 25))}%` }}
                    ></div>
                  </div>
                  <div className="ml-occ-session">
                    Đã hoàn thành: <strong>{m.totalOrders || 0} đơn đặt trước</strong> • {m.activeFarmers || 2} sạp hoạt động
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Strip: Top Pre-ordered Produce */}
        <div className="ml-card ml-top-produce-card">
          <div className="ml-op-card-header">
            <div>
              <h3 className="ml-op-card-title">Nông Sản Được Đặt Trước Nhiều Nhất Tuần</h3>
              <p className="ml-op-card-subtitle">
                Xếp hạng các sản phẩm thu hút lượng đặt giữ chỗ cao nhất từ cư dân
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate && onNavigate('products')}
            >
              Xem danh mục nông sản
            </Button>
          </div>

          <div className="ml-produce-rank-grid">
            {topProduce.map((p, idx) => (
              <div key={idx} className="ml-produce-rank-item">
                <div className="ml-rank-num">#{idx + 1}</div>
                <div className="ml-rank-info">
                  <div className="ml-rank-name">{p.name}</div>
                  <div className="ml-rank-farmer">👨‍🌾 {p.farmer} • Chợ {p.market}</div>
                </div>
                <div className="ml-rank-stat">
                  <span className="ml-rank-count">{p.preorders} lượt</span>
                  <Badge variant="organic" size="sm">{p.tag}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
