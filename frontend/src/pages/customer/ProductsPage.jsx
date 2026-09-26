import React, { useState, useEffect, useMemo } from 'react';
import './ProductsPage.css';
import ProductCard from '../../components/customer/ProductCard';
import ProductDetailModal from '../../components/customer/ProductDetailModal';
import Button from '../../components/common/Button';
import productService from '../../services/productService';
import marketService from '../../services/marketService';
import { matchSearch, POPULAR_PRODUCT_KEYWORDS } from '../../utils/searchUtils';

export default function ProductsPage({
  onAddToCart,
  cartItems = [],
  onUpdateCartQty,
  onNavigate,
  initialMarket = 'all'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState(initialMarket || 'all');
  const [sortBy, setSortBy] = useState('popular');
  const [priceMax, setPriceMax] = useState(200000);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (initialMarket && initialMarket !== 'all') {
      setSelectedMarket(initialMarket);
    }
  }, [initialMarket]);

  // Categories list
  const [categories, setCategories] = useState([
    { categoryId: 1, name: 'Rau Lá Hữu Cơ', slug: 'rau-la-huu-co', icon: '🥬' },
    { categoryId: 2, name: 'Củ & Quả Tươi Sạch', slug: 'cu-qua-tuoi-sach', icon: '🥕' },
    { categoryId: 3, name: 'Trái Cây Bản Địa', slug: 'trai-cay-ban-dia', icon: '🍓' },
    { categoryId: 4, name: 'Nấm & Thảo Dược', slug: 'nam-thao-duoc', icon: '🍄' }
  ]);

  // Markets list
  const [markets, setMarkets] = useState([
    { id: 101, name: 'Phiên Chợ Xanh Nông Sản Ba Đình' },
    { id: 103, name: 'Phiên Chợ Hữu Cơ Thảo Điền EcoMarket' },
    { id: 104, name: 'Hội Chợ Nông Sản Vùng Miền Tây Hồ' },
    { id: 105, name: 'Chợ Phiên Nông Nghiệp Xanh Ecopark' }
  ]);

  // Products list
  const [products, setProducts] = useState([
    {
      id: 101,
      name: 'Cải Bó Xôi Hữu Cơ Ba Vì',
      categoryId: 1,
      categoryName: 'Rau Lá Hữu Cơ',
      price: 45000,
      unit: 'kg',
      farmerName: 'Nông Trại Hữu Cơ Ba Vì',
      stallCode: 'Sạp A-01',
      marketName: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      stockQuantity: 35,
      harvestTime: 'Thu hoạch 5h sáng',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
      organicCertified: true,
      description: 'Rau bina trồng hữu cơ vi sinh, lá dày xanh thẫm, giàu sắt và vitamin.'
    },
    {
      id: 106,
      name: 'Nấm Hương Rừng Sa Pa Tươi',
      categoryId: 4,
      categoryName: 'Nấm & Thảo Dược',
      price: 98000,
      unit: 'kg',
      farmerName: 'Hợp Tác Xã Dược Liệu & Nấm Sạch Sa Pa',
      stallCode: 'Sạp D-02',
      marketName: 'Hội Chợ Nông Sản Tây Hồ',
      stockQuantity: 20,
      harvestTime: 'Hái tự nhiên trên núi',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      organicCertified: true,
      description: 'Nấm hương sinh trưởng tự nhiên trên gỗ mục vùng núi Tả Phìn, thơm nồng.'
    },
    {
      id: 104,
      name: 'Dâu Tây Hana Đà Lạt Tuyển Chọn',
      categoryId: 3,
      categoryName: 'Trái Cây Bản Địa',
      price: 125000,
      unit: 'hộp 500g',
      farmerName: 'Nông Sản Sạch Đà Lạt Farm',
      stallCode: 'Sạp C-05',
      marketName: 'Phiên Chợ Thảo Điền',
      stockQuantity: 30,
      harvestTime: 'Thu hái sáng sớm',
      imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
      organicCertified: true,
      description: 'Dâu tây giống Hana hái tại vườn Đà Lạt lúc sáng sớm, thơm lừng vị ngọt.'
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
      marketName: 'Phiên Chợ Xanh Ba Đình',
      stockQuantity: 45,
      harvestTime: 'Chín cây tự nhiên',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      organicCertified: true,
      description: 'Cà chua bi giống Socola Mộc Châu vỏ mỏng mọng nước, vị ngọt đậm đà.'
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
      marketName: 'Phiên Chợ Xanh Ba Đình',
      stockQuantity: 60,
      harvestTime: 'Cắt 4h30 sáng',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      organicCertified: true,
      description: 'Thu hoạch sớm từ ngọn non, thân giòn xào tỏi hoặc nấu canh thanh mát.'
    },
    {
      id: 105,
      name: 'Vải Thiều Thanh Hà Chính Gốc',
      categoryId: 3,
      categoryName: 'Trái Cây Bản Địa',
      price: 65000,
      unit: 'kg',
      farmerName: 'Hợp Tác Xã Vải & Cây Ăn Trái Hải Dương',
      stallCode: 'Sạp B-03',
      marketName: 'Hội Chợ Nông Sản Tây Hồ',
      stockQuantity: 80,
      harvestTime: 'Hái đúng độ chín',
      imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
      organicCertified: true,
      description: 'Cùi dày hạt tiêu mọng nước, ngọt sắc hương thơm đặc trưng vùng Thanh Hà.'
    }
  ]);

  // Fetch categories and markets metadata on mount
  useEffect(() => {
    let isMounted = true;
    async function loadMetadata() {
      try {
        const [cats, mrkts] = await Promise.all([
          productService.getCategories(),
          marketService.getMarkets()
        ]);

        if (isMounted) {
          if (cats && cats.length > 0) {
            setCategories(cats.map((c) => ({
              ...c,
              icon: c.name.includes('Rau') ? '🥬' : c.name.includes('Củ') ? '🥕' : c.name.includes('Trái') ? '🍓' : '🍄'
            })));
          }

          if (mrkts && mrkts.length > 0) {
            setMarkets(mrkts.map((m) => ({
              id: m.marketId || m.id,
              name: m.name
            })));
          }
        }
      } catch (err) {
        console.warn('Using fallback categories/markets for ProductsPage:', err);
      }
    }

    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Server-Side Search & Filter for Products (No client-side search)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        // Resolve marketId if selectedMarket is an ID or market name
        let targetMarketId = '';
        if (selectedMarket !== 'all') {
          const matched = markets.find((m) => String(m.id) === String(selectedMarket) || m.name === selectedMarket);
          targetMarketId = matched ? matched.id : (!isNaN(selectedMarket) ? selectedMarket : '');
        }

        const prods = await productService.getProducts({
          keyword: searchTerm.trim(),
          categoryId: selectedCategory !== 'all' ? selectedCategory : '',
          marketId: targetMarketId,
          status: 'AVAILABLE'
        });

        if (isMounted) {
          if (prods && prods.length > 0) {
            setProducts(prods.map((p) => ({
              ...p,
              id: p.productId || p.id,
              name: p.name,
              categoryId: p.categoryId,
              categoryName: p.categoryName || 'Nông sản mùa vụ',
              price: p.price,
              unit: p.unit || 'kg',
              farmerName: p.farmerStallName || p.farmerName || 'Nông Trại Thành Viên',
              stallCode: p.stallCode || 'Sạp Tiêu Chuẩn',
              marketName: p.marketName || 'Phiên Chợ Nông Sản',
              stockQuantity: p.currentStock || p.stockQuantity || 25,
              harvestTime: 'Thu hoạch sáng sớm',
              imageUrl: p.imageUrl,
              organicCertified: true,
              description: p.description || 'Nông sản canh tác tự nhiên đạt chuẩn an toàn.'
            })));
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch filtered products from server', err);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedCategory, selectedMarket, markets]);

  // Client only sorts and checks price bounds (Search & Categories are completely processed by backend server)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.price <= priceMax)
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        return (b.stockQuantity || 0) - (a.stockQuantity || 0);
      });
  }, [products, sortBy, priceMax]);

  const getCartQty = (prodId) => {
    const found = cartItems.find((item) => item.id === prodId);
    return found ? found.quantity : 0;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="ml-products-page">
      {/* Banner */}
      <div className="ml-products-banner">
        <div className="ml-container ml-products-banner-inner">
          <div>
            <span className="ml-section-subtitle">Duyệt Nông Sản Tươi Sạch ({products.length} Sản phẩm)</span>
            <h1 className="ml-products-title">Đặt Trước Nông Sản Theo Mùa</h1>
            <p className="ml-products-desc">
              Thu hoạch sớm trong ngày họp chợ. Chọn sạp, giữ chỗ trước và nhận hàng tươi ngon tận tay!
            </p>
          </div>
          <div className="ml-products-search-container">
            <div className="ml-products-search-wrap">
              <span className="ml-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm theo tên cải bó xôi, dâu tây, tên sạp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ml-products-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="ml-search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="ml-products-search-suggestions">
              <span className="ml-quick-label">Gợi ý:</span>
              {POPULAR_PRODUCT_KEYWORDS.map((kw, i) => {
                const clean = kw.replace(/^[^\s]+\s*/, '');
                return (
                  <button
                    key={i}
                    type="button"
                    className={`ml-quick-tag-btn ${searchTerm === clean ? 'active' : ''}`}
                    onClick={() => setSearchTerm(searchTerm === clean ? '' : clean)}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="ml-container ml-products-layout">
        {/* ================= SIDEBAR FILTERS ================= */}
        <aside className="ml-products-sidebar">
          <div className="ml-filter-card">
            <div className="ml-filter-card-header">
              <h3 className="ml-filter-card-title">Bộ Lọc Tìm Kiếm</h3>
              {(selectedCategory !== 'all' || selectedMarket !== 'all' || searchTerm !== '') && (
                <button
                  type="button"
                  className="ml-filter-reset"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedMarket('all');
                    setSearchTerm('');
                    setPriceMax(200000);
                  }}
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="ml-filter-block">
              <label className="ml-filter-label">Danh mục sản phẩm</label>
              <div className="ml-cat-list">
                <button
                  type="button"
                  className={`ml-cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <span>🌿 Tất cả danh mục</span>
                  <span className="ml-cat-count">{products.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.categoryId}
                    type="button"
                    className={`ml-cat-btn ${String(selectedCategory) === String(cat.categoryId) ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(String(cat.categoryId))}
                  >
                    <span>{cat.icon || '🌱'} {cat.name}</span>
                    <span className="ml-cat-count">
                      {products.filter((p) => String(p.categoryId) === String(cat.categoryId)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Filter */}
            <div className="ml-filter-block">
              <label className="ml-filter-label">Điểm họp chợ phiên</label>
              <select
                className="ml-filter-select"
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
              >
                <option value="all">Tất cả các chợ ({markets.length} điểm)</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Max Slider */}
            <div className="ml-filter-block">
              <div className="ml-slider-header">
                <label className="ml-filter-label">Mức giá tối đa:</label>
                <span className="ml-slider-val">{formatCurrency(priceMax)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="200000"
                step="5000"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="ml-price-range"
              />
              <div className="ml-range-labels">
                <span>10.000₫</span>
                <span>200.000₫</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= MAIN PRODUCTS LIST ================= */}
        <section className="ml-products-main">
          {/* Top Bar Sort & Count */}
          <div className="ml-products-topbar">
            <div className="ml-results-count">
              Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm sẵn sàng đặt trước
            </div>

            <div className="ml-sort-wrap">
              <label htmlFor="sort-select" className="ml-sort-label">Sắp xếp:</label>
              <select
                id="sort-select"
                className="ml-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popular">Tồn kho sẵn sàng</option>
                <option value="price_asc">Giá từ thấp đến cao</option>
                <option value="price_desc">Giá từ cao xuống thấp</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {filteredProducts.length === 0 ? (
            <div className="ml-no-products">
              <span className="ml-no-prod-icon">🥦</span>
              <h3>
                {searchTerm ? `Không tìm thấy sản phẩm khớp với "${searchTerm}"` : 'Không tìm thấy sản phẩm phù hợp'}
              </h3>
              <p>Hãy thử bấm vào các gợi ý nông sản phổ biến hoặc xem các sản phẩm sẵn sàng đặt trước bên dưới.</p>

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
                          setSearchTerm(cleanKw);
                          setSelectedCategory('all');
                          setSelectedMarket('all');
                          setPriceMax(200000);
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
                    setSelectedCategory('all');
                    setSelectedMarket('all');
                    setSearchTerm('');
                    setPriceMax(200000);
                  }}
                >
                  ↺ Xem tất cả nông sản
                </Button>
              </div>

              {/* Recommended Products Fallback */}
              <div className="ml-fallback-recommended-section" style={{ width: '100%', marginTop: '32px', textAlign: 'left' }}>
                <div className="ml-fallback-header">
                  <span className="ml-fallback-badge">🔥 NÔNG SẢN NỔI BẬT</span>
                  <h3 className="ml-fallback-title">Gợi Ý Nông Sản Sẵn Sàng Đặt Trước</h3>
                  <p className="ml-fallback-sub">Các mặt hàng tươi ngon được nhiều khách đi chợ lựa chọn:</p>
                </div>

                <div className="ml-products-grid">
                  {products.slice(0, 3).map((product) => (
                    <div key={product.id} className="ml-prod-card-wrap">
                      <ProductCard
                        product={product}
                        cartQuantity={getCartQty(product.id)}
                        onAddToCart={onAddToCart}
                        onUpdateQty={onUpdateCartQty}
                        onClick={() => setSelectedProduct(product)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="ml-products-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="ml-prod-card-wrap">
                  <ProductCard
                    product={product}
                    cartQuantity={getCartQty(product.id)}
                    onAddToCart={onAddToCart}
                    onUpdateQty={onUpdateCartQty}
                    onClick={() => setSelectedProduct(product)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          cartQuantity={getCartQty(selectedProduct.id)}
          onAddToCart={onAddToCart}
          onUpdateQty={onUpdateCartQty}
        />
      )}
    </div>
  );
}
