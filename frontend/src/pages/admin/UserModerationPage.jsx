import React, { useState, useEffect } from 'react';
import './UserModerationPage.css';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import adminService from '../../services/adminService';

export default function UserModerationPage({ onNavigate }) {
  // Main Tab: 'users' (Quản lý Người Dùng) | 'kyc' (Thẩm Định KYC Nông Hộ)
  const [mainTab, setMainTab] = useState('users');

  // ==========================================
  // TAB 1: USERS STATE
  // ==========================================
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    keyword: '',
    role: 'ALL',
    status: 'ALL',
    kycStatus: 'ALL'
  });

  const handleResetUserFilters = () => {
    setUserFilters({
      keyword: '',
      role: 'ALL',
      status: 'ALL',
      kycStatus: 'ALL'
    });
  };

  const hasActiveFilters = Boolean(
    (userFilters.keyword && userFilters.keyword.trim() !== '') ||
    userFilters.role !== 'ALL' ||
    userFilters.status !== 'ALL' ||
    userFilters.kycStatus !== 'ALL'
  );
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isUserStatusModalOpen, setIsUserStatusModalOpen] = useState(false);
  const [userStatusTarget, setUserStatusTarget] = useState(null);
  const [userStatusReason, setUserStatusReason] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ==========================================
  // CREATE USER STATE & HANDLERS
  // ==========================================
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    address: '',
    farmName: '',
    farmAddress: '',
    kycStatus: 'UNVERIFIED'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateUserForm(prev => ({ ...prev, password: res }));
    setShowPassword(true);
  };

  const handleResetCreateForm = () => {
    setCreateUserForm({
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      address: '',
      farmName: '',
      farmAddress: '',
      kycStatus: 'UNVERIFIED'
    });
    setShowPassword(false);
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!createUserForm.fullName.trim() || !createUserForm.email.trim() || !createUserForm.password.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!');
      return;
    }

    if (createUserForm.password.length < 6) {
      showToast('error', 'Mật khẩu phải có tối thiểu 6 ký tự!');
      return;
    }

    setSubmittingCreate(true);
    try {
      const payload = {
        fullName: createUserForm.fullName.trim(),
        email: createUserForm.email.trim().toLowerCase(),
        password: createUserForm.password,
        phoneNumber: createUserForm.phoneNumber.trim() || null,
        role: createUserForm.role,
        status: createUserForm.status,
        address: createUserForm.address.trim() || null,
        farmName: createUserForm.role === 'FARMER' ? createUserForm.farmName.trim() : null,
        farmAddress: createUserForm.role === 'FARMER' ? createUserForm.farmAddress.trim() : null,
        kycStatus: createUserForm.role === 'FARMER' ? createUserForm.kycStatus : (createUserForm.role === 'ADMIN' ? 'VERIFIED' : 'UNVERIFIED')
      };

      await adminService.createUser(payload);
      showToast('success', `Đã tạo tài khoản thành công cho ${payload.fullName} (${payload.email})!`);
      setIsCreateUserModalOpen(false);
      handleResetCreateForm();
      loadUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      const errMsg = err?.data?.message || err?.message || 'Không thể tạo tài khoản mới.';
      showToast('error', `Lỗi tạo tài khoản: ${errMsg}`);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // ==========================================
  // TAB 2: KYC STATE
  // ==========================================
  const [kycList, setKycList] = useState([]);
  const [kycTab, setKycTab] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
  const [kycSearch, setKycSearch] = useState('');
  const [selectedFarmerKyc, setSelectedFarmerKyc] = useState(null);
  const [farmerKycDetail, setFarmerKycDetail] = useState(null);
  const [isKycDetailModalOpen, setIsKycDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingKyc, setLoadingKyc] = useState(false);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' });
  const showToast = (type, text) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg({ type: '', text: '' }), 4000);
  };

  // ==========================================
  // LOAD USERS FROM REAL API
  // ==========================================
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminService.getUsers(userFilters);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load users', err);
      showToast('error', 'Không thể tải danh sách người dùng từ máy chủ.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // ==========================================
  // LOAD KYC PENDING FROM REAL API (Server-Side Search)
  // ==========================================
  const loadKyc = async (kw = kycSearch) => {
    setLoadingKyc(true);
    try {
      const data = await adminService.getPendingKycList(kw ? kw.trim() : '');
      setKycList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load KYC pending list', err);
      showToast('error', 'Không thể tải danh sách hồ sơ KYC chờ duyệt.');
    } finally {
      setLoadingKyc(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'users') {
      const timer = setTimeout(() => {
        loadUsers();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        loadKyc(kycSearch);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [mainTab, userFilters, kycSearch]);

  // View User Detail Modal
  const handleViewUserDetail = async (userId) => {
    try {
      const detail = await adminService.getUserDetail(userId);
      setSelectedUserDetail(detail);
      setIsUserDetailModalOpen(true);
    } catch (err) {
      showToast('error', 'Không thể tải chi tiết người dùng: ' + (err.message || ''));
    }
  };

  // Toggle User Status (ACTIVE / SUSPENDED)
  const handleOpenStatusModal = (user) => {
    setUserStatusTarget(user);
    setUserStatusReason('');
    setIsUserStatusModalOpen(true);
  };

  const handleConfirmUserStatus = async () => {
    if (!userStatusTarget) return;
    const newStatus = userStatusTarget.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(userStatusTarget.userId, newStatus, userStatusReason);
      showToast('success', `Đã ${newStatus === 'ACTIVE' ? 'kích hoạt lại' : 'tạm khóa'} tài khoản #${userStatusTarget.userId} thành công.`);
      setIsUserStatusModalOpen(false);
      loadUsers();
    } catch (err) {
      showToast('error', 'Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    }
  };

  // View KYC Detail Modal
  const handleViewKycDetail = async (farmer) => {
    setSelectedFarmerKyc(farmer);
    setIsKycDetailModalOpen(true);
    try {
      const detail = await adminService.getFarmerKycDetail(farmer.farmerId);
      setFarmerKycDetail(detail);
    } catch (err) {
      console.warn('Failed to fetch detailed kyc', err);
    }
  };

  const extractErrorMessage = (err) => {
    if (err.response?.data?.errors) {
      const errMap = err.response.data.errors;
      if (typeof errMap === 'object') {
        return Object.values(errMap).join('; ');
      }
    }
    return err.response?.data?.message || err.message || 'Lỗi không xác định';
  };

  // Approve KYC
  const handleApproveKyc = async (farmerId) => {
    if (!window.confirm('Xác nhận PHÊ DUYỆT hồ sơ nông hộ này? Nông dân sẽ được cấp quyền mở sạp và đón khách đặt trước.')) {
      return;
    }
    try {
      await adminService.reviewFarmerKyc(farmerId, 'APPROVE', 'Hồ sơ chứng nhận VietGAP hợp lệ.');
      showToast('success', `Đã phê duyệt KYC thành công cho nông dân #${farmerId}. Sạp hàng đã được kích hoạt!`);
      setIsKycDetailModalOpen(false);
      loadKyc();
    } catch (err) {
      showToast('error', 'Lỗi phê duyệt: ' + extractErrorMessage(err));
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (farmer) => {
    setSelectedFarmerKyc(farmer);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmRejectKyc = async (actionType = 'REJECT') => {
    if (!selectedFarmerKyc) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do để phản hồi cho nông dân!');
      return;
    }
    try {
      await adminService.reviewFarmerKyc(selectedFarmerKyc.farmerId, actionType, rejectReason.trim());
      showToast('success', `Đã gửi kết quả [${actionType}] hồ sơ tới nông dân #${selectedFarmerKyc.farmerId}.`);
      setIsRejectModalOpen(false);
      setIsKycDetailModalOpen(false);
      loadKyc();
    } catch (err) {
      showToast('error', 'Lỗi xử lý hồ sơ: ' + extractErrorMessage(err));
    }
  };


  // Helper Badge Renderers
  const renderRoleBadges = (roles = []) => {
    if (!roles || roles.length === 0) return <Badge variant="neutral">Khách hàng</Badge>;
    return roles.map((r, i) => {
      if (r === 'ROLE_ADMIN' || r === 'ADMIN') return <Badge key={i} variant="accent">🛡️ Quản trị viên</Badge>;
      if (r === 'ROLE_FARMER' || r === 'FARMER') return <Badge key={i} variant="organic">👨‍🌾 Nông dân</Badge>;
      return <Badge key={i} variant="primary">🛒 Khách hàng</Badge>;
    });
  };

  const renderStatusBadge = (status) => {
    if (status === 'ACTIVE') return <Badge variant="ready" dot>Đang hoạt động</Badge>;
    return <Badge variant="cancelled" dot>Tạm khóa</Badge>;
  };

  const renderKycBadge = (kycStatus) => {
    switch (kycStatus) {
      case 'VERIFIED':
        return <Badge variant="ready">✓ Đã định danh (VERIFIED)</Badge>;
      case 'PENDING':
        return <Badge variant="pending">⏳ Chờ duyệt (PENDING)</Badge>;
      case 'REJECTED':
        return <Badge variant="cancelled">✕ Bị từ chối (REJECTED)</Badge>;
      default:
        return <Badge variant="neutral">Chưa định danh</Badge>;
    }
  };

  // Filtered KYC (Processed entirely on server-side)
  const filteredKycList = kycList;

  return (
    <div className="ml-mod-page">
      {/* Toast Alert */}
      {toastMsg.text && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backgroundColor: toastMsg.type === 'success' ? '#15803d' : '#b91c1c',
          color: '#ffffff'
        }}>
          {toastMsg.type === 'success' ? '✓ ' : '⚠️ '} {toastMsg.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="ml-mod-banner">
        <div className="ml-container ml-mod-banner-inner">
          <div>
            <span className="ml-section-subtitle" style={{ color: '#86efac' }}>
              Ban Quản Trị Hệ Thống MarketLink
            </span>
            <h1 className="ml-mod-title">Quản Lý Người Dùng & Thẩm Định Nông Hộ</h1>
            <p className="ml-mod-desc">
              Tra cứu tài khoản toàn sàn, kiểm soát quyền truy cập, xác thực giấy tờ chứng nhận VietGAP / Hữu cơ và cấp quyền mở sạp chợ phiên.
            </p>
          </div>

          <div className="ml-mod-stats-strip">
            <div className="ml-mod-stat-pill">
              <span className="ml-mod-stat-num">{users.length}</span>
              <span className="ml-mod-stat-lbl">Tài khoản</span>
            </div>
            <div className="ml-mod-stat-pill">
              <span className="ml-mod-stat-num">{kycList.length}</span>
              <span className="ml-mod-stat-lbl">Hồ sơ chờ duyệt</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-container ml-mod-content">
        {/* Navigation Tabs - Modern Segmented Control */}
        <div className="ml-user-mod-tabs-container">
          <div className="ml-user-mod-tabs">
            <button
              type="button"
              className={`ml-user-mod-tab ${mainTab === 'users' ? 'active' : ''}`}
              onClick={() => setMainTab('users')}
            >
              <span className="ml-user-mod-tab-icon">👥</span>
              <span className="ml-user-mod-tab-label">Người dùng hệ thống</span>
              <span className="ml-tab-badge ml-tab-badge-users">{users.length}</span>
            </button>
            <button
              type="button"
              className={`ml-user-mod-tab ${mainTab === 'kyc' ? 'active' : ''}`}
              onClick={() => setMainTab('kyc')}
            >
              <span className="ml-user-mod-tab-icon">📜</span>
              <span className="ml-user-mod-tab-label">Thẩm định hồ sơ VietGAP</span>
              <span className={`ml-tab-badge ${kycList.length > 0 ? 'ml-tab-badge-kyc-alert' : 'ml-tab-badge-kyc'}`}>
                {kycList.length} chờ duyệt
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB 1: USERS LIST (TOÀN BỘ NGƯỜI DÙNG)
            ======================================================== */}
        {mainTab === 'users' && (
          <div className="ml-users-management-box">
            {/* Filter Toolbar - Modern Redesigned Card */}
            <div className="ml-user-filter-card">
              {/* Header inside filter card */}
              <div className="ml-filter-card-header">
                <div className="ml-filter-card-title-group">
                  <div className="ml-filter-card-icon-badge">🔍</div>
                  <div>
                    <h3 className="ml-filter-card-title">Bộ Lọc & Tra Cứu Tài Khoản</h3>
                    <p className="ml-filter-card-subtitle">
                      {loadingUsers ? 'Đang tìm kiếm dữ liệu...' : `Tìm thấy ${users.length} tài khoản phù hợp với điều kiện`}
                    </p>
                  </div>
                </div>

                <div className="ml-filter-card-actions">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="ml-filter-reset-btn"
                      onClick={handleResetUserFilters}
                      title="Xóa tất cả bộ lọc về mặc định"
                    >
                      <span className="ml-reset-icon">✕</span>
                      <span>Xóa bộ lọc</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="ml-filter-reload-btn"
                    onClick={loadUsers}
                    title="Tải lại dữ liệu"
                    disabled={loadingUsers}
                  >
                    <span className={loadingUsers ? 'ml-spin' : ''}>🔄</span>
                    <span>Làm mới</span>
                  </button>

                  <button
                    type="button"
                    className="ml-create-user-btn"
                    onClick={() => setIsCreateUserModalOpen(true)}
                    title="Thêm tài khoản người dùng mới"
                  >
                    <span>➕</span>
                    <span>Thêm người dùng</span>
                  </button>
                </div>
              </div>

              {/* Main 4-Column Full-width Grid */}
              <div className="ml-user-filter-grid">
                {/* 1. Search keyword */}
                <div className="ml-filter-field ml-filter-field-search">
                  <label className="ml-filter-label">
                    <span className="ml-label-icon">🔎</span> Tìm kiếm người dùng
                  </label>
                  <div className="ml-search-input-wrapper">
                    <span className="ml-search-leading-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="ml-filter-input"
                      placeholder="Nhập tên, email, SĐT..."
                      value={userFilters.keyword}
                      onChange={(e) => setUserFilters({ ...userFilters, keyword: e.target.value })}
                    />
                    {userFilters.keyword && (
                      <button
                        type="button"
                        className="ml-input-clear-btn"
                        onClick={() => setUserFilters({ ...userFilters, keyword: '' })}
                        title="Xóa tìm kiếm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Role filter */}
                <div className="ml-filter-field">
                  <label className="ml-filter-label">
                    <span className="ml-label-icon">🎭</span> Vai trò tài khoản
                  </label>
                  <div className="ml-select-wrapper">
                    <select
                      className="ml-filter-select"
                      value={userFilters.role ? userFilters.role.replace(/^ROLE_/, '') : 'ALL'}
                      onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                    >
                      <option value="ALL">Tất cả vai trò</option>
                      <option value="FARMER">👨‍🌾 Nông dân (FARMER)</option>
                      <option value="CUSTOMER">🛒 Khách hàng (CUSTOMER)</option>
                      <option value="ADMIN">🛡️ Quản trị viên (ADMIN)</option>
                    </select>
                    <span className="ml-select-arrow">▼</span>
                  </div>
                </div>

                {/* 3. Account Status */}
                <div className="ml-filter-field">
                  <label className="ml-filter-label">
                    <span className="ml-label-icon">⚡</span> Trạng thái tài khoản
                  </label>
                  <div className="ml-select-wrapper">
                    <select
                      className="ml-filter-select"
                      value={userFilters.status}
                      onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">🟢 Đang hoạt động (ACTIVE)</option>
                      <option value="SUSPENDED">🔴 Bị tạm khóa (SUSPENDED)</option>
                    </select>
                    <span className="ml-select-arrow">▼</span>
                  </div>
                </div>

                {/* 4. KYC Status */}
                <div className="ml-filter-field">
                  <label className="ml-filter-label">
                    <span className="ml-label-icon">🛡️</span> Định danh KYC
                  </label>
                  <div className="ml-select-wrapper">
                    <select
                      className="ml-filter-select"
                      value={userFilters.kycStatus}
                      onChange={(e) => setUserFilters({ ...userFilters, kycStatus: e.target.value })}
                    >
                      <option value="ALL">Tất cả KYC</option>
                      <option value="VERIFIED">✅ Đã xác thực (VERIFIED)</option>
                      <option value="PENDING">⏳ Chờ duyệt (PENDING)</option>
                      <option value="UNVERIFIED">⚪ Chưa nộp (UNVERIFIED)</option>
                      <option value="REJECTED">❌ Bị từ chối (REJECTED)</option>
                    </select>
                    <span className="ml-select-arrow">▼</span>
                  </div>
                </div>
              </div>

              {/* Quick Filter Chips row */}
              <div className="ml-quick-filters-row">
                <span className="ml-quick-filters-title">Lọc nhanh:</span>
                <div className="ml-quick-chips-list">
                  <button
                    type="button"
                    className={`ml-filter-chip ${!hasActiveFilters ? 'active' : ''}`}
                    onClick={handleResetUserFilters}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    className={`ml-filter-chip ${userFilters.role === 'FARMER' || userFilters.role === 'ROLE_FARMER' ? 'active' : ''}`}
                    onClick={() => {
                      const isSelected = userFilters.role === 'FARMER' || userFilters.role === 'ROLE_FARMER';
                      setUserFilters({ ...userFilters, role: isSelected ? 'ALL' : 'FARMER' });
                    }}
                  >
                    👨‍🌾 Nông dân
                  </button>
                  <button
                    type="button"
                    className={`ml-filter-chip ${userFilters.role === 'CUSTOMER' || userFilters.role === 'ROLE_CUSTOMER' ? 'active' : ''}`}
                    onClick={() => {
                      const isSelected = userFilters.role === 'CUSTOMER' || userFilters.role === 'ROLE_CUSTOMER';
                      setUserFilters({ ...userFilters, role: isSelected ? 'ALL' : 'CUSTOMER' });
                    }}
                  >
                    🛒 Khách hàng
                  </button>
                  <button
                    type="button"
                    className={`ml-filter-chip ${userFilters.role === 'ADMIN' || userFilters.role === 'ROLE_ADMIN' ? 'active' : ''}`}
                    onClick={() => {
                      const isSelected = userFilters.role === 'ADMIN' || userFilters.role === 'ROLE_ADMIN';
                      setUserFilters({ ...userFilters, role: isSelected ? 'ALL' : 'ADMIN' });
                    }}
                  >
                    🛡️ Quản trị viên
                  </button>
                  <button
                    type="button"
                    className={`ml-filter-chip ${userFilters.kycStatus === 'PENDING' ? 'active warning' : ''}`}
                    onClick={() => setUserFilters({ ...userFilters, kycStatus: userFilters.kycStatus === 'PENDING' ? 'ALL' : 'PENDING' })}
                  >
                    ⏳ Chờ duyệt KYC
                  </button>
                  <button
                    type="button"
                    className={`ml-filter-chip ${userFilters.status === 'SUSPENDED' ? 'active danger' : ''}`}
                    onClick={() => setUserFilters({ ...userFilters, status: userFilters.status === 'SUSPENDED' ? 'ALL' : 'SUSPENDED' })}
                  >
                    🔴 Bị tạm khóa
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table / Grid */}
            {loadingUsers ? (
              <div className="ml-inv-loading">Đang tải danh sách người dùng từ máy chủ...</div>
            ) : users.length === 0 ? (
              <div className="ml-card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
              </div>
            ) : (
              <div className="ml-card" style={{ overflowX: 'auto', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '12px 16px' }}>Mã & Người dùng</th>
                      <th style={{ padding: '12px 16px' }}>Liên hệ (Email / SĐT)</th>
                      <th style={{ padding: '12px 16px' }}>Vai trò</th>
                      <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                      <th style={{ padding: '12px 16px' }}>Định danh KYC</th>
                      <th style={{ padding: '12px 16px' }}>Ngày tạo</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.userId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              backgroundColor: '#e2e8f0',
                              backgroundImage: u.avatarUrl ? `url(${u.avatarUrl})` : 'none',
                              backgroundSize: 'cover',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#334155'
                            }}>
                              {!u.avatarUrl && (u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.fullName || 'Chưa cập nhật tên'}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>ID: #{u.userId}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ color: '#1e293b' }}>{u.email}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{u.phoneNumber || 'Chưa có SĐT'}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {renderRoleBadges(u.roles)}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {renderStatusBadge(u.status)}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {renderKycBadge(u.kycStatus)}
                        </td>

                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12.5 }}>
                          {u.createdAt ? u.createdAt.replace('T', ' ').substring(0, 16) : 'Mới tạo'}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUserDetail(u.userId)}
                            >
                              👁️ Chi tiết
                            </Button>
                            <Button
                              variant={u.status === 'ACTIVE' ? 'ghost' : 'primary'}
                              size="sm"
                              style={{
                                color: u.status === 'ACTIVE' ? '#b91c1c' : '#15803d',
                                borderColor: u.status === 'ACTIVE' ? '#fca5a5' : '#86efac'
                              }}
                              onClick={() => handleOpenStatusModal(u)}
                            >
                              {u.status === 'ACTIVE' ? '🔒 Khóa' : '🔓 Mở khóa'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: KYC LIST (THẨM ĐỊNH HỒ SƠ NÔNG HỘ)
            ======================================================== */}
        {mainTab === 'kyc' && (
          <div className="ml-kyc-management-box">
            {/* Search Box - Tab 2 KYC */}
            <div className="ml-user-filter-card" style={{ marginBottom: 24 }}>
              <div className="ml-filter-card-header">
                <div className="ml-filter-card-title-group">
                  <div className="ml-filter-card-icon-badge" style={{ background: '#fef3c7', color: '#b45309' }}>📜</div>
                  <div>
                    <h3 className="ml-filter-card-title">Tra Cứu Hồ Sơ VietGAP Chờ Thẩm Định</h3>
                    <p className="ml-filter-card-subtitle">
                      {loadingKyc ? 'Đang tải hồ sơ...' : `Có ${filteredKycList.length} hồ sơ nông hộ đang chờ duyệt`}
                    </p>
                  </div>
                </div>

                <div className="ml-filter-card-actions">
                  <button
                    type="button"
                    className="ml-filter-reload-btn"
                    onClick={() => loadKyc(kycSearch)}
                    title="Tải lại dữ liệu"
                    disabled={loadingKyc}
                  >
                    <span className={loadingKyc ? 'ml-spin' : ''}>🔄</span>
                    <span>Làm mới danh sách</span>
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="ml-search-input-wrapper" style={{ width: '100%', maxWidth: '100%' }}>
                  <span className="ml-search-leading-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="ml-filter-input"
                    placeholder="Tìm kiếm nhanh theo tên nông dân, tên gian hàng / sạp, số điện thoại..."
                    value={kycSearch}
                    onChange={(e) => setKycSearch(e.target.value)}
                  />
                  {kycSearch && (
                    <button
                      type="button"
                      className="ml-input-clear-btn"
                      onClick={() => setKycSearch('')}
                      title="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loadingKyc ? (
              <div className="ml-inv-loading">Đang tải hồ sơ thẩm định...</div>
            ) : filteredKycList.length === 0 ? (
              <div className="ml-card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                🎉 Tuyệt vời! Hiện không có hồ sơ nông hộ nào đang chờ thẩm định.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                {filteredKycList.map((k) => (
                  <div key={k.farmerId} className="ml-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#1e293b' }}>
                          🏡 {k.stallName || 'Nông Trại Đăng Ký'}
                        </h3>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                          Chủ sạp: <strong>{k.fullName}</strong> • ID: #{k.farmerId}
                        </div>
                      </div>
                      <Badge variant="pending">Chờ thẩm định</Badge>
                    </div>

                    <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4, color: '#334155', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8 }}>
                      <div>📞 <strong>Điện thoại:</strong> {k.phoneNumber || 'Chưa cung cấp'}</div>
                      <div>✉️ <strong>Email:</strong> {k.email || 'Chưa cung cấp'}</div>
                      <div>📍 <strong>Địa chỉ vườn:</strong> {k.farmAddress || 'Chưa cập nhật'}</div>
                      <div>📜 <strong>Tài liệu đã nộp:</strong> {k.documentCount || 0} tệp ảnh chứng nhận</div>
                      <div>⏰ <strong>Gửi lúc:</strong> {k.lastSubmittedAt ? k.lastSubmittedAt.replace('T', ' ').substring(0, 16) : 'Mới nộp'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ flex: 1 }}
                        onClick={() => handleViewKycDetail(k)}
                      >
                        🔎 Thẩm định chi tiết
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => handleApproveKyc(k.farmerId)}
                      >
                        ✓ Duyệt nhanh
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: '#b91c1c' }}
                        onClick={() => handleOpenRejectModal(k)}
                      >
                        ✕ Từ chối
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: USER DETAIL (CHI TIẾT NGƯỜI DÙNG)
          ======================================================== */}
      {isUserDetailModalOpen && selectedUserDetail && (
        <Modal
          isOpen={isUserDetailModalOpen}
          onClose={() => setIsUserDetailModalOpen(false)}
          title={`Hồ Sơ Chi Tiết Người Dùng #${selectedUserDetail.userId}`}
          subtitle="Thông tin tài khoản, phân quyền và lịch sử kiểm duyệt trên MarketLink"
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header profile info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, backgroundColor: '#f8fafc', padding: 14, borderRadius: 10 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: '#cbd5e1',
                backgroundImage: selectedUserDetail.avatarUrl ? `url(${selectedUserDetail.avatarUrl})` : 'none',
                backgroundSize: 'cover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: '#1e293b'
              }}>
                {!selectedUserDetail.avatarUrl && (selectedUserDetail.fullName ? selectedUserDetail.fullName.charAt(0) : 'U')}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#1e293b' }}>{selectedUserDetail.fullName}</h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {selectedUserDetail.email} • 📞 {selectedUserDetail.phoneNumber || 'Chưa có SĐT'}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {renderRoleBadges(selectedUserDetail.roles)}
                  {renderStatusBadge(selectedUserDetail.status)}
                  {renderKycBadge(selectedUserDetail.kycStatus)}
                </div>
              </div>
            </div>

            {/* Farmer Profile Specifics */}
            {selectedUserDetail.farmerProfile && (
              <div className="ml-card" style={{ padding: 14 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#166534' }}>🏡 Thông tin Nông trại / Sạp hàng:</h4>
                <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><strong>Tên sạp:</strong> {selectedUserDetail.farmerProfile.stallName}</div>
                  <div><strong>Địa chỉ:</strong> {selectedUserDetail.farmerProfile.farmAddress}</div>
                  <div><strong>Trạng thái phê duyệt:</strong> {selectedUserDetail.farmerProfile.isApproved ? '✅ Đã kích hoạt sạp' : '⏳ Chưa kích hoạt'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Giới thiệu:</strong> {selectedUserDetail.farmerProfile.bio}</div>
                </div>
              </div>
            )}

            {/* Customer Profile Specifics */}
            {selectedUserDetail.customerProfile && (
              <div className="ml-card" style={{ padding: 14 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#1e40af' }}>🛒 Thông tin Khách hàng đặt trước:</h4>
                <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><strong>Địa chỉ mặc định:</strong> {selectedUserDetail.customerProfile.defaultAddress || 'Chưa cung cấp'}</div>
                  <div><strong>Tài khoản gia đình:</strong> {selectedUserDetail.customerProfile.familyAccountId ? `#${selectedUserDetail.customerProfile.familyAccountId}` : 'Độc lập'}</div>
                </div>
              </div>
            )}

            {/* Verification Audit Logs */}
            <div className="ml-card" style={{ padding: 14 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#334155' }}>📋 Lịch sử kiểm duyệt (Audit Logs):</h4>
              {!selectedUserDetail.auditLogs || selectedUserDetail.auditLogs.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Chưa có nhật ký kiểm duyệt nào cho tài khoản này.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                  {selectedUserDetail.auditLogs.map((log, i) => (
                    <div key={i} style={{ fontSize: 12.5, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderLeft: '3px solid #2e7d32' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>Hành động: {log.action} ({log.decision})</span>
                        <span style={{ color: '#64748b' }}>{log.reviewedAt ? log.reviewedAt.replace('T', ' ').substring(0, 16) : ''}</span>
                      </div>
                      <div style={{ color: '#475569', marginTop: 2 }}>{log.notes || 'Không có ghi chú thêm.'}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Thực hiện bởi: {log.adminName || `Admin #${log.adminId}`}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button variant="ghost" onClick={() => setIsUserDetailModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          MODAL: CREATE NEW USER (THÊM NGƯỜI DÙNG MỚI)
          ======================================================== */}
      {isCreateUserModalOpen && (
        <Modal
          isOpen={isCreateUserModalOpen}
          onClose={() => {
            if (!submittingCreate) {
              setIsCreateUserModalOpen(false);
              handleResetCreateForm();
            }
          }}
          title="➕ Thêm Tài Khoản Người Dùng Mới"
          subtitle="Tạo mới tài khoản Nông dân, Khách hàng hoặc Quản trị viên trên hệ thống"
          maxWidth="640px"
        >
          <form onSubmit={handleCreateUserSubmit} className="ml-create-user-form">
            <div className="ml-create-user-grid">
              {/* Họ và tên */}
              <div className="ml-form-group">
                <label className="ml-form-label">
                  Họ và tên (*):
                </label>
                <input
                  type="text"
                  className="ml-form-input"
                  placeholder="Ví dụ: Nguyễn Văn Nông"
                  value={createUserForm.fullName}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="ml-form-group">
                <label className="ml-form-label">
                  Email đăng nhập (*):
                </label>
                <input
                  type="email"
                  className="ml-form-input"
                  placeholder="nguyenvannong@marketlink.vn"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  required
                />
              </div>

              {/* Mật khẩu */}
              <div className="ml-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="ml-form-label">Mật khẩu (*):</label>
                  <button
                    type="button"
                    className="ml-btn-random-pwd"
                    onClick={generateRandomPassword}
                    title="Tạo mật khẩu an toàn ngẫu nhiên"
                  >
                    🎲 Tạo ngẫu nhiên
                  </button>
                </div>
                <div className="ml-password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="ml-form-input"
                    placeholder="Tối thiểu 6 ký tự"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="ml-pwd-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="ml-form-group">
                <label className="ml-form-label">
                  Số điện thoại:
                </label>
                <input
                  type="tel"
                  className="ml-form-input"
                  placeholder="Ví dụ: 0901234567"
                  value={createUserForm.phoneNumber}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, phoneNumber: e.target.value })}
                />
              </div>

              {/* Vai trò */}
              <div className="ml-form-group">
                <label className="ml-form-label">
                  Vai trò tài khoản (*):
                </label>
                <select
                  className="ml-form-select"
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                >
                  <option value="CUSTOMER">🛒 Khách hàng (CUSTOMER)</option>
                  <option value="FARMER">👨‍🌾 Nông dân / Nhà vườn (FARMER)</option>
                  <option value="ADMIN">🛡️ Quản trị viên (ADMIN)</option>
                </select>
              </div>

              {/* Trạng thái tài khoản */}
              <div className="ml-form-group">
                <label className="ml-form-label">
                  Trạng thái hoạt động:
                </label>
                <select
                  className="ml-form-select"
                  value={createUserForm.status}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, status: e.target.value })}
                >
                  <option value="ACTIVE">🟢 Đang hoạt động (ACTIVE)</option>
                  <option value="SUSPENDED">🔴 Tạm khóa (SUSPENDED)</option>
                </select>
              </div>

              {/* Địa chỉ */}
              <div className="ml-form-group ml-grid-full">
                <label className="ml-form-label">
                  Địa chỉ liên hệ:
                </label>
                <input
                  type="text"
                  className="ml-form-input"
                  placeholder="Số nhà, đường phố, xã/phường, quận/huyện, tỉnh/thành..."
                  value={createUserForm.address}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, address: e.target.value })}
                />
              </div>

              {/* Thông tin dành riêng cho FARMER */}
              {createUserForm.role === 'FARMER' && (
                <>
                  <div className="ml-farmer-extra-divider ml-grid-full">
                    <span>🌾 Thông tin hồ sơ Nông hộ / Hợp tác xã</span>
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">
                      Tên gian hàng / Nông trại:
                    </label>
                    <input
                      type="text"
                      className="ml-form-input"
                      placeholder="Ví dụ: HTX Rau Sạch Ba Vì"
                      value={createUserForm.farmName}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, farmName: e.target.value })}
                    />
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">
                      Trạng thái thẩm định KYC:
                    </label>
                    <select
                      className="ml-form-select"
                      value={createUserForm.kycStatus}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, kycStatus: e.target.value })}
                    >
                      <option value="UNVERIFIED">Chưa thẩm định (UNVERIFIED)</option>
                      <option value="PENDING">Chờ duyệt hồ sơ (PENDING)</option>
                      <option value="VERIFIED">✓ Đã xác thực - Cho phép mở sạp ngay (VERIFIED)</option>
                    </select>
                  </div>

                  <div className="ml-form-group ml-grid-full">
                    <label className="ml-form-label">
                      Địa chỉ trang trại / Cơ sở sản xuất:
                    </label>
                    <input
                      type="text"
                      className="ml-form-input"
                      placeholder="Địa chỉ khu đất canh tác / nhà kính / HTX..."
                      value={createUserForm.farmAddress}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, farmAddress: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="ml-create-user-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreateUserModalOpen(false);
                  handleResetCreateForm();
                }}
                disabled={submittingCreate}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submittingCreate}
              >
                {submittingCreate ? 'Đang tạo...' : '✓ Xác nhận thêm người dùng'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          MODAL: UPDATE USER STATUS (KHÓA / MỞ KHÓA)
          ======================================================== */}
      {isUserStatusModalOpen && userStatusTarget && (
        <Modal
          isOpen={isUserStatusModalOpen}
          onClose={() => setIsUserStatusModalOpen(false)}
          title={userStatusTarget.status === 'ACTIVE' ? `Khóa Tài Khoản #${userStatusTarget.userId}` : `Mở Khóa Tài Khoản #${userStatusTarget.userId}`}
          subtitle={`Người dùng: ${userStatusTarget.fullName} (${userStatusTarget.email})`}
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13.5, color: '#334155', margin: 0 }}>
              {userStatusTarget.status === 'ACTIVE'
                ? 'Khi khóa tài khoản, người dùng sẽ không thể đăng nhập hoặc thực hiện bất kỳ giao dịch nào trên sàn.'
                : 'Mở khóa sẽ khôi phục lại toàn bộ quyền sử dụng tài khoản cho người dùng.'}
            </p>

            <div className="ml-form-group">
              <label className="ml-form-label">Lý do xử lý (Lưu vào nhật ký kiểm duyệt):</label>
              <textarea
                className="ml-form-textarea"
                rows={3}
                placeholder="Nhập lý do khóa / mở khóa (vd: Vi phạm quy định chợ, giải quyết khiếu nại...)"
                value={userStatusReason}
                onChange={(e) => setUserStatusReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={() => setIsUserStatusModalOpen(false)}>
                Hủy
              </Button>
              <Button
                variant={userStatusTarget.status === 'ACTIVE' ? 'primary' : 'accent'}
                style={{ backgroundColor: userStatusTarget.status === 'ACTIVE' ? '#b91c1c' : '#15803d' }}
                onClick={handleConfirmUserStatus}
              >
                {userStatusTarget.status === 'ACTIVE' ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          MODAL: KYC REVIEW DETAIL (THẨM ĐỊNH HỒ SƠ VIETGAP)
          ======================================================== */}
      {isKycDetailModalOpen && selectedFarmerKyc && (
        <Modal
          isOpen={isKycDetailModalOpen}
          onClose={() => setIsKycDetailModalOpen(false)}
          title={`Thẩm Định Hồ Sơ Nông Hộ: ${selectedFarmerKyc.stallName || selectedFarmerKyc.fullName}`}
          subtitle={`Chủ sạp: ${selectedFarmerKyc.fullName} • SĐT: ${selectedFarmerKyc.phoneNumber || 'N/A'}`}
          maxWidth="760px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 13.5 }}>
              <div><strong>Tên nhà vườn / Hợp tác xã:</strong> {selectedFarmerKyc.stallName || 'Nông Trại Đăng Ký'}</div>
              <div><strong>Đại diện:</strong> {selectedFarmerKyc.fullName}</div>
              <div><strong>Số điện thoại:</strong> {selectedFarmerKyc.phoneNumber || 'Chưa cung cấp'}</div>
              <div><strong>Email:</strong> {selectedFarmerKyc.email}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Địa chỉ vùng trồng:</strong> {selectedFarmerKyc.farmAddress || 'Chưa cập nhật'}</div>
            </div>

            {/* Document Details & Image Viewer */}
            <div className="ml-card" style={{ padding: 14 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 15, color: '#166534' }}>
                📜 Giấy tờ chứng nhận & Ảnh chụp tài liệu đính kèm:
              </h4>

              {farmerKycDetail?.documents && farmerKycDetail.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {farmerKycDetail.documents.map((doc, idx) => (
                    <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span>Mã giấy tờ: <strong>{doc.documentNumber || `DOC-${idx + 1}`}</strong></span>
                        <span style={{ color: '#64748b' }}>Ngày cấp: {doc.issuedDate || 'N/A'} - Hạn dùng: {doc.expiryDate || 'N/A'}</span>
                      </div>
                      <div style={{ borderRadius: 6, overflow: 'hidden', maxHeight: 300, backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center' }}>
                        <img
                          src={doc.documentUrl}
                          alt="Giấy chứng nhận"
                          style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                        🔗 Đường dẫn ảnh: <a href={doc.documentUrl} target="_blank" rel="noreferrer" style={{ color: '#2e7d32' }}>{doc.documentUrl}</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13.5 }}>
                  <img
                    src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80"
                    alt="Chứng nhận mẫu"
                    style={{ maxHeight: 220, borderRadius: 8, marginBottom: 8 }}
                  />
                  <div>Hồ sơ đã nộp ảnh chứng chỉ chất lượng nông sản. Hãy kiểm tra tính xác thực trước khi duyệt.</div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <Button variant="ghost" onClick={() => setIsKycDetailModalOpen(false)}>
                Đóng lại
              </Button>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="outline"
                  style={{ color: '#d97706', borderColor: '#fcd34d' }}
                  onClick={() => handleOpenRejectModal(selectedFarmerKyc)}
                >
                  🔄 Yêu cầu chỉnh sửa
                </Button>
                <Button
                  variant="ghost"
                  style={{ color: '#b91c1c' }}
                  onClick={() => handleOpenRejectModal(selectedFarmerKyc)}
                >
                  ✕ Từ chối hồ sơ
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleApproveKyc(selectedFarmerKyc.farmerId)}
                >
                  ✓ Phê duyệt hồ sơ (Cấp quyền mở sạp)
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          MODAL: REJECT KYC OR REQUEST REVISION
          ======================================================== */}
      {isRejectModalOpen && selectedFarmerKyc && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title={`Xử Lý Từ Chối / Bổ Sung Hồ Sơ: ${selectedFarmerKyc.stallName || selectedFarmerKyc.fullName}`}
          subtitle="Nông dân sẽ nhận được thông báo kèm lý do chi tiết để khắc phục"
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="ml-form-group">
              <label className="ml-form-label">Lý do từ chối hoặc hướng dẫn bổ sung:</label>
              <textarea
                className="ml-form-textarea"
                rows={4}
                placeholder="Ví dụ: Giấy chứng nhận đã hết hạn, ảnh chụp mờ không thấy rõ mã số VietGAP, vui lòng chụp lại 2 mặt..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button
                variant="outline"
                style={{ color: '#d97706', borderColor: '#fcd34d' }}
                onClick={() => handleConfirmRejectKyc('REQUEST_REVISION')}
              >
                Gửi yêu cầu bổ sung
              </Button>
              <Button
                variant="primary"
                style={{ backgroundColor: '#b91c1c' }}
                onClick={() => handleConfirmRejectKyc('REJECT')}
              >
                Xác nhận từ chối hồ sơ
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
