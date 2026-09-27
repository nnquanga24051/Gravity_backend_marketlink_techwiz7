import React from 'react';
import './MobileDrawer.css';
import Button from '../common/Button';

export default function MobileDrawer({
  isOpen,
  onClose,
  currentRole,
  userName = 'Khách vãng lai',
  onSwitchRole,
  selectedLocation,
  onSelectLocation,
  activeNav,
  onNavigate,
  onOpenAuthModal,
  onLogout
}) {
  if (!isOpen) return null;

  const locations = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Lạt', 'Mộc Châu', 'Cần Thơ'];

  const formatName = (name) => {
    if (!name || name === 'Khách vãng lai') return 'Khách vãng lai';
    return name
      .replace(/Nguy\?n\s*Nh\?t\s*Quang/gi, 'Nguyễn Nhựt Quang')
      .replace(/Nguy\?n/gi, 'Nguyễn')
      .replace(/Nh\?t/gi, 'Nhựt')
      .replace(/\?/g, '');
  };

  const displayName = formatName(userName);
  const avatarLetter = (displayName && displayName.trim().length > 0)
    ? displayName.trim().charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="ml-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ml-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ml-drawer-header">
          <div className="ml-brand">
            <div className="ml-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a9 9 0 0 1 9 9v1a9 9 0 0 1-9 9 9 9 0 0 1-9-9v-1a9 9 0 0 1 9-9Z" fill="#E8F5E9" stroke="#2E7D32"/>
                <path d="M12 21V11" stroke="#1B5E20"/>
              </svg>
            </div>
            <div className="ml-brand-text">
              <span className="ml-brand-title">Market<span className="ml-brand-title-accent">Link</span></span>
              <span className="ml-brand-tagline">Nông sản sạch từ vườn</span>
            </div>
          </div>
          <button 
            type="button" 
            className="ml-drawer-close"
            onClick={onClose}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="ml-drawer-body">
          {/* User Profile Card if logged in */}
          {currentRole !== 'GUEST' && (
            <div className="ml-drawer-user-card">
              <div className="ml-drawer-user-avatar">
                {avatarLetter}
              </div>
              <div className="ml-drawer-user-info">
                <div className="ml-drawer-user-name">{displayName}</div>
                <div className="ml-drawer-user-role">
                  {currentRole === 'ADMIN' ? '🛡️ Quản trị viên' : currentRole === 'FARMER' ? '👨‍🌾 Nông dân (Chủ sạp)' : '🛒 Khách hàng'}
                </div>
              </div>
            </div>
          )}

          {/* Location picker */}
          <div className="ml-drawer-section">
            <div className="ml-drawer-section-title">Khu vực chợ của bạn</div>
            <div className="ml-drawer-chips">
              {locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`ml-drawer-chip ${loc === selectedLocation ? 'active' : ''}`}
                  onClick={() => onSelectLocation(loc)}
                >
                  📍 {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="ml-drawer-section">
            <div className="ml-drawer-section-title">Khám phá</div>
            <nav className="ml-drawer-nav">
              <button 
                type="button"
                className={`ml-drawer-nav-item ${activeNav === 'home' ? 'active' : ''}`}
                onClick={() => { onNavigate('home'); onClose(); }}
              >
                🏠 Trang chủ
              </button>
              <button 
                type="button"
                className={`ml-drawer-nav-item ${activeNav === 'markets' ? 'active' : ''}`}
                onClick={() => { onNavigate('markets'); onClose(); }}
              >
                🎪 Khám phá các chợ phiên
              </button>
              <button 
                type="button"
                className={`ml-drawer-nav-item ${activeNav === 'products' ? 'active' : ''}`}
                onClick={() => { onNavigate('products'); onClose(); }}
              >
                🥦 Nông sản tươi theo mùa
              </button>
              <button 
                type="button"
                className={`ml-drawer-nav-item ${activeNav === 'farmers' ? 'active' : ''}`}
                onClick={() => { onNavigate('farmers'); onClose(); }}
              >
                👨‍🌾 Gian hàng nông dân
              </button>
              <button 
                type="button"
                className={`ml-drawer-nav-item ${activeNav === 'announcements' ? 'active' : ''}`}
                onClick={() => { onNavigate('announcements'); onClose(); }}
              >
                📢 Bản tin & Thông báo chợ
              </button>
              {currentRole === 'CUSTOMER' && (
                <>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'orders' ? 'active' : ''}`}
                    onClick={() => { onNavigate('orders'); onClose(); }}
                  >
                    📦 Đơn đặt trước của tôi
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
                    onClick={() => { onNavigate('dashboard'); onClose(); }}
                  >
                    👤 Dashboard cá nhân & sạp thích
                  </button>
                </>
              )}
              {currentRole === 'FARMER' && (
                <>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'farmer-dashboard' ? 'active' : ''}`}
                    onClick={() => { onNavigate('farmer-dashboard'); onClose(); }}
                  >
                    📊 Tổng quan sạp chợ
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'farmer-orders' ? 'active' : ''}`}
                    onClick={() => { onNavigate('farmer-orders'); onClose(); }}
                  >
                    📦 Đơn khách đặt trước
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'farmer-inventory' ? 'active' : ''}`}
                    onClick={() => { onNavigate('farmer-inventory'); onClose(); }}
                  >
                    🥬 Quản lý kho nông sản
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'farmer-stall' ? 'active' : ''}`}
                    onClick={() => { onNavigate('farmer-stall'); onClose(); }}
                  >
                    🎪 Hồ sơ sạp & chợ đăng ký
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'farmer-reviews' ? 'active' : ''}`}
                    onClick={() => { onNavigate('farmer-reviews'); onClose(); }}
                  >
                    💬 Đánh giá từ khách
                  </button>
                </>
              )}
              {currentRole === 'ADMIN' && (
                <>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'admin-dashboard' ? 'active' : ''}`}
                    onClick={() => { onNavigate('admin-dashboard'); onClose(); }}
                  >
                    📊 Tổng quan sàn MarketLink
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'admin-markets' ? 'active' : ''}`}
                    onClick={() => { onNavigate('admin-markets'); onClose(); }}
                  >
                    🎪 Quản lý chợ & sạp
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'admin-users' ? 'active' : ''}`}
                    onClick={() => { onNavigate('admin-users'); onClose(); }}
                  >
                    👥 Quản lý người dùng & KYC
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'admin-orders' ? 'active' : ''}`}
                    onClick={() => { onNavigate('admin-orders'); onClose(); }}
                  >
                    📦 Giám sát đơn toàn sàn
                  </button>
                  <button 
                    type="button"
                    className={`ml-drawer-nav-item ${activeNav === 'admin-content' ? 'active' : ''}`}
                    onClick={() => { onNavigate('admin-content'); onClose(); }}
                  >
                    🛡️ Kiểm duyệt & Vận hành
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Auth Actions */}
          <div className="ml-drawer-auth">
            {currentRole === 'GUEST' ? (
              <div className="ml-drawer-auth-buttons">
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={() => { onOpenAuthModal('LOGIN'); onClose(); }}
                >
                  Đăng nhập
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={() => { onOpenAuthModal('REGISTER'); onClose(); }}
                >
                  Đăng ký tài khoản
                </Button>
              </div>
            ) : (
              <button 
                type="button"
                className="ml-drawer-logout-btn"
                onClick={() => { if (onLogout) onLogout(); onClose(); }}
              >
                🚪 Đăng xuất tài khoản
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="ml-drawer-footer">
          <p>📞 Hotline hỗ trợ chợ phiên: <strong>1900 8899</strong></p>
          <span className="ml-drawer-pledge">Cam kết 100% nông sản sạch địa phương</span>
        </div>
      </div>
    </div>
  );
}
