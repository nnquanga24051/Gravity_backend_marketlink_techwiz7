import React, { useState, useEffect, useRef } from 'react';
import './HomePage.css';
import MarketCard from '../components/customer/MarketCard';
import ProductCard from '../components/customer/ProductCard';
import MarketDetailModal from '../components/customer/MarketDetailModal';
import MarketStallsModal from '../components/customer/MarketStallsModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import marketService from '../services/marketService';
import productService from '../services/productService';
import announcementService from '../services/announcementService';
import { matchSearch, POPULAR_PRODUCT_KEYWORDS } from '../utils/searchUtils';
import { formatImageUrl } from '../services/apiClient';

export default function HomePage({
  onAddToCart,
  cartItems = [],
  onUpdateCartQty,
  onNavigate,
  onSelectMarketProducts,
  onOpenFarmerRegister
}) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedMarketDay, setSelectedMarketDay] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [marketCityFilter, setMarketCityFilter] = useState('all');

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementTab, setAnnouncementTab] = useState('all');
  const [readingAnnouncement, setReadingAnnouncement] = useState(null);

  useEffect(() => {
    let isMounted = true;
    announcementService.getActiveAnnouncements()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setAnnouncements(data);
        }
      })
      .catch((err) => console.warn('Could not load announcements', err));
    return () => { isMounted = false; };
  }, []);

  // Modals state
  const [scheduleMapMarket, setScheduleMapMarket] = useState(null);
  const [stallProductsMarket, setStallProductsMarket] = useState(null);

  // Markets State (Loaded from backend with curated fallbacks)
  const [markets, setMarkets] = useState([
    {
      id: 101,
      name: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      address: '12 Núi Trúc, Phường Giảng Võ, Ba Đình, Hà Nội',
      city: 'Hà Nội',
      distance: '1.2 km',
      operatingDays: 'Thứ 7 & Chủ Nhật',
      operatingHours: '06:00 - 11:30',
      stallsCount: 18,
      imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=700&q=80',
      tag: 'Chợ rau hữu cơ',
      verified: true,
      description: 'Chợ phiên cuối tuần quy tụ hơn 30 nhà vườn đạt chuẩn VietGAP và hữu cơ vùng Bắc Bộ.'
    },
    {
      id: 103,
      name: 'Phiên Chợ Hữu Cơ Thảo Điền EcoMarket',
      address: '28 Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      distance: '3.5 km',
      operatingDays: 'Thứ Bảy & Chủ Nhật',
      operatingHours: '07:00 - 12:00',
      stallsCount: 22,
      imageUrl: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=700&q=80',
      tag: 'Đặc sản hữu cơ Miền Tây',
      verified: true,
      description: 'Phiên chợ thực phẩm xanh, bánh men thủ công và trái cây hữu cơ miền Tây Nam Bộ.'
    },
    {
      id: 104,
      name: 'Hội Chợ Nông Sản Vùng Miền Tây Hồ',
      address: '614 Lạc Long Quân, P. Nhật Tân, Tây Hồ, Hà Nội',
      city: 'Hà Nội',
      distance: '2.1 km',
      operatingDays: 'Chủ Nhật hàng tuần',
      operatingHours: '06:30 - 11:30',
      stallsCount: 16,
      imageUrl: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=700&q=80',
      tag: 'Nông sản vùng cao',
      verified: true,
      description: 'Giao lưu nông sản đặc sản vùng cao Tây Bắc, mật ong rừng, gạo nương và hoa quả tươi.'
    }
  ]);

  // Products State (Loaded from backend with curated fallbacks)
  const [products, setProducts] = useState([
    {
      id: 101,
      name: 'Cải Bó Xôi Hữu Cơ Ba Vì',
      category: 'veg',
      categoryName: 'Rau Lá Hữu Cơ',
      price: 45000,
      unit: 'kg',
      farmerName: 'Nông Trại Hữu Cơ Ba Vì',
      stallCode: 'Sạp A-01',
      marketName: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      stockQuantity: 35,
      harvestTime: 'Thu hoạch 5h sáng',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
      organicCertified: true
    },
    {
      id: 106,
      name: 'Nấm Hương Rừng Sa Pa Tươi',
      category: 'specialty',
      categoryName: 'Nấm & Thảo Dược',
      price: 98000,
      unit: 'kg',
      farmerName: 'Hợp Tác Xã Dược Liệu & Nấm Sạch Sa Pa',
      stallCode: 'Sạp D-02',
      marketName: 'Hội Chợ Nông Sản Tây Hồ',
      stockQuantity: 20,
      harvestTime: 'Hái tự nhiên trên núi',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      organicCertified: true
    },
    {
      id: 104,
      name: 'Dâu Tây Hana Đà Lạt Tuyển Chọn',
      category: 'fruit',
      categoryName: 'Trái Cây Bản Địa',
      price: 125000,
      unit: 'hộp 500g',
      farmerName: 'Nông Sản Sạch Đà Lạt Farm',
      stallCode: 'Sạp C-05',
      marketName: 'Phiên Chợ Thảo Điền',
      stockQuantity: 30,
      harvestTime: 'Thu hái sáng sớm',
      imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
      organicCertified: true
    },
    {
      id: 103,
      name: 'Cà Chua Cherry Mộc Châu Ngọt Giòn',
      category: 'fruit_veg',
      categoryName: 'Củ & Quả Tươi Sạch',
      price: 35000,
      unit: 'hộp 500g',
      farmerName: 'Vườn Rau Sinh Thái Mộc Châu',
      stallCode: 'Sạp A-02',
      marketName: 'Phiên Chợ Xanh Ba Đình',
      stockQuantity: 45,
      harvestTime: 'Chín cây tự nhiên',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      organicCertified: true
    },
    {
      id: 102,
      name: 'Rau Muống Tiến Vua Sạch',
      category: 'veg',
      categoryName: 'Rau Lá Hữu Cơ',
      price: 15000,
      unit: 'bó',
      farmerName: 'Nông Trại Hữu Cơ Ba Vì',
      stallCode: 'Sạp A-01',
      marketName: 'Phiên Chợ Xanh Ba Đình',
      stockQuantity: 60,
      harvestTime: 'Cắt 4h30 sáng',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      organicCertified: true
    },
    {
      id: 105,
      name: 'Vải Thiều Thanh Hà Chính Gốc',
      category: 'fruit',
      categoryName: 'Trái Cây Bản Địa',
      price: 65000,
      unit: 'kg',
      farmerName: 'Hợp Tác Xã Vải & Cây Ăn Trái Hải Dương',
      stallCode: 'Sạp B-03',
      marketName: 'Hội Chợ Nông Sản Tây Hồ',
      stockQuantity: 80,
      harvestTime: 'Hái đúng độ chín',
      imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
      organicCertified: true
    }
  ]);

  // Server-Side Products Fetch & Search (Debounced, no client-side filtering)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const realProducts = await productService.getProducts({
          keyword: searchKeyword.trim(),
          categoryId: (activeCategory !== 'all' && !isNaN(activeCategory)) ? activeCategory : '',
          status: 'AVAILABLE'
        });

        if (isMounted) {
          if (realProducts && realProducts.length > 0) {
            setProducts(realProducts.map((p) => ({
              ...p,
              id: p.productId || p.id,
              name: p.name,
              categoryName: p.categoryName || 'Nông sản mùa vụ',
              price: p.price,
              unit: p.unit || 'kg',
              farmerName: p.farmerStallName || p.farmerName || 'Nông Trại Thành Viên',
              stallCode: p.stallCode || 'Sạp Tiêu Chuẩn',
              marketName: p.marketName || 'Phiên Chợ Nông Sản',
              stockQuantity: p.currentStock || p.stockQuantity || 25,
              harvestTime: p.harvestTime || 'Thu hoạch sáng sớm',
              imageUrl: p.imageUrl,
              organicCertified: true
            })));
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.warn('Failed to load server-filtered products for HomePage:', err);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchKeyword, activeCategory]);

  // Server-Side Markets Fetch & Search (Debounced, no client-side filtering)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        let cityParam = '';
        if (marketCityFilter === 'hanoi' || selectedArea === 'hanoi') cityParam = 'Hà Nội';
        else if (marketCityFilter === 'hcm' || selectedArea === 'hcm') cityParam = 'Hồ Chí Minh';
        else if (selectedArea === 'ecopark') cityParam = 'Hưng Yên';

        let dayParam = '';
        if (selectedMarketDay === 'sat') dayParam = 'Thứ 7';
        else if (selectedMarketDay === 'sun') dayParam = 'Chủ Nhật';

        const realMarkets = await marketService.getMarkets({
          city: cityParam,
          dayOfWeek: dayParam
        });

        if (isMounted) {
          if (realMarkets && realMarkets.length > 0) {
            setMarkets(realMarkets.map((m) => ({
              ...m,
              id: m.marketId || m.id,
              name: m.name,
              address: m.address,
              city: m.address && (m.address.includes('Hồ Chí Minh') || m.address.includes('Thủ Đức')) ? 'TP. Hồ Chí Minh' : 'Hà Nội',
              distance: '1.5 km',
              operatingDays: m.operatingDays || 'Thứ 7 & Chủ Nhật',
              operatingHours: m.operatingHours || '06:00 - 11:30',
              stallsCount: m.stallsCount || 15,
              imageUrl: formatImageUrl(m.imageUrl, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=700&q=80'),
              tag: m.tag || 'Chợ nông sản sinh thái',
              verified: true,
              description: m.description || 'Chợ phiên nông sản sạch chất lượng cao.'
            })));
          } else {
            setMarkets([]);
          }
        }
      } catch (err) {
        console.warn('Failed to load server-filtered markets for HomePage:', err);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [marketCityFilter, selectedArea, selectedMarketDay]);

  // IntersectionObserver for Smooth Scroll Reveal
  useEffect(() => {
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ml-reveal-visible');
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const revealElements = document.querySelectorAll('.ml-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [products, markets, activeCategory, marketCityFilter, selectedArea, selectedMarketDay]);

  // Products and Markets are filtered completely on backend server
  const filteredProducts = products;
  const displayedMarkets = markets;

  const getCartQty = (prodId) => {
    const found = cartItems.find((item) => item.id === prodId);
    return found ? found.quantity : 0;
  };

  const handleScrollToProducts = () => {
    const target = document.getElementById('seasonal-products');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickSearch = (keyword) => {
    setSearchKeyword(keyword);
    handleScrollToProducts();
  };

  return (
    <div className="ml-homepage">
      {/* ========================================================
          1. HERO SECTION
          ======================================================== */}
      <section className="ml-hero">
        <div className="ml-container ml-hero-container">
          <div className="ml-hero-content ml-reveal">
            <div className="ml-hero-badge">
              <span className="ml-hero-badge-dot"></span>
              <span>Sàn Nông Sản Địa Phương Đặt Trước</span>
            </div>

            <h1 className="ml-hero-title">
              Nông Sản Tươi Từ Vườn,<br />
              <span className="ml-title-highlight">Đặt Trước & Nhận Tại Chợ Sáng</span>
            </h1>

            <p className="ml-hero-desc">
              Kết nối trực tiếp người tiêu dùng với các nhà vườn tâm huyết. Đặt trước để sạp giữ phần rau củ ngon nhất, ra chợ kiểm tra độ tươi giòn rồi mới thanh toán tiền mặt hoặc chuyển khoản tại sạp.
            </p>
            {/* Hero CTA Action Buttons */}
            <div className="ml-hero-actions">
              <Button 
                variant="accent" 
                size="lg" 
                onClick={handleScrollToProducts}
              >
                🌾 Khám Phá Nông Sản
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => onNavigate && onNavigate('markets')}
              >
                🎪 Xem Các Phiên Chợ
              </Button>
            </div>

            {/* Quick Stat Highlights */}
            <div className="ml-hero-stats">
              <div className="ml-stat-item">
                <span className="ml-stat-num">{markets.length}+</span>
                <span className="ml-stat-label">Chợ phiên cuối tuần</span>
              </div>
              <div className="ml-stat-sep"></div>
              <div className="ml-stat-item">
                <span className="ml-stat-num">{products.length}+</span>
                <span className="ml-stat-label">Nông sản thu hoạch sớm</span>
              </div>
              <div className="ml-stat-sep"></div>
              <div className="ml-stat-item">
                <span className="ml-stat-num">100%</span>
                <span className="ml-stat-label">Thanh toán tại sạp</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Column (Zero overlap guaranteed) */}
          <div className="ml-hero-visual ml-reveal ml-stagger-2">
            <div className="ml-hero-img-frame">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                alt="Chợ Nông Sản Sạch MarketLink"
                className="ml-hero-main-img"
              />

              {/* Desktop Floating Badges */}
              <div className="ml-hero-floating-badge top">
                <div className="ml-float-icon-box green">
                  <span>🥕</span>
                </div>
                <div>
                  <div className="ml-float-title">Cắt lúc 4h30 sáng</div>
                  <div className="ml-float-subtitle">Tươi giòn nguyên sương sớm</div>
                </div>
              </div>

              <div className="ml-hero-floating-badge bottom">
                <div className="ml-float-icon-box amber">
                  <span>🛡️</span>
                </div>
                <div>
                  <div className="ml-float-title">VietGAP & Hữu cơ</div>
                  <div className="ml-float-subtitle">Kiểm định nguồn gốc rõ ràng</div>
                </div>
              </div>
            </div>

            {/* Mobile Benefit Badges (Shown neatly underneath photo on small screens) */}
            <div className="ml-hero-mobile-badges">
              <div className="ml-hero-floating-badge">
                <div className="ml-float-icon-box green">
                  <span>🥕</span>
                </div>
                <div>
                  <div className="ml-float-title">Cắt 4h30 sáng</div>
                  <div className="ml-float-subtitle">Tươi giòn sương sớm</div>
                </div>
              </div>

              <div className="ml-hero-floating-badge">
                <div className="ml-float-icon-box amber">
                  <span>🛡️</span>
                </div>
                <div>
                  <div className="ml-float-title">Chuẩn VietGAP</div>
                  <div className="ml-float-subtitle">Minh bạch nguồn gốc</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. TRUST & VALUE STRIP
          ======================================================== */}
      <section className="ml-trust-strip">
        <div className="ml-container">
          <div className="ml-trust-grid ml-reveal">
            <div className="ml-trust-item">
              <div className="ml-trust-icon">🌅</div>
              <div>
                <div className="ml-trust-title">Hái Trong Ngày</div>
                <div className="ml-trust-desc">Rau củ tươi vừa rời cành sáng sớm</div>
              </div>
            </div>

            <div className="ml-trust-item">
              <div className="ml-trust-icon">👨‍🌾</div>
              <div>
                <div className="ml-trust-title">Trực Tiếp Từ Nhà Vườn</div>
                <div className="ml-trust-desc">Không qua thương lái trung gian</div>
              </div>
            </div>

            <div className="ml-trust-item">
              <div className="ml-trust-icon">🧺</div>
              <div>
                <div className="ml-trust-title">Kiểm Tra Tại Sạp</div>
                <div className="ml-trust-desc">Ưng ý độ tươi mới gửi tiền thanh toán</div>
              </div>
            </div>

            <div className="ml-trust-item">
              <div className="ml-trust-icon">⚡</div>
              <div>
                <div className="ml-trust-title">Đặt Trước Giữ Chỗ</div>
                <div className="ml-trust-desc">Không lo hết hàng vào giờ cao điểm</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. HOW IT WORKS (3 Bước đơn giản)
          ======================================================== */}
      <section className="ml-how-it-works">
        <div className="ml-container">
          <div className="ml-section-header center ml-reveal">
            <span className="ml-section-subtitle">Quy trình đơn giản & an tâm</span>
            <h2 className="ml-section-title">Cách Thức Đặt Trước & Nhận Hàng Tại Chợ</h2>
            <p className="ml-section-desc">
              Không vận chuyển lưu kho dài ngày, nông sản đi thẳng từ luống vườn đến giỏ xách của bạn.
            </p>
          </div>

          <div className="ml-steps-grid">
            <div className="ml-step-card ml-reveal ml-stagger-1">
              <div className="ml-step-card-num">01</div>
              <div className="ml-step-icon-wrap">🥦</div>
              <span className="ml-step-badge">Bước 1</span>
              <h3 className="ml-step-title">Chọn sạp & đặt trước</h3>
              <p className="ml-step-desc">
                Xem lượng nông sản dự kiến hái cho phiên chợ tới. Chọn món bạn thích và giữ chỗ trước khi sạp đầy đơn.
              </p>
            </div>

            <div className="ml-step-card ml-reveal ml-stagger-2">
              <div className="ml-step-card-num">02</div>
              <div className="ml-step-icon-wrap">⏰</div>
              <span className="ml-step-badge">Bước 2</span>
              <h3 className="ml-step-title">Hẹn giờ ra chợ lấy</h3>
              <p className="ml-step-desc">
                Chọn ca nhận hàng (sáng sớm 06:30 - 08:30 hoặc 08:30 - 10:30) để người bán đóng gói sẵn phần riêng cho bạn.
              </p>
            </div>

            <div className="ml-step-card ml-reveal ml-stagger-3">
              <div className="ml-step-card-num">03</div>
              <div className="ml-step-icon-wrap">🤝</div>
              <span className="ml-step-badge">Bước 3</span>
              <h3 className="ml-step-title">Kiểm tra & trả tiền tại sạp</h3>
              <p className="ml-step-desc">
                Ghé sạp tận mắt ngắm rau quả tươi giòn, hài lòng mới gửi tiền mặt hoặc quét VietQR. Thảnh thơi dạo chợ phiên!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          ANNOUNCEMENTS & NEWS (Bản tin & Thông báo chợ phiên)
          ======================================================== */}
      {announcements && announcements.length > 0 && (
        <section className="ml-announcements-home-section" style={{ background: '#f8fafc', padding: '44px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div className="ml-container">
            <div className="ml-section-header with-action">
              <div>
                <span className="ml-section-subtitle">Thông báo từ Ban quản lý</span>
                <h2 className="ml-section-title">📢 Bản Tin & Sự Kiện Chợ Phiên</h2>
                <p className="ml-section-desc">
                  Lịch họp chợ, quy chuẩn nông sản sạch và các chính sách vận hành mới nhất.
                </p>
              </div>

              {/* Filter tabs */}
              <div className="ml-filter-tabs" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`ml-filter-tab ${announcementTab === 'all' ? 'active' : ''}`}
                  onClick={() => setAnnouncementTab('all')}
                >
                  Tất cả ({announcements.length})
                </button>
                <button
                  type="button"
                  className={`ml-filter-tab ${announcementTab === 'MARKET_EVENT' ? 'active' : ''}`}
                  onClick={() => setAnnouncementTab('MARKET_EVENT')}
                >
                  🎪 Sự kiện chợ
                </button>
                <button
                  type="button"
                  className={`ml-filter-tab ${announcementTab === 'POLICY' ? 'active' : ''}`}
                  onClick={() => setAnnouncementTab('POLICY')}
                >
                  📋 Chính sách
                </button>
                <button
                  type="button"
                  className={`ml-filter-tab ${announcementTab === 'GENERAL' ? 'active' : ''}`}
                  onClick={() => setAnnouncementTab('GENERAL')}
                >
                  📢 Tin chung
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
              {announcements
                .filter(a => announcementTab === 'all' || a.type === announcementTab)
                .slice(0, 3)
                .map((a) => (
                  <div
                    key={a.announcementId || a.id}
                    className="ml-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderLeft: a.priority === 'PINNED' ? '4px solid #f59e0b' : a.priority === 'URGENT' ? '4px solid #ef4444' : '4px solid #10b981',
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onClick={() => setReadingAnnouncement(a)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '3px 8px', borderRadius: 4 }}>
                          {a.type === 'MARKET_EVENT' ? '🎪 Sự kiện chợ' : a.type === 'POLICY' ? '📋 Chính sách' : a.type === 'MAINTENANCE' ? '⚙️ Bảo trì' : '📢 Tin chung'}
                        </span>
                        {a.priority === 'PINNED' && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: 4 }}>
                            📌 Ghim đầu
                          </span>
                        )}
                        {a.priority === 'URGENT' && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', background: '#fee2e2', padding: '2px 6px', borderRadius: 4 }}>
                            🚨 Khẩn cấp
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                        {a.title}
                      </h3>

                      <p style={{
                        fontSize: 13.5,
                        color: '#64748b',
                        lineHeight: 1.55,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {a.content}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 10, fontSize: 12, color: '#94a3b8' }}>
                      <span>📅 {a.publishedAt ? a.publishedAt.substring(0, 10) : ''}</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>Đọc bản tin →</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          4. FEATURED MARKETS (Chợ phiên tiêu biểu)
          ======================================================== */}
      <section className="ml-markets-section">
        <div className="ml-container">
          <div className="ml-section-header with-action ml-reveal">
            <div>
              <span className="ml-section-subtitle">Điểm hẹn cuối tuần</span>
              <h2 className="ml-section-title">Các Phiên Chợ Đang Nhận Đặt Trước</h2>
              <p className="ml-section-desc">
                Tìm phiên chợ nông sản gần nhà bạn để ghé mua sắm cuối tuần này.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigate && onNavigate('markets')}
            >
              Xem tất cả chợ ({markets.length}) →
            </Button>
          </div>

          {/* Quick Area Filters for Markets */}
          <div className="ml-markets-filter-bar ml-reveal">
            <div className="ml-filter-tabs">
              <button
                type="button"
                className={`ml-filter-tab ${marketCityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMarketCityFilter('all')}
              >
                Tất cả khu vực ({markets.length})
              </button>
              <button
                type="button"
                className={`ml-filter-tab ${marketCityFilter === 'hanoi' ? 'active' : ''}`}
                onClick={() => setMarketCityFilter('hanoi')}
              >
                📍 Hà Nội
              </button>
              <button
                type="button"
                className={`ml-filter-tab ${marketCityFilter === 'hcm' ? 'active' : ''}`}
                onClick={() => setMarketCityFilter('hcm')}
              >
                📍 TP. Hồ Chí Minh
              </button>
            </div>

            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Đang mở đặt hàng trước cho phiên cuối tuần
            </span>
          </div>

          <div className="ml-markets-grid">
            {displayedMarkets.slice(0, 3).map((market, idx) => (
              <div key={market.id} className={`ml-reveal ml-stagger-${(idx % 3) + 1}`}>
                <MarketCard
                  market={market}
                  onViewDetails={(m) => setScheduleMapMarket(m)}
                  onSelectMarket={(m) => setStallProductsMarket(m)}
                />
              </div>
            ))}
          </div>

          {displayedMarkets.length === 0 && (
            <div className="ml-empty-state-card ml-reveal">
              <span className="ml-empty-icon">📍</span>
              <div className="ml-empty-title">Không tìm thấy phiên chợ phù hợp</div>
              <div className="ml-empty-desc">
                Thử chọn khu vực khác hoặc chuyển sang xem toàn bộ các phiên chợ.
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setMarketCityFilter('all');
                  setSelectedArea('all');
                  setSelectedMarketDay('all');
                }}
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          5. SEASONAL PRODUCTS (Nông sản mùa vụ)
          ======================================================== */}
      <section id="seasonal-products" className="ml-products-section">
        <div className="ml-container">
          <div className="ml-section-header with-action ml-reveal">
            <div>
              <span className="ml-section-subtitle">Đang vào mùa thu hái</span>
              <h2 className="ml-section-title">Nông Sản Tươi Ngon Nhất Tuần Này</h2>
              <p className="ml-section-desc">
                Nông dân vừa cập nhật số lượng hái cho phiên chợ sáng mai.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigate && onNavigate('products')}
            >
              Xem danh mục đầy đủ →
            </Button>
          </div>

          {/* Search Box & Quick Tags */}
          <div className="ml-home-search-panel ml-reveal">
            <div className="ml-home-search-input-wrap">
              <span className="ml-home-search-icon">🔍</span>
              <input
                type="text"
                className="ml-home-search-input"
                placeholder="Tìm nông sản tươi (cải bó xôi, cà chua cherry, dâu tây Đà Lạt, nấm, Ba Vì)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              {searchKeyword && (
                <button
                  type="button"
                  className="ml-home-search-clear"
                  onClick={() => setSearchKeyword('')}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="ml-home-quick-tags">
              <span className="ml-home-quick-label">Gợi ý tìm nhanh:</span>
              {POPULAR_PRODUCT_KEYWORDS.map((tag, idx) => {
                const cleanTag = tag.replace(/^[^\s]+\s*/, '');
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`ml-home-quick-tag ${searchKeyword === cleanTag ? 'active' : ''}`}
                    onClick={() => setSearchKeyword(searchKeyword === cleanTag ? '' : cleanTag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Chips */}
          <div className="ml-category-chips-wrap ml-reveal">
            <button
              type="button"
              className={`ml-cat-chip ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              🌿 Tất cả <span className="ml-cat-chip-count">{products.length}</span>
            </button>
            <button
              type="button"
              className={`ml-cat-chip ${activeCategory === 'Rau' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Rau')}
            >
              🥬 Rau Lá Hữu Cơ
            </button>
            <button
              type="button"
              className={`ml-cat-chip ${activeCategory === 'Củ' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Củ')}
            >
              🥕 Củ & Quả Tươi Sạch
            </button>
            <button
              type="button"
              className={`ml-cat-chip ${activeCategory === 'Trái Cây' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Trái Cây')}
            >
              🍓 Trái Cây Bản Địa
            </button>
            <button
              type="button"
              className={`ml-cat-chip ${activeCategory === 'Nấm' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Nấm')}
            >
              🍄 Nấm & Thảo Dược
            </button>
          </div>

          {/* Search Status Bar if active */}
          {(searchKeyword.trim() !== '' || selectedArea !== 'all') && (
            <div className="ml-search-status-bar ml-reveal">
              <span>
                Tìm thấy <strong>{filteredProducts.length}</strong> sản phẩm
                {searchKeyword && <> cho từ khóa "<strong>{searchKeyword}</strong>"</>}
                {selectedArea !== 'all' && <> tại khu vực đã chọn</>}
              </span>
              <button 
                type="button" 
                className="ml-reset-filter-btn"
                onClick={() => {
                  setSearchKeyword('');
                  setSelectedArea('all');
                  setActiveCategory('all');
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Products Grid */}
          <div className="ml-products-grid">
            {filteredProducts.map((product, idx) => (
              <div key={product.id} className={`ml-reveal ml-stagger-${(idx % 4) + 1}`}>
                <ProductCard
                  product={product}
                  cartQuantity={getCartQty(product.id)}
                  onAddToCart={onAddToCart}
                  onUpdateQty={onUpdateCartQty}
                />
              </div>
            ))}
          </div>

          {/* Empty State with Suggestions & Recommendations */}
          {filteredProducts.length === 0 && (
            <div className="ml-empty-state-card ml-reveal">
              <span className="ml-empty-icon">🥬</span>
              <div className="ml-empty-title">
                {searchKeyword ? `Không tìm thấy nông sản khớp với "${searchKeyword}"` : 'Không tìm thấy nông sản phù hợp'}
              </div>
              <div className="ml-empty-desc">
                Bạn hãy thử bấm vào một trong các từ khóa phổ biến bên dưới hoặc xem các nông sản tươi ngon đang mở bán:
              </div>

              {/* Suggestions chips */}
              <div className="ml-empty-suggestions-box">
                <span className="ml-empty-suggestions-label">Thử tìm kiếm với:</span>
                <div className="ml-empty-chips-list">
                  {POPULAR_PRODUCT_KEYWORDS.map((kw, i) => {
                    const cleanKw = kw.replace(/^[^\s]+\s*/, '');
                    return (
                      <button
                        key={i}
                        type="button"
                        className="ml-empty-chip-btn"
                        onClick={() => {
                          setSearchKeyword(cleanKw);
                          setActiveCategory('all');
                          setSelectedArea('all');
                        }}
                      >
                        {kw}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchKeyword('');
                    setActiveCategory('all');
                    setSelectedArea('all');
                  }}
                >
                  ↺ Xem tất cả nông sản
                </Button>
              </div>

              {/* Fallback Products Recommendation so screen is never blank */}
              <div className="ml-fallback-recommended-section" style={{ width: '100%', marginTop: '32px', textAlign: 'left' }}>
                <div className="ml-fallback-header">
                  <span className="ml-fallback-badge">🔥 NÔNG SẢN NỔI BẬT</span>
                  <h3 className="ml-fallback-title">Gợi Ý Nông Sản Tươi Ngon Nhất Cho Bạn</h3>
                  <p className="ml-fallback-sub">Nông dân hái sớm trong ngày họp chợ, sẵn sàng giao tại sạp:</p>
                </div>

                <div className="ml-products-grid">
                  {products.slice(0, 4).map((product) => (
                    <div key={product.id}>
                      <ProductCard
                        product={product}
                        cartQuantity={getCartQty(product.id)}
                        onAddToCart={onAddToCart}
                        onUpdateQty={onUpdateCartQty}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          5b. SYSTEM ANNOUNCEMENTS SECTION (Bản tin chợ phiên)
          ======================================================== */}
      {announcements && announcements.length > 0 && (
        <section className="ml-home-announcements-section" style={{ background: '#f8fafc', padding: '60px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div className="ml-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: '#ecfdf5', color: '#059669', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  <span>📢</span>
                  <span>Kênh Phát Ngôn & Thông Báo Chính Thức</span>
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0 8px' }}>
                  Bản Tin Chợ Phiên & Lịch Họp Mới Nhất
                </h2>
                <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '600px', margin: 0 }}>
                  Cập nhật thông tin nhanh từ Ban quản trị: lịch mở cổng nhận hàng, tiêu chuẩn kiểm định an toàn và các sự kiện chợ cuối tuần.
                </p>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate && onNavigate('announcements')}
              >
                Xem tất cả bản tin ({announcements.length}) →
              </Button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {announcements.slice(0, 3).map((item) => {
                const isPinned = item.priority === 'PINNED';
                const isUrgent = item.priority === 'URGENT';
                const annId = item.announcementId || item.id;
                return (
                  <div
                    key={annId}
                    onClick={() => setReadingAnnouncement(item)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '24px',
                      border: isPinned ? '2px solid #f59e0b' : isUrgent ? '2px solid #ef4444' : '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {isPinned && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#b45309' }}>
                            📌 Ghim
                          </span>
                        )}
                        {isUrgent && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c' }}>
                            🚨 Khẩn cấp
                          </span>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                          {item.type === 'MARKET_EVENT' ? '🎪 Sự kiện' : item.type === 'POLICY' ? '📋 Quy chuẩn' : item.type === 'MAINTENANCE' ? '⚙️ Kỹ thuật' : '📢 Tin chung'}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        📅 {item.publishedAt ? item.publishedAt.substring(0, 10) : ''}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', lineHeight: 1.4 }}>
                      {item.title}
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      lineHeight: 1.6,
                      flex: 1,
                      margin: '0 0 16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.content}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        ✍️ {item.adminName || 'Ban Quản Trị'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                        Đọc chi tiết →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          6. FARMER CTA SECTION (Kêu gọi nông dân tham gia)
          ======================================================== */}
      <section className="ml-farmer-cta">
        <div className="ml-container">
          <div className="ml-farmer-cta-inner ml-reveal">
            <div className="ml-farmer-cta-content">
              <div className="ml-farmer-badge">
                <span>🌱</span>
                <span>Dành Cho Nhà Vườn & Nông Hộ</span>
              </div>

              <h2 className="ml-farmer-cta-title">
                Bạn Là Nông Dân Canh Tác Sạch?<br />
                Đăng Ký Sạp Chợ & Đón Khách Đặt Trước Ngay!
              </h2>

              <p className="ml-farmer-cta-desc">
                Chủ động sản lượng hái từ chiều hôm trước, biết chính xác có bao nhiêu khách đến nhận tại chợ. Không lo dội chợ, không bị ép giá trung gian!
              </p>

              <div className="ml-farmer-benefits-list">
                <div className="ml-benefit-item">
                  <span className="ml-benefit-icon">✓</span>
                  <span>Chủ động số lượng đơn trước khi thu hoạch mỗi buổi chiều</span>
                </div>
                <div className="ml-benefit-item">
                  <span className="ml-benefit-icon">✓</span>
                  <span>0% chi phí sàn khởi tạo, miễn phí hỗ trợ làm bảng sạp VietQR</span>
                </div>
                <div className="ml-benefit-item">
                  <span className="ml-benefit-icon">✓</span>
                  <span>Khách đến nhận trực tiếp tại sạp, nhận tiền mặt hoặc chuyển khoản 100%</span>
                </div>
              </div>

              <div className="ml-farmer-cta-actions">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={onOpenFarmerRegister}
                >
                  Đăng ký mở sạp miễn phí
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onNavigate && onNavigate('farmers')}
                >
                  Khám phá các gian hàng →
                </Button>
              </div>
            </div>

            <div className="ml-farmer-cta-visual">
              <img
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80"
                alt="Nông dân làm vườn hữu cơ"
                className="ml-farmer-cta-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 1. Modal Xem Lịch & Bản Đồ */}
      {scheduleMapMarket && (
        <MarketDetailModal
          isOpen={!!scheduleMapMarket}
          onClose={() => setScheduleMapMarket(null)}
          market={scheduleMapMarket}
          onViewStalls={(m) => {
            setScheduleMapMarket(null);
            setStallProductsMarket(m);
          }}
        />
      )}

      {/* 2. Modal Xem Sản Phẩm Sạp */}
      {stallProductsMarket && (
        <MarketStallsModal
          isOpen={!!stallProductsMarket}
          onClose={() => setStallProductsMarket(null)}
          market={stallProductsMarket}
          onAddToCart={onAddToCart}
          cartItems={cartItems}
          onUpdateCartQty={onUpdateCartQty}
          onViewScheduleMap={(m) => {
            setStallProductsMarket(null);
            setScheduleMapMarket(m);
          }}
          onOpenFullProducts={(m) => {
            setStallProductsMarket(null);
            if (onSelectMarketProducts) {
              onSelectMarketProducts(m);
            } else if (onNavigate) {
              onNavigate('products');
            }
          }}
        />
      )}

      {/* 3. Modal Đọc Bản Tin Thông Báo Hệ Thống */}
      {readingAnnouncement && (
        <Modal
          isOpen={!!readingAnnouncement}
          onClose={() => setReadingAnnouncement(null)}
          title={readingAnnouncement.title}
          subtitle={`Phát hành bởi ${readingAnnouncement.adminName || 'Ban Quản Trị MarketLink'} • ${readingAnnouncement.publishedAt ? readingAnnouncement.publishedAt.substring(0, 10) : ''}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge variant={readingAnnouncement.priority === 'PINNED' ? 'warning' : readingAnnouncement.priority === 'URGENT' ? 'urgent' : 'ready'}>
                {readingAnnouncement.priority === 'PINNED' ? '📌 Bản tin được ghim' : readingAnnouncement.priority === 'URGENT' ? '🚨 Thông báo khẩn' : '📢 Thông báo chính thức'}
              </Badge>
              <Badge variant="outline">
                {readingAnnouncement.type === 'MARKET_EVENT' ? '🎪 Sự kiện chợ phiên' : readingAnnouncement.type === 'POLICY' ? '📋 Tiêu chuẩn & Quy chuẩn' : readingAnnouncement.type === 'MAINTENANCE' ? '⚙️ Kỹ thuật' : '📢 Tin tức chung'}
              </Badge>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '16px 20px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 15,
              lineHeight: 1.7,
              color: '#1e293b',
              whiteSpace: 'pre-wrap'
            }}>
              {readingAnnouncement.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="md" onClick={() => setReadingAnnouncement(null)}>
                Đã hiểu
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
