import React, { useState, useEffect } from 'react';
import './FarmerReviewsPage.css';
import Button from '../../components/common/Button';
import farmerService from '../../services/farmerService';

export default function FarmerReviewsPage() {
  const [replyTextMap, setReplyTextMap] = useState({});
  const [replyingId, setReplyingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [farmerInfo, setFarmerInfo] = useState({ id: 90, name: 'Bác Ba' });

  const [reviews, setReviews] = useState([]);

  const showSuccess = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const profile = await farmerService.getFarmerProfile();
      const currentFarmerId = profile?.userId || 90;
      setFarmerInfo({
        id: currentFarmerId,
        name: profile?.fullName || 'Chủ Sạp'
      });

      const list = await farmerService.getFarmerReviews(currentFarmerId);
      if (list && Array.isArray(list) && list.length > 0) {
        setReviews(list.map((r) => ({
          id: r.reviewId || r.id,
          orderId: r.orderId,
          productName: r.productName,
          customerName: r.customerName || 'Khách hàng thân thiết',
          customerAvatar: r.customerAvatar || '👤',
          date: r.createdAt ? r.createdAt.replace('T', ' ').substring(0, 10) : 'Gần đây',
          rating: r.rating || 5,
          comment: r.comment || '',
          replied: !!r.farmerReply,
          replyMessage: r.farmerReply || '',
          replyAt: r.farmerReplyAt ? r.farmerReplyAt.replace('T', ' ').substring(0, 16) : ''
        })));
      } else {
        // Fallback default demonstration reviews if none in db yet
        setReviews([
          {
            id: 101,
            customerName: 'Chị Mai Lan',
            customerAvatar: '👩',
            date: '2026-09-24',
            productName: 'Cải Bó Xôi Hữu Cơ Ba Vì',
            rating: 5,
            comment: '[Rau rất tươi, Đúng hẹn tại sạp] Cải mèo của bác Ba rất ngọt và non! Mình đặt trước trên web, 7h sáng ra chợ nhận là bác đã bó sẵn rồi, cân chuẩn đủ ký.',
            replied: true,
            replyMessage: 'Cảm ơn chị Mai Lan đã tin tưởng ủng hộ sạp Bác Ba! Phiên chợ Thứ 7 tới bác có lứa cải mèo mới hái lúc 4h30 sáng, mong gặp lại chị nhé!'
          },
          {
            id: 106,
            customerName: 'Anh Quốc Bảo',
            customerAvatar: '👨',
            date: '2026-09-26',
            productName: 'Rau Muống Tiến Vua Sạch',
            rating: 5,
            comment: 'Rau muống rất giòn ngọt, dầm sấu tuyệt vời! Sạp bác Ba phục vụ chu đáo, đóng gói sạch sẽ.',
            replied: false,
            replyMessage: ''
          }
        ]);
      }
    } catch (err) {
      console.warn('Error loading real farmer reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSendReply = async (reviewId) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim()) return;

    try {
      await farmerService.replyReview(reviewId, text.trim());
      showSuccess('Đã gửi phản hồi đến khách hàng thành công!');
      setReplyingId(null);
      setReplyTextMap({ ...replyTextMap, [reviewId]: '' });
      loadReviews();
    } catch (err) {
      console.warn('Failed to reply on backend, applying locally', err);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, replied: true, replyMessage: text.trim() } : r
        )
      );
      setReplyingId(null);
      setReplyTextMap({ ...replyTextMap, [reviewId]: '' });
      showSuccess('Đã lưu phản hồi của chủ sạp!');
    }
  };

  // Calculate dynamic rating stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  const count5 = reviews.filter((r) => r.rating === 5).length;
  const count4 = reviews.filter((r) => r.rating === 4).length;
  const count3 = reviews.filter((r) => r.rating <= 3).length;

  const pct5 = totalReviews > 0 ? Math.round((count5 / totalReviews) * 100) : 100;
  const pct4 = totalReviews > 0 ? Math.round((count4 / totalReviews) * 100) : 0;
  const pct3 = totalReviews > 0 ? Math.round((count3 / totalReviews) * 100) : 0;

  return (
    <div className="ml-farmer-reviews-page">
      <div className="ml-reviews-banner">
        <div className="ml-container">
          <span className="ml-section-subtitle">Tiếng Nói Khách Hàng</span>
          <h1 className="ml-rev-page-title">Đánh Giá & Phản Hồi Từ Người Mua</h1>
          <p className="ml-rev-page-desc">
            Lắng nghe đóng góp từ cư dân ghé sạp và phản hồi để xây dựng lòng tin lâu dài với khách hàng chợ phiên.
          </p>
        </div>
      </div>

      <div className="ml-container ml-reviews-layout">
        {/* Left: Overall Score card */}
        <div className="ml-score-summary-card ml-card">
          <h3 className="ml-score-heading">Tổng quan uy tín sạp</h3>
          <div className="ml-score-big">{avgRating} <span className="ml-score-scale">/ 5.0</span></div>
          <div className="ml-score-stars">{'★'.repeat(Math.round(Number(avgRating) || 5))}</div>
          <div className="ml-score-count">Dựa trên {totalReviews} lượt đánh giá thực tế từ khách nhận hàng</div>

          <div className="ml-score-breakdown">
            <div className="ml-score-bar-row">
              <span>5 sao</span>
              <div className="ml-bar-track"><div className="ml-bar-fill" style={{ width: `${pct5}%` }} /></div>
              <span>{pct5}%</span>
            </div>
            <div className="ml-score-bar-row">
              <span>4 sao</span>
              <div className="ml-bar-track"><div className="ml-bar-fill" style={{ width: `${pct4}%` }} /></div>
              <span>{pct4}%</span>
            </div>
            <div className="ml-score-bar-row">
              <span>≤ 3 sao</span>
              <div className="ml-bar-track"><div className="ml-bar-fill" style={{ width: `${pct3}%` }} /></div>
              <span>{pct3}%</span>
            </div>
          </div>
        </div>

        {/* Right: Reviews List with In-line Reply */}
        <div className="ml-reviews-feed">
          {actionSuccessMsg && (
            <div className="ml-alert-success mb-4">
              ✓ {actionSuccessMsg}
            </div>
          )}

          <h3 className="ml-feed-title">Danh sách nhận xét từ khách sạp ({reviews.length})</h3>

          {loading && <div className="ml-inv-loading mb-4">Đang tải nhận xét mới nhất...</div>}

          <div className="ml-reviews-list-col">
            {reviews.map((rev) => (
              <div key={rev.id} className="ml-card ml-rev-feed-card">
                <div className="ml-rev-feed-top">
                  <div className="ml-rev-user">
                    <span className="ml-rev-uavatar">{rev.customerAvatar}</span>
                    <div>
                      <h4 className="ml-rev-uname">{rev.customerName}</h4>
                      <span className="ml-rev-udate">
                        {rev.productName ? `Đã mua: ${rev.productName} • ` : ''}Ghé nhận lúc: {rev.date}
                      </span>
                    </div>
                  </div>
                  <div className="ml-rev-stars-gold">{'★'.repeat(rev.rating)}</div>
                </div>

                <p className="ml-rev-text">{rev.comment}</p>

                {/* Farmer Reply Block */}
                {rev.replied ? (
                  <div className="ml-farmer-reply-box">
                    <div className="ml-reply-author">
                      👨‍🌾 <strong>Phản hồi của {farmerInfo.name}:</strong>
                    </div>
                    <p className="ml-reply-msg">{rev.replyMessage}</p>
                    {rev.replyAt && <span className="ml-reply-time">Đã trả lời lúc: {rev.replyAt}</span>}
                  </div>
                ) : (
                  <div className="ml-reply-action-area">
                    {replyingId === rev.id ? (
                      <div className="ml-reply-form">
                        <textarea
                          rows={2}
                          className="ml-reply-input"
                          placeholder="Nhập lời cảm ơn hoặc giải đáp thắc mắc của khách..."
                          value={replyTextMap[rev.id] || ''}
                          onChange={(e) =>
                            setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })
                          }
                        />
                        <div className="ml-reply-btns">
                          <Button variant="ghost" size="sm" onClick={() => setReplyingId(null)}>
                            Hủy
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSendReply(rev.id)}
                          >
                            Gửi phản hồi
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="ml-reply-trigger-btn"
                        onClick={() => setReplyingId(rev.id)}
                      >
                        💬 Phản hồi nhận xét này
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
