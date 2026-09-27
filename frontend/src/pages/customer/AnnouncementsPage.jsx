import React, { useState, useEffect } from 'react';
import './AnnouncementsPage.css';
import announcementService from '../../services/announcementService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function AnnouncementsPage({ onNavigate }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getActiveAnnouncements({
        keyword: searchKeyword.trim(),
        type: selectedType
      });
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load announcements in page', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnnouncements();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchKeyword, selectedType]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'MARKET_EVENT':
        return { label: '🎪 Sự kiện chợ phiên', bg: '#e0f2fe', color: '#0284c7' };
      case 'POLICY':
        return { label: '📋 Tiêu chuẩn & An toàn', bg: '#fef3c7', color: '#b45309' };
      case 'MAINTENANCE':
        return { label: '⚙️ Bảo trì kỹ thuật', bg: '#f1f5f9', color: '#475569' };
      default:
        return { label: '📢 Tin tức chung', bg: '#ecfdf5', color: '#059669' };
    }
  };

  return (
    <div className="ml-announcements-page">
      <div className="ml-container">
        {/* Breadcrumb & Header */}
        <div className="ml-ann-header">
          <div className="ml-ann-breadcrumb">
            <span onClick={() => onNavigate && onNavigate('home')}>Trang chủ</span> / Bản tin chợ phiên
          </div>
          <h1 className="ml-ann-title">📢 Bản Tin & Thông Báo Chợ Phiên</h1>
          <p className="ml-ann-desc">
            Kênh phát ngôn chính thức từ Ban quản lý MarketLink về lịch họp chợ, thời gian mở cổng nhận hàng Pay-at-pickup, quy chuẩn kiểm định VietGAP và các chương trình ưu đãi dành cho người tiêu dùng.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="ml-ann-controls">
          <div className="ml-ann-search-box">
            <span className="ml-ann-search-icon">🔍</span>
            <input
              type="text"
              className="ml-ann-search-input"
              placeholder="Tìm kiếm bản tin theo từ khóa (VietGAP, họp chợ, lịch nhận hàng, bảo trì...)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <button
                type="button"
                className="ml-ann-clear-btn"
                onClick={() => setSearchKeyword('')}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          <div className="ml-ann-tabs">
            <button
              type="button"
              className={`ml-ann-tab ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedType('all')}
            >
              Tất cả bản tin
            </button>
            <button
              type="button"
              className={`ml-ann-tab ${selectedType === 'MARKET_EVENT' ? 'active' : ''}`}
              onClick={() => setSelectedType('MARKET_EVENT')}
            >
              🎪 Sự kiện họp chợ
            </button>
            <button
              type="button"
              className={`ml-ann-tab ${selectedType === 'POLICY' ? 'active' : ''}`}
              onClick={() => setSelectedType('POLICY')}
            >
              📋 Tiêu chuẩn & Chính sách
            </button>
            <button
              type="button"
              className={`ml-ann-tab ${selectedType === 'GENERAL' ? 'active' : ''}`}
              onClick={() => setSelectedType('GENERAL')}
            >
              📢 Tin tức chung
            </button>
            <button
              type="button"
              className={`ml-ann-tab ${selectedType === 'MAINTENANCE' ? 'active' : ''}`}
              onClick={() => setSelectedType('MAINTENANCE')}
            >
              ⚙️ Kỹ thuật & Bảo trì
            </button>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="ml-ann-loading">
            <div className="ml-ann-spinner"></div>
            <p>Đang tải thông báo chính thức từ ban quản trị...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="ml-card ml-ann-empty">
            <span style={{ fontSize: 48, marginBottom: 12 }}>📭</span>
            <h3>Không tìm thấy thông báo nào</h3>
            <p>Hiện không có thông báo nào phù hợp với từ khóa hoặc bộ lọc đã chọn.</p>
            {(searchKeyword || selectedType !== 'all') && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchKeyword('');
                  setSelectedType('all');
                }}
              >
                🔄 Xóa bộ lọc & xem tất cả
              </Button>
            )}
          </div>
        ) : (
          <div className="ml-ann-grid">
            {announcements.map((item) => {
              const annId = item.announcementId || item.id;
              const isPinned = item.priority === 'PINNED';
              const isUrgent = item.priority === 'URGENT';
              const typeInfo = getTypeLabel(item.type);

              return (
                <div
                  key={annId}
                  className={`ml-card ml-ann-card ${isPinned ? 'pinned' : ''} ${isUrgent ? 'urgent' : ''}`}
                  onClick={() => setSelectedAnnouncement(item)}
                >
                  <div className="ml-ann-card-top">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span
                        className="ml-ann-type-tag"
                        style={{ backgroundColor: typeInfo.bg, color: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </span>
                      {isPinned && (
                        <span className="ml-ann-priority-tag pinned">
                          📌 Ghim quan trọng
                        </span>
                      )}
                      {isUrgent && (
                        <span className="ml-ann-priority-tag urgent">
                          🚨 Khẩn cấp
                        </span>
                      )}
                    </div>
                    <span className="ml-ann-date">
                      📅 {item.publishedAt ? item.publishedAt.substring(0, 10) : ''}
                    </span>
                  </div>

                  <h3 className="ml-ann-card-title">{item.title}</h3>

                  <p className="ml-ann-card-content">{item.content}</p>

                  <div className="ml-ann-card-footer">
                    <span className="ml-ann-author">
                      ✍️ {item.adminName || 'Ban Quản Trị MarketLink'}
                    </span>
                    <span className="ml-ann-read-link">
                      Xem chi tiết →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reader Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
          subtitle={`Phát hành bởi ${selectedAnnouncement.adminName || 'Ban Quản Trị MarketLink'} • Ngày ${selectedAnnouncement.publishedAt ? selectedAnnouncement.publishedAt.substring(0, 16).replace('T', ' ') : ''}`}
          maxWidth="680px"
        >
          <div className="ml-ann-reader">
            <div className="ml-ann-reader-badges">
              <Badge variant={selectedAnnouncement.priority === 'PINNED' ? 'warning' : selectedAnnouncement.priority === 'URGENT' ? 'urgent' : 'ready'}>
                {selectedAnnouncement.priority === 'PINNED' ? '📌 Bản tin được ghim' : selectedAnnouncement.priority === 'URGENT' ? '🚨 Thông báo khẩn' : '📢 Thông báo chính thức'}
              </Badge>
              <Badge variant="outline">
                Phân loại: {getTypeLabel(selectedAnnouncement.type).label}
              </Badge>
              <Badge variant="neutral">
                Đối tượng: {selectedAnnouncement.targetRole === 'FARMER' ? '🌾 Chỉ Nông Dân' : selectedAnnouncement.targetRole === 'CUSTOMER' ? '🛒 Người Mua Hàng' : '🌐 Toàn Sàn'}
              </Badge>
            </div>

            <div className="ml-ann-reader-content">
              {selectedAnnouncement.content}
            </div>

            <div className="ml-ann-reader-footer">
              <span className="ml-ann-reader-sign">
                🌿 Chúc quý khách và bà con có những buổi chợ phiên tươi vui và bội thu nông sản sạch!
              </span>
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
