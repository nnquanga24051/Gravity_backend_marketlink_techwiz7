import React, { useState } from 'react';
import './ReviewModal.css';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function ReviewModal({
  isOpen,
  onClose,
  order,
  onSubmit,
  onSubmitReview
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Rau rất tươi', 'Đúng hẹn']);
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const quickTags = [
    'Rau rất tươi',
    'Chủ sạp thân thiện',
    'Đúng hẹn tại sạp',
    'Đóng gói cẩn thận',
    'Cân chuẩn đủ ký',
    'Giá hợp lý'
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fullComment = selectedTags.length > 0 
      ? `[${selectedTags.join(', ')}] ${comment}`.trim()
      : comment;

    const submitHandler = onSubmit || onSubmitReview;
    if (submitHandler) {
      await submitHandler({
        orderId: order.orderId || order.id,
        productId: order.items && order.items.length > 0 ? (order.items[0].productId || order.items[0].id) : null,
        rating,
        comment: fullComment
      });
    }

    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đánh Giá Trải Nghiệm Nhận Hàng"
      subtitle={`Đơn hàng #${order.orderCode || order.id} tại ${order.marketName || 'chợ phiên'}`}
      maxWidth="520px"
    >
      <form onSubmit={handleSubmit} className="ml-review-form">
        {/* Star Rating */}
        <div className="ml-review-stars-box">
          <label className="ml-review-stars-label">Chất lượng nông sản & sạp hàng:</label>
          <div className="ml-stars-row">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`ml-star-btn ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
            <span className="ml-rating-text">
              {rating === 5 && 'Tuyệt vời, rau củ rất tươi ngon!'}
              {rating === 4 && 'Rất hài lòng, đúng hẹn'}
              {rating === 3 && 'Bình thường, chấp nhận được'}
              {rating === 2 && 'Cần cải thiện chất lượng'}
              {rating === 1 && 'Không hài lòng'}
            </span>
          </div>
        </div>

        {/* Quick Review Tags */}
        <div className="ml-review-tags-section">
          <label className="ml-review-tags-label">Điểm bạn thích nhất:</label>
          <div className="ml-review-tags-cloud">
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`ml-review-tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {selectedTags.includes(tag) ? '✓ ' : '+ '}
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="ml-form-group">
          <label className="ml-form-label">Chia sẻ thêm cảm nhận của bạn (tùy chọn):</label>
          <textarea
            className="ml-review-textarea"
            rows={3}
            placeholder="Chia sẻ về độ tươi ngọt của rau, thái độ của chủ sạp..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Action */}
        <div className="ml-review-actions">
          <Button variant="ghost" onClick={onClose}>
            Để sau
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            icon={<span>⭐</span>}
          >
            Gửi đánh giá
          </Button>
        </div>
      </form>
    </Modal>
  );
}
