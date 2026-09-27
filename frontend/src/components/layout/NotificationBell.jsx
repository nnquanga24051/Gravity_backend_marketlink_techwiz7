// frontend/src/components/layout/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import './NotificationBell.css';
import notificationService from '../../services/notificationService';

export default function NotificationBell({
  notifications = [],
  unreadCount = 0,
  onNotificationRead,
  onMarkAllRead,
  onNewTestPush,
  isLiveConnected = true,
  onNavigate,
  currentRole
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [browserPermission, setBrowserPermission] = useState('default');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const bellRef = useRef(null);

  // Check browser notification permission status on mount
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const result = await notificationService.requestBrowserPermission();
    setBrowserPermission(result);
  };

  const handleTriggerTestPush = async () => {
    if (isSendingTest) return;
    try {
      setIsSendingTest(true);
      const res = await notificationService.sendTestPush({
        title: '🔔 Thông báo đẩy MarketLink',
        message: 'Hệ thống thông báo đẩy SSE thời gian thực đang hoạt động mượt mà!',
        type: 'SYSTEM'
      });
      if (onNewTestPush) {
        onNewTestPush(res);
      }
    } catch (err) {
      console.error('Lỗi khi bắn thông báo thử nghiệm:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleItemClick = (item) => {
    if (!item.isRead && onNotificationRead) {
      onNotificationRead(item.notificationId);
    }
    
    if (!onNavigate) {
      setIsOpen(false);
      return;
    }

    const activeRole = (currentRole || localStorage.getItem('ml_role') || 'CUSTOMER').toUpperCase().replace('ROLE_', '');
    const notifType = (item.type || '').toUpperCase();
    const title = (item.title || '').toLowerCase();
    const message = (item.message || '').toLowerCase();

    // 1. Order notifications
    const isOrder = notifType.startsWith('ORDER') || title.includes('đơn') || message.includes('đơn') || title.includes('ord-');
    if (isOrder) {
      // Extract human-friendly order code if present (e.g. ORD-20260928-7789)
      const orderCodeMatch = ((item.title || '') + ' ' + (item.message || '')).match(/ORD-[\w-]+/i);
      const code = orderCodeMatch ? orderCodeMatch[0] : (item.referenceId ? String(item.referenceId) : '');
      const navPayload = { orderId: item.referenceId, orderCode: code };

      if (activeRole === 'FARMER') {
        onNavigate('farmer-orders', navPayload);
      } else if (activeRole === 'ADMIN') {
        onNavigate('admin-orders', navPayload);
      } else {
        onNavigate('orders', navPayload);
      }
      setIsOpen(false);
      return;
    }

    // 2. Customer review / Farmer reply
    const isReview = notifType.startsWith('REVIEW') || title.includes('đánh giá') || message.includes('đánh giá');
    if (isReview) {
      if (activeRole === 'FARMER') {
        onNavigate('farmer-reviews');
      } else if (activeRole === 'ADMIN') {
        onNavigate('admin-content');
      } else {
        onNavigate('my-reviews');
      }
      setIsOpen(false);
      return;
    }

    // 3. Restock / Inventory alert
    const isRestock = notifType === 'RESTOCK_ALERT' || title.includes('tồn kho') || title.includes('kho hàng');
    if (isRestock) {
      if (activeRole === 'FARMER') {
        onNavigate('farmer-inventory');
      } else {
        onNavigate('products');
      }
      setIsOpen(false);
      return;
    }

    // 4. KYC / Stall verification
    const isKyc = notifType === 'KYC_UPDATE' || title.includes('kyc') || title.includes('thẩm định');
    if (isKyc) {
      if (activeRole === 'ADMIN') {
        onNavigate('admin-users');
      } else if (activeRole === 'FARMER') {
        onNavigate('farmer-stall');
      } else {
        onNavigate('dashboard');
      }
      setIsOpen(false);
      return;
    }

    // 5. Default role-based home/dashboard navigation
    if (activeRole === 'FARMER') {
      onNavigate('farmer-dashboard');
    } else if (activeRole === 'ADMIN') {
      onNavigate('admin-dashboard');
    } else {
      onNavigate('dashboard');
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const past = new Date(dateStr).getTime();
      const diffSec = Math.floor((Date.now() - past) / 1000);
      if (diffSec < 60) return 'Vừa xong';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} giờ trước`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_ACCEPTED':
      case 'ORDER_READY':
        return { icon: '📦', class: 'type-order' };
      case 'KYC_UPDATE':
        return { icon: '🛡️', class: 'type-kyc' };
      case 'RESTOCK_ALERT':
        return { icon: '🥬', class: 'type-restock' };
      case 'REVIEW_POSTED':
      case 'REVIEW_REPLIED':
        return { icon: '⭐', class: 'type-review' };
      default:
        return { icon: '📢', class: 'type-system' };
    }
  };

  const filteredList = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.isRead;
    return true;
  });

  return (
    <div className="ml-notif-bell-wrap" ref={bellRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        className={`ml-notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''} ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo hệ thống và đơn hàng"
        aria-label={`Thông báo (${unreadCount} chưa đọc)`}
        aria-expanded={isOpen}
      >
        <svg
          className="ml-notif-icon-svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Live SSE pulse dot */}
        {isLiveConnected && <span className="ml-notif-live-dot" title="Đang kết nối luồng đẩy trực tiếp" />}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="ml-notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="ml-notif-dropdown">
          {/* Header */}
          <div className="ml-notif-header">
            <div className="ml-notif-header-top">
              <div className="ml-notif-title-wrap">
                <h4 className="ml-notif-header-title">Thông báo</h4>
                {isLiveConnected && (
                  <span className="ml-notif-live-badge">
                    <span className="ml-notif-live-indicator" /> Live
                  </span>
                )}
              </div>
              <div className="ml-notif-header-actions">
                <button
                  type="button"
                  className="ml-notif-btn-action ml-notif-btn-test"
                  onClick={handleTriggerTestPush}
                  disabled={isSendingTest}
                  title="Bắn thử 1 thông báo đẩy tức thời để kiểm tra âm thanh & giao diện"
                >
                  {isSendingTest ? 'Đang gửi...' : '🚀 Bắn thử'}
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="ml-notif-btn-action"
                    onClick={onMarkAllRead}
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    ✓ Đọc hết
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="ml-notif-tabs">
              <button
                type="button"
                className={`ml-notif-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                className={`ml-notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>
          </div>

          {/* Optional Native Browser Notification Prompt */}
          {browserPermission === 'default' && (
            <div className="ml-notif-permission-banner">
              <span>Bật thông báo đẩy trên trình duyệt để không bỏ lỡ đơn hàng?</span>
              <button
                type="button"
                className="ml-notif-perm-btn"
                onClick={handleRequestPermission}
              >
                Bật ngay
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="ml-notif-list">
            {filteredList.length === 0 ? (
              <div className="ml-notif-empty">
                <div className="ml-notif-empty-icon">🔔</div>
                <div className="ml-notif-empty-title">
                  {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </div>
                <div className="ml-notif-empty-desc">
                  Các cập nhật đơn hàng, kết quả kiểm duyệt và phản hồi sẽ xuất hiện tại đây tức thời.
                </div>
              </div>
            ) : (
              filteredList.map((item) => {
                const typeInfo = getTypeIcon(item.type);
                return (
                  <div
                    key={item.notificationId || Math.random()}
                    className={`ml-notif-item ${!item.isRead ? 'unread' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className={`ml-notif-item-icon ${typeInfo.class}`}>
                      {typeInfo.icon}
                    </div>
                    <div className="ml-notif-item-body">
                      <div className="ml-notif-item-top">
                        <span className="ml-notif-item-title">{item.title}</span>
                        <span className="ml-notif-item-time">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                      <div className="ml-notif-item-desc">{item.message}</div>
                    </div>
                    {!item.isRead && <span className="ml-notif-item-dot" title="Chưa đọc" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="ml-notif-footer">
            <span>MarketLink Real-time Push v2.0</span>
            <span style={{ color: '#16a34a' }}>● Đã kết nối luồng đẩy</span>
          </div>
        </div>
      )}
    </div>
  );
}
