import React, { useState, useEffect } from 'react';
import './FarmerStallProfilePage.css';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ImageUploadInput from '../../components/ImageUploadInput';
import farmerService from '../../services/farmerService';
import marketService from '../../services/marketService';

const DAY_OF_WEEK_NAMES = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật'
};

export default function FarmerStallProfilePage() {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'cutoff' | 'slots' | 'markets' | 'kyc'
  const [loading, setLoading] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  // 1. Profile State
  const [profile, setProfile] = useState({
    farmName: 'Vườn Nông Sản Sạch Ba Vì',
    fullName: 'Nguyễn Văn Nông Dân',
    phone: '0988123456',
    address: 'Xã Vân Hòa, Huyện Ba Vì, TP. Hà Nội',
    bio: 'Nhà vườn chúng tôi chuyên canh tác các loại rau cải, rau muống nước ngọt và các loại củ ăn lá hoàn toàn tự nhiên dưới chân núi Ba Vì.',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    latitude: '21.0823',
    longitude: '105.3512',
    isApproved: true
  });

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    farmName: '',
    fullName: '',
    phone: '',
    address: '',
    bio: '',
    avatarUrl: '',
    coverUrl: '',
    latitude: '',
    longitude: ''
  });

  // 2. Cutoff Settings State
  const [cutoffSettings, setCutoffSettings] = useState([]);
  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState(false);
  const [cutoffForm, setCutoffForm] = useState({
    marketId: 101,
    dayOfWeek: 6,
    cutoffHoursBefore: 12
  });

  // 3. Pickup Slots State
  const [pickupSlots, setPickupSlots] = useState([]);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({
    marketId: 101,
    startTime: '07:00:00',
    endTime: '08:00:00',
    maxOrdersCapacity: 15
  });

  // 4. Market Assignments State
  const [assignedMarkets, setAssignedMarkets] = useState([]);
  const [availableMarkets, setAvailableMarkets] = useState([]);
  const [isRegisterMarketModalOpen, setIsRegisterMarketModalOpen] = useState(false);
  const [registerMarketForm, setRegisterMarketForm] = useState({
    marketId: '',
    stallNumber: ''
  });

  // 5. KYC Status State
  const [kycData, setKycData] = useState(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycForm, setKycForm] = useState({
    documentUrl: '',
    documentNumber: '',
    issuedDate: '',
    expiryDate: ''
  });

  const notifySuccess = (msg) => {
    setAlertSuccess(msg);
    setTimeout(() => setAlertSuccess(''), 4000);
  };

  const notifyError = (msg) => {
    setAlertError(msg);
    setTimeout(() => setAlertError(''), 4000);
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profRes, cutoffs, slots, assignments, markets, kyc] = await Promise.all([
        farmerService.getFarmerProfile(),
        farmerService.getFarmerCutoffSettings(),
        farmerService.getFarmerPickupSlots(),
        farmerService.getMyMarketAssignments(),
        marketService.getMarkets(),
        farmerService.getFarmerKycStatus()
      ]);

      if (profRes) {
        const details = profRes.profileDetails || {};
        const savedCover = localStorage.getItem('farmer_cover_url');
        setProfile((prev) => ({
          ...prev,
          farmName: details.stallName || profRes.stallName || prev.farmName,
          fullName: profRes.fullName || prev.fullName,
          phone: profRes.phoneNumber || profRes.phone || prev.phone,
          address: details.farmAddress || profRes.address || prev.address,
          bio: details.bio || profRes.bio || prev.bio,
          avatarUrl: profRes.avatarUrl || prev.avatarUrl,
          coverUrl: savedCover || prev.coverUrl,
          latitude: details.latitude != null ? String(details.latitude) : prev.latitude,
          longitude: details.longitude != null ? String(details.longitude) : prev.longitude,
          isApproved: details.isApproved ?? prev.isApproved
        }));
      }

      setCutoffSettings(cutoffs || []);
      setPickupSlots(slots || []);
      setAssignedMarkets(assignments || []);
      setAvailableMarkets(markets || []);
      setKycData(kyc);

      if (markets && markets.length > 0) {
        setRegisterMarketForm((f) => ({ ...f, marketId: markets[0].marketId || markets[0].id }));
        setCutoffForm((f) => ({ ...f, marketId: markets[0].marketId || markets[0].id }));
        setSlotForm((f) => ({ ...f, marketId: markets[0].marketId || markets[0].id }));
      }
    } catch (err) {
      console.warn('Error loading stall profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Open Edit Profile Modal
  const handleOpenEditProfileModal = () => {
    setEditProfileForm({
      farmName: profile.farmName || '',
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      address: profile.address || '',
      bio: profile.bio || '',
      avatarUrl: profile.avatarUrl || '',
      coverUrl: profile.coverUrl || '',
      latitude: profile.latitude || '',
      longitude: profile.longitude || ''
    });
    setIsEditProfileModalOpen(true);
  };

  // Save Profile from Modal
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // 1. Update farmer profile details & user info
      await farmerService.updateFarmerProfile({
        fullName: editProfileForm.fullName,
        phoneNumber: editProfileForm.phone,
        stallName: editProfileForm.farmName,
        farmAddress: editProfileForm.address,
        bio: editProfileForm.bio,
        latitude: editProfileForm.latitude ? parseFloat(editProfileForm.latitude) : null,
        longitude: editProfileForm.longitude ? parseFloat(editProfileForm.longitude) : null
      });

      // 2. If avatar changed, update avatar
      if (editProfileForm.avatarUrl && editProfileForm.avatarUrl !== profile.avatarUrl) {
        await farmerService.updateAvatar(editProfileForm.avatarUrl);
      }

      // 3. Save cover photo in localStorage for persistence
      if (editProfileForm.coverUrl) {
        localStorage.setItem('farmer_cover_url', editProfileForm.coverUrl);
      }

      // 4. Update local state
      setProfile((prev) => ({
        ...prev,
        farmName: editProfileForm.farmName,
        fullName: editProfileForm.fullName,
        phone: editProfileForm.phone,
        address: editProfileForm.address,
        bio: editProfileForm.bio,
        avatarUrl: editProfileForm.avatarUrl,
        coverUrl: editProfileForm.coverUrl,
        latitude: editProfileForm.latitude,
        longitude: editProfileForm.longitude
      }));

      setIsEditProfileModalOpen(false);
      notifySuccess('Đã cập nhật thông tin hồ sơ nhà vườn thành công!');
    } catch (err) {
      notifyError('Cập nhật hồ sơ thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Cutoff Settings Actions
  const handleSaveCutoff = async (e) => {
    e.preventDefault();
    try {
      await farmerService.saveFarmerCutoffSetting({
        marketId: Number(cutoffForm.marketId),
        dayOfWeek: Number(cutoffForm.dayOfWeek),
        cutoffHoursBefore: Number(cutoffForm.cutoffHoursBefore)
      });
      notifySuccess('Đã thiết lập khung giờ chốt đơn trước phiên họp chợ!');
      setIsCutoffModalOpen(false);
      const updated = await farmerService.getFarmerCutoffSettings();
      setCutoffSettings(updated || []);
    } catch (err) {
      notifyError('Lưu hạn chốt đơn thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCutoff = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa cấu hình chốt đơn này?')) {
      try {
        await farmerService.deleteFarmerCutoffSetting(id);
        setCutoffSettings((prev) => prev.filter((c) => c.settingId !== id));
        notifySuccess('Đã xóa cấu hình chốt đơn.');
      } catch (err) {
        notifyError('Xóa cấu hình thất bại: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // 3. Pickup Slots Actions
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      await farmerService.createFarmerPickupSlot({
        marketId: Number(slotForm.marketId),
        startTime: slotForm.startTime.length === 5 ? `${slotForm.startTime}:00` : slotForm.startTime,
        endTime: slotForm.endTime.length === 5 ? `${slotForm.endTime}:00` : slotForm.endTime,
        maxOrdersCapacity: Number(slotForm.maxOrdersCapacity) || 15
      });
      notifySuccess('Đã thêm ca đón khách mới tại sạp chợ!');
      setIsSlotModalOpen(false);
      const updated = await farmerService.getFarmerPickupSlots();
      setPickupSlots(updated || []);
    } catch (err) {
      notifyError('Tạo ca nhận hàng thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSlot = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa ca đón khách này?')) {
      try {
        await farmerService.deleteFarmerPickupSlot(id);
        setPickupSlots((prev) => prev.filter((s) => s.slotId !== id));
        notifySuccess('Đã xóa ca nhận hàng.');
      } catch (err) {
        notifyError('Xóa ca nhận thất bại: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // 4. Market Registration Actions
  const handleRegisterMarket = async (e) => {
    e.preventDefault();
    try {
      await farmerService.registerMarket({
        marketId: Number(registerMarketForm.marketId),
        stallNumber: registerMarketForm.stallNumber || 'Sạp Dự Kiến'
      });
      notifySuccess('Đã gửi đơn đăng ký tham gia sạp chợ thành công!');
      setIsRegisterMarketModalOpen(false);
      const updated = await farmerService.getMyMarketAssignments();
      setAssignedMarkets(updated || []);
    } catch (err) {
      notifyError('Đăng ký chợ thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  // 5. KYC Submission Actions
  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    if (!kycForm.documentUrl) {
      alert('Vui lòng cung cấp ảnh giấy chứng nhận hoặc CCCD!');
      return;
    }

    try {
      await farmerService.submitFarmerKyc({
        documents: [
          {
            documentUrl: kycForm.documentUrl,
            documentNumber: kycForm.documentNumber || 'VG-2026-090',
            issuedDate: kycForm.issuedDate || '2024-01-01',
            expiryDate: kycForm.expiryDate || '2027-01-01'
          }
        ]
      });
      notifySuccess('Hồ sơ định danh KYC & Chứng nhận đã được nộp và chờ Quản trị viên duyệt!');
      setIsKycModalOpen(false);
      const updatedKyc = await farmerService.getFarmerKycStatus();
      setKycData(updatedKyc);
    } catch (err) {
      notifyError('Nộp hồ sơ KYC thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const getKycBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="ready" dot>Đã xác thực định danh (VERIFIED)</Badge>;
      case 'PENDING':
        return <Badge variant="pending" dot>Đang chờ Ban Quản Trị duyệt (PENDING)</Badge>;
      case 'REJECTED':
        return <Badge variant="cancelled">Bị từ chối hồ sơ (REJECTED)</Badge>;
      default:
        return <Badge variant="neutral">Chưa định danh (UNVERIFIED)</Badge>;
    }
  };

  return (
    <div className="ml-stall-profile-page">
      {/* Banner */}
      <div className="ml-stall-banner">
        <div className="ml-container">
          <span className="ml-section-subtitle">Phân hệ Chủ Sạp & Nhà Vườn</span>
          <h1 className="ml-stall-page-title">Quản Lý Hồ Sơ Gian Hàng & Vận Hành Chợ</h1>
          <p className="ml-stall-page-desc">
            Cập nhật câu chuyện canh tác hữu cơ, thiết lập giờ chốt đơn, các ca đón khách tại sạp, đăng ký chợ phiên và theo dõi chứng nhận KYC.
          </p>
        </div>
      </div>

      <div className="ml-container">
        {/* Alerts */}
        {alertSuccess && <div className="ml-alert-success mb-4">✓ {alertSuccess}</div>}
        {alertError && <div className="ml-alert-danger mb-4">⚠️ {alertError}</div>}

        {/* Navigation Tabs */}
        <div className="ml-inv-main-tabs">
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            🏡 Hồ sơ nhà vườn
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'cutoff' ? 'active' : ''}`}
            onClick={() => setActiveTab('cutoff')}
          >
            ⏰ Giờ chốt đơn ({cutoffSettings.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'slots' ? 'active' : ''}`}
            onClick={() => setActiveTab('slots')}
          >
            🕒 Ca đón khách ({pickupSlots.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'markets' ? 'active' : ''}`}
            onClick={() => setActiveTab('markets')}
          >
            🎪 Sạp chợ đã đăng ký ({assignedMarkets.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'kyc' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc')}
          >
            🛡️ Định danh KYC & VietGAP
          </button>
        </div>

        {loading && <div className="ml-inv-loading mb-4">Đang đồng bộ dữ liệu sạp từ máy chủ...</div>}

        {/* ================= TAB 1: PROFILE VIEW ================= */}
        {activeTab === 'profile' && (
          <div className="ml-profile-page-view">
            {/* 1. Hero Card */}
            <div className="ml-profile-hero-card">
              <div
                className="ml-profile-hero-cover"
                style={{ backgroundImage: `url(${profile.coverUrl})` }}
              >
                <div className="ml-profile-cover-badge">
                  <span>📸 Ảnh bìa nhà vườn</span>
                </div>
              </div>

              <div className="ml-profile-hero-content">
                <div className="ml-profile-avatar-row">
                  <div className="ml-profile-avatar-wrapper">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="ml-profile-avatar-img"
                    />
                    <div className="ml-profile-hero-text">
                      <div className="ml-profile-title-row">
                        <h2 className="ml-profile-farm-title">{profile.farmName}</h2>
                        {profile.isApproved && (
                          <span className="ml-profile-verified-badge" title="Đã được ban quản trị xét duyệt">
                            ✓ Đã xác minh
                          </span>
                        )}
                      </div>
                      <p className="ml-profile-owner-sub">
                        👤 Chủ hộ: <strong>{profile.fullName}</strong> • 📞 <strong>{profile.phone}</strong> • 📍 {profile.address}
                      </p>
                    </div>
                  </div>

                  <div className="ml-profile-hero-actions">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleOpenEditProfileModal}
                    >
                      ✏️ Chỉnh sửa hồ sơ
                    </Button>
                  </div>
                </div>

                <div className="ml-profile-tags-row">
                  <span className="ml-profile-tag">🌱 Canh tác hữu cơ</span>
                  <span className="ml-profile-tag">🌾 Chứng nhận VietGAP</span>
                  <span className="ml-profile-tag">🚚 Giao tại phiên chợ</span>
                  <span className="ml-profile-tag">⭐ 4.9/5 (120+ lượt mua)</span>
                </div>
              </div>
            </div>

            {/* 2. Quick Metrics Row */}
            <div className="ml-profile-metrics-row">
              <div
                className="ml-profile-metric-card"
                onClick={() => setActiveTab('markets')}
                style={{ cursor: 'pointer' }}
                title="Xem danh sách sạp chợ"
              >
                <div className="ml-profile-metric-icon">🎪</div>
                <div>
                  <div className="ml-profile-metric-label">Sạp chợ tham gia</div>
                  <div className="ml-profile-metric-val">{assignedMarkets.length} phiên chợ</div>
                </div>
              </div>

              <div
                className="ml-profile-metric-card"
                onClick={() => setActiveTab('cutoff')}
                style={{ cursor: 'pointer' }}
                title="Cài đặt giờ chốt đơn"
              >
                <div className="ml-profile-metric-icon">⏰</div>
                <div>
                  <div className="ml-profile-metric-label">Khung giờ chốt đơn</div>
                  <div className="ml-profile-metric-val">{cutoffSettings.length} cấu hình</div>
                </div>
              </div>

              <div
                className="ml-profile-metric-card"
                onClick={() => setActiveTab('slots')}
                style={{ cursor: 'pointer' }}
                title="Cài đặt ca đón khách"
              >
                <div className="ml-profile-metric-icon">🕒</div>
                <div>
                  <div className="ml-profile-metric-label">Ca đón khách tại sạp</div>
                  <div className="ml-profile-metric-val">{pickupSlots.length} khung giờ</div>
                </div>
              </div>

              <div
                className="ml-profile-metric-card"
                onClick={() => setActiveTab('kyc')}
                style={{ cursor: 'pointer' }}
                title="Xem trạng thái định danh"
              >
                <div className="ml-profile-metric-icon">🛡️</div>
                <div>
                  <div className="ml-profile-metric-label">Định danh nhà vườn</div>
                  <div className="ml-profile-metric-val">
                    {kycData?.status === 'VERIFIED' ? 'Đã duyệt KYC' : 'Đang xử lý'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Main Profile Body Grid */}
            <div className="ml-profile-body-grid">
              {/* Left Column: Story, Commitments & Registered Stalls */}
              <div className="ml-profile-main-col">
                {/* Farming Story */}
                <div className="ml-card ml-stall-card">
                  <div className="ml-card-header-flex">
                    <h3 className="ml-card-title">🌱 Câu chuyện canh tác & Triết lý xanh</h3>
                    <button
                      type="button"
                      className="ml-btn-link-edit"
                      onClick={handleOpenEditProfileModal}
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  </div>

                  <div className="ml-profile-bio-box">
                    "{profile.bio || 'Chưa cập nhật câu chuyện canh tác. Hãy bấm Chỉnh sửa hồ sơ để giới thiệu phương pháp trồng trọt hữu cơ và nguồn gốc nông sản của bạn tới khách hàng!'}"
                  </div>

                  <h4 className="ml-profile-section-sub">Cam kết chất lượng nông sản:</h4>
                  <div className="ml-profile-commitments-grid">
                    <div className="ml-commitment-item">
                      <span className="ml-commitment-icon">🌿</span>
                      <span>100% Không thuốc BVTV hóa học</span>
                    </div>
                    <div className="ml-commitment-item">
                      <span className="ml-commitment-icon">💧</span>
                      <span>Nước ngầm tự nhiên, đất sạch</span>
                    </div>
                    <div className="ml-commitment-item">
                      <span className="ml-commitment-icon">🚚</span>
                      <span>Thu hoạch sớm, tươi trong ngày</span>
                    </div>
                  </div>
                </div>

                {/* Stalls / Markets Summary */}
                <div className="ml-card ml-stall-card">
                  <div className="ml-card-header-flex">
                    <h3 className="ml-card-title">🎪 Danh sách sạp chợ đang vận hành</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('markets')}
                    >
                      Quản lý sạp →
                    </Button>
                  </div>

                  {assignedMarkets.length === 0 ? (
                    <div className="ml-empty-box">
                      <p>Chưa đăng ký sạp chợ phiên nào.</p>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setIsRegisterMarketModalOpen(true)}
                      >
                        + Đăng ký sạp chợ ngay
                      </Button>
                    </div>
                  ) : (
                    <div className="ml-profile-stalls-list">
                      {assignedMarkets.map((a) => (
                        <div key={a.assignmentId || a.id} className="ml-profile-stall-card">
                          <div className="ml-profile-stall-info">
                            <span className="ml-profile-stall-market">
                              🎪 {a.marketName || `Chợ #${a.marketId}`}
                            </span>
                            <span className="ml-profile-stall-meta">
                              Vị trí: <strong>{a.stallNumber || a.stallCode || 'Đang bố trí'}</strong> • Phiên: {a.marketSchedule || 'Cuối tuần'}
                            </span>
                          </div>
                          <div>
                            {a.status === 'APPROVED' ? (
                              <Badge variant="ready" dot>Đang mở bán</Badge>
                            ) : (
                              <Badge variant="pending" dot>Đang chờ duyệt</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Contact info & Farm details */}
              <div className="ml-profile-side-col">
                <div className="ml-card ml-stall-card">
                  <div className="ml-card-header-flex">
                    <h3 className="ml-card-title">📋 Thông tin liên hệ & Vùng trồng</h3>
                    <button
                      type="button"
                      className="ml-btn-link-edit"
                      onClick={handleOpenEditProfileModal}
                    >
                      ✏️ Sửa
                    </button>
                  </div>

                  <div className="ml-profile-info-list">
                    <div className="ml-profile-info-row">
                      <span className="ml-profile-info-label">Chủ hộ / Đại diện pháp lý</span>
                      <strong className="ml-profile-info-value">{profile.fullName}</strong>
                    </div>

                    <div className="ml-profile-info-row">
                      <span className="ml-profile-info-label">Số điện thoại liên hệ</span>
                      <strong className="ml-profile-info-value">📞 {profile.phone}</strong>
                    </div>

                    <div className="ml-profile-info-row">
                      <span className="ml-profile-info-label">Địa chỉ nông trại / Vùng trồng</span>
                      <span className="ml-profile-info-value">📍 {profile.address}</span>
                    </div>

                    <div className="ml-profile-info-row">
                      <span className="ml-profile-info-label">Tọa độ GPS bản đồ</span>
                      <span className="ml-profile-info-value">
                        🌐 {profile.latitude && profile.longitude ? `${profile.latitude}, ${profile.longitude}` : '21.0823, 105.3512'}
                      </span>
                    </div>

                    <div className="ml-profile-info-row">
                      <span className="ml-profile-info-label">Tình trạng xét duyệt nhà vườn</span>
                      <div style={{ marginTop: '4px' }}>
                        {profile.isApproved ? (
                          <Badge variant="ready" dot>Đã phê duyệt hoạt động</Badge>
                        ) : (
                          <Badge variant="pending" dot>Chờ xét duyệt</Badge>
                        )}
                      </div>
                    </div>

                    <div className="ml-profile-info-row">
                      <span className="ml-profile-info-label">Hồ sơ định danh KYC & VietGAP</span>
                      <div style={{ marginTop: '4px' }}>
                        {getKycBadge(kycData?.status || 'PENDING')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="ml-card ml-stall-card ml-profile-shortcuts-card">
                  <h3 className="ml-card-title">⚡ Thao tác nhanh</h3>
                  <div className="ml-profile-shortcuts-list">
                    <button
                      type="button"
                      className="ml-profile-shortcut-btn"
                      onClick={handleOpenEditProfileModal}
                    >
                      <span>✏️ Chỉnh sửa thông tin hồ sơ & hình ảnh</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      className="ml-profile-shortcut-btn"
                      onClick={() => setActiveTab('cutoff')}
                    >
                      <span>⏰ Cài đặt giờ chốt đơn trước phiên chợ</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      className="ml-profile-shortcut-btn"
                      onClick={() => setActiveTab('slots')}
                    >
                      <span>🕒 Cấu hình ca đón khách nhận hàng</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      className="ml-profile-shortcut-btn"
                      onClick={() => setActiveTab('kyc')}
                    >
                      <span>🛡️ Cập nhật giấy tờ chứng nhận VietGAP</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CUTOFF SETTINGS ================= */}
        {activeTab === 'cutoff' && (
          <div className="ml-card ml-templates-section">
            <div className="ml-templates-header">
              <div>
                <h3 className="ml-card-title">⏰ Cấu hình khung giờ chốt đơn trước phiên họp chợ</h3>
                <p className="ml-templates-desc">
                  Thiết lập thời gian đóng nhận đơn trước khi phiên chợ bắt đầu (ví dụ: Chốt trước 12 tiếng). 
                  Khách hàng sẽ không thể đặt thêm sau giờ chốt để bạn có thời gian hái rau và đóng gói.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCutoffModalOpen(true)}
              >
                + Thêm giờ chốt đơn
              </Button>
            </div>

            {cutoffSettings.length === 0 ? (
              <div className="ml-templates-empty">
                <span className="ml-templates-empty-icon">⏰</span>
                <h4>Chưa có cấu hình chốt đơn nào</h4>
                <p>Thêm giờ chốt đơn để đảm bảo nông trại có đủ thời gian thu hoạch nông sản tươi.</p>
                <Button variant="outline" size="sm" onClick={() => setIsCutoffModalOpen(true)}>
                  Thiết lập hạn chốt đầu tiên
                </Button>
              </div>
            ) : (
              <div className="ml-templates-table-wrap">
                <table className="ml-templates-table">
                  <thead>
                    <tr>
                      <th>Phiên chợ áp dụng</th>
                      <th>Thứ họp chợ</th>
                      <th>Hạn chốt đơn trước giờ mở</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cutoffSettings.map((c) => (
                      <tr key={c.settingId}>
                        <td>
                          <strong>🎪 {c.marketName || `Chợ #${c.marketId}`}</strong>
                        </td>
                        <td>
                          <span className="ml-day-badge">
                            {DAY_OF_WEEK_NAMES[c.dayOfWeek] || `Thứ ${c.dayOfWeek}`}
                          </span>
                        </td>
                        <td>
                          <strong className="text-accent">
                            Chốt trước {c.cutoffHoursBefore} tiếng
                          </strong>
                        </td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-danger-text"
                            onClick={() => handleDeleteCutoff(c.settingId)}
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

        {/* ================= TAB 3: PICKUP SLOTS ================= */}
        {activeTab === 'slots' && (
          <div className="ml-card ml-templates-section">
            <div className="ml-templates-header">
              <div>
                <h3 className="ml-card-title">🕒 Danh sách ca đón khách tại sạp chợ</h3>
                <p className="ml-templates-desc">
                  Các khung giờ khách có thể ghé sạp của bạn để nhận phần rau quả đã đặt trước. Giới hạn số đơn tối đa mỗi ca giúp sạp phục vụ chu đáo, tránh ùn ứ.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsSlotModalOpen(true)}
              >
                + Thêm ca đón khách mới
              </Button>
            </div>

            {pickupSlots.length === 0 ? (
              <div className="ml-templates-empty">
                <span className="ml-templates-empty-icon">🕒</span>
                <h4>Chưa có ca nhận hàng nào</h4>
                <p>Tạo các ca sáng sớm (07:00 - 08:00, 08:00 - 09:00...) để khách lựa chọn khi đặt đơn.</p>
                <Button variant="outline" size="sm" onClick={() => setIsSlotModalOpen(true)}>
                  Tạo ca nhận đầu tiên
                </Button>
              </div>
            ) : (
              <div className="ml-templates-table-wrap">
                <table className="ml-templates-table">
                  <thead>
                    <tr>
                      <th>Phiên chợ</th>
                      <th>Khung giờ nhận</th>
                      <th>Sức chứa đơn tối đa</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickupSlots.map((s) => (
                      <tr key={s.slotId}>
                        <td>
                          <strong>🎪 {s.marketName || `Chợ #${s.marketId}`}</strong>
                        </td>
                        <td>
                          <span className="ml-day-badge">
                            ⏰ {s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}
                          </span>
                        </td>
                        <td>
                          <strong>{s.maxOrdersCapacity} đơn / ca</strong>
                        </td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-danger-text"
                            onClick={() => handleDeleteSlot(s.slotId)}
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

        {/* ================= TAB 4: ASSIGNED MARKETS ================= */}
        {activeTab === 'markets' && (
          <div className="ml-card ml-templates-section">
            <div className="ml-templates-header">
              <div>
                <h3 className="ml-card-title">🎪 Sạp chợ nông sản bạn đang tham gia bán</h3>
                <p className="ml-templates-desc">
                  Danh sách các phiên chợ mà tài khoản nông dân của bạn đã được cấp phép sạp hoặc đã đăng ký mở bán.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsRegisterMarketModalOpen(true)}
              >
                + Đăng ký tham gia chợ mới
              </Button>
            </div>

            {assignedMarkets.length === 0 ? (
              <div className="ml-templates-empty">
                <span className="ml-templates-empty-icon">🎪</span>
                <h4>Bạn chưa đăng ký tham gia chợ nào</h4>
                <p>Đăng ký sạp tại các chợ phiên nông sản sạch trong khu vực để mở rộng kênh bán rau củ.</p>
                <Button variant="outline" size="sm" onClick={() => setIsRegisterMarketModalOpen(true)}>
                  Đăng ký sạp chợ đầu tiên
                </Button>
              </div>
            ) : (
              <div className="ml-stall-items-list">
                {assignedMarkets.map((m) => (
                  <div key={m.assignmentId || m.marketId} className="ml-assigned-stall-item">
                    <div className="ml-stall-badge-top">
                      <span className="ml-stall-num-pill">{m.stallNumber || 'Sạp Chính'}</span>
                      <Badge variant={m.status === 'ACTIVE' ? 'ready' : 'pending'} size="sm">
                        {m.status === 'ACTIVE' ? 'Đã duyệt bán' : 'Đang chờ duyệt'}
                      </Badge>
                    </div>
                    <h4 className="ml-assigned-mname">{m.marketName || `Chợ Nông Sản #${m.marketId}`}</h4>
                    <div className="ml-assigned-maddr">Mã chợ: #{m.marketId}</div>
                    <div className="ml-assigned-sched">🕒 Trạng thái hoạt động: {m.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: KYC VERIFICATION ================= */}
        {activeTab === 'kyc' && (
          <div className="ml-card ml-templates-section">
            <div className="ml-templates-header">
              <div>
                <h3 className="ml-card-title">🛡️ Hồ sơ định danh KYC & Chứng nhận VietGAP / Hữu Cơ</h3>
                <p className="ml-templates-desc">
                  MarketLink yêu cầu 100% nông dân và chủ sạp hoàn tất định danh và nộp chứng nhận canh tác sạch nhằm bảo vệ quyền lợi người tiêu dùng.
                </p>
              </div>
              {(!kycData || kycData.kycStatus !== 'VERIFIED') && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsKycModalOpen(true)}
                >
                  📤 Nộp hồ sơ định danh
                </Button>
              )}
            </div>

            {/* KYC Status Banner */}
            <div className="ml-kyc-status-banner">
              <div className="ml-kyc-status-left">
                <span className="ml-kyc-status-label">Trạng thái định danh hiện tại:</span>
                <div>{getKycBadge(kycData?.kycStatus || 'UNVERIFIED')}</div>
              </div>
              {kycData?.isApproved && (
                <div className="ml-kyc-approved-badge">
                  ✓ Quyền mở bán và nhận đơn đặt trước: ĐÃ ĐƯỢC CẤP
                </div>
              )}
            </div>

            {/* Uploaded Documents List */}
            <h4 className="ml-kyc-subheading">Tài liệu và chứng chỉ đã nộp:</h4>
            {(!kycData?.documents || kycData.documents.length === 0) ? (
              <div className="ml-templates-empty">
                <span className="ml-templates-empty-icon">📄</span>
                <h4>Chưa có tài liệu định danh nào được nộp</h4>
                <p>Nộp ảnh CCCD và Giấy chứng nhận VietGAP/Hữu cơ để mở khóa đầy đủ tính năng sạp chợ.</p>
                <Button variant="outline" size="sm" onClick={() => setIsKycModalOpen(true)}>
                  Nộp tài liệu ngay
                </Button>
              </div>
            ) : (
              <div className="ml-kyc-docs-grid">
                {kycData.documents.map((doc, idx) => (
                  <div key={idx} className="ml-kyc-doc-card">
                    <img src={doc.documentUrl} alt="KYC Document" className="ml-kyc-doc-img" />
                    <div className="ml-kyc-doc-info">
                      <span className="ml-kyc-doc-num">Số: {doc.documentNumber || 'N/A'}</span>
                      <span className="ml-kyc-doc-date">Ngày cấp: {doc.issuedDate || 'N/A'}</span>
                      {doc.expiryDate && (
                        <span className="ml-kyc-doc-date">Hết hạn: {doc.expiryDate}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD CUTOFF SETTING ================= */}
      {isCutoffModalOpen && (
        <div className="ml-modal-overlay">
          <div className="ml-modal-box">
            <div className="ml-modal-header">
              <h3>Thiết lập khung giờ chốt đơn trước phiên họp</h3>
              <button
                type="button"
                className="ml-modal-close"
                onClick={() => setIsCutoffModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCutoff} className="ml-modal-form">
              <div className="ml-modal-body">
                <div className="ml-form-group">
                  <label className="ml-form-label">Chọn phiên chợ áp dụng:</label>
                  <select
                    className="ml-form-input"
                    value={cutoffForm.marketId}
                    onChange={(e) => setCutoffForm({ ...cutoffForm, marketId: e.target.value })}
                    required
                  >
                    {availableMarkets.map((m) => (
                      <option key={m.marketId || m.id} value={m.marketId || m.id}>
                        {m.name || `Chợ #${m.marketId || m.id}`} - {m.address || 'Hà Nội'}
                      </option>
                    ))}
                    {availableMarkets.length === 0 && (
                      <option value="101">Chợ Nông Sản Tây Hồ Eco (Mặc định)</option>
                    )}
                  </select>
                </div>

                <div className="ml-form-grid-2">
                  <div className="ml-form-group">
                    <label className="ml-form-label">Thứ họp chợ:</label>
                    <select
                      className="ml-form-input"
                      value={cutoffForm.dayOfWeek}
                      onChange={(e) => setCutoffForm({ ...cutoffForm, dayOfWeek: Number(e.target.value) })}
                      required
                    >
                      <option value={6}>Thứ Bảy</option>
                      <option value={7}>Chủ Nhật</option>
                      <option value={1}>Thứ Hai</option>
                      <option value={2}>Thứ Ba</option>
                      <option value={3}>Thứ Tư</option>
                      <option value={4}>Thứ Năm</option>
                      <option value={5}>Thứ Sáu</option>
                    </select>
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">Chốt trước bao nhiêu tiếng:</label>
                    <input
                      type="number"
                      min="1"
                      max="72"
                      step="1"
                      className="ml-form-input"
                      value={cutoffForm.cutoffHoursBefore}
                      onChange={(e) => setCutoffForm({ ...cutoffForm, cutoffHoursBefore: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="ml-modal-actions">
                <Button type="button" variant="ghost" onClick={() => setIsCutoffModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary">
                  Lưu giờ chốt đơn
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PICKUP SLOT ================= */}
      {isSlotModalOpen && (
        <div className="ml-modal-overlay">
          <div className="ml-modal-box">
            <div className="ml-modal-header">
              <h3>Thêm ca đón khách tại sạp chợ</h3>
              <button
                type="button"
                className="ml-modal-close"
                onClick={() => setIsSlotModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="ml-modal-form">
              <div className="ml-modal-body">
                <div className="ml-form-group">
                  <label className="ml-form-label">Chợ họp phiên:</label>
                  <select
                    className="ml-form-input"
                    value={slotForm.marketId}
                    onChange={(e) => setSlotForm({ ...slotForm, marketId: e.target.value })}
                    required
                  >
                    {availableMarkets.map((m) => (
                      <option key={m.marketId || m.id} value={m.marketId || m.id}>
                        {m.name || `Chợ #${m.marketId || m.id}`}
                      </option>
                    ))}
                    {availableMarkets.length === 0 && (
                      <option value="101">Chợ Nông Sản Tây Hồ Eco</option>
                    )}
                  </select>
                </div>

                <div className="ml-form-grid-2">
                  <div className="ml-form-group">
                    <label className="ml-form-label">Giờ bắt đầu ca:</label>
                    <input
                      type="time"
                      className="ml-form-input"
                      value={slotForm.startTime.substring(0, 5)}
                      onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">Giờ kết thúc ca:</label>
                    <input
                      type="time"
                      className="ml-form-input"
                      value={slotForm.endTime.substring(0, 5)}
                      onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Sức chứa tối đa (số đơn/ca):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="ml-form-input"
                    value={slotForm.maxOrdersCapacity}
                    onChange={(e) => setSlotForm({ ...slotForm, maxOrdersCapacity: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="ml-modal-actions">
                <Button type="button" variant="ghost" onClick={() => setIsSlotModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary">
                  Tạo ca đón khách
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER MARKET ================= */}
      {isRegisterMarketModalOpen && (
        <div className="ml-modal-overlay">
          <div className="ml-modal-box">
            <div className="ml-modal-header">
              <h3>Đăng ký tham gia sạp tại phiên chợ mới</h3>
              <button
                type="button"
                className="ml-modal-close"
                onClick={() => setIsRegisterMarketModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterMarket} className="ml-modal-form">
              <div className="ml-modal-body">
                <div className="ml-form-group">
                  <label className="ml-form-label">Chọn chợ phiên muốn mở sạp:</label>
                  <select
                    className="ml-form-input"
                    value={registerMarketForm.marketId}
                    onChange={(e) => setRegisterMarketForm({ ...registerMarketForm, marketId: e.target.value })}
                    required
                  >
                    {availableMarkets.map((m) => (
                      <option key={m.marketId || m.id} value={m.marketId || m.id}>
                        {m.name || `Chợ #${m.marketId || m.id}`} - {m.address || 'Hà Nội'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Số hiệu sạp mong muốn (nếu có):</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Sạp A-08, Gian Rau Sạch Ba Vì..."
                    className="ml-form-input"
                    value={registerMarketForm.stallNumber}
                    onChange={(e) => setRegisterMarketForm({ ...registerMarketForm, stallNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="ml-modal-actions">
                <Button type="button" variant="ghost" onClick={() => setIsRegisterMarketModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary">
                  Gửi đăng ký sạp
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUBMIT KYC ================= */}
      {isKycModalOpen && (
        <div className="ml-modal-overlay">
          <div className="ml-modal-box">
            <div className="ml-modal-header">
              <h3>Nộp hồ sơ định danh KYC & Chứng nhận VietGAP</h3>
              <button
                type="button"
                className="ml-modal-close"
                onClick={() => setIsKycModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitKyc} className="ml-modal-form">
              <div className="ml-modal-body">
                <div className="ml-form-group">
                  <label className="ml-form-label">Tải lên tài liệu chứng nhận / CCCD:</label>
                  <ImageUploadInput
                    folder="kyc"
                    value={kycForm.documentUrl}
                    onChange={(url) => setKycForm((prev) => ({ ...prev, documentUrl: url }))}
                    onUploadSuccess={(url) => setKycForm((prev) => ({ ...prev, documentUrl: url }))}
                    helpText="Ảnh chụp rõ nét 2 mặt CCCD hoặc Giấy chứng nhận VietGAP / Hữu cơ"
                  />
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Số giấy tờ / Mã chứng nhận VietGAP:</label>
                  <input
                    type="text"
                    placeholder="VD: VG-2024-HANOI-88"
                    className="ml-form-input"
                    value={kycForm.documentNumber}
                    onChange={(e) => setKycForm({ ...kycForm, documentNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="ml-form-grid-2">
                  <div className="ml-form-group">
                    <label className="ml-form-label">Ngày cấp:</label>
                    <input
                      type="date"
                      className="ml-form-input"
                      value={kycForm.issuedDate}
                      onChange={(e) => setKycForm({ ...kycForm, issuedDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">Ngày hết hạn:</label>
                    <input
                      type="date"
                      className="ml-form-input"
                      value={kycForm.expiryDate}
                      onChange={(e) => setKycForm({ ...kycForm, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="ml-modal-actions">
                <Button type="button" variant="ghost" onClick={() => setIsKycModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary">
                  Nộp hồ sơ xét duyệt
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PROFILE ================= */}
      {isEditProfileModalOpen && (
        <div className="ml-modal-overlay">
          <div className="ml-modal-box" style={{ maxWidth: '680px' }}>
            <div className="ml-modal-header">
              <div>
                <h3>✏️ Chỉnh sửa hồ sơ nhà vườn & Nông hộ</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Cập nhật thông tin định danh, câu chuyện canh tác và hình ảnh đại diện của gian hàng
                </p>
              </div>
              <button
                type="button"
                className="ml-modal-close"
                onClick={() => setIsEditProfileModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="ml-modal-form">
              <div className="ml-modal-body">
                <div className="ml-form-group">
                  <label className="ml-form-label">Tên nhà vườn / Hợp tác xã:</label>
                  <input
                    type="text"
                    className="ml-form-input"
                    value={editProfileForm.farmName}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, farmName: e.target.value })}
                    placeholder="VD: Vườn Nông Sản Sạch Ba Vì"
                    required
                  />
                </div>

                <div className="ml-form-grid-2">
                  <div className="ml-form-group">
                    <label className="ml-form-label">Tên chủ hộ / Người đại diện:</label>
                    <input
                      type="text"
                      className="ml-form-input"
                      value={editProfileForm.fullName}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, fullName: e.target.value })}
                      placeholder="VD: Nguyễn Văn Nông Dân"
                      required
                    />
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">Số điện thoại liên hệ sạp:</label>
                    <input
                      type="text"
                      className="ml-form-input"
                      value={editProfileForm.phone}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                      placeholder="VD: 0988123456"
                      required
                    />
                  </div>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Địa chỉ nông trại / Vùng trồng:</label>
                  <input
                    type="text"
                    className="ml-form-input"
                    value={editProfileForm.address}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                    placeholder="VD: Xã Vân Hòa, Huyện Ba Vì, TP. Hà Nội"
                    required
                  />
                </div>

                <div className="ml-form-grid-2">
                  <div className="ml-form-group">
                    <label className="ml-form-label">Tọa độ Vĩ độ (Latitude):</label>
                    <input
                      type="text"
                      className="ml-form-input"
                      value={editProfileForm.latitude}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, latitude: e.target.value })}
                      placeholder="VD: 21.0823"
                    />
                  </div>

                  <div className="ml-form-group">
                    <label className="ml-form-label">Tọa độ Kinh độ (Longitude):</label>
                    <input
                      type="text"
                      className="ml-form-input"
                      value={editProfileForm.longitude}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, longitude: e.target.value })}
                      placeholder="VD: 105.3512"
                    />
                  </div>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Ảnh đại diện chủ sạp (Avatar):</label>
                  <ImageUploadInput
                    folder="avatars"
                    value={editProfileForm.avatarUrl}
                    onChange={(url) => setEditProfileForm((prev) => ({ ...prev, avatarUrl: url }))}
                    onUploadSuccess={(url) => setEditProfileForm((prev) => ({ ...prev, avatarUrl: url }))}
                    helpText="Tải ảnh chân dung người nông dân / chủ hộ (Rõ mặt)"
                  />
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Ảnh bìa sạp / Vườn rau (Cover):</label>
                  <ImageUploadInput
                    folder="stalls"
                    value={editProfileForm.coverUrl}
                    onChange={(url) => setEditProfileForm((prev) => ({ ...prev, coverUrl: url }))}
                    onUploadSuccess={(url) => setEditProfileForm((prev) => ({ ...prev, coverUrl: url }))}
                    helpText="Tải ảnh chụp quang cảnh vườn trồng, luống rau hoặc sạp chợ"
                  />
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Câu chuyện canh tác & Cam kết chất lượng:</label>
                  <textarea
                    className="ml-form-textarea"
                    rows={4}
                    value={editProfileForm.bio}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                    placeholder="Chia sẻ nguồn gốc nông sản, phương pháp canh tác sạch, chứng nhận VietGAP..."
                  />
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
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
