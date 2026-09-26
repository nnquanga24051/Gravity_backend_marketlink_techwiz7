import React, { useState, useEffect, useMemo } from 'react';
import './MarketsPage.css';
import MarketCard from '../../components/customer/MarketCard';
import MarketDetailModal from '../../components/customer/MarketDetailModal';
import MarketStallsModal from '../../components/customer/MarketStallsModal';
import OpenStreetMapRouting from '../../components/OpenStreetMapRouting';
import Button from '../../components/common/Button';
import marketService from '../../services/marketService';
import { matchSearch, POPULAR_MARKET_KEYWORDS } from '../../utils/searchUtils';

export default function MarketsPage({ 
  onNavigate, 
  onSelectMarketProducts,
  onAddToCart,
  cartItems = [],
  onUpdateCartQty 
}) {
  const [activeCity, setActiveCity] = useState('all');
  const [activeDay, setActiveDay] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [scheduleMapMarket, setScheduleMapMarket] = useState(null);
  const [stallProductsMarket, setStallProductsMarket] = useState(null);

  const [marketsData, setMarketsData] = useState([
    {
      id: 101,
      name: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      address: '12 Núi Trúc, Phường Giảng Võ, Q. Ba Đình',
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
      address: '28 Thảo Điền, P. Thảo Điền, TP. Thủ Đức',
      city: 'TP. Hồ Chí Minh',
      distance: '3.8 km',
      operatingDays: 'Thứ Bảy & Chủ Nhật',
      operatingHours: '07:00 - 12:00',
      stallsCount: 22,
      imageUrl: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=700&q=80',
      tag: 'Đặc sản Đà Lạt & Miền Tây',
      verified: true,
      description: 'Phiên chợ thực phẩm xanh, bánh men thủ công và trái cây hữu cơ miền Tây Nam Bộ.'
    },
    {
      id: 104,
      name: 'Hội Chợ Nông Sản Vùng Miền Tây Hồ',
      address: '614 Lạc Long Quân, P. Nhật Tân, Q. Tây Hồ',
      city: 'Hà Nội',
      distance: '2.1 km',
      operatingDays: 'Chủ Nhật hàng tuần',
      operatingHours: '06:30 - 11:30',
      stallsCount: 16,
      imageUrl: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=700&q=80',
      tag: 'Nông sản vùng cao',
      verified: true,
      description: 'Giao lưu nông sản đặc sản vùng cao Tây Bắc, mật ong rừng, gạo nương và hoa quả tươi.'
    },
    {
      id: 105,
      name: 'Chợ Phiên Nông Nghiệp Xanh Ecopark',
      address: 'Công viên Mùa Hạ, KĐT Ecopark, Văn Giang',
      city: 'Hưng Yên',
      distance: '12.0 km',
      operatingDays: 'Thứ 7 hàng tuần',
      operatingHours: '06:00 - 11:30',
      stallsCount: 25,
      imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80',
      tag: 'Nông sản sinh thái',
      verified: true,
      description: 'Chợ phiên sinh thái phục vụ cư dân đô thị với nguồn rau quả hái tươi trong ngày.'
    }
  ]);

  // Load real markets from backend with Server-Side Search & Filters (No client-side filtering)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        let cityParam = '';
        if (activeCity !== 'all') {
          cityParam = activeCity;
        }

        let dayParam = '';
        if (activeDay !== 'all') {
          dayParam = activeDay;
        }

        const real = await marketService.getMarkets({
          search: searchTerm.trim(),
          city: cityParam,
          dayOfWeek: dayParam
        });

        if (isMounted) {
          if (real && real.length > 0) {
            setMarketsData(real.map((m) => {
              const isHcm = m.address && m.address.toLowerCase().includes('hồ chí minh');
              const isEcopark = m.address && m.address.toLowerCase().includes('ecopark');
              return {
                ...m,
                id: m.marketId || m.id,
                name: m.name,
                address: m.address,
                city: isHcm ? 'TP. Hồ Chí Minh' : isEcopark ? 'Hưng Yên' : 'Hà Nội',
                distance: '1.5 km',
                operatingDays: m.operatingDays || 'Thứ 7 & Chủ Nhật',
                operatingHours: m.operatingHours || '06:00 - 11:30',
                stallsCount: m.stallsCount || 16,
                imageUrl: m.imageUrl || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=700&q=80',
                tag: m.tag || 'Chợ nông sản sinh thái',
                verified: true,
                description: m.description || 'Chợ phiên nông sản sạch liên kết nông dân địa phương.'
              };
            }));
          } else {
            setMarketsData([]);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch filtered markets from server:', err);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, activeCity, activeDay]);

  const filteredMarkets = marketsData;

  return (
    <div className="ml-markets-page">
      {/* Banner */}
      <div className="ml-markets-banner">
        <div className="ml-container ml-markets-banner-inner">
          <div>
            <span className="ml-section-subtitle">Mạng Lưới Chợ Phiên ({marketsData.length} Điểm)</span>
            <h1 className="ml-markets-title">Khám Phá Các Điểm Chợ Nông Sản Sạch</h1>
            <p className="ml-markets-desc">
              Tìm các chợ phiên họp định kỳ gần nơi bạn sinh sống, xem lịch họp sạp và lộ trình đi lại thuận tiện nhất.
            </p>
          </div>

          {/* View Toggle */}
          <div className="ml-view-toggle">
            <button
              type="button"
              className={`ml-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞ Danh sách sạp
            </button>
            <button
              type="button"
              className={`ml-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              🗺️ Bản đồ & Định vị
            </button>
          </div>
        </div>
      </div>

      <div className="ml-container ml-markets-content">
        {/* Filters Bar */}
        <div className="ml-markets-filters">
          <div className="ml-filter-search-box">
            <div className="ml-filter-search">
              <span className="ml-filter-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm theo tên chợ, quận/huyện, tên đường..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ml-markets-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="ml-markets-clear-btn"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="ml-markets-quick-tags">
              <span className="ml-markets-quick-label">Gợi ý:</span>
              {POPULAR_MARKET_KEYWORDS.map((kw, i) => (
                <button
                  key={i}
                  type="button"
                  className={`ml-market-tag-chip ${searchTerm === kw ? 'active' : ''}`}
                  onClick={() => setSearchTerm(searchTerm === kw ? '' : kw)}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-filter-group">
            <span className="ml-filter-label">Thành phố:</span>
            <div className="ml-filter-chips">
              <button
                type="button"
                className={`ml-chip-btn ${activeCity === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCity('all')}
              >
                Tất cả ({marketsData.length})
              </button>
              <button
                type="button"
                className={`ml-chip-btn ${activeCity === 'Hà Nội' ? 'active' : ''}`}
                onClick={() => setActiveCity('Hà Nội')}
              >
                Hà Nội
              </button>
              <button
                type="button"
                className={`ml-chip-btn ${activeCity === 'TP. Hồ Chí Minh' ? 'active' : ''}`}
                onClick={() => setActiveCity('TP. Hồ Chí Minh')}
              >
                TP. Hồ Chí Minh
              </button>
              <button
                type="button"
                className={`ml-chip-btn ${activeCity === 'Hưng Yên' ? 'active' : ''}`}
                onClick={() => setActiveCity('Hưng Yên')}
              >
                Hưng Yên
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Map */}
        {viewMode === 'map' ? (
          <div className="ml-markets-map-view">
            <OpenStreetMapRouting 
              onSelectMarketProducts={(m) => setStallProductsMarket(m)}
            />
          </div>
        ) : (
          /* View Mode: Grid */
          <div className="ml-markets-grid-wrap">
            {filteredMarkets.length === 0 ? (
              <div className="ml-markets-empty-container">
                <div className="ml-markets-empty">
                  <span className="ml-empty-icon">🎪</span>
                  <h3>
                    {searchTerm ? `Không tìm thấy chợ phiên khớp với "${searchTerm}"` : 'Không tìm thấy chợ phiên phù hợp'}
                  </h3>
                  <p>Thử tìm kiếm với từ khóa khác hoặc chuyển sang khu vực "Tất cả".</p>

                  {/* Suggestion chips */}
                  <div className="ml-empty-suggestions-box">
                    <span className="ml-empty-suggestions-label">Thử tìm kiếm với:</span>
                    <div className="ml-empty-chips-list">
                      {POPULAR_MARKET_KEYWORDS.map((kw, i) => (
                        <button
                          key={i}
                          type="button"
                          className="ml-empty-chip-btn"
                          onClick={() => {
                            setSearchTerm(kw);
                            setActiveCity('all');
                            setActiveDay('all');
                          }}
                        >
                          🎪 {kw}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <Button variant="outline" size="sm" onClick={() => { setActiveCity('all'); setActiveDay('all'); setSearchTerm(''); }}>
                      ↺ Xem tất cả chợ
                    </Button>
                  </div>
                </div>

                {/* Fallback Recommended Markets */}
                <div className="ml-fallback-recommended-section" style={{ width: '100%', marginTop: '32px', textAlign: 'left' }}>
                  <div className="ml-fallback-header">
                    <span className="ml-fallback-badge">⭐ CHỢ PHIÊN TIÊU BIỂU</span>
                    <h3 className="ml-fallback-title">Gợi Ý Các Phiên Chợ Nổi Bật Cho Bạn</h3>
                    <p className="ml-fallback-sub">Các điểm chợ nông sản sạch họp định kỳ mỗi cuối tuần:</p>
                  </div>

                  <div className="ml-markets-cards-grid">
                    {marketsData.slice(0, 3).map((market) => (
                      <MarketCard
                        key={market.id}
                        market={market}
                        onViewDetails={(m) => setScheduleMapMarket(m)}
                        onSelectMarket={(m) => setStallProductsMarket(m)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="ml-markets-cards-grid">
                {filteredMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    onViewDetails={(m) => setScheduleMapMarket(m)}
                    onSelectMarket={(m) => setStallProductsMarket(m)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
