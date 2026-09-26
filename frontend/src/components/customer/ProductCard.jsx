import React from 'react';
import './ProductCard.css';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function ProductCard({
  product,
  onAddToCart,
  cartQuantity = 0,
  onUpdateCartQty
}) {
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
    harvestTime = 'Thu hoạch sáng nay',
    imageUrl,
    organicCertified = true
  } = product;

  const fallbackImg = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';

  const isOutOfStock = stockQuantity <= 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className={`ml-card ml-product-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}>
      <div className="ml-product-img-wrap">
        <img 
          src={imageUrl || fallbackImg} 
          alt={name} 
          className="ml-product-img"
          loading="lazy"
          onError={(e) => { e.target.src = fallbackImg; }}
        />
        
        {/* Badges Overlay */}
        <div className="ml-product-badges">
          {organicCertified && (
            <Badge variant="organic" size="sm">🌿 Hữu cơ</Badge>
          )}
          {isOutOfStock ? (
            <Badge variant="cancelled" size="sm">Hết hàng</Badge>
          ) : (
            <span className="ml-harvest-tag">⚡ {harvestTime}</span>
          )}
        </div>
      </div>

      <div className="ml-product-body">
        {/* Origin & Stall */}
        <div className="ml-product-origin">
          <span className="ml-farmer-name">🏡 {farmerName}</span>
          <span className="ml-stall-code">{stallCode}</span>
        </div>

        {/* Product Title */}
        <h4 className="ml-product-title" title={name}>{name}</h4>
        
        {/* Market location hint */}
        <div className="ml-product-market-hint">
          <span>🎪 Nhận tại: <strong>{marketName}</strong></span>
        </div>

        {/* Stock Meter */}
        <div className="ml-product-stock-wrap">
          {!isOutOfStock ? (
            <span className="ml-stock-text">Còn lại: <strong>{stockQuantity} {unit}</strong></span>
          ) : (
            <span className="ml-stock-text out">Sạp sẽ bổ sung vào phiên sau</span>
          )}
        </div>

        {/* Price & CTA */}
        <div className="ml-product-footer">
          <div className="ml-product-price-box">
            <span className="ml-product-price">{formatCurrency(price)}</span>
            <span className="ml-product-unit">/ {unit}</span>
          </div>

          {onAddToCart && (
            <div className="ml-product-action" onClick={(e) => e.stopPropagation()}>
              {cartQuantity > 0 ? (
                <div className="ml-qty-control">
                  <button 
                    type="button" 
                    className="ml-qty-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateCartQty && onUpdateCartQty(product, cartQuantity - 1);
                    }}
                    aria-label="Giảm số lượng"
                  >
                    -
                  </button>
                  <span className="ml-qty-num">{cartQuantity}</span>
                  <button 
                    type="button" 
                    className="ml-qty-btn"
                    disabled={cartQuantity >= stockQuantity}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateCartQty && onUpdateCartQty(product, cartQuantity + 1);
                    }}
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>
              ) : (
                <Button
                  variant="accent"
                  size="sm"
                  disabled={isOutOfStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  icon={<span>+</span>}
                >
                  Đặt trước
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
