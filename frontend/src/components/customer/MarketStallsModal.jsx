import React, { useState, useEffect, useMemo } from 'react';
import './MarketStallsModal.css';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import marketService from '../../services/marketService';
import productService from '../../services/productService';

export default function MarketStallsModal({
  isOpen,
  onClose,
  market,
  onAddToCart,
  cartItems = [],
  onUpdateCartQty,
  onViewScheduleMap,
  onOpenFullProducts
}) {
  if (!market) return null;

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'stalls'
  const [selectedStallCode, setSelectedStallCode] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const marketId = market.id || market.marketId || 101;
  const marketName = market.name || 'Phiên Chợ Nông Sản Sạch';

  // Realistic sample stalls associated with this market
  const defaultStalls = useMemo(() => {
    if (marketId === 101 || marketName.includes('Ba Đình')) {
      return [
        {
          stallNumber: 'Sạp A-01',
          stallName: 'Nông Trại Hữu Cơ Ba Vì',
          farmerName: 'Bác Ba Nông Dân',
          phone: '0912 345 678',
          farmAddress: 'Thôn 2, Xã Yên Bài, Ba Vì, Hà Nội',
          bio: 'Chuyên canh rau ăn lá vi sinh hữu cơ, đạt chuẩn VietGAP thu hoạch sáng sớm ngày họp chợ.',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Cải Bó Xôi', 'Rau Muống Tiến Vua', 'Cải Xoăn Kale']
        },
        {
          stallNumber: 'Sạp A-02',
          stallName: 'Vườn Rau Sinh Thái Mộc Châu',
          farmerName: 'Chị Lan Mộc Châu',
          phone: '0987 654 321',
          farmAddress: 'Thảo nguyên Mộc Châu, Sơn La',
          bio: 'Trồng rau củ ôn đới không tồn dư thuốc trừ sâu, khí hậu cao nguyên mát mẻ quanh năm.',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Cà Chua Cherry', 'Bắp Cải Tí Hon', 'Cải Ngọt Thảo Nguyên']
        },
        {
          stallNumber: 'Sạp A-03',
          stallName: 'HTX Nấm & Dược Liệu Tươi Sa Pa',
          farmerName: 'Anh Hùng Sa Pa',
          phone: '0903 112 233',
          farmAddress: 'Bản Tả Phìn, Sa Pa, Lào Cai',
          bio: 'Cung cấp nấm hương rừng mọc tự nhiên trên thân gỗ mục và thảo dược thanh nhiệt.',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Nấm Hương Rừng', 'Mộc Nhĩ Đen', 'Đẳng Sâm Tươi']
        },
        {
          stallNumber: 'Sạp A-04',
          stallName: 'Vườn Cây Ăn Trái Bản Địa',
          farmerName: 'Chú Tư Miền Tây & Đà Lạt',
          phone: '0938 998 877',
          farmAddress: 'Chợ Lách, Bến Tre & Đà Lạt',
          bio: 'Hoa quả đặc sản hái đúng độ chín cây, ngọt thơm tự nhiên không dùng hóa chất thúc chín.',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Dâu Tây Hana', 'Bưởi Da Xanh', 'Cam Sành']
        }
      ];
    } else if (marketId === 103 || marketName.includes('Thảo Điền')) {
      return [
        {
          stallNumber: 'Sạp C-01',
          stallName: 'Nông Sản Sạch Đà Lạt Farm',
          farmerName: 'Anh Minh Đà Lạt',
          phone: '0918 223 344',
          farmAddress: 'Huyện Đơn Dương, Lâm Đồng',
          bio: 'Rau củ quả sạch cao nguyên Đà Lạt hái lúc 4h sáng vận chuyển lạnh về TP.HCM.',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Dâu Tây Hana', 'Xà Lách Lolo Búp', 'Cà Chua Socola']
        },
        {
          stallNumber: 'Sạp C-02',
          stallName: 'Vườn Trái Cây Sinh Thái Tiền Giang',
          farmerName: 'Chị Mai Tiền Giang',
          phone: '0945 667 788',
          farmAddress: 'Huyện Cái Bè, Tiền Giang',
          bio: 'Trái cây sông nước miền Tây đạt chuẩn an toàn, độ ngọt thanh mát tự nhiên.',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Xoài Cát Hòa Lộc', 'Mít Ruột Đỏ', 'Thanh Long']
        },
        {
          stallNumber: 'Sạp C-03',
          stallName: 'Nông Trại Rau Thủy Canh Thủ Đức',
          farmerName: 'Bác Sáu Rau Sạch',
          phone: '0922 445 566',
          farmAddress: 'Phường Long Phước, TP. Thủ Đức',
          bio: 'Rau thủy canh dinh dưỡng khép kín, tươi giòn sạch đất, dùng ngay không cần rửa nhiều.',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Cải Bẹ Xanh', 'Xà Lách Mỡ', 'Rau Dền Đỏ']
        }
      ];
    } else {
      return [
        {
          stallNumber: 'Sạp B-01',
          stallName: 'HTX Vải & Cây Ăn Trái Hải Dương',
          farmerName: 'Bác Năm Thanh Hà',
          phone: '0913 556 677',
          farmAddress: 'Thanh Hà, Hải Dương',
          bio: 'Đặc sản vải thiều cùi dày hạt tiêu mọng nước thu hoạch đúng mùa vụ ngọt ngào.',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Vải Thiều Thanh Hà', 'Ổi Bo', 'Dưa Lưới']
        },
        {
          stallNumber: 'Sạp B-02',
          stallName: 'Hợp Tác Xã Nấm Sạch Tây Hồ',
          farmerName: 'Chị Hà Nấm Sạch',
          phone: '0976 112 244',
          farmAddress: 'Q. Tây Hồ, Hà Nội',
          bio: 'Cung cấp các loại nấm tươi dinh dưỡng, nấm sò, mộc nhĩ không dùng chất kích thích.',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Nấm Hương Tươi', 'Nấm Đùi Gà', 'Mộc Nhĩ']
        },
        {
          stallNumber: 'Sạp B-03',
          stallName: 'Nông Trại Hữu Cơ Sông Hồng',
          farmerName: 'Anh Tuấn Tây Hồ',
          phone: '0989 334 455',
          farmAddress: 'Bãi bồi Sông Hồng, Hà Nội',
          bio: 'Đất phù sa màu mỡ trồng rau màu ăn lá giòn ngọt tự nhiên.',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          featuredItems: ['Rau Muống Sạch', 'Mồng Tơi', 'Rau Đay']
        }
      ];
    }
  }, [marketId, marketName]);

  const [stalls, setStalls] = useState(defaultStalls);

  // Products available at this market
  const defaultProducts = useMemo(() => {
    return [
      {
        id: 101,
        name: 'Cải Bó Xôi Hữu Cơ Ba Vì',
        categoryId: 1,
        categoryName: 'Rau Lá Hữu Cơ',
        price: 45000,
        unit: 'kg',
        farmerName: 'Nông Trại Hữu Cơ Ba Vì',
        stallCode: 'Sạp A-01',
        marketName,
        stockQuantity: 35,
        harvestTime: 'Thu hoạch 5h sáng',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
        organicCertified: true,
        description: 'Rau bina trồng hữu cơ vi sinh, lá dày xanh thẫm, giàu sắt và vitamin.'
      },
      {
        id: 102,
        name: 'Rau Muống Tiến Vua Sạch',
        categoryId: 1,
        categoryName: 'Rau Lá Hữu Cơ',
        price: 15000,
        unit: 'bó',
        farmerName: 'Nông Trại Hữu Cơ Ba Vì',
        stallCode: 'Sạp A-01',
        marketName,
        stockQuantity: 60,
        harvestTime: 'Cắt 4h30 sáng',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        organicCertified: true,
        description: 'Thu hoạch sớm từ ngọn non, thân giòn xào tỏi hoặc nấu canh thanh mát.'
      },
      {
        id: 103,
        name: 'Cà Chua Cherry Mộc Châu Ngọt Giòn',
        categoryId: 2,
        categoryName: 'Củ & Quả Tươi Sạch',
        price: 35000,
        unit: 'hộp 500g',
        farmerName: 'Vườn Rau Sinh Thái Mộc Châu',
        stallCode: 'Sạp A-02',
        marketName,
        stockQuantity: 45,
        harvestTime: 'Chín cây tự nhiên',
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        organicCertified: true,
        description: 'Cà chua bi giống Socola Mộc Châu vỏ mỏng mọng nước, vị ngọt đậm đà.'
      },
      {
        id: 104,
        name: 'Dâu Tây Hana Đà Lạt Tuyển Chọn',
        categoryId: 3,
        categoryName: 'Trái Cây Bản Địa',
        price: 125000,
        unit: 'hộp 500g',
        farmerName: 'Nông Sản Sạch Đà Lạt Farm',
        stallCode: 'Sạp C-01',
        marketName,
        stockQuantity: 30,
        harvestTime: 'Thu hái sáng sớm',
        imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
        organicCertified: true,
        description: 'Dâu tây giống Hana hái tại vườn Đà Lạt lúc sáng sớm, thơm lừng vị ngọt.'
      },
      {
        id: 106,
        name: 'Nấm Hương Rừng Sa Pa Tươi',
        categoryId: 4,
        categoryName: 'Nấm & Thảo Dược',
        price: 98000,
        unit: 'kg',
        farmerName: 'HTX Nấm & Dược Liệu Tươi Sa Pa',
        stallCode: 'Sạp A-03',
        marketName,
        stockQuantity: 20,
        harvestTime: 'Hái tự nhiên trên núi',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
        organicCertified: true,
        description: 'Nấm hương sinh trưởng tự nhiên trên gỗ mục vùng núi Tả Phìn, thơm nồng.'
      },
      {
        id: 105,
        name: 'Vải Thiều Thanh Hà Chính Gốc',
        categoryId: 3,
        categoryName: 'Trái Cây Bản Địa',
        price: 65000,
        unit: 'kg',
        farmerName: 'HTX Vải & Cây Ăn Trái Hải Dương',
        stallCode: 'Sạp B-01',
        marketName,
        stockQuantity: 80,
        harvestTime: 'Hái đúng độ chín',
        imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
        organicCertified: true,
        description: 'Cùi dày hạt tiêu mọng nước, ngọt sắc hương thơm đặc trưng vùng Thanh Hà.'
      }
    ];
  }, [marketName]);

  const [products, setProducts] = useState(defaultProducts);

  // Load real stalls from backend if available
  useEffect(() => {
    let isMounted = true;
    async function loadStalls() {
      if (!marketId) return;
      try {
        const farmers = await marketService.getMarketFarmers(marketId);
        if (isMounted && Array.isArray(farmers) && farmers.length > 0) {
          const mapped = farmers.map((f, idx) => ({
            stallNumber: f.stallNumber || `Sạp ${idx + 1}`,
            stallName: f.stallName || f.farmerName || `Sạp Nông Dân #${idx + 1}`,
            farmerName: f.farmerName || 'Chủ nông trại',
            phone: f.phoneNumber || '0912 345 678',
            farmAddress: f.farmAddress || 'Vùng trồng liên kết',
            bio: f.bio || 'Chuyên cung cấp nông sản sạch cho phiên chợ.',
            avatarUrl: f.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
            featuredItems: ['Rau hữu cơ', 'Củ quả tươi', 'Trái cây sạch']
          }));
          setStalls(mapped);
        }
      } catch (err) {
        console.warn('Using default stalls for market:', err);
      }
    }

    async function loadProducts() {
      try {
        let prods = await productService.getProducts({ marketId, status: 'AVAILABLE' });
        if (isMounted) {
          if (Array.isArray(prods) && prods.length > 0) {
            setProducts(prods);
          } else if (Array.isArray(prods) && prods.length === 0) {
            setProducts([]);
          }
        }
      } catch (err) {
        console.warn('Using default products for market modal:', err);
      }
    }

    loadStalls();
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [marketId, marketName, market.city]);

  // Filter products by stall, category, and search keyword
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      let matchStall = selectedStallCode === 'all';
      if (!matchStall && selectedStallCode) {
        const normSelected = selectedStallCode.toLowerCase().replace(/[\s\-_:]+/g, '');
        const normStallNum = (p.stallNumber || '').toLowerCase().replace(/[\s\-_:]+/g, '');
        const normStallCode = (p.stallCode || '').toLowerCase().replace(/[\s\-_:]+/g, '');

        matchStall =
          (normStallNum && normStallNum === normSelected) ||
          (normStallCode && normStallCode === normSelected) ||
          (p.stallNumber && p.stallNumber.toLowerCase().includes(selectedStallCode.toLowerCase())) ||
          (p.stallCode && p.stallCode.toLowerCase().includes(selectedStallCode.toLowerCase())) ||
          (p.farmerStallName && p.farmerStallName.toLowerCase().includes(selectedStallCode.toLowerCase())) ||
          (p.farmerName && p.farmerName.toLowerCase().includes(selectedStallCode.toLowerCase()));
      }

      const matchCategory =
        selectedCategory === 'all' ||
        String(p.categoryId) === String(selectedCategory);

      const matchSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.farmerName && p.farmerName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchStall && matchCategory && matchSearch;
    });
  }, [products, selectedStallCode, selectedCategory, searchTerm]);

  const getCartQty = (prodId) => {
    const found = cartItems.find((item) => item.id === prodId);
    return found ? found.quantity : 0;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleSelectStallToFilter = (stall) => {
    setSelectedStallCode(stall.stallNumber || stall.stallName);
    setActiveTab('products');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sản Phẩm & Sạp Bán: ${marketName}`}
      subtitle={`🎪 ${stalls.length} Gian hàng nông dân • Nhận hàng tại: ${market.address || market.city}`}
      maxWidth="860px"
    >
      <div className="ml-market-stalls-modal-content">
        {/* Navigation Tabs */}
        <div className="ml-stalls-tab-nav">
          <button
            type="button"
            className={`ml-stalls-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            🧺 Nông Sản Tại Chợ ({filteredProducts.length})
          </button>
          <button
            type="button"
            className={`ml-stalls-tab-btn ${activeTab === 'stalls' ? 'active' : ''}`}
            onClick={() => setActiveTab('stalls')}
          >
            🎪 Danh Sách Gian Hàng / Sạp ({stalls.length})
          </button>
        </div>

        {/* ========================================================
            TAB 1: NÔNG SẢN TẠI CHỢ
            ======================================================== */}
        {activeTab === 'products' && (
          <div className="ml-stalls-tab-pane">
            {/* Filter Bar */}
            <div className="ml-stalls-filter-bar">
              {/* Stall chips filter */}
              <div className="ml-filter-chips-row">
                <span className="ml-filter-sublabel">Chọn sạp:</span>
                <button
                  type="button"
                  className={`ml-stall-chip ${selectedStallCode === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedStallCode('all')}
                >
                  Tất cả các sạp ({products.length})
                </button>
                {stalls.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`ml-stall-chip ${selectedStallCode === s.stallNumber ? 'active' : ''}`}
                    onClick={() => setSelectedStallCode(s.stallNumber)}
                    title={s.stallName}
                  >
                    🎪 {s.stallNumber}: {s.stallName.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Category & Search Row */}
              <div className="ml-cat-search-row">
                <div className="ml-cat-chips-wrap">
                  <button
                    type="button"
                    className={`ml-cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    className={`ml-cat-btn ${selectedCategory === '1' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('1')}
                  >
                    🥬 Rau lá
                  </button>
                  <button
                    type="button"
                    className={`ml-cat-btn ${selectedCategory === '2' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('2')}
                  >
                    🥕 Củ quả
                  </button>
                  <button
                    type="button"
                    className={`ml-cat-btn ${selectedCategory === '3' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('3')}
                  >
                    🍓 Trái cây
                  </button>
                  <button
                    type="button"
                    className={`ml-cat-btn ${selectedCategory === '4' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('4')}
                  >
                    🍄 Nấm
                  </button>
                </div>

                <div className="ml-search-input-wrap">
                  <span className="ml-search-ic">🔍</span>
                  <input
                    type="text"
                    placeholder="Tìm rau, củ, tên sạp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ml-stalls-search-input"
                  />
                </div>
              </div>
            </div>

            {/* Active filter reminder */}
            {selectedStallCode !== 'all' && (
              <div className="ml-active-stall-banner">
                <span>Đang lọc theo: <strong>{selectedStallCode}</strong></span>
                <button
                  type="button"
                  className="ml-clear-stall-btn"
                  onClick={() => setSelectedStallCode('all')}
                >
                  ✕ Bỏ lọc sạp
                </button>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="ml-products-empty-state">
                <span className="ml-empty-icon">🥬</span>
                <h4>Không tìm thấy nông sản phù hợp</h4>
                <p>Thử bỏ bớt từ khóa hoặc chuyển sang xem tất cả các sạp nông dân.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStallCode('all');
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                >
                  Xem toàn bộ nông sản
                </Button>
              </div>
            ) : (
              <div className="ml-stalls-products-grid">
                {filteredProducts.map((p) => {
                  const cartQty = getCartQty(p.id);
                  return (
                    <div key={p.id} className="ml-stall-product-card">
                      <div className="ml-sp-img-box">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="ml-sp-img"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        {p.organicCertified && (
                          <span className="ml-sp-badge">🌿 VietGAP</span>
                        )}
                      </div>

                      <div className="ml-sp-info">
                        <div className="ml-sp-stall-tag">
                          🎪 {p.stallCode || 'Sạp nông sản'} • {p.farmerName}
                        </div>
                        <h4 className="ml-sp-name" title={p.name}>{p.name}</h4>
                        <div className="ml-sp-stock">
                          Tồn kho: <strong>{p.stockQuantity} {p.unit}</strong> ({p.harvestTime || 'Thu hoạch sớm'})
                        </div>

                        <div className="ml-sp-footer">
                          <div className="ml-sp-price">
                            <strong>{formatCurrency(p.price)}</strong>
                            <span>/ {p.unit}</span>
                          </div>

                          {onAddToCart && (
                            <div className="ml-sp-actions">
                              {cartQty > 0 ? (
                                <div className="ml-sp-qty-row">
                                  <button
                                    type="button"
                                    className="ml-sp-qty-btn"
                                    onClick={() => onUpdateCartQty && onUpdateCartQty(p, cartQty - 1)}
                                  >
                                    -
                                  </button>
                                  <span className="ml-sp-qty-val">{cartQty}</span>
                                  <button
                                    type="button"
                                    className="ml-sp-qty-btn"
                                    disabled={cartQty >= p.stockQuantity}
                                    onClick={() => onUpdateCartQty && onUpdateCartQty(p, cartQty + 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="ml-sp-add-btn"
                                  onClick={() => onAddToCart(p)}
                                >
                                  + Đặt trước
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: DANH SÁCH CÁC GIAN HÀNG / SẠP NÔNG DÂN
            ======================================================== */}
        {activeTab === 'stalls' && (
          <div className="ml-stalls-tab-pane">
            <div className="ml-stalls-overview-banner">
              <div className="ml-stalls-ob-text">
                <strong>Các Sạp Nông Dân Tại Phiên Chợ {marketName}</strong>
                <p>Mỗi sạp đại diện cho một hợp tác xã hoặc nông hộ cam kết sản phẩm sạch, minh bạch nguồn gốc.</p>
              </div>
            </div>

            <div className="ml-stalls-list-grid">
              {stalls.map((s, idx) => (
                <div key={idx} className="ml-stall-detail-card">
                  <div className="ml-sd-header">
                    <img
                      src={s.avatarUrl}
                      alt={s.farmerName}
                      className="ml-sd-avatar"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                    <div className="ml-sd-meta">
                      <div className="ml-sd-stall-pill">{s.stallNumber}</div>
                      <h4 className="ml-sd-stall-name">{s.stallName}</h4>
                      <div className="ml-sd-owner">👨‍🌾 Chủ sạp: <strong>{s.farmerName}</strong></div>
                    </div>
                  </div>

                  <p className="ml-sd-bio">{s.bio}</p>

                  <div className="ml-sd-address">
                    📍 Vùng trồng: <span>{s.farmAddress}</span>
                  </div>

                  <div className="ml-sd-featured">
                    <span className="ml-sd-feat-label">Nông sản thế mạnh:</span>
                    <div className="ml-sd-feat-tags">
                      {(s.featuredItems || []).map((it, i) => (
                        <span key={i} className="ml-feat-tag">✓ {it}</span>
                      ))}
                    </div>
                  </div>

                  <div className="ml-sd-actions">
                    <button
                      type="button"
                      className="ml-sd-view-prods-btn"
                      onClick={() => handleSelectStallToFilter(s)}
                    >
                      🧺 Xem nông sản sạp này →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="ml-stalls-modal-footer">
          <div className="ml-stalls-footer-left">
            {onViewScheduleMap && (
              <button
                type="button"
                className="ml-btn-schedule-map"
                onClick={() => {
                  onClose();
                  onViewScheduleMap(market);
                }}
              >
                📅 Xem lịch & bản đồ chợ này
              </button>
            )}
          </div>

          <div className="ml-stalls-footer-right">
            {onOpenFullProducts && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onClose();
                  onOpenFullProducts(market);
                }}
                icon={<span>🛒</span>}
              >
                Duyệt trên trang Mua sắm đầy đủ →
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={onClose}
            >
              Xong
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
