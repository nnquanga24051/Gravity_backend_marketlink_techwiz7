import React, { useState, useEffect } from 'react';
import './styles/global.css';

// Layout & Common
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MobileDrawer from './components/layout/MobileDrawer';
import AIChatbot from './components/layout/AIChatbot';
import Toast from './components/common/Toast';
import AuthModal from './components/common/AuthModal';
import CartDrawer from './components/customer/CartDrawer';

// Pages & Studios - Customer
import HomePage from './pages/HomePage';
import ProductsPage from './pages/customer/ProductsPage';
import MarketsPage from './pages/customer/MarketsPage';
import StallsPage from './pages/customer/StallsPage';
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import CustomerReviewsPage from './pages/customer/CustomerReviewsPage';

// Pages - Farmer
import FarmerDashboardPage from './pages/farmer/FarmerDashboardPage';
import FarmerInventoryPage from './pages/farmer/FarmerInventoryPage';
import FarmerOrdersPage from './pages/farmer/FarmerOrdersPage';
import FarmerStallProfilePage from './pages/farmer/FarmerStallProfilePage';
import FarmerReviewsPage from './pages/farmer/FarmerReviewsPage';

// Pages - Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserModerationPage from './pages/admin/UserModerationPage';
import ContentModerationPage from './pages/admin/ContentModerationPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';

// Studios & Tools
import AdminMarketStudio from './components/AdminMarketStudio';
import OpenStreetMapRouting from './components/OpenStreetMapRouting';
import ImageUploadStudio from './components/ImageUploadStudio';

// Services
import orderService from './services/orderService';
import authService from './services/authService';

export default function App() {
  // Sanitize potentially corrupted UTF-8 string like 'Nguy?n Nh?t Quang'
  const sanitizeName = (raw) => {
    if (!raw || raw === 'Khách vãng lai') return 'Khách vãng lai';
    return raw
      .replace(/Nguy\?n\s*Nh\?t\s*Quang/gi, 'Nguyễn Nhựt Quang')
      .replace(/Nguy\?n/gi, 'Nguyễn')
      .replace(/Nh\?t/gi, 'Nhựt')
      .replace(/\?/g, '');
  };

  // Authentication & Role
  const [token, setToken] = useState(() => localStorage.getItem('ml_token') || '');
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('ml_role') || 'GUEST');
  const [userName, setUserName] = useState(() => {
    const saved = localStorage.getItem('ml_name');
    if (saved) {
      const clean = sanitizeName(saved);
      if (clean !== saved) {
        try { localStorage.setItem('ml_name', clean); } catch {}
      }
      return clean;
    }
    return 'Khách vãng lai';
  });

  // Navigation & UI state
  const [activeNav, setActiveNav] = useState('home');
  const [selectedLocation, setSelectedLocation] = useState('Hà Nội');
  const [selectedMarketFilter, setSelectedMarketFilter] = useState('all');
  const [selectedFarmerFilter, setSelectedFarmerFilter] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER' | 'FORGOT'

  // Cart state (stored in localStorage for persistence)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ml_cart');
      return saved ? JSON.parse(saved) : [
        {
          id: 101,
          name: 'Dâu Tây Mộc Châu Giống Hana (Hái Sớm)',
          price: 65000,
          unit: 'hộp 500g',
          farmerName: 'HTX Dâu Tây Mộc Châu',
          stallCode: 'Sạp A-02',
          marketName: 'Chợ Nông Sản Tây Hồ',
          imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
          quantity: 2
        }
      ];
    } catch {
      return [];
    }
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem('ml_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.warn('Error saving cart to storage', err);
    }
  }, [cartItems]);

  // Verify stored session on mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('ml_token');
      if (savedToken) {
        try {
          const profile = await authService.getCurrentUser();
          if (profile?.fullName) {
            const clean = sanitizeName(profile.fullName);
            setUserName(clean);
            localStorage.setItem('ml_name', clean);
          }
          if (profile?.roles && profile.roles.length > 0) {
            const serverRole = profile.roles[0].replace('ROLE_', '');
            setCurrentRole(serverRole);
            localStorage.setItem('ml_role', serverRole);
          }
        } catch (err) {
          console.warn('Session verification warning:', err);
          if (err.status === 401 || err.status === 403) {
            authService.logout();
            setToken('');
            setCurrentRole('GUEST');
            setUserName('Khách vãng lai');
          }
        }
      }
    };
    verifySession();
  }, []);

  const addToast = (title, message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart operations
  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    addToast(
      'Đã thêm vào giỏ đặt trước! 🌿',
      `${product.name} được đặt giữ chỗ tại ${product.marketName || 'chợ phiên'}.`,
      'success'
    );
  };

  const handleUpdateCartQty = (product, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(product.id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === product.id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    addToast('Đã bỏ món khỏi giỏ', 'Bạn có thể chọn lại sản phẩm khác bất kỳ lúc nào.', 'info');
  };

  const handleSubmitOrder = async (orderPayload, metaDetails = {}) => {
    try {
      let finalPayload = orderPayload;
      if (!finalPayload || !finalPayload.items) {
        const firstItem = (cartItems && cartItems.length > 0) ? cartItems[0] : null;
        const farmerId = firstItem?.farmerId || 103;
        const marketId = firstItem?.marketId || 101;
        const slotId = 101; // Ca sáng 07:00 - 08:00
        
        const now = new Date();
        now.setDate(now.getDate() + 1);
        const pickupDate = now.toISOString().split('T')[0];

        finalPayload = {
          farmerId: Number(farmerId),
          marketId: Number(marketId),
          slotId: Number(slotId),
          pickupDate: pickupDate,
          note: metaDetails.customerNote || orderPayload?.customerNote || 'Đặt trước qua sàn MarketLink',
          items: cartItems.map((it) => ({
            productId: Number(it.productId || it.id || 101),
            quantity: Number(it.quantity || 1)
          }))
        };
      }

      const result = await orderService.createOrder(finalPayload);
      const code = result?.orderCode || result?.data?.orderCode || 'ORD-' + Math.floor(1000 + Math.random() * 9000);

      addToast(
        `Đặt trước thành công! 🎉 Mã đơn: #${code}`,
        `Đơn hàng tại ${metaDetails.pickupMarket || 'sạp nông dân'} đã được ghi nhận. Hẹn bạn ghé chợ nhận hàng và thanh toán trực tiếp!`,
        'success'
      );
      setCartItems([]);
      setIsCartOpen(false);
      setActiveNav('orders');
    } catch (err) {
      console.warn('Real order submit warning:', err);
      addToast(
        'Không thể tạo đơn đặt trước',
        err?.message || 'Vui lòng kiểm tra lại thông tin hoặc đăng nhập trước khi đặt hàng.',
        'error'
      );
    }
  };

  // Auth actions
  const handleLoginSuccess = (tokenVal, roleVal, nameVal) => {
    const cleanName = sanitizeName(nameVal);
    setToken(tokenVal);
    setCurrentRole(roleVal);
    setUserName(cleanName);
    localStorage.setItem('ml_token', tokenVal);
    localStorage.setItem('ml_role', roleVal);
    localStorage.setItem('ml_name', cleanName);
    addToast('Đăng nhập thành công! 🎉', `Chào mừng ${cleanName} đến với MarketLink!`, 'success');
  };

  const handleOpenAuthModal = (mode = 'LOGIN') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    setToken('');
    setCurrentRole('GUEST');
    setUserName('Khách vãng lai');
    setActiveNav('home');
    addToast('Đã đăng xuất', 'Bạn đã đăng xuất tài khoản an toàn.', 'info');
  };

  const callApi = async (endpoint, method = 'GET', body = null) => {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const options = {
        method,
        headers
      };

      if (body) {
        options.body = body instanceof FormData ? body : JSON.stringify(body);
      }

      const res = await fetch(endpoint, options);
      let data = null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text };
      }
      return { status: res.status, data };
    } catch (err) {
      console.warn('callApi error:', err);
      return { status: 500, data: { message: err.message || 'Lỗi kết nối máy chủ.' } };
    }
  };

  const handleSwitchRole = (roleVal) => {
    setCurrentRole(roleVal);
    localStorage.setItem('ml_role', roleVal);
    if (roleVal === 'ADMIN' || roleVal === 'FARMER') {
      setIsCartOpen(false);
    }

    // Auto-navigate to respective landing page
    if (roleVal === 'FARMER') {
      setActiveNav('farmer-dashboard');
    } else if (roleVal === 'ADMIN') {
      setActiveNav('admin-dashboard');
    } else if (roleVal === 'CUSTOMER') {
      if (activeNav.startsWith('farmer-') || activeNav.startsWith('admin-')) {
        setActiveNav('home');
      }
    }

    addToast(
      'Đã đổi góc nhìn giao diện',
      `Hiện đang xem với quyền: ${
        roleVal === 'FARMER'
          ? 'Nông dân (Chủ sạp)'
          : roleVal === 'ADMIN'
          ? 'Quản trị viên'
          : roleVal === 'CUSTOMER'
          ? 'Khách hàng'
          : 'Khách vãng lai'
      }`,
      'info'
    );
  };

  const isShopper = currentRole !== 'ADMIN' && currentRole !== 'FARMER';
  const totalCartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="ml-app">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Main Responsive Header */}
      <Header
        currentRole={currentRole}
        userName={userName}
        onSwitchRole={handleSwitchRole}
        cartCount={isShopper ? totalCartCount : 0}
        onOpenCart={isShopper ? () => setIsCartOpen(true) : undefined}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        onOpenAuthModal={handleOpenAuthModal}
        activeNav={activeNav}
        onNavigate={(navKey) => setActiveNav(navKey)}
        onLogout={handleLogout}
      />

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentRole={currentRole}
        userName={userName}
        onSwitchRole={handleSwitchRole}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        activeNav={activeNav}
        onNavigate={(navKey) => setActiveNav(navKey)}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="ml-main-content">
        {/* View Router */}
        {/* Customer Views */}
        {activeNav === 'home' && (
          <HomePage
            onAddToCart={isShopper ? handleAddToCart : undefined}
            cartItems={isShopper ? cartItems : []}
            onUpdateCartQty={isShopper ? handleUpdateCartQty : undefined}
            onNavigate={(nav) => setActiveNav(nav)}
            onSelectMarketProducts={(market) => {
              if (market?.name) setSelectedMarketFilter(market.name);
              setActiveNav('products');
            }}
            onOpenFarmerRegister={() => {
              handleOpenAuthModal('REGISTER');
            }}
          />
        )}

        {activeNav === 'markets' && (
          <MarketsPage
            onNavigate={(nav) => setActiveNav(nav)}
            onSelectMarketProducts={(market) => {
              if (market?.name) setSelectedMarketFilter(market.name);
              setActiveNav('products');
            }}
            onAddToCart={isShopper ? handleAddToCart : undefined}
            cartItems={isShopper ? cartItems : []}
            onUpdateCartQty={isShopper ? handleUpdateCartQty : undefined}
          />
        )}

        {activeNav === 'products' && (
          <ProductsPage
            onAddToCart={isShopper ? handleAddToCart : undefined}
            cartItems={isShopper ? cartItems : []}
            onUpdateCartQty={isShopper ? handleUpdateCartQty : undefined}
            onNavigate={(nav) => setActiveNav(nav)}
            initialMarket={selectedMarketFilter}
          />
        )}

        {activeNav === 'farmers' && (
          <StallsPage
            onAddToCart={isShopper ? handleAddToCart : undefined}
            cartItems={isShopper ? cartItems : []}
            onUpdateCartQty={isShopper ? handleUpdateCartQty : undefined}
            onNavigate={(nav) => setActiveNav(nav)}
            initialFarmerId={selectedFarmerFilter}
          />
        )}

        {activeNav === 'orders' && (
          <CustomerOrdersPage
            onReorder={(order) => {
              const reorderedItems = order.items.map((it) => ({
                id: it.id,
                name: it.name,
                price: it.price,
                unit: it.unit,
                farmerName: order.farmerName,
                stallCode: order.stallLocation,
                marketName: order.pickupMarket,
                quantity: it.quantity
              }));
              setCartItems(reorderedItems);
              setIsCartOpen(true);
              addToast(
                'Đã nạp lại đơn cũ! 🧺',
                `Đã thêm ${reorderedItems.length} sản phẩm vào giỏ. Hãy chọn ngày và giờ hẹn ra chợ nhé!`,
                'success'
              );
            }}
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {activeNav === 'dashboard' && (
          <CustomerDashboardPage
            userName={userName}
            userEmail={token ? (localStorage.getItem('ml_email') || 'customer@marketlink.vn') : 'khach@marketlink.vn'}
            onNavigate={(nav) => setActiveNav(nav)}
            onAddToCart={handleAddToCart}
          />
        )}

        {activeNav === 'my-reviews' && (
          <CustomerReviewsPage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {/* Farmer Views */}
        {activeNav === 'farmer-dashboard' && (
          <FarmerDashboardPage
            onNavigate={(nav) => setActiveNav(nav)}
            onOpenAddProduct={() => setActiveNav('farmer-inventory')}
          />
        )}

        {activeNav === 'farmer-orders' && (
          <FarmerOrdersPage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {activeNav === 'farmer-inventory' && (
          <FarmerInventoryPage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {activeNav === 'farmer-stall' && (
          <FarmerStallProfilePage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {activeNav === 'farmer-reviews' && (
          <FarmerReviewsPage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {activeNav === 'farmer-studio' && (
          <div className="ml-container ml-page-view">
            <div className="ml-page-header">
              <span className="ml-section-subtitle">Phân hệ Nông dân</span>
              <h2 className="ml-section-title">Studio Gian Hàng & Tải Ảnh Nông Sản</h2>
              <p className="ml-section-desc">
                Đăng tải hình ảnh nông sản vừa thu hoạch, cập nhật sạp chợ để người mua đặt trước.
              </p>
            </div>
            <ImageUploadStudio token={token} callApi={callApi} />
          </div>
        )}

        {/* Admin Views */}
        {activeNav === 'admin-dashboard' && (
          <AdminDashboardPage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {(activeNav === 'admin-markets' || activeNav === 'admin-studio') && (
          <div className="ml-container ml-page-view">
            <div className="ml-page-header">
              <span className="ml-section-subtitle">Phân hệ Quản trị viên</span>
              <h2 className="ml-section-title">Quản Lý Hệ Thống Chợ Phiên & Sạp Hàng</h2>
              <p className="ml-section-desc">
                Quản lý hệ thống chợ nông sản, phân bổ sạp bán cho nông dân và ghim tọa độ bản đồ.
              </p>
            </div>
            <AdminMarketStudio callApi={callApi} role={currentRole} token={token} />
          </div>
        )}

        {activeNav === 'admin-users' && (
          <UserModerationPage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {activeNav === 'admin-orders' && (
          <AdminOrdersPage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}

        {activeNav === 'admin-content' && (
          <ContentModerationPage
            onNavigate={(nav) => setActiveNav(nav)}
          />
        )}
      </main>

      {/* Cart Drawer - Only for Customer / Guest */}
      {isShopper && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQty={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onSubmitOrder={handleSubmitOrder}
          isLoggedIn={Boolean(token && currentRole !== 'GUEST')}
          onOpenLogin={() => handleOpenAuthModal('LOGIN')}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* AI Chatbot Widget */}
      <AIChatbot token={token} />

      {/* Footer */}
      <Footer onNavigate={(navKey) => setActiveNav(navKey)} />
    </div>
  );
}
