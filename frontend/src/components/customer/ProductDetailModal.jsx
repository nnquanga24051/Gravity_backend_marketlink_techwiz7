import React, { useState } from 'react';
import './ProductDetailModal.css';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  cartQuantity = 0,
  onUpdateCartQty
}) {
  if (!product) return null;

  const [selectedQty, setSelectedQty] = useState(1);

  const {
    id,
    name,
    categoryName = 'Rau hữu cơ',
    price = 25000,
    unit = 'kg',
    farmerName = 'Nông Trại Xanh Ba Vì',
    stallCode = 'Sạp A-04',
    marketName = 'Chợ Tây Hồ',
    stockQuantity = 20,
    harvestTime = 'Thu hoạch sáng nay lúc 04:30',
    description = 'Được canh tác tự nhiên không sử dụng thuốc trừ sâu hóa học, tưới bằng nguồn nước suối nguồn sạch. Thu hoạch sớm tinh sương và vận chuyển thẳng tới sạp chợ để giữ nguyên vị ngọt tự nhiên và độ giòn tươi.',
    imageUrl,
    organicCertified = true,
    cutoffTime = 'Chốt đơn lúc 20:00 tối nay'
  } = product;

  const fallbackImg = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80';
  const isOutOfStock = stockQuantity <= 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleAdd = () => {
    if (onAddToCart) {
      for (let i = 0; i < selectedQty; i++) {
        onAddToCart(product);
      }
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={name}
      subtitle={`Thuộc sạp ${farmerName} • ${stallCode}`}
      maxWidth="680px"
    >
      <div className="ml-product-detail-modal">
        <div className="ml-detail-grid">
          {/* Left: Product Image */}
          <div className="ml-detail-img-box">
            <img 
              src={imageUrl || fallbackImg} 
              alt={name} 
              className="ml-detail-main-img" 
              onError={(e) => { e.target.src = fallbackImg; }}
            />
            <div className="ml-detail-img-badges">
              {organicCertified && <Badge variant="organic" size="sm">🌿 Hữu cơ kiểm định</Badge>}
              <span className="ml-cutoff-pill">⏰ {cutoffTime}</span>
            </div>
          </div>

          {/* Right: Info & Ordering */}
          <div className="ml-detail-info-col">
            <div className="ml-detail-price-row">
              <span className="ml-detail-price">{formatCurrency(price)}</span>
              <span className="ml-detail-unit">/ {unit}</span>
            </div>

            <div className="ml-detail-meta-list">
              <div className="ml-detail-meta-item">
                <span className="ml-meta-label">Nhà vườn:</span>
                <span className="ml-meta-val">🏡 {farmerName}</span>
              </div>
              <div className="ml-detail-meta-item">
                <span className="ml-meta-label">Điểm nhận hàng:</span>
                <span className="ml-meta-val">🎪 {marketName} ({stallCode})</span>
              </div>
              <div className="ml-detail-meta-item">
                <span className="ml-meta-label">Thời điểm cắt:</span>
                <span className="ml-meta-val">⚡ {harvestTime}</span>
              </div>
              <div className="ml-detail-meta-item">
                <span className="ml-meta-label">Tình trạng kho:</span>
                <span className={`ml-meta-val ${isOutOfStock ? 'out' : 'in'}`}>
                  {isOutOfStock ? 'Đã hết hàng cho phiên này' : `Còn ${stockQuantity} ${unit}`}
                </span>
              </div>
            </div>

            <div className="ml-detail-desc-box">
              <h5 className="ml-desc-title">Mô tả nông sản:</h5>
              <p className="ml-desc-text">{description}</p>
            </div>

            {/* Quantity Selector & Action */}
            {onAddToCart ? (
              <div className="ml-detail-order-actions">
                <div className="ml-detail-qty-picker">
                  <label className="ml-qty-label">Số lượng đặt:</label>
                  <div className="ml-qty-control">
                    <button 
                      type="button" 
                      className="ml-qty-btn"
                      disabled={selectedQty <= 1}
                      onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    >
                      -
                    </button>
                    <span className="ml-qty-num">{selectedQty}</span>
                    <button 
                      type="button" 
                      className="ml-qty-btn"
                      disabled={selectedQty >= stockQuantity}
                      onClick={() => setSelectedQty(Math.min(stockQuantity, selectedQty + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <Button
                  variant="accent"
                  size="lg"
                  fullWidth
                  disabled={isOutOfStock}
                  onClick={handleAdd}
                  icon={<span>🧺</span>}
                >
                  {isOutOfStock ? 'Tạm hết hàng' : `Đặt trước • ${formatCurrency(price * selectedQty)}`}
                </Button>

                <div className="ml-detail-guarantee">
                  ✓ Nhận tại sạp chợ • Kiểm tra độ tươi trước khi trả tiền mặt
                </div>
              </div>
            ) : (
              <div className="ml-detail-guarantee" style={{ marginTop: '20px', textAlign: 'center', background: 'var(--color-bg-base)', padding: '14px', borderRadius: '12px' }}>
                🌾 Chế độ quản lý (Admin / Farmer): Chỉ xem thông tin niêm yết của sạp
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
