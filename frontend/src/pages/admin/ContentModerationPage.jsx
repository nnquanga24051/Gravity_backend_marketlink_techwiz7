import React, { useState, useEffect } from 'react';
import './ContentModerationPage.css';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import adminService from '../../services/adminService';

export default function ContentModerationPage({ onNavigate }) {
  // Tabs: 'reviews' | 'categories' | 'announcements' | 'disputes'
  const [activeTab, setActiveTab] = useState('reviews');

  // ========================================================
  // 1. REVIEWS MODERATION STATE
  // ========================================================
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('ALL'); // 'ALL' | 'LOW_RATING' | 'HIDDEN' | 'VISIBLE'

  // ========================================================
  // 2. CATEGORIES STATE
  // ========================================================
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: ''
  });

  // ========================================================
  // 3. ANNOUNCEMENTS STATE
  // ========================================================
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'GENERAL', // 'GENERAL' | 'MARKET_EVENT' | 'POLICY' | 'MAINTENANCE'
    targetRole: 'ALL', // 'ALL' | 'FARMER' | 'CUSTOMER'
    isActive: true
  });

  // ========================================================
  // 4. DISPUTES STATE
  // ========================================================
  const [disputes, setDisputes] = useState([
    {
      id: 301,
      orderCode: 'ORD-2026-001',
      customerName: 'Nguyễn Nhựt Quang',
      farmerName: 'Nguyễn Văn Nông Dân',
      marketName: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      issue: 'Khách đến sạp muộn 30 phút so với ca nhận hàng, sạp đã chuẩn bị sẵn rau tươi trong túi sinh học giữ lạnh.',
      solution: 'Ban Quản Lý chợ đã hướng dẫn khách kiểm tra chất lượng và nhận hàng bình thường.',
      status: 'RESOLVED'
    }
  ]);

  // Notifications
  const [notification, setNotification] = useState({ type: '', text: '' });
  const showToast = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification({ type: '', text: '' }), 4000);
  };

  // Load reviews from backend
  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await adminService.getAllReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load reviews', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Load categories from backend
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await adminService.getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load categories', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load announcements from backend
  const loadAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const data = await adminService.getAllAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load announcements', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews();
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'announcements') loadAnnouncements();
  }, [activeTab]);

  // ========================================================
  // REVIEWS ACTIONS
  // ========================================================
  const handleToggleReviewVisibility = async (reviewId, currentIsHidden) => {
    const nextHidden = !currentIsHidden;
    try {
      await adminService.setReviewVisibility(reviewId, nextHidden);
      showToast('success', nextHidden ? 'Đã ẩn đánh giá khỏi giao diện người xem.' : 'Đã hiển thị lại đánh giá công khai.');
      loadReviews();
    } catch (err) {
      showToast('error', 'Lỗi thay đổi trạng thái đánh giá: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === 'LOW_RATING') return (r.rating || 5) <= 2;
    if (reviewFilter === 'HIDDEN') return r.isHidden === true;
    if (reviewFilter === 'VISIBLE') return !r.isHidden;
    return true;
  });

  // ========================================================
  // CATEGORIES ACTIONS
  // ========================================================
  const handleOpenCategoryModal = (cat = null) => {
    setEditingCategory(cat);
    if (cat) {
      setCategoryForm({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || ''
      });
    } else {
      setCategoryForm({
        name: '',
        slug: '',
        description: ''
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert('Vui lòng nhập tên danh mục!');
      return;
    }

    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.categoryId, categoryForm);
        showToast('success', 'Cập nhật danh mục thành công!');
      } else {
        await adminService.createCategory(categoryForm);
        showToast('success', 'Tạo danh mục sản phẩm mới thành công!');
      }
      setIsCategoryModalOpen(false);
      loadCategories();
    } catch (err) {
      showToast('error', 'Lỗi lưu danh mục: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Xác nhận xóa danh mục "${name}"? Hành động này sẽ yêu cầu các sản phẩm thuộc danh mục được chuyển sang phân loại khác.`)) {
      return;
    }
    try {
      await adminService.deleteCategory(id);
      showToast('success', `Đã xóa danh mục "${name}" thành công.`);
      loadCategories();
    } catch (err) {
      showToast('error', 'Lỗi xóa danh mục: ' + (err.response?.data?.message || err.message));
    }
  };

  // ========================================================
  // ANNOUNCEMENTS ACTIONS
  // ========================================================
  const handleOpenAnnouncementModal = (ann = null) => {
    setEditingAnnouncement(ann);
    if (ann) {
      setAnnouncementForm({
        title: ann.title || '',
        content: ann.content || '',
        type: ann.type || 'GENERAL',
        targetRole: ann.targetRole || 'ALL',
        isActive: ann.isActive !== undefined ? ann.isActive : true
      });
    } else {
      setAnnouncementForm({
        title: '',
        content: '',
        type: 'GENERAL',
        targetRole: 'ALL',
        isActive: true
      });
    }
    setIsAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề thông báo!');
      return;
    }

    try {
      if (editingAnnouncement) {
        await adminService.updateAnnouncement(editingAnnouncement.announcementId || editingAnnouncement.id, announcementForm);
        showToast('success', 'Cập nhật thông báo hệ thống thành công!');
      } else {
        await adminService.createAnnouncement(announcementForm);
        showToast('success', 'Đăng thông báo hệ thống mới thành công!');
      }
      setIsAnnouncementModalOpen(false);
      loadAnnouncements();
    } catch (err) {
      showToast('error', 'Lỗi lưu thông báo: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteAnnouncement = async (id, title) => {
    if (!window.confirm(`Xác nhận xóa bản tin "${title}" khỏi hệ thống?`)) return;
    try {
      await adminService.deleteAnnouncement(id);
      showToast('success', 'Đã xóa bản tin thành công.');
      loadAnnouncements();
    } catch (err) {
      showToast('error', 'Lỗi xóa bản tin: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="ml-content-mod-page">
      {/* Toast */}
      {notification.text && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backgroundColor: notification.type === 'success' ? '#15803d' : '#b91c1c',
          color: '#ffffff'
        }}>
          {notification.type === 'success' ? '✓ ' : '⚠️ '} {notification.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="ml-mod-banner">
        <div className="ml-container ml-mod-banner-inner">
          <div>
            <span className="ml-section-subtitle" style={{ color: '#86efac' }}>
              Ban Quản Trị Hệ Thống MarketLink
            </span>
            <h1 className="ml-mod-title">Kiểm Duyệt Nội Dung & Vận Hành Sàn</h1>
            <p className="ml-mod-desc">
              Kiểm duyệt đánh giá, quản lý danh mục phân loại nông sản và phát hành các bản tin, thông báo lịch chợ toàn sàn.
            </p>
          </div>

          <div className="ml-mod-stats-strip">
            <div className="ml-mod-stat-pill">
              <span className="ml-mod-stat-num">{reviews.length}</span>
              <span className="ml-mod-stat-lbl">Đánh giá</span>
            </div>
            <div className="ml-mod-stat-pill">
              <span className="ml-mod-stat-num">{categories.length}</span>
              <span className="ml-mod-stat-lbl">Danh mục</span>
            </div>
            <div className="ml-mod-stat-pill">
              <span className="ml-mod-stat-num">{announcements.length}</span>
              <span className="ml-mod-stat-lbl">Bản tin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-container ml-mod-content">
        {/* Navigation Tabs */}
        <div className="ml-inv-main-tabs" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            ⭐ Kiểm duyệt đánh giá ({reviews.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🏷️ Danh mục nông sản ({categories.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            📢 Thông báo & Bản tin ({announcements.length})
          </button>
          <button
            type="button"
            className={`ml-inv-main-tab ${activeTab === 'disputes' ? 'active' : ''}`}
            onClick={() => setActiveTab('disputes')}
          >
            ⚖️ Tranh chấp & Khiếu nại ({disputes.length})
          </button>
        </div>

        {/* ========================================================
            TAB 1: REVIEWS MODERATION
            ======================================================== */}
        {activeTab === 'reviews' && (
          <div className="ml-reviews-mod-box">
            {/* Filter Sub-bar */}
            <div className="ml-card ml-mod-controls" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Bộ lọc hiển thị:</span>
                <button
                  type="button"
                  className={`ml-filter-chip ${reviewFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('ALL')}
                >
                  Tất cả ({reviews.length})
                </button>
                <button
                  type="button"
                  className={`ml-filter-chip ${reviewFilter === 'LOW_RATING' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('LOW_RATING')}
                >
                  Đánh giá thấp (1-2★) ({reviews.filter((r) => (r.rating || 5) <= 2).length})
                </button>
                <button
                  type="button"
                  className={`ml-filter-chip ${reviewFilter === 'HIDDEN' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('HIDDEN')}
                >
                  Đang bị ẩn ({reviews.filter((r) => r.isHidden).length})
                </button>
                <button
                  type="button"
                  className={`ml-filter-chip ${reviewFilter === 'VISIBLE' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('VISIBLE')}
                >
                  Đang hiển thị ({reviews.filter((r) => !r.isHidden).length})
                </button>
                <div style={{ marginLeft: 'auto' }}>
                  <Button variant="outline" size="sm" onClick={loadReviews}>
                    🔄 Tải lại
                  </Button>
                </div>
              </div>
            </div>

            {loadingReviews ? (
              <div className="ml-inv-loading">Đang tải danh sách đánh giá...</div>
            ) : filteredReviews.length === 0 ? (
              <div className="ml-card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                Không có đánh giá nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredReviews.map((r) => (
                  <div
                    key={r.reviewId}
                    className="ml-card"
                    style={{
                      borderLeft: r.isHidden ? '4px solid #ef4444' : '4px solid #22c55e',
                      backgroundColor: r.isHidden ? '#fef2f2' : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                            {r.customerName || 'Khách hàng'}
                          </span>
                          <span style={{ color: '#eab308', fontSize: 15 }}>
                            {'★'.repeat(r.rating || 5)}
                            {'☆'.repeat(Math.max(0, 5 - (r.rating || 5)))}
                          </span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            ({r.createdAt ? r.createdAt.replace('T', ' ').substring(0, 16) : ''})
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                          Đánh giá cho sạp: <strong>{r.stallName || r.farmerName}</strong> {r.productName ? `• Sản phẩm: ${r.productName}` : ''}
                        </div>
                      </div>

                      <div>
                        {r.isHidden ? (
                          <Badge variant="cancelled" dot>Đang bị ẩn</Badge>
                        ) : (
                          <Badge variant="ready" dot>Công khai</Badge>
                        )}
                      </div>
                    </div>

                    <div style={{ margin: '10px 0', fontSize: 14, color: '#1e293b', fontStyle: 'italic' }}>
                      "{r.comment || 'Không có bình luận chữ.'}"
                    </div>

                    {r.farmerReply && (
                      <div style={{ backgroundColor: '#f0fdf4', padding: '8px 12px', borderRadius: 6, fontSize: 13, color: '#166534', borderLeft: '3px solid #22c55e' }}>
                        <strong>Phản hồi từ chủ sạp:</strong> "{r.farmerReply}"
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <Button
                        variant={r.isHidden ? 'primary' : 'outline'}
                        size="sm"
                        style={{
                          color: r.isHidden ? '#ffffff' : '#b91c1c',
                          borderColor: r.isHidden ? '#15803d' : '#fca5a5'
                        }}
                        onClick={() => handleToggleReviewVisibility(r.reviewId, r.isHidden)}
                      >
                        {r.isHidden ? '✓ Mở lại đánh giá' : '👁️ Ẩn đánh giá này'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: CATEGORIES CRUD
            ======================================================== */}
        {activeTab === 'categories' && (
          <div className="ml-categories-mod-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                Quản lý các phân loại ngành hàng nông sản để người mua dễ dàng tìm kiếm trên chợ phiên.
              </div>
              <Button variant="primary" size="md" onClick={() => handleOpenCategoryModal()}>
                + Thêm danh mục mới
              </Button>
            </div>

            {loadingCategories ? (
              <div className="ml-inv-loading">Đang tải danh mục...</div>
            ) : categories.length === 0 ? (
              <div className="ml-card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                Chưa có danh mục nào. Hãy bấm "Thêm danh mục mới" ở trên.
              </div>
            ) : (
              <div className="ml-card" style={{ overflowX: 'auto', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '12px 16px' }}>Mã</th>
                      <th style={{ padding: '12px 16px' }}>Tên danh mục</th>
                      <th style={{ padding: '12px 16px' }}>Đường dẫn (Slug)</th>
                      <th style={{ padding: '12px 16px' }}>Mô tả chi tiết</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.categoryId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>#{c.categoryId}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#166534' }}>{c.name}</td>
                        <td style={{ padding: '12px 16px', color: '#334155', fontFamily: 'monospace' }}>{c.slug}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{c.description || 'Chưa có mô tả'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCategoryModal(c)}
                            >
                              ✏️ Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ color: '#b91c1c' }}
                              onClick={() => handleDeleteCategory(c.categoryId, c.name)}
                            >
                              ✕ Xóa
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
            TAB 3: SYSTEM ANNOUNCEMENTS CRUD
            ======================================================== */}
        {activeTab === 'announcements' && (
          <div className="ml-announcements-mod-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                Phát thông báo vận hành, chính sách mới hoặc cảnh báo thời tiết tới bà con nông dân và khách mua hàng.
              </div>
              <Button variant="primary" size="md" onClick={() => handleOpenAnnouncementModal()}>
                📢 Đăng bản tin mới
              </Button>
            </div>

            {loadingAnnouncements ? (
              <div className="ml-inv-loading">Đang tải bản tin hệ thống...</div>
            ) : announcements.length === 0 ? (
              <div className="ml-card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                Chưa có bản tin nào. Hãy bấm "Đăng bản tin mới" để phát thông báo tới toàn sàn.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {announcements.map((a) => {
                  const annId = a.announcementId || a.id;
                  return (
                    <div key={annId} className="ml-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1e293b' }}>
                          {a.title}
                        </h3>
                        <Badge variant={a.isActive !== false ? 'ready' : 'neutral'} dot>
                          {a.isActive !== false ? 'Đang bật' : 'Đã ẩn'}
                        </Badge>
                      </div>

                      <div style={{ fontSize: 12, display: 'flex', gap: 8, color: '#64748b' }}>
                        <span>Loại: <strong>{a.type || 'GENERAL'}</strong></span>
                        <span>•</span>
                        <span>Đối tượng: <strong>{a.targetRole || 'ALL'}</strong></span>
                        <span>•</span>
                        <span>{a.createdAt ? a.createdAt.substring(0, 10) : ''}</span>
                      </div>

                      <p style={{ fontSize: 13.5, color: '#475569', margin: '4px 0', lineHeight: 1.5, flex: 1 }}>
                        {a.content}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAnnouncementModal(a)}
                        >
                          ✏️ Chỉnh sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ color: '#b91c1c' }}
                          onClick={() => handleDeleteAnnouncement(annId, a.title)}
                        >
                          ✕ Xóa
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: DISPUTES & RESOLUTION
            ======================================================== */}
        {activeTab === 'disputes' && (
          <div className="ml-disputes-mod-box">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {disputes.map((d) => (
                <div key={d.id} className="ml-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                      Đơn hàng #{d.orderCode} • {d.marketName}
                    </div>
                    <Badge variant={d.status === 'RESOLVED' ? 'ready' : 'pending'}>
                      {d.status === 'RESOLVED' ? 'Đã giải quyết thỏa đáng' : 'Đang tiếp nhận'}
                    </Badge>
                  </div>

                  <div style={{ fontSize: 13, color: '#475569' }}>
                    Người mua: <strong>{d.customerName}</strong> ↔ Chủ sạp: <strong>{d.farmerName}</strong>
                  </div>

                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: 10, borderRadius: 6, fontSize: 13, color: '#92400e' }}>
                    ⚠️ <strong>Nội dung phản ánh:</strong> {d.issue}
                  </div>

                  {d.solution && (
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: 10, borderRadius: 6, fontSize: 13, color: '#166534' }}>
                      ✅ <strong>Kết quả xử lý:</strong> {d.solution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: ADD / EDIT CATEGORY
          ======================================================== */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title={editingCategory ? 'Chỉnh Sửa Danh Mục Sản Phẩm' : 'Thêm Danh Mục Nông Sản Mới'}
          subtitle="Danh mục giúp khách hàng phân loại và tìm kiếm nông sản tươi dễ dàng hơn"
          maxWidth="520px"
        >
          <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="ml-form-group">
              <label className="ml-form-label">Tên danh mục:</label>
              <input
                type="text"
                className="ml-form-input"
                placeholder="VD: Nấm & Thảo Dược, Trái Cây Bản Địa..."
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
            </div>

            <div className="ml-form-group">
              <label className="ml-form-label">Đường dẫn URL (Slug - để trống để tạo tự động):</label>
              <input
                type="text"
                className="ml-form-input"
                placeholder="VD: nam-thao-duoc"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
              />
            </div>

            <div className="ml-form-group">
              <label className="ml-form-label">Mô tả danh mục:</label>
              <textarea
                className="ml-form-textarea"
                rows={3}
                placeholder="Mô tả các sản phẩm thuộc phân loại này..."
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button type="button" variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary">
                {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT ANNOUNCEMENT
          ======================================================== */}
      {isAnnouncementModalOpen && (
        <Modal
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          title={editingAnnouncement ? 'Chỉnh Sửa Thông Báo Hệ Thống' : 'Phát Hành Thông Báo Mới'}
          subtitle="Bản tin sẽ hiển thị trên bảng tin chợ phiên và gửi thông báo tới người dùng"
          maxWidth="560px"
        >
          <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="ml-form-group">
              <label className="ml-form-label">Tiêu đề thông báo:</label>
              <input
                type="text"
                className="ml-form-input"
                placeholder="VD: Thông báo lịch họp chợ phiên cuối tuần tại Ba Đình..."
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="ml-form-group">
                <label className="ml-form-label">Phân loại:</label>
                <select
                  className="ml-form-select"
                  value={announcementForm.type}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                >
                  <option value="GENERAL">Tin chung (GENERAL)</option>
                  <option value="MARKET_EVENT">Sự kiện chợ phiên (MARKET_EVENT)</option>
                  <option value="POLICY">Chính sách & An toàn (POLICY)</option>
                  <option value="MAINTENANCE">Bảo trì hệ thống (MAINTENANCE)</option>
                </select>
              </div>

              <div className="ml-form-group">
                <label className="ml-form-label">Đối tượng nhận:</label>
                <select
                  className="ml-form-select"
                  value={announcementForm.targetRole}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, targetRole: e.target.value })}
                >
                  <option value="ALL">Toàn bộ sàn (Tất cả mọi người)</option>
                  <option value="FARMER">Chỉ Nông Dân / Chủ sạp</option>
                  <option value="CUSTOMER">Chỉ Khách Mua Hàng</option>
                </select>
              </div>
            </div>

            <div className="ml-form-group">
              <label className="ml-form-label">Nội dung chi tiết bản tin:</label>
              <textarea
                className="ml-form-textarea"
                rows={5}
                placeholder="Nhập nội dung đầy đủ của thông báo..."
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="annActive"
                checked={announcementForm.isActive}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, isActive: e.target.checked })}
              />
              <label htmlFor="annActive" style={{ fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                Kích hoạt hiển thị công khai ngay sau khi đăng
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button type="button" variant="ghost" onClick={() => setIsAnnouncementModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary">
                {editingAnnouncement ? 'Lưu thay đổi' : 'Phát thông báo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
