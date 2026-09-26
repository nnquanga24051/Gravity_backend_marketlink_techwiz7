import React, { useState, useEffect } from 'react';
import './CustomerReviewsPage.css';
import customerService from '../../services/customerService';
import Button from '../../components/common/Button';

export default function CustomerReviewsPage({ onNavigate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const list = await customerService.getMyReviews();
      let rawList = [];
      if (Array.isArray(list)) rawList = list;
      else if (list && Array.isArray(list.data)) rawList = list.data;

      setReviews(rawList.map((r) => ({
        reviewId: r.reviewId || r.id,
        orderId: r.orderId,
        rating: r.rating || 5,
        comment: r.comment || '',
        productName: r.productName || '',
        stallName: r.stallName || 'Sap nong dan',
        farmerName: r.farmerName || 'Nong dan',
        farmerReply: r.farmerReply || '',
        farmerReplyAt: r.farmerReplyAt ? String(r.farmerReplyAt).replace('T', ' ').substring(0, 16) : '',
        createdAt: r.createdAt ? String(r.createdAt).replace('T', ' ').substring(0, 10) : 'Gan day',
        isHidden: r.isHidden === true
      })));
    } catch (err) {
      console.warn('Error loading my reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const renderStars = (rating) => {
    const full = Math.min(Math.max(Math.round(rating), 1), 5);
    return '\u2605'.repeat(full) + '\u2606'.repeat(5 - full);
  };

  return (
    <div className="ml-my-reviews-page">
      {/* Header Banner */}
      <div className="ml-my-reviews-banner">
        <div className="ml-container">
          <span className="ml-section-subtitle">Lich Su Danh Gia</span>
          <h1 className="ml-my-reviews-title">Danh Gia Cua Toi</h1>
          <p className="ml-my-reviews-subtitle">
            Xem lai cac danh gia ban da gui cho sap nong dan sau khi nhan hang tai cho phien.
          </p>
        </div>
      </div>

      <div className="ml-container">
        {loading && (
          <div className="ml-my-reviews-loading">Dang tai lich su danh gia...</div>
        )}

        {!loading && reviews.length === 0 && (
          <div className="ml-card ml-my-reviews-empty">
            <span className="ml-my-reviews-empty-icon">&#11088;</span>
            <h3>Ban chua gui danh gia nao</h3>
            <p>Sau khi nhan hang thanh cong tai sap cho, hay gui danh gia de giup cac khach hang khac tim duoc sap tot!</p>
            <Button variant="primary" size="md" onClick={() => onNavigate && onNavigate('orders')}>
              Xem don hang cua toi
            </Button>
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="ml-my-reviews-list">
            {/* Summary bar */}
            <div className="ml-my-reviews-summary">
              <span className="ml-reviews-count-badge">{reviews.length} danh gia</span>
              <span className="ml-reviews-avg-score">
                Diem trung binh:{' '}
                <strong>
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} / 5.0
                </strong>
              </span>
            </div>

            {reviews.map((rev) => (
              <div key={rev.reviewId} className={`ml-card ml-my-rev-card ${rev.isHidden ? 'hidden-review' : ''}`}>
                {rev.isHidden && (
                  <div className="ml-rev-hidden-notice">
                    Danh gia nay da bi quan tri vien an do vi pham chinh sach
                  </div>
                )}

                {/* Header */}
                <div className="ml-my-rev-header">
                  <div className="ml-my-rev-meta">
                    <span className="ml-my-rev-stall">&#127978; {rev.stallName}</span>
                    {rev.productName && (
                      <span className="ml-my-rev-product"> &bull; &#129379; {rev.productName}</span>
                    )}
                    <span className="ml-my-rev-date"> &bull; &#128197; {rev.createdAt}</span>
                  </div>
                  <div className="ml-my-rev-stars">{renderStars(rev.rating)}</div>
                </div>

                {/* Comment */}
                <p className="ml-my-rev-comment">"{rev.comment}"</p>

                {/* Farmer Reply */}
                {rev.farmerReply ? (
                  <div className="ml-my-rev-reply-box">
                    <div className="ml-my-rev-reply-author">
                      &#128104;&#8205;&#127806; <strong>Phan hoi tu {rev.farmerName}:</strong>
                    </div>
                    <p className="ml-my-rev-reply-text">{rev.farmerReply}</p>
                    {rev.farmerReplyAt && (
                      <span className="ml-my-rev-reply-time">Da tra loi luc: {rev.farmerReplyAt}</span>
                    )}
                  </div>
                ) : (
                  <div className="ml-my-rev-no-reply">
                    Nong dan chua phan hoi danh gia nay
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
