import React from 'react';
import './Footer.css';

export default function Footer({ onNavigate }) {
  return (
    <footer className="ml-footer">
      {/* Trust Badges Strip */}
      <div className="ml-footer-badges">
        <div className="ml-container ml-badges-grid">
          <div className="ml-badge-card">
            <span className="ml-badge-icon">🌱</span>
            <div>
              <div className="ml-badge-card-title">100% Thu hoạch sớm</div>
              <div className="ml-badge-card-desc">Nông sản tươi rói từ vườn đem ra sạp chợ sáng</div>
            </div>
          </div>
          <div className="ml-badge-card">
            <span className="ml-badge-icon">🧺</span>
            <div>
              <div className="ml-badge-card-title">Đặt trước - Giữ món ngon</div>
              <div className="ml-badge-card-desc">Không lo cháy hàng, sạp giữ sẵn phần cho bạn</div>
            </div>
          </div>
          <div className="ml-badge-card">
            <span className="ml-badge-icon">🤝</span>
            <div>
              <div className="ml-badge-card-title">Ủng hộ nông dân địa phương</div>
              <div className="ml-badge-card-desc">Giao dịch trực tiếp, không qua tầng trung gian ép giá</div>
            </div>
          </div>
          <div className="ml-badge-card">
            <span className="ml-badge-icon">💵</span>
            <div>
              <div className="ml-badge-card-title">Nhận hàng rồi mới thanh toán</div>
              <div className="ml-badge-card-desc">Kiểm tra tận mắt độ tươi ngon ngay tại sạp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="ml-container ml-footer-main">
        <div className="ml-footer-grid">
          {/* Brand Info */}
          <div className="ml-footer-col ml-footer-brand-col">
            <div className="ml-brand">
              <div className="ml-brand-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a9 9 0 0 1 9 9v1a9 9 0 0 1-9 9 9 9 0 0 1-9-9v-1a9 9 0 0 1 9-9Z" fill="#E8F5E9" stroke="#2E7D32"/>
                  <path d="M12 21V11" stroke="#1B5E20"/>
                </svg>
              </div>
              <div className="ml-brand-text">
                <span className="ml-brand-title">Market<span className="ml-brand-title-accent">Link</span></span>
                <span className="ml-brand-tagline">Nông sản sạch từ vườn đến chợ</span>
              </div>
            </div>
            <p className="ml-footer-desc">
              MarketLink là nền tảng số hóa chợ nông sản địa phương, kết nối những người nông dân tâm huyết với cư dân đô thị, mang lại bữa ăn lành mạnh và giữ trọn nét đẹp văn hóa chợ phiên truyền thống.
            </p>
            <div className="ml-footer-meta">
              <span>📍 Trụ sở: Tòa nhà TechWiz, Hà Nội</span>
              <span>✉️ lienhe@marketlink.vn</span>
            </div>
          </div>

          {/* Column: Khách hàng */}
          <div className="ml-footer-col">
            <h4 className="ml-footer-heading">Dành cho khách hàng</h4>
            <ul className="ml-footer-links">
              <li><button type="button" onClick={() => onNavigate('markets')}>Tìm chợ nông sản gần đây</button></li>
              <li><button type="button" onClick={() => onNavigate('products')}>Rau củ hữu cơ theo mùa</button></li>
              <li><button type="button" onClick={() => onNavigate('home')}>Cách thức đặt trước & nhận tại sạp</button></li>
              <li><button type="button" onClick={() => onNavigate('farmers')}>Danh sách sạp nông dân uy tín</button></li>
            </ul>
          </div>

          {/* Column: Nông dân */}
          <div className="ml-footer-col">
            <h4 className="ml-footer-heading">Dành cho nông dân</h4>
            <ul className="ml-footer-links">
              <li><button type="button" onClick={() => onNavigate('farmers')}>Đăng ký mở sạp bán tại chợ</button></li>
              <li><button type="button" onClick={() => onNavigate('home')}>Quy trình xác thực nông sản sạch</button></li>
              <li><button type="button" onClick={() => onNavigate('home')}>Chính sách hỗ trợ nông hộ nhỏ lẻ</button></li>
              <li><button type="button" onClick={() => onNavigate('home')}>Lịch đăng ký chợ phiên cuối tuần</button></li>
            </ul>
          </div>

          {/* Column: Cam kết */}
          <div className="ml-footer-col">
            <h4 className="ml-footer-heading">Chợ phiên nổi bật</h4>
            <div className="ml-footer-tag-cloud">
              <span className="ml-footer-tag">Chợ Phiên Yên Hòa</span>
              <span className="ml-footer-tag">Chợ Xanh Thảo Điền</span>
              <span className="ml-footer-tag">Chợ Nông Sản Tây Hồ</span>
              <span className="ml-footer-tag">Chợ Sớm Ba Vì</span>
              <span className="ml-footer-tag">Chợ Đêm Nông Sản</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="ml-footer-bottom">
          <p>© 2026 MarketLink Platform. Dự án số hóa nông sản TechWiz 7. Bảo lưu mọi quyền.</p>
          <div className="ml-footer-bottom-links">
            <a href="#privacy">Chính sách bảo mật</a>
            <a href="#terms">Điều khoản sử dụng</a>
            <a href="#contact">Liên hệ hỗ trợ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
