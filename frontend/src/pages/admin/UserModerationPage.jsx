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
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isUserStatusModalOpen, setIsUserStatusModalOpen] = useState(false);
  const [userStatusTarget, setUserStatusTarget] = useState(null);
  const [userStatusReason, setUserStatusReason] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

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
  // LOAD KYC PENDING FROM REAL API
  // ==========================================
  const loadKyc = async () => {
    setLoadingKyc(true);
    try {
      const data = await adminService.getPendingKycList();
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
      loadUsers();
    } else {
      loadKyc();
    }
  }, [mainTab, userFilters]);

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

  // Filtered KYC
  const filteredKycList = kycList.filter((k) => {
    const matchSearch =
      !kycSearch ||
      (k.fullName && k.fullName.toLowerCase().includes(kycSearch.toLowerCase())) ||
      (k.stallName && k.stallName.toLowerCase().includes(kycSearch.toLowerCase())) ||
      (k.phoneNumber && k.phoneNumber.includes(kycSearch)) ||
      (k.email && k.email.toLowerCase().includes(kycSearch.toLowerCase()));
    return matchSearch;
  });

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
        {/* Navigation Tabs */}
        <div className="ml-inv-main-tabs" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`ml-inv-main-tab ${mainTab === 'users' ? 'active' : ''}`}
            onClick={() => setMainTab('users')}
          >
            👥 Người dùng hệ thống ({users.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${mainTab === 'kyc' ? 'active' : ''}`}
            onClick={() => setMainTab('kyc')}
          >
            📜 Thẩm định hồ sơ VietGAP ({kycList.length} chờ duyệt)
          </button>
        </div>

        {/* ========================================================
            TAB 1: USERS LIST (TOÀN BỘ NGƯỜI DÙNG)
            ======================================================== */}
        {mainTab === 'users' && (
          <div className="ml-users-management-box">
            {/* Filter Toolbar */}
            <div className="ml-card ml-mod-controls" style={{ marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label className="ml-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Tìm kiếm người dùng:</label>
                  <input
                    type="text"
                    className="ml-form-input"
                    placeholder="Tên, Email, SĐT..."
                    value={userFilters.keyword}
                    onChange={(e) => setUserFilters({ ...userFilters, keyword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="ml-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Vai trò:</label>
                  <select
                    className="ml-form-select"
                    value={userFilters.role}
                    onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="ROLE_ADMIN">Quản trị viên (ADMIN)</option>
                    <option value="ROLE_FARMER">Nông dân (FARMER)</option>
                    <option value="ROLE_CUSTOMER">Khách hàng (CUSTOMER)</option>
                  </select>
                </div>

                <div>
                  <label className="ml-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Trạng thái tài khoản:</label>
                  <select
                    className="ml-form-select"
                    value={userFilters.status}
                    onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                    <option value="SUSPENDED">Tạm khóa (SUSPENDED)</option>
                  </select>
                </div>

                <div>
                  <label className="ml-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Định danh KYC:</label>
                  <select
                    className="ml-form-select"
                    value={userFilters.kycStatus}
                    onChange={(e) => setUserFilters({ ...userFilters, kycStatus: e.target.value })}
                  >
                    <option value="ALL">Tất cả KYC</option>
                    <option value="VERIFIED">Đã xác thực (VERIFIED)</option>
                    <option value="PENDING">Chờ duyệt (PENDING)</option>
                    <option value="UNVERIFIED">Chưa định danh (UNVERIFIED)</option>
                    <option value="REJECTED">Bị từ chối (REJECTED)</option>
                  </select>
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
            {/* Search Box */}
            <div className="ml-card ml-mod-controls" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  className="ml-form-input"
                  style={{ flex: 1, minWidth: 260 }}
                  placeholder="Tìm kiếm nông hộ theo tên, sạp, SĐT..."
                  value={kycSearch}
                  onChange={(e) => setKycSearch(e.target.value)}
                />
                <Button variant="outline" size="md" onClick={loadKyc}>
                  🔄 Làm mới danh sách
                </Button>
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
