import React, { useState, useEffect } from 'react';
import './FarmerInventoryPage.css';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import FarmerProductModal from '../../components/farmer/FarmerProductModal';
import farmerService from '../../services/farmerService';

const DAY_OF_WEEK_NAMES = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật'
};

export default function FarmerInventoryPage({ onNavigate }) {
  const [activeMainTab, setActiveMainTab] = useState('products'); // 'products' | 'templates'
  const [products, setProducts] = useState([]);
  const [stockTemplates, setStockTemplates] = useState([]);
  const [assignedMarkets, setAssignedMarkets] = useState([]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStallFilter, setSelectedStallFilter] = useState('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Weekly template modal state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    productId: '',
    marketId: '',
    dayOfWeek: 6,
    recurringQuantity: 20
  });

  const showSuccess = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Load real products & assigned markets & stock templates with Server-Side Search & Filters
  const loadData = async (kw = searchKeyword, cat = selectedCategory, stall = selectedStallFilter) => {
    setLoading(true);
    try {
      const [prods, templates, markets] = await Promise.all([
        farmerService.getFarmerProducts({
          keyword: (kw || '').trim(),
          categoryId: (cat !== 'all' && !isNaN(cat)) ? cat : '',
          marketId: (stall !== 'all' && !isNaN(stall)) ? stall : ''
        }),
        farmerService.getFarmerStockTemplates((kw || '').trim()),
        farmerService.getMyMarketAssignments()
      ]);

      if (prods && prods.length > 0) {
        setProducts(prods.map((p) => ({
          ...p,
          id: p.productId || p.id,
          name: p.name,
          categoryName: p.categoryName || 'Nông sản sạch',
          price: p.price,
          unit: p.unit || 'kg',
          stockQuantity: p.currentStock != null ? p.currentStock : 20,
          inStock: p.status === 'AVAILABLE' || (p.currentStock != null && p.currentStock > 0),
          harvestTime: 'Thu hoạch sáng sớm',
          cutoffTime: 'Chốt 20:00 trước phiên',
          imageUrl: p.imageUrl,
          organicCertified: true
        })));
      } else {
        setProducts([]);
      }

      setStockTemplates(templates || []);
      setAssignedMarkets(markets || []);

      // Set default template form selections if available
      if (prods && prods.length > 0) {
        setTemplateForm((prev) => ({
          ...prev,
          productId: prods[0].productId || prods[0].id
        }));
      }
      if (markets && markets.length > 0) {
        setTemplateForm((prev) => ({
          ...prev,
          marketId: markets[0].marketId
        }));
      }
    } catch (err) {
      console.warn('Error loading farmer inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(searchKeyword, selectedCategory, selectedStallFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchKeyword, selectedCategory, selectedStallFilter]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // Toggle inStock status and persist
  const handleToggleStock = async (p) => {
    const nextInStock = !p.inStock;
    const nextStatus = nextInStock ? 'AVAILABLE' : 'OUT_OF_STOCK';
    const nextQty = nextInStock ? (p.stockQuantity > 0 ? p.stockQuantity : 15) : 0;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((item) =>
        item.id === p.id
          ? { ...item, inStock: nextInStock, stockQuantity: nextQty }
          : item
      )
    );

    try {
      await farmerService.updateProductStatus(p.id, nextStatus);
      showSuccess(`Đã cập nhật trạng thái nông sản: ${nextInStock ? 'Mở nhận đặt' : 'Tạm hết hàng'}`);
    } catch (err) {
      console.warn('Backend updateProductStatus failed', err);
    }
  };

  // Adjust stock quantity
  const handleAdjustQty = async (p, delta) => {
    const newQty = Math.max(0, p.stockQuantity + delta);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === p.id
          ? { ...item, stockQuantity: newQty, inStock: newQty > 0 }
          : item
      )
    );

    try {
      await farmerService.updateProduct(p.id, {
        name: p.name,
        categoryId: p.categoryId,
        price: p.price,
        unit: p.unit,
        currentStock: newQty,
        imageUrl: p.imageUrl,
        originProvince: p.originProvince
      });
    } catch (err) {
      console.warn('Backend updateProduct quantity failed', err);
    }
  };

  // Save product from modal
  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await farmerService.updateProduct(editingProduct.id, productData);
        showSuccess(`Đã cập nhật thông tin "${productData.name}" thành công!`);
      } else {
        await farmerService.createProduct({
          ...productData,
          categoryId: productData.categoryId || 1,
          price: Number(productData.price) || 30000,
          currentStock: Number(productData.stockQuantity) || 20,
          unit: productData.unit || 'kg',
          status: 'AVAILABLE'
        });
        showSuccess(`Đã đăng bán nông sản mới "${productData.name}"!`);
      }
      loadData();
    } catch (err) {
      console.warn('Failed saving to backend, updating locally', err);
      loadData();
    } finally {
      setIsProductModalOpen(false);
      setEditingProduct(null);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nông sản này khỏi kho sạp chợ?')) {
      try {
        await farmerService.deleteProduct(id);
        showSuccess('Đã xóa nông sản khỏi kho sạp!');
      } catch (err) {
        console.warn('Backend delete product failed', err);
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Weekly stock template save
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.productId || !templateForm.marketId) {
      alert('Vui lòng chọn sản phẩm và chợ phiên áp dụng!');
      return;
    }

    try {
      await farmerService.saveFarmerStockTemplate({
        productId: Number(templateForm.productId),
        marketId: Number(templateForm.marketId),
        dayOfWeek: Number(templateForm.dayOfWeek),
        recurringQuantity: Number(templateForm.recurringQuantity),
        isActive: true
      });
      showSuccess('Đã lưu mẫu định mức tồn kho tự động hàng tuần!');
      setIsTemplateModalOpen(false);
      const updated = await farmerService.getFarmerStockTemplates();
      setStockTemplates(updated || []);
    } catch (err) {
      alert('Lưu định mức thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete stock template
  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Bạn có chắc muốn xóa định mức tồn kho mẫu này?')) {
      try {
        await farmerService.deleteFarmerStockTemplate(templateId);
        setStockTemplates((prev) => prev.filter((t) => t.templateId !== templateId));
        showSuccess('Đã xóa định mức mẫu thành công!');
      } catch (err) {
        alert('Xóa định mức thất bại: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Products are filtered entirely on server-side
  const filteredProducts = products;

  return (
    <div className="ml-farmer-inv-page">
      {/* Banner */}
      <div className="ml-farmer-inv-banner">
        <div className="ml-container ml-inv-banner-inner">
          <div>
            <span className="ml-section-subtitle">Kho Sạp Chợ Nông Dân</span>
            <h1 className="ml-inv-title">Quản Lý Sản Lượng & Nông Sản Mở Bán</h1>
            <p className="ml-inv-subtitle">
              Cập nhật số lượng nông sản dự kiến hái cho phiên chợ tới. Tự động đóng đặt trước khi hết hàng hoặc qua giờ chốt đơn.
            </p>
          </div>

          <div className="ml-inv-banner-actions">
            {activeMainTab === 'products' ? (
              <Button
                variant="accent"
                size="lg"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
              >
                + Đăng bán nông sản mới
              </Button>
            ) : (
              <Button
                variant="accent"
                size="lg"
                onClick={() => setIsTemplateModalOpen(true)}
              >
                + Thêm định mức tuần mới
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="ml-container ml-inv-content">
        {/* Success Alert Banner */}
        {actionSuccessMsg && (
          <div className="ml-alert-success">
            ✓ {actionSuccessMsg}
          </div>
        )}

        {/* Main Tab Navigation: Products vs Stock Templates */}
        <div className="ml-inv-main-tabs">
          <button
            type="button"
            className={`ml-inv-main-tab ${activeMainTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('products')}
          >
            📦 Nông sản đang bán ({products.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeMainTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('templates')}
          >
            🔁 Định mức tồn kho hàng tuần ({stockTemplates.length})
          </button>
        </div>

        {/* ================= TAB 1: PRODUCTS LIST ================= */}
        {activeMainTab === 'products' && (
          <>
            {/* Search and Filters */}
            <div className="ml-card ml-inv-controls">
              <div className="ml-inv-search">
                <span className="ml-inv-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm theo tên rau, củ, quả trong sạp..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="ml-inv-search-input"
                />
              </div>

              <div className="ml-inv-filters">
                <button
                  type="button"
                  className={`ml-inv-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  Tất cả ({products.length})
                </button>
                <button
                  type="button"
                  className={`ml-inv-chip ${selectedCategory === 'veg' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('veg')}
                >
                  🥬 Rau ăn lá
                </button>
                <button
                  type="button"
                  className={`ml-inv-chip ${selectedCategory === 'fruit_veg' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('fruit_veg')}
                >
                  🥕 Củ quả
                </button>
                <button
                  type="button"
                  className={`ml-inv-chip ${selectedCategory === 'fruit' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('fruit')}
                >
                  🍓 Trái cây
                </button>

                {assignedMarkets.length > 0 && (
                  <select
                    className="ml-inv-stall-select"
                    value={selectedStallFilter}
                    onChange={(e) => setSelectedStallFilter(e.target.value)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1.5px solid #16a34a',
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      fontWeight: 600,
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">🏪 Tất cả sạp & chợ ({products.length})</option>
                    {assignedMarkets.map((m, idx) => (
                      <option key={idx} value={m.marketId}>
                        {m.stallNumber || 'Sạp'} — {m.marketName || `Chợ #${m.marketId}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {loading && <div className="ml-inv-loading">Đang tải nông sản từ máy chủ...</div>}

            {filteredProducts.length === 0 ? (
              <div className="ml-card ml-inv-empty">
                <span className="ml-inv-empty-icon">🌱</span>
                <h3>Kho nông sản của bạn đang trống</h3>
                <p>Bắt đầu đăng bán những món rau củ thu hoạch sớm đầu tiên cho phiên chợ cuối tuần.</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsProductModalOpen(true);
                  }}
                >
                  Đăng món đầu tiên
                </Button>
              </div>
            ) : (
              <div className="ml-inv-grid">
                {filteredProducts.map((p) => (
                  <div key={p.id} className={`ml-card ml-inv-card ${!p.inStock ? 'out-of-stock' : ''}`}>
                    <div className="ml-inv-card-body">
                      <img src={p.imageUrl} alt={p.name} className="ml-inv-img" />

                      <div className="ml-inv-info">
                        <div className="ml-inv-badges">
                          {p.inStock ? (
                            <Badge variant="ready" size="sm">Đang mở đặt</Badge>
                          ) : (
                            <Badge variant="cancelled" size="sm">Tạm hết hàng</Badge>
                          )}
                          {p.organicCertified && (
                            <Badge variant="organic" size="sm">VietGAP / Hữu cơ</Badge>
                          )}
                        </div>

                        <h4 className="ml-inv-name">{p.name}</h4>
                        <div className="ml-inv-price">
                          {formatCurrency(p.price)} <span className="ml-unit">/ {p.unit}</span>
                        </div>

                        <div className="ml-inv-meta">
                          <span style={{ color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            🏪 {p.stallNumber || p.stallCode || 'Chưa gán sạp'} — {p.marketName || 'Chợ phiên'}
                          </span>
                          <span>🌱 {p.harvestTime}</span>
                          <span>⏰ {p.cutoffTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Controls */}
                    <div className="ml-inv-card-footer">
                      <div className="ml-inv-stock-control">
                        <span className="ml-stock-label">Số lượng có thể nhận đặt:</span>
                        <div className="ml-stock-stepper">
                          <button
                            type="button"
                            className="ml-step-btn"
                            onClick={() => handleAdjustQty(p, -5)}
                            disabled={!p.inStock || p.stockQuantity <= 0}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            className="ml-step-btn"
                            onClick={() => handleAdjustQty(p, -1)}
                            disabled={!p.inStock || p.stockQuantity <= 0}
                          >
                            -1
                          </button>
                          <span className="ml-stock-display">
                            <strong>{p.stockQuantity}</strong> {p.unit}
                          </span>
                          <button
                            type="button"
                            className="ml-step-btn"
                            onClick={() => handleAdjustQty(p, +1)}
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            className="ml-step-btn"
                            onClick={() => handleAdjustQty(p, +5)}
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      <div className="ml-inv-action-buttons">
                        <Button
                          variant={p.inStock ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStock(p)}
                        >
                          {p.inStock ? 'Tạm dừng nhận đơn' : 'Mở lại đặt trước'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(p);
                            setIsProductModalOpen(true);
                          }}
                        >
                          ✏️ Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-danger-text"
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          🗑️ Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: WEEKLY RECURRING STOCK TEMPLATES ================= */}
        {activeMainTab === 'templates' && (
          <div className="ml-card ml-templates-section">
            <div className="ml-templates-header">
              <div>
                <h3 className="ml-card-title">🔁 Định mức phân bổ sản lượng tự động hàng tuần</h3>
                <p className="ml-templates-desc">
                  Thiết lập sẵn sản lượng nông sản bạn dự kiến thu hoạch và mang đến từng phiên chợ theo thứ trong tuần. 
                  Hệ thống tự động kích hoạt số lượng mở bán mỗi chu kỳ họp chợ mà không cần nhập tay lại.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsTemplateModalOpen(true)}
              >
                + Thêm định mức mới
              </Button>
            </div>

            {stockTemplates.length === 0 ? (
              <div className="ml-templates-empty">
                <span className="ml-templates-empty-icon">📅</span>
                <h4>Chưa có định mức tuần nào được tạo</h4>
                <p>Thêm định mức hàng tuần giúp nông trại tự động mở bán đúng ngày họp chợ phiên.</p>
                <Button variant="outline" size="sm" onClick={() => setIsTemplateModalOpen(true)}>
                  Tạo định mức đầu tiên
                </Button>
              </div>
            ) : (
              <div className="ml-templates-table-wrap">
                <table className="ml-templates-table">
                  <thead>
                    <tr>
                      <th>Thứ trong tuần</th>
                      <th>Nông sản</th>
                      <th>Chợ phiên áp dụng</th>
                      <th>Định mức mở bán</th>
                      <th>Trạng thái</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockTemplates.map((t) => (
                      <tr key={t.templateId}>
                        <td>
                          <span className="ml-day-badge">
                            {DAY_OF_WEEK_NAMES[t.dayOfWeek] || `Thứ ${t.dayOfWeek}`}
                          </span>
                        </td>
                        <td>
                          <div className="ml-tbl-prod">
                            <strong>{t.productName || `Sản phẩm #${t.productId}`}</strong>
                            <span className="ml-tbl-unit">{formatCurrency(t.productPrice)} / {t.productUnit || 'kg'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ml-tbl-market">🎪 {t.marketName || `Chợ #${t.marketId}`}</span>
                        </td>
                        <td>
                          <strong className="ml-tbl-qty">{t.recurringQuantity} {t.productUnit || 'kg'}</strong>
                        </td>
                        <td>
                          <Badge variant={t.isActive ? 'ready' : 'cancelled'} size="sm">
                            {t.isActive ? 'Đang kích hoạt' : 'Tạm ngưng'}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-danger-text"
                            onClick={() => handleDeleteTemplate(t.templateId)}
                          >
                            🗑️ Xóa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <FarmerProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          assignedMarkets={assignedMarkets}
          onSave={handleSaveProduct}
        />
      )}

      {/* Weekly Stock Template Modal */}
      {isTemplateModalOpen && (
        <div className="ml-modal-overlay">
          <div className="ml-modal-box">
            <div className="ml-modal-header">
              <h3>Thêm định mức tồn kho mẫu hàng tuần</h3>
              <button
                type="button"
                className="ml-modal-close"
                onClick={() => setIsTemplateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="ml-modal-form">
              <div className="ml-form-group">
                <label className="ml-form-label">Chọn nông sản trong vườn:</label>
                <select
                  className="ml-form-input"
                  value={templateForm.productId}
                  onChange={(e) => setTemplateForm({ ...templateForm, productId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price)} / {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="ml-form-group">
                <label className="ml-form-label">Chợ phiên áp dụng:</label>
                <select
                  className="ml-form-input"
                  value={templateForm.marketId}
                  onChange={(e) => setTemplateForm({ ...templateForm, marketId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn chợ phiên --</option>
                  {assignedMarkets.map((m) => (
                    <option key={m.assignmentId || m.marketId} value={m.marketId}>
                      {m.marketName || `Chợ #${m.marketId}`} - Sạp: {m.stallNumber || 'Chính'}
                    </option>
                  ))}
                  {assignedMarkets.length === 0 && (
                    <option value="101">Chợ Nông Sản Tây Hồ Eco (Mặc định)</option>
                  )}
                </select>
              </div>

              <div className="ml-form-grid-2">
                <div className="ml-form-group">
                  <label className="ml-form-label">Thứ họp chợ hàng tuần:</label>
                  <select
                    className="ml-form-input"
                    value={templateForm.dayOfWeek}
                    onChange={(e) => setTemplateForm({ ...templateForm, dayOfWeek: Number(e.target.value) })}
                    required
                  >
                    <option value={6}>Thứ Bảy (Phiên chính cuối tuần)</option>
                    <option value={7}>Chủ Nhật (Phiên cuối tuần)</option>
                    <option value={1}>Thứ Hai</option>
                    <option value={2}>Thứ Ba</option>
                    <option value={3}>Thứ Tư</option>
                    <option value={4}>Thứ Năm</option>
                    <option value={5}>Thứ Sáu</option>
                  </select>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Sản lượng định mức (kg/bó):</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    className="ml-form-input"
                    value={templateForm.recurringQuantity}
                    onChange={(e) => setTemplateForm({ ...templateForm, recurringQuantity: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="ml-modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsTemplateModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary">
                  Lưu định mức tự động
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
