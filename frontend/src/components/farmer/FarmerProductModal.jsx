import React, { useState, useEffect } from 'react';
import './FarmerProductModal.css';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ImageUploadInput from '../ImageUploadInput';
import farmerService from '../../services/farmerService';

export default function FarmerProductModal({
  isOpen,
  onClose,
  product = null,
  assignedMarkets = [],
  onSave
}) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [price, setPrice] = useState(25000);
  const [unit, setUnit] = useState('kg');
  const [stockQuantity, setStockQuantity] = useState(20);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedStallKey, setSelectedStallKey] = useState('');
  const [stallsList, setStallsList] = useState([]);
  const [loadingStalls, setLoadingStalls] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const categories = [
    { id: 1, name: 'Rau Lá Hữu Cơ' },
    { id: 2, name: 'Củ & Quả Tươi Sạch' },
    { id: 3, name: 'Trái Cây Bản Địa' },
    { id: 4, name: 'Nấm & Thảo Dược' },
    { id: 5, name: 'Trứng & Đặc Sản Nhà Vườn' }
  ];

  // Fetch or sync stalls list
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadStalls() {
      if (assignedMarkets && assignedMarkets.length > 0) {
        setStallsList(assignedMarkets);
        return;
      }
      setLoadingStalls(true);
      try {
        const res = await farmerService.getMyMarketAssignments();
        if (isMounted && Array.isArray(res)) {
          setStallsList(res);
        }
      } catch (err) {
        console.warn('Could not load farmer market assignments', err);
      } finally {
        if (isMounted) setLoadingStalls(false);
      }
    }

    loadStalls();
    return () => {
      isMounted = false;
    };
  }, [isOpen, assignedMarkets]);

  useEffect(() => {
    setErrorMsg('');
    if (product) {
      setName(product.name || '');
      setCategoryId(product.categoryId || 1);
      setPrice(product.price || 25000);
      setUnit(product.unit || 'kg');
      setStockQuantity(product.currentStock || product.stockQuantity || 20);
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || '');
      if (product.marketId) {
        setSelectedStallKey(`${product.marketId}|${product.stallNumber || product.stallCode || ''}`);
      } else {
        setSelectedStallKey('');
      }
    } else {
      setName('');
      setCategoryId(1);
      setPrice(25000);
      setUnit('bó');
      setStockQuantity(20);
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80');
      if (stallsList && stallsList.length > 0) {
        const s = stallsList[0];
        setSelectedStallKey(`${s.marketId}|${s.stallNumber || ''}`);
      } else {
        setSelectedStallKey('');
      }
    }
  }, [product, isOpen, stallsList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!selectedStallKey) {
      setErrorMsg('Vui lòng chọn sạp và phiên chợ chỉ định để đăng bán sản phẩm.');
      setLoading(false);
      return;
    }

    const [mId, sNum] = selectedStallKey.split('|');

    const payload = {
      marketId: Number(mId),
      stallNumber: sNum || 'Chờ phân sạp',
      categoryId: Number(categoryId),
      name: name.trim(),
      description: description.trim() || 'Nông sản sạch thu hoạch sớm tại nhà vườn.',
      unit: unit.trim(),
      price: Number(price),
      currentStock: Number(stockQuantity),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
    };

    try {
      let savedResult;
      if (product && (product.id || product.productId)) {
        const prodId = product.id || product.productId;
        savedResult = await farmerService.updateProduct(prodId, payload);
      } else {
        savedResult = await farmerService.createProduct(payload);
      }

      if (onSave) {
        await onSave(savedResult);
      }
      onClose();
    } catch (err) {
      console.warn('Product save error', err);
      setErrorMsg(err?.message || 'Không thể lưu sản phẩm. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Chỉnh Sửa Nông Sản Tại Sạp' : 'Thêm Nông Sản Mới Cho Phiên Chợ'}
      subtitle="Sản phẩm sẽ được liên kết trực tiếp vào sạp chỉ định tại phiên chợ"
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} className="ml-prod-form">
        {errorMsg && (
          <div style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Gán vào sạp & phiên chợ chỉ định */}
        <div className="ml-form-group" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
          <label className="ml-form-label" style={{ color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span>🏪</span> Sạp & Phiên chợ bày bán chỉ định (*):
          </label>
          {loadingStalls ? (
            <div style={{ fontSize: '13px', color: '#166534' }}>Đang tải danh sách sạp đã đăng ký...</div>
          ) : stallsList.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '4px', lineHeight: '1.4' }}>
              ⚠️ Bạn chưa có sạp nào được đăng ký tại các phiên chợ. Vui lòng vào trang "Chợ Nông Sản" để đăng ký tham gia chợ trước khi đăng bán sản phẩm.
            </div>
          ) : (
            <select
              className="ml-form-select"
              value={selectedStallKey}
              onChange={(e) => setSelectedStallKey(e.target.value)}
              required
              style={{ backgroundColor: '#fff', borderColor: '#86efac', fontWeight: 500 }}
            >
              <option value="">-- Chọn sạp chỉ định bày bán --</option>
              {stallsList.map((st, idx) => {
                const key = `${st.marketId}|${st.stallNumber || ''}`;
                const label = `${st.stallNumber || 'Sạp chờ phân'} — ${st.marketName || `Chợ #${st.marketId}`} ${st.status ? `[${st.status}]` : ''}`;
                return (
                  <option key={idx} value={key}>
                    {label}
                  </option>
                );
              })}
            </select>
          )}
          <small style={{ display: 'block', marginTop: '6px', fontSize: '11.5px', color: '#15803d' }}>
            ℹ️ Khi khách hàng ghé thăm sạp này trên sàn hoặc tại điểm chợ, hệ thống sẽ hiển thị đúng sản phẩm này.
          </small>
        </div>

        {/* Tên sản phẩm */}
        <div className="ml-form-group">
          <label className="ml-form-label">Tên nông sản:</label>
          <input
            type="text"
            className="ml-form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Cải bó xôi hữu cơ Ba Vì..."
            required
          />
        </div>

        {/* Danh mục & Đơn vị */}
        <div className="ml-form-grid-2">
          <div className="ml-form-group">
            <label className="ml-form-label">Phân loại danh mục:</label>
            <select
              className="ml-form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-form-group">
            <label className="ml-form-label">Đơn vị đóng gói / bán:</label>
            <input
              type="text"
              className="ml-form-input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="kg, bó, hộp 500g..."
              required
            />
          </div>
        </div>

        {/* Giá & Tồn kho */}
        <div className="ml-form-grid-2">
          <div className="ml-form-group">
            <label className="ml-form-label">Đơn giá bán tại sạp (VNĐ):</label>
            <input
              type="number"
              className="ml-form-input"
              value={price}
              min="1000"
              step="1000"
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="ml-form-group">
            <label className="ml-form-label">Số lượng sẵn sàng đặt trước:</label>
            <input
              type="number"
              className="ml-form-input"
              value={stockQuantity}
              min="0"
              onChange={(e) => setStockQuantity(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Mô tả */}
        <div className="ml-form-group">
          <label className="ml-form-label">Mô tả độ tươi & phương pháp chăm sóc:</label>
          <textarea
            className="ml-form-textarea"
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="VD: Rau cắt lúc 4h30 sáng, tưới nước suối nguồn tự nhiên..."
          />
        </div>

        {/* Hình ảnh */}
        <div className="ml-form-group">
          <label className="ml-form-label">Ảnh chụp thực tế nông sản:</label>
          <ImageUploadInput
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="Dán link ảnh hoặc tải ảnh nông sản lên"
          />
        </div>

        <div className="ml-prod-actions">
          <Button variant="ghost" onClick={onClose} type="button">
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={stallsList.length === 0 && !product}
          >
            {product ? 'Cập nhật nông sản' : 'Đăng bán vào sạp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
