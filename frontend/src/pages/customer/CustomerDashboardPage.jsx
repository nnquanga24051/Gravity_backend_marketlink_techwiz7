import React, { useState, useEffect } from 'react';
import './CustomerDashboardPage.css';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ImageUploadInput from '../../components/ImageUploadInput';
import customerService from '../../services/customerService';
import orderService from '../../services/orderService';
import marketService from '../../services/marketService';
import announcementService from '../../services/announcementService';
import Modal from '../../components/common/Modal';

export default function CustomerDashboardPage({
  userName: propUserName,
  userEmail: propUserEmail,
  onNavigate,
  onAddToCart
}) {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Profile data
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState(propUserName || '');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit Profile Modal State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    defaultAddress: '',
    avatarUrl: ''
  });

  // Metrics & Orders
  const [orders, setOrders] = useState([]);
  const [upcomingOrder, setUpcomingOrder] = useState(null);

  // Favorites
  const [favoriteFarmers, setFavoriteFarmers] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);

  // Family Account
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyInvitations, setFamilyInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [acceptToken, setAcceptToken] = useState('');
  const [familyLoading, setFamilyLoading] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [profData, myOrders, favFarmers, favProds, famMembers, famInvs, annList] = await Promise.all([
          customerService.getProfile(),
          orderService.getMyOrders(),
          customerService.getFavorites('FARMER'),
          customerService.getFavorites('PRODUCT'),
          customerService.getFamilyMembers(),
          customerService.getFamilyInvitations(),
          announcementService.getActiveAnnouncements()
        ]);

        if (!isMounted) return;

        if (profData) {
          setProfile(profData);
          setFullName(profData.fullName || propUserName || '');
          setPhone(profData.phoneNumber || '');
          setDefaultAddress(profData.defaultAddress || '');
          setEditForm({
            fullName: profData.fullName || propUserName || '',
            phone: profData.phoneNumber || '',
            defaultAddress: profData.defaultAddress || '',
            avatarUrl: profData.avatarUrl || ''
          });
        }

        if (myOrders && myOrders.length > 0) {
          setOrders(myOrders);
          // Find first upcoming active order
          const upcoming = myOrders.find((o) =>
            o.orderStatus === 'READY_FOR_PICKUP' ||
            o.orderStatus === 'READY' ||
            o.orderStatus === 'ACCEPTED' ||
            o.orderStatus === 'PLACED'
          );
          setUpcomingOrder(upcoming || null);
        }

        if (favFarmers) setFavoriteFarmers(favFarmers);
        if (favProds) setFavoriteProducts(favProds);
        if (famMembers) setFamilyMembers(famMembers);
        if (famInvs) setFamilyInvitations(famInvs);
        if (annList) setAnnouncements(Array.isArray(annList) ? annList : []);
      } catch (err) {
        console.warn('Dashboard data fetch warning', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [propUserName]);

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 4500);
  };

  // Open & populate edit modal
  const handleOpenEditProfileModal = () => {
    setEditForm({
      fullName: profile?.fullName || fullName || '',
      phone: profile?.phoneNumber || phone || '',
      defaultAddress: profile?.defaultAddress || defaultAddress || '',
      avatarUrl: profile?.avatarUrl || ''
    });
    setIsEditProfileModalOpen(true);
  };

  // Save changes from modal
  const handleSaveProfileModal = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updatePayload = {
        fullName: editForm.fullName.trim(),
        phoneNumber: editForm.phone.trim(),
        defaultAddress: editForm.defaultAddress.trim(),
        avatarUrl: editForm.avatarUrl ? editForm.avatarUrl.trim() : null
      };

      const updated = await customerService.updateProfile(updatePayload);

      // If avatar was updated, ensure avatar endpoint is also notified
      if (editForm.avatarUrl && editForm.avatarUrl !== profile?.avatarUrl) {
        try {
          await customerService.updateAvatar(editForm.avatarUrl.trim());
        } catch (avErr) {
          console.warn('Avatar update fallback note:', avErr);
        }
      }

      const nextAvatar = editForm.avatarUrl ? editForm.avatarUrl.trim() : (updated?.avatarUrl || profile?.avatarUrl);
      const nextFullName = editForm.fullName.trim();
      const nextPhone = editForm.phone.trim();
      const nextAddress = editForm.defaultAddress.trim();

      setProfile((prev) => ({
        ...prev,
        ...(updated || {}),
        fullName: nextFullName,
        phoneNumber: nextPhone,
        defaultAddress: nextAddress,
        avatarUrl: nextAvatar
      }));
      setFullName(nextFullName);
      setPhone(nextPhone);
      setDefaultAddress(nextAddress);

      if (nextFullName) {
        localStorage.setItem('ml_name', nextFullName);
      }
      if (nextAvatar) {
        localStorage.setItem('ml_avatar', nextAvatar);
      }

      setIsEditProfileModalOpen(false);
      showStatus('✓ Đã cập nhật hồ sơ và ảnh đại diện thành công!');
    } catch (err) {
      console.error('Update profile error:', err);
      alert(err?.message || 'Không thể cập nhật hồ sơ lúc này.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Profile Update (inline form)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await customerService.updateProfile({
        fullName,
        phoneNumber: phone,
        defaultAddress,
        avatarUrl: profile?.avatarUrl || null
      });
      if (updated) {
        setProfile((prev) => ({
          ...prev,
          ...updated,
          fullName: updated.fullName || fullName
        }));
        localStorage.setItem('ml_name', updated.fullName || fullName);
      }
      showStatus('✓ Đã cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      alert(err?.message || 'Không thể cập nhật hồ sơ lúc này.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      await customerService.changePassword(currentPassword, newPassword);
      setPasswordMessage('✓ Đã đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 4000);
    } catch (err) {
      setPasswordMessage(`Lỗi: ${err?.message || 'Không thể đổi mật khẩu'}`);
    }
  };

  // Handle Family Invite
  const handleSendFamilyInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setFamilyLoading(true);
    try {
      await customerService.inviteFamilyMember(inviteEmail);
      showStatus(`✓ Đã gửi lời mời tham gia nhóm gia đình tới ${inviteEmail}!`);
      setInviteEmail('');
      const invs = await customerService.getFamilyInvitations();
      setFamilyInvitations(invs || []);
    } catch (err) {
      alert(err?.message || 'Không thể gửi lời mời gia đình.');
    } finally {
      setFamilyLoading(false);
    }
  };

  // Handle Accept Family Invite
  const handleAcceptInvite = async (tokenVal) => {
    setFamilyLoading(true);
    try {
      await customerService.acceptFamilyInvitation(tokenVal);
      showStatus('✓ Bạn đã gia nhập nhóm gia đình thành công!');
      const [members, invs] = await Promise.all([
        customerService.getFamilyMembers(),
        customerService.getFamilyInvitations()
      ]);
      setFamilyMembers(members || []);
      setFamilyInvitations(invs || []);
    } catch (err) {
      alert(err?.message || 'Không thể chấp nhận lời mời.');
    } finally {
      setFamilyLoading(false);
    }
  };

  // Handle Leave Family
  const handleLeaveFamily = async () => {
    if (window.confirm('Bạn có chắc chắn muốn rời khỏi nhóm gia đình này?')) {
      try {
        await customerService.leaveFamily();
        showStatus('✓ Bạn đã rời khỏi nhóm gia đình.');
        const members = await customerService.getFamilyMembers();
        setFamilyMembers(members || []);
      } catch (err) {
        alert(err?.message || 'Không thể rời nhóm gia đình.');
      }
    }
  };

  // Handle Remove Family Member
  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm gia đình?')) {
      try {
        await customerService.removeFamilyMember(memberId);
        showStatus('✓ Đã xóa thành viên khỏi nhóm gia đình.');
        const members = await customerService.getFamilyMembers();
        setFamilyMembers(members || []);
      } catch (err) {
        alert(err?.message || 'Không thể xóa thành viên lúc này.');
      }
    }
  };

  // Handle Remove Favorite
  const handleRemoveFavorite = async (targetType, targetId) => {
    try {
      await customerService.removeFavorite(targetType, targetId);
      if (targetType === 'FARMER') {
        setFavoriteFarmers((prev) => prev.filter((f) => (f.targetId || f.id) !== targetId));
      } else {
        setFavoriteProducts((prev) => prev.filter((p) => (p.targetId || p.id) !== targetId));
      }
      showStatus('✓ Đã xóa khỏi danh sách yêu thích.');
    } catch (err) {
      console.warn('Failed to remove favorite', err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // Metrics count
  const activePickupCount = orders.filter((o) =>
    o.orderStatus === 'READY_FOR_PICKUP' || o.orderStatus === 'READY' || o.orderStatus === 'PLACED' || o.orderStatus === 'ACCEPTED'
  ).length;

  const completedCount = orders.filter((o) => o.orderStatus === 'COMPLETED').length;

  const displayUserEmail = profile?.email || propUserEmail || 'customer@marketlink.vn';
  const displayUserName = profile?.fullName || fullName || propUserName || 'Khách Hàng MarketLink';

  return (
    <div className="ml-dashboard-page">
      {/* Banner */}
      <div className="ml-dashboard-banner">
        <div className="ml-container ml-dashboard-banner-inner">
          <div className="ml-user-profile-header">
            <div
              className="ml-dashboard-avatar ml-dashboard-avatar--clickable"
              onClick={handleOpenEditProfileModal}
              title="Nhấn để đổi ảnh đại diện & thông tin cá nhân"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayUserName}
                  className="ml-dashboard-avatar-img"
                />
              ) : (
                <span className="ml-dashboard-avatar-fallback">🛒</span>
              )}
              <span className="ml-dashboard-avatar-badge" title="Đổi ảnh đại diện">
                📷
              </span>
            </div>
            <div>
              <div className="ml-dashboard-user-greeting">Tài khoản khách hàng</div>
              <h1 className="ml-dashboard-user-name">{displayUserName}</h1>
              <div className="ml-dashboard-user-meta">
                <span>✉️ {displayUserEmail}</span>
                {phone && <span>📞 {phone}</span>}
                {defaultAddress && <span>📍 {defaultAddress}</span>}
              </div>
            </div>
          </div>

          <div className="ml-dashboard-quick-actions">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenEditProfileModal}
              className="ml-btn-header-edit-profile"
            >
              ✏️ Chỉnh sửa hồ sơ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('orders')}
            >
              📦 Lịch sử đơn hàng ({orders.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('my-reviews')}
            >
              ⭐ Đánh giá của tôi
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('announcements')}
            >
              📢 Bản tin ({announcements.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('products')}
            >
              🥦 Đặt thêm nông sản
            </Button>
          </div>
        </div>
      </div>

      <div className="ml-container">
        {statusMessage && (
          <div className="ml-orders-loading" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
            {statusMessage}
          </div>
        )}

        {/* Real KPI Metrics */}
        <div className="ml-dashboard-metrics">
          <div className="ml-metric-card">
            <span className="ml-metric-icon">⏰</span>
            <div>
              <div className="ml-metric-val">{activePickupCount} Đơn</div>
              <div className="ml-metric-label">Đơn hẹn lấy tại chợ</div>
            </div>
          </div>

          <div className="ml-metric-card">
            <span className="ml-metric-icon">🧺</span>
            <div>
              <div className="ml-metric-val">{completedCount} Đơn</div>
              <div className="ml-metric-label">Đã nhận & thanh toán</div>
            </div>
          </div>

          <div className="ml-metric-card">
            <span className="ml-metric-icon">💚</span>
            <div>
              <div className="ml-metric-val">{favoriteFarmers.length + favoriteProducts.length} Mục</div>
              <div className="ml-metric-label">Nông dân & món đã lưu</div>
            </div>
          </div>

          <div className="ml-metric-card">
            <span className="ml-metric-icon">👨‍👩‍👧‍👦</span>
            <div>
              <div className="ml-metric-val">{familyMembers.length > 0 ? `${familyMembers.length} Người` : 'Chưa có'}</div>
              <div className="ml-metric-label">Thành viên nhóm gia đình</div>
            </div>
          </div>
        </div>

        {/* Upcoming Active Order Banner */}
        {upcomingOrder && (
          <div className="ml-card ml-upcoming-card">
            <div className="ml-upcoming-header">
              <span className="ml-upcoming-badge">⚡ ĐƠN NÔNG SẢN ĐẶT TRƯỚC SẮP TỚI</span>
              <span className="ml-upcoming-time">
                Ngày nhận: <strong>{upcomingOrder.pickupDate}</strong> ({upcomingOrder.slotTimeRange || 'Ca sáng'})
              </span>
            </div>

            <div className="ml-upcoming-body">
              <div className="ml-upcoming-info">
                <h3 className="ml-upcoming-market">
                  🎪 {upcomingOrder.marketName || 'Phiên Chợ Nông Sản'} • {upcomingOrder.stallName || 'Sạp nông dân'}
                </h3>
                <p className="ml-upcoming-desc">
                  Mã đơn: <strong>#{upcomingOrder.orderCode || upcomingOrder.orderId}</strong> • Trạng thái:{' '}
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                    {upcomingOrder.orderStatus === 'READY_FOR_PICKUP' ? 'Sẵn sàng tại sạp' : 'Đang thu hoạch & đóng gói'}
                  </span>
                </p>
                <div className="ml-upcoming-stall-note">
                  Chủ sạp: <strong>{upcomingOrder.farmerName || 'Nhà vườn hữu cơ'}</strong> • Tổng thanh toán:{' '}
                  <strong>{formatCurrency(upcomingOrder.totalAmount)}</strong> (Thanh toán tại sạp khi nhận hàng).
                </div>
              </div>

              <div className="ml-upcoming-actions">
                <Button
                  variant="accent"
                  size="md"
                  onClick={() => onNavigate('orders')}
                >
                  📱 Xem mã lấy hàng QR
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div className="ml-dashboard-tabs-section">
          <div className="ml-dashboard-tabs">
            <button
              type="button"
              className={`ml-dash-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              💚 Sạp nông dân đã lưu ({favoriteFarmers.length})
            </button>
            <button
              type="button"
              className={`ml-dash-tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              🍓 Nông sản yêu thích ({favoriteProducts.length})
            </button>
            <button
              type="button"
              className={`ml-dash-tab ${activeTab === 'family' ? 'active' : ''}`}
              onClick={() => setActiveTab('family')}
            >
              👨‍👩‍👧‍👦 Gia đình đi chợ ({familyMembers.length})
            </button>
            <button
              type="button"
              className={`ml-dash-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              ⚙️ Cài đặt hồ sơ & địa chỉ
            </button>
            <button
              type="button"
              className={`ml-dash-tab ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              📢 Bản tin chợ ({announcements.length})
            </button>
          </div>

          {/* Tab 1: Favorite Farmers */}
          {activeTab === 'upcoming' && (
            <div>
              {favoriteFarmers.length === 0 ? (
                <div className="ml-card ml-orders-empty">
                  <span className="ml-orders-empty-icon">💚</span>
                  <h3>Chưa có nhà vườn yêu thích nào</h3>
                  <p>Khi ghé các sạp nông dân ưng ý, hãy nhấn nút yêu thích để theo dõi lịch họp chợ của họ.</p>
                  <Button variant="primary" size="md" onClick={() => onNavigate('farmers')}>
                    Khám phá nhà vườn
                  </Button>
                </div>
              ) : (
                <div className="ml-fav-farmers-grid">
                  {favoriteFarmers.map((f) => {
                    const fid = f.targetId || f.id;
                    return (
                      <div key={f.favoriteId || fid} className="ml-card ml-fav-farmer-card">
                        <img
                          src={f.targetImageUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80'}
                          alt={f.targetName}
                          className="ml-fav-avatar"
                        />
                        <div className="ml-fav-info">
                          <h4 className="ml-fav-name">{f.targetName}</h4>
                          <div className="ml-fav-market">📍 {f.targetMeta || 'Phiên chợ nông sản'}</div>
                          <div className="ml-fav-produce">🌿 Nông trại xanh canh tác chuẩn hữu cơ</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate('farmers')}
                          >
                            Xem sạp
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-danger-text"
                            onClick={() => handleRemoveFavorite('FARMER', fid)}
                          >
                            Bỏ lưu
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Favorite Products */}
          {activeTab === 'products' && (
            <div>
              {favoriteProducts.length === 0 ? (
                <div className="ml-card ml-orders-empty">
                  <span className="ml-orders-empty-icon">🍓</span>
                  <h3>Chưa có nông sản lưu sẵn</h3>
                  <p>Hãy lưu các loại rau quả mùa vụ bạn muốn đặt trước để dễ dàng thêm vào giỏ khi chợ họp.</p>
                  <Button variant="primary" size="md" onClick={() => onNavigate('products')}>
                    Duyệt nông sản tươi
                  </Button>
                </div>
              ) : (
                <div className="ml-fav-prods-grid">
                  {favoriteProducts.map((p) => {
                    const pid = p.targetId || p.id;
                    return (
                      <div key={p.favoriteId || pid} className="ml-card ml-fav-prod-card">
                        <img
                          src={p.targetImageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80'}
                          alt={p.targetName}
                          className="ml-fav-prod-img"
                        />
                        <div className="ml-fav-prod-info">
                          <h4 className="ml-fav-prod-title">{p.targetName}</h4>
                          <span className="ml-fav-prod-farmer">🏡 {p.targetMeta || 'Sạp nông dân'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => {
                              if (onAddToCart) {
                                onAddToCart({
                                  id: pid,
                                  name: p.targetName,
                                  price: 35000,
                                  unit: 'kg',
                                  imageUrl: p.targetImageUrl,
                                  farmerName: p.targetMeta || 'Nông Trại Hữu Cơ'
                                });
                              }
                            }}
                          >
                            + Đặt trước
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-danger-text"
                            onClick={() => handleRemoveFavorite('PRODUCT', pid)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Family Account (Tài khoản gia đình đi chợ chung) */}
          {activeTab === 'family' && (
            <div className="ml-family-section">
              <div className="ml-family-intro-card">
                <div className="ml-family-intro-icon">👨‍👩‍👧‍👦</div>
                <div>
                  <h3 className="ml-family-intro-title">Nhóm Gia Đình Đi Chợ Chung (Family Account)</h3>
                  <p className="ml-family-intro-desc">
                    Tính năng đặc biệt cho phép các thành viên trong gia đình cùng xem đơn đặt trước, cùng nhận thông báo khi nông sản đã sẵn sàng tại sạp, và bất kỳ ai cũng có thể xuất trình mã QR để nhận rau củ giúp nhau.
                  </p>
                </div>
              </div>

              <div className="ml-family-grid">
                {/* Left: Current Members */}
                <div className="ml-card ml-family-members-card">
                  <div className="ml-family-card-title">
                    <span>Thành viên trong nhóm ({familyMembers.length})</span>
                    {familyMembers.length > 1 && (
                      <Button variant="ghost" size="sm" className="btn-danger-text" onClick={handleLeaveFamily}>
                        Rời nhóm
                      </Button>
                    )}
                  </div>

                  {familyMembers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                      <p>Bạn chưa liên kết tài khoản gia đình nào.</p>
                      <p style={{ fontSize: '12px' }}>Hãy gửi lời mời bằng email hoặc nhập mã lời mời bạn nhận được ở khung bên phải!</p>
                    </div>
                  ) : (
                    <div className="ml-family-member-list">
                      {familyMembers.map((m) => (
                        <div key={m.customerId || m.email} className="ml-family-member-item">
                          <div className="ml-family-member-left">
                            <div className="ml-family-member-avatar">
                              {m.fullName ? m.fullName.charAt(0).toUpperCase() : '👤'}
                            </div>
                            <div>
                              <div className="ml-family-member-name">
                                {m.fullName || m.email}
                                {m.isHeadOfFamily && (
                                  <Badge variant="organic" size="sm">Chủ nhóm</Badge>
                                )}
                              </div>
                              <div className="ml-family-member-email">
                                ✉️ {m.email} {m.phoneNumber ? `• 📞 ${m.phoneNumber}` : ''}
                              </div>
                            </div>
                          </div>

                          {!m.isHeadOfFamily && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="btn-danger-text"
                              onClick={() => handleRemoveMember(m.customerId)}
                            >
                              Xóa
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Invite & Accept */}
                <div className="ml-card ml-family-invite-card">
                  <h4 className="ml-family-card-title">Mời người thân vào nhóm</h4>
                  <form onSubmit={handleSendFamilyInvite} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="ml-form-group">
                      <label className="ml-form-label">Email thành viên muốn mời:</label>
                      <input
                        type="email"
                        className="ml-form-input"
                        placeholder="VD: vo_yeu@gmail.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" variant="primary" size="md" loading={familyLoading}>
                      Gửi lời mời tham gia
                    </Button>
                  </form>

                  {/* Accept token section */}
                  <div className="ml-family-invitations-box">
                    <h5 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                      Bạn có mã token lời mời gia đình?
                    </h5>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="ml-form-input"
                        placeholder="Nhập mã token lời mời..."
                        value={acceptToken}
                        onChange={(e) => setAcceptToken(e.target.value)}
                      />
                      <Button
                        variant="accent"
                        size="md"
                        disabled={!acceptToken.trim()}
                        onClick={() => handleAcceptInvite(acceptToken.trim())}
                      >
                        Gia nhập
                      </Button>
                    </div>
                  </div>

                  {/* Active invitations */}
                  {familyInvitations && familyInvitations.length > 0 && (
                    <div className="ml-family-invitations-box">
                      <h5 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Lời mời đang chờ ({familyInvitations.length})
                      </h5>
                      {familyInvitations.map((inv) => (
                        <div key={inv.invitationId || inv.invitationToken} className="ml-invitation-item">
                          <div>Gửi tới: <strong>{inv.inviteeEmail}</strong></div>
                          <div>Trạng thái: <Badge variant="pending" size="sm">{inv.status}</Badge></div>
                          <div className="ml-invitation-token-row">
                            <span>Mã: {inv.invitationToken}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(inv.invitationToken);
                                showStatus('✓ Đã sao chép mã token lời mời!');
                              }}
                            >
                              Sao chép
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Profile Settings */}
          {activeTab === 'profile' && (
            <div className="ml-card ml-profile-settings-card">
              <div className="ml-profile-settings-header-flex">
                <div>
                  <h3 className="ml-subcard-title">Cài đặt hồ sơ & địa chỉ nhận hàng</h3>
                  <p className="ml-profile-settings-subdesc">
                    Quản lý thông tin tài khoản, ảnh đại diện và địa chỉ nhận hàng nông sản tại các phiên chợ
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleOpenEditProfileModal}
                  className="ml-btn-open-modal-settings"
                >
                  ✏️ Chỉnh sửa hồ sơ (Mở hộp thoại)
                </Button>
              </div>

              {/* Profile Overview Card */}
              <div className="ml-profile-overview-box">
                <div
                  className="ml-overview-avatar-wrapper"
                  onClick={handleOpenEditProfileModal}
                  title="Nhấn để đổi ảnh đại diện"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={displayUserName}
                      className="ml-overview-avatar-img"
                    />
                  ) : (
                    <div className="ml-overview-avatar-placeholder">🛒</div>
                  )}
                  <span className="ml-overview-camera-icon">📷</span>
                </div>

                <div className="ml-overview-info">
                  <div className="ml-overview-name-row">
                    <h4 className="ml-overview-name">{displayUserName}</h4>
                    <span className="ml-overview-badge">Khách hàng thành viên</span>
                  </div>
                  <div className="ml-overview-meta-list">
                    <div className="ml-overview-meta-item">
                      <span className="ml-meta-label">Email tài khoản:</span>
                      <strong className="ml-meta-value">✉️ {displayUserEmail}</strong>
                    </div>
                    <div className="ml-overview-meta-item">
                      <span className="ml-meta-label">Số điện thoại liên hệ:</span>
                      <strong className="ml-meta-value">📞 {phone || 'Chưa cập nhật'}</strong>
                    </div>
                    <div className="ml-overview-meta-item">
                      <span className="ml-meta-label">Địa chỉ nhận hàng mặc định:</span>
                      <span className="ml-meta-value">📍 {defaultAddress || 'Chưa thiết lập địa chỉ'}</span>
                    </div>
                  </div>
                </div>

                <div className="ml-overview-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEditProfileModal}
                  >
                    ✏️ Thay đổi
                  </Button>
                </div>
              </div>

              {/* Quick Inline Update Form */}
              <div className="ml-profile-inline-form-wrap">
                <h4 className="ml-inline-form-title">📝 Cập nhật nhanh thông tin:</h4>
                <form onSubmit={handleUpdateProfile} className="ml-profile-form">
                  <div className="ml-form-group">
                    <label className="ml-form-label">Họ và tên của bạn:</label>
                    <input
                      type="text"
                      className="ml-form-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">Số điện thoại liên hệ (để nông dân liên hệ khi có rau):</label>
                    <input
                      type="text"
                      className="ml-form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0912 345 678"
                    />
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">Địa chỉ mặc định:</label>
                    <input
                      type="text"
                      className="ml-form-input"
                      value={defaultAddress}
                      onChange={(e) => setDefaultAddress(e.target.value)}
                      placeholder="VD: 123 Đường Láng, Đống Đa, Hà Nội"
                    />
                  </div>

                  <div className="ml-inline-form-actions">
                    <Button type="submit" variant="primary" size="md" loading={savingProfile}>
                      Lưu thay đổi hồ sơ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={handleOpenEditProfileModal}
                    >
                      🖼️ Đổi ảnh đại diện (Mở hộp thoại)
                    </Button>
                  </div>
                </form>
              </div>

              {/* Password Change Subform */}
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border-light)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>Đổi mật khẩu tài khoản</h4>
                {passwordMessage && (
                  <div style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', backgroundColor: '#f0fdf4', color: '#166534' }}>
                    {passwordMessage}
                  </div>
                )}
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="ml-form-group">
                    <label className="ml-form-label">Mật khẩu hiện tại:</label>
                    <input
                      type="password"
                      className="ml-form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="ml-form-group">
                    <label className="ml-form-label">Mật khẩu mới:</label>
                    <input
                      type="password"
                      className="ml-form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="ml-form-group">
                    <label className="ml-form-label">Nhập lại mật khẩu mới:</label>
                    <input
                      type="password"
                      className="ml-form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" size="md">
                    Cập nhật mật khẩu mới
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 5: Announcements */}
          {activeTab === 'announcements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    📢 Bản Tin & Thông Báo Chợ Phiên
                  </h3>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                    Các thông báo chính thức từ ban quản trị MarketLink về lịch chợ, quy chuẩn an toàn và chính sách nhận hàng.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate && onNavigate('announcements')}
                >
                  Mở trang bản tin toàn diện ↗
                </Button>
              </div>

              {announcements.length === 0 ? (
                <div className="ml-card ml-orders-empty">
                  <span className="ml-orders-empty-icon">📢</span>
                  <h3>Chưa có thông báo mới nào</h3>
                  <p>Khi ban quản lý gửi thông báo về lịch họp chợ hoặc sự kiện nông sản, thông tin sẽ hiển thị tại đây.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {announcements.map((item) => {
                    const isPinned = item.priority === 'PINNED';
                    const isUrgent = item.priority === 'URGENT';
                    const annId = item.announcementId || item.id;
                    return (
                      <div
                        key={annId}
                        className="ml-card"
                        style={{
                          padding: '24px',
                          border: isPinned ? '2px solid #f59e0b' : isUrgent ? '2px solid #ef4444' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onClick={() => setSelectedAnnouncement(item)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {isPinned && (
                              <Badge variant="warning">📌 Ghim quan trọng</Badge>
                            )}
                            {isUrgent && (
                              <Badge variant="urgent">🚨 Khẩn cấp</Badge>
                            )}
                            <Badge variant="outline">
                              {item.type === 'MARKET_EVENT' ? '🎪 Sự kiện' : item.type === 'POLICY' ? '📋 Tiêu chuẩn' : item.type === 'MAINTENANCE' ? '⚙️ Kỹ thuật' : '📢 Tin chung'}
                            </Badge>
                          </div>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            📅 {item.publishedAt ? item.publishedAt.substring(0, 10) : ''}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', lineHeight: 1.4 }}>
                          {item.title}
                        </h4>

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
                            Xem chi tiết →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: EDIT CUSTOMER PROFILE & AVATAR ================= */}
      {isEditProfileModalOpen && (
        <div className="ml-modal-overlay" onClick={() => setIsEditProfileModalOpen(false)}>
          <div
            className="ml-modal-box ml-customer-edit-modal-box"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ml-modal-header">
              <div>
                <h3>✏️ Chỉnh sửa hồ sơ & Ảnh đại diện</h3>
                <p className="ml-modal-subtitle">
                  Cập nhật họ và tên, số điện thoại, địa chỉ nhận hàng và hình ảnh đại diện của bạn
                </p>
              </div>
              <button
                type="button"
                className="ml-modal-close"
                onClick={() => setIsEditProfileModalOpen(false)}
                aria-label="Đóng hộp thoại"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileModal} className="ml-modal-form">
              <div className="ml-modal-body">
                {/* Avatar Uploader Section */}
                <div className="ml-customer-modal-avatar-section">
                  <div className="ml-customer-modal-avatar-preview">
                    {editForm.avatarUrl ? (
                      <img
                        src={editForm.avatarUrl}
                        alt="Avatar Preview"
                        className="ml-customer-modal-avatar-img"
                      />
                    ) : (
                      <div className="ml-customer-modal-avatar-placeholder">
                        🛒
                      </div>
                    )}
                  </div>
                  <div className="ml-customer-modal-avatar-controls">
                    <label className="ml-form-label" style={{ fontWeight: 700 }}>
                      Ảnh đại diện tài khoản (Avatar):
                    </label>
                    <ImageUploadInput
                      folder="avatars"
                      value={editForm.avatarUrl}
                      onChange={(url) => setEditForm((prev) => ({ ...prev, avatarUrl: url }))}
                      onUploadSuccess={(url) => setEditForm((prev) => ({ ...prev, avatarUrl: url }))}
                      helpText="Tải lên ảnh chân dung cá nhân (JPG, PNG, WebP) hoặc dán đường dẫn ảnh trực tiếp"
                    />
                  </div>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Họ và tên của bạn:</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">👤</span>
                    <input
                      type="text"
                      className="ml-form-input ml-form-input--icon"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="VD: Nguyễn Nhựt Quang"
                      required
                    />
                  </div>
                </div>

                <div className="ml-form-grid-2">
                  <div className="ml-form-group">
                    <label className="ml-form-label">Email tài khoản (Cố định):</label>
                    <div className="ml-input-wrapper">
                      <span className="ml-input-icon">✉️</span>
                      <input
                        type="email"
                        className="ml-form-input ml-form-input--icon"
                        value={displayUserEmail}
                        disabled
                        style={{ backgroundColor: 'var(--color-bg-base)', cursor: 'not-allowed', opacity: 0.8 }}
                      />
                    </div>
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">Số điện thoại liên hệ:</label>
                    <div className="ml-input-wrapper">
                      <span className="ml-input-icon">📞</span>
                      <input
                        type="text"
                        className="ml-form-input ml-form-input--icon"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="VD: 0901234567"
                      />
                    </div>
                  </div>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Địa chỉ nhận hàng mặc định:</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">📍</span>
                    <input
                      type="text"
                      className="ml-form-input ml-form-input--icon"
                      value={editForm.defaultAddress}
                      onChange={(e) => setEditForm({ ...editForm, defaultAddress: e.target.value })}
                      placeholder="VD: 123 Đường Láng, Đống Đa, Hà Nội"
                    />
                  </div>
                  <span className="ml-form-help">
                    Địa chỉ này sẽ được dùng để tự động điền khi bạn đặt mua nông sản tại các sạp chợ.
                  </span>
                </div>
              </div>

              <div className="ml-modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  disabled={savingProfile}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={savingProfile}
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
          subtitle={`Phát hành bởi ${selectedAnnouncement.adminName || 'Ban Quản Trị MarketLink'} • Ngày ${selectedAnnouncement.publishedAt ? selectedAnnouncement.publishedAt.substring(0, 10) : ''}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge variant={selectedAnnouncement.priority === 'PINNED' ? 'warning' : selectedAnnouncement.priority === 'URGENT' ? 'urgent' : 'ready'}>
                {selectedAnnouncement.priority === 'PINNED' ? '📌 Bản tin được ghim' : selectedAnnouncement.priority === 'URGENT' ? '🚨 Thông báo khẩn' : '📢 Thông báo chính thức'}
              </Badge>
              <Badge variant="outline">
                {selectedAnnouncement.type === 'MARKET_EVENT' ? '🎪 Sự kiện chợ phiên' : selectedAnnouncement.type === 'POLICY' ? '📋 Tiêu chuẩn & Quy chuẩn' : selectedAnnouncement.type === 'MAINTENANCE' ? '⚙️ Kỹ thuật' : '📢 Tin tức chung'}
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
              {selectedAnnouncement.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="outline" size="md" onClick={() => {
                setSelectedAnnouncement(null);
                if (onNavigate) onNavigate('announcements');
              }}>
                Mở trang bản tin toàn diện
              </Button>
              <Button variant="primary" size="md" onClick={() => setSelectedAnnouncement(null)}>
                Đã hiểu
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
