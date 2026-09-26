import React, { useState, useRef } from 'react';
import ImageUploadInput from './ImageUploadInput';

export default function ImageUploadStudio({ token, callApi }) {
  const [selectedFolder, setSelectedFolder] = useState('markets');
  const [singleImageUrl, setSingleImageUrl] = useState('');
  const [uploadedGallery, setUploadedGallery] = useState([
    {
      url: '/uploads/images/markets/markets_20260925_013948_b55b70d6.png',
      folder: 'markets',
      filename: 'sample_test.png',
      size: '33 B',
      time: 'Vừa tải lên'
    }
  ]);

  // Multiple files upload state
  const [multiFiles, setMultiFiles] = useState([]);
  const [multiUploading, setMultiUploading] = useState(false);
  const [multiMessage, setMultiMessage] = useState('');
  const multiInputRef = useRef(null);

  // Folder descriptions
  const folderInfo = {
    markets: { name: 'Chợ Nông Sản (Markets)', desc: 'Ảnh chụp toàn cảnh, sơ đồ sạp, cổng chợ phiên' },
    products: { name: 'Nông Sản & Thực Phẩm (Products)', desc: 'Ảnh rau củ, trái cây, tem nhãn VietGAP' },
    avatars: { name: 'Ảnh Đại Diện (Avatars)', desc: 'Ảnh cá nhân khách hàng, ảnh chân dung nông dân' },
    kyc: { name: 'Hồ Sơ Chứng Nhận & KYC (KYC)', desc: 'CCCD/CMND, Giấy chứng nhận vệ sinh ATTP' },
    general: { name: 'Khác / Tổng Hợp (General)', desc: 'Banner tin tức, tài liệu hướng dẫn chung' }
  };

  const handleMultipleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setMultiUploading(true);
    setMultiMessage('Đang tải lên ' + files.length + ' tệp...');

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));

      const res = await fetch(`/api/upload/images?folder=${selectedFolder}`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.data && Array.isArray(data.data)) {
        setMultiMessage(`✅ Tải lên thành công ${data.data.length} ảnh vào thư mục [${selectedFolder}]!`);
        
        const newItems = data.data.map(item => ({
          url: item.url,
          folder: selectedFolder,
          filename: item.originalFilename,
          size: (item.size / 1024).toFixed(1) + ' KB',
          time: new Date().toLocaleTimeString('vi-VN')
        }));

        setUploadedGallery(prev => [...newItems, ...prev]);
        if (multiInputRef.current) multiInputRef.current.value = '';
      } else {
        setMultiMessage('❌ Lỗi tải lên: ' + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      setMultiMessage('❌ Lỗi kết nối: ' + err.message);
    } finally {
      setMultiUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép đường dẫn: ' + text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Intro Header Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="card-top">
          <div className="card-heading" style={{ fontSize: '1.25rem', color: '#10b981' }}>
            📸 Trung Tâm Tải Lên Hình Ảnh Từ Thiết Bị (Device Image Uploader)
          </div>
          <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
            REST API Multipart / Static Cache
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: '8px 0 16px 0' }}>
          Hệ thống cho phép người dùng và quản trị viên tải ảnh chụp thực tế trực tiếp từ máy tính bảng, điện thoại di động hoặc máy tính để bàn lên máy chủ backend. 
          Các tập tin được lưu trữ phân loại theo thư mục nghiệp vụ và cung cấp đường dẫn tĩnh (Static Resource) được cache 30 ngày.
        </p>

        {/* Folder Selection Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {Object.entries(folderInfo).map(([key, info]) => (
            <button
              key={key}
              type="button"
              className={`btn btn-sm ${selectedFolder === key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedFolder(key)}
              style={{ fontSize: '0.82rem' }}
            >
              📁 {info.name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 8, fontStyle: 'italic' }}>
          Mục tiêu lưu trữ hiện tại: <b>uploads/images/{selectedFolder}/</b> — {folderInfo[selectedFolder]?.desc}
        </div>
      </div>

      {/* Upload Dual Columns: Single & Batch */}
      <div className="grid-cols-2">
        {/* Column 1: Single Image Upload & Live Preview */}
        <div className="card">
          <div className="card-top">
            <div className="card-heading">
              🖼️ Tải Lên 1 Ảnh (Đơn Lẻ)
            </div>
            <span className="badge-tag">POST /api/upload/image</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Thích hợp cho tải Ảnh bìa chợ, Ảnh đại diện tài khoản, hoặc Logo sạp nông sản:
          </p>

          <ImageUploadInput
            value={singleImageUrl}
            onChange={(url) => {
              setSingleImageUrl(url);
              if (url) {
                setUploadedGallery(prev => [
                  {
                    url,
                    folder: selectedFolder,
                    filename: url.split('/').pop(),
                    size: 'Vừa tải',
                    time: new Date().toLocaleTimeString('vi-VN')
                  },
                  ...prev
                ]);
              }
            }}
            folder={selectedFolder}
            label={`Tải ảnh vào thư mục [${selectedFolder}]:`}
            helpText="Chọn ảnh từ thiết bị của bạn hoặc kéo thả trực tiếp vào khung"
          />

          {singleImageUrl && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 8,
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                URL Tĩnh Phục Vụ (Relative URL):
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  className="input-control"
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  value={singleImageUrl}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => copyToClipboard(singleImageUrl)}
                >
                  Copy
                </button>
                <a
                  href={singleImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  Mở ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Batch Multiple Images Upload */}
        <div className="card">
          <div className="card-top">
            <div className="card-heading">
              📑 Tải Lên Nhiều Ảnh Cùng Lúc (Batch Upload)
            </div>
            <span className="badge-tag">POST /api/upload/images</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Thích hợp cho nông dân tải album ảnh sản phẩm VietGAP hoặc tải nhiều mặt hồ sơ KYC:
          </p>

          <div style={{
            border: '2px dashed rgba(148, 163, 184, 0.3)',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.4)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📤</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
              Chọn nhiều tệp ảnh cùng lúc từ thiết bị
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Hỗ trợ chọn tối đa 10 ảnh định dạng JPG, PNG, WEBP, GIF
            </div>

            <input
              ref={multiInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleMultipleUpload}
            />

            <button
              type="button"
              className="btn btn-primary"
              disabled={multiUploading}
              onClick={() => multiInputRef.current?.click()}
            >
              {multiUploading ? '⏳ Đang tải lên danh sách ảnh...' : '📂 Chọn Nhiều Tệp Từ Thiết Bị'}
            </button>
          </div>

          {multiMessage && (
            <div style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 6,
              fontSize: '0.85rem',
              background: multiMessage.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: multiMessage.startsWith('✅') ? '#34d399' : '#f87171',
              border: `1px solid ${multiMessage.startsWith('✅') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {multiMessage}
            </div>
          )}
        </div>
      </div>

      {/* Gallery of Uploaded Images */}
      <div className="card">
        <div className="card-top">
          <div className="card-heading">
            🖼️ Thư Viện Các Ảnh Vừa Tải Lên Trong Phiên Làm Việc ({uploadedGallery.length} tệp)
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setUploadedGallery([])}
          >
            Dọn sạch danh sách
          </button>
        </div>

        {uploadedGallery.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Chưa có ảnh nào được tải lên trong phiên này. Hãy chọn tệp từ máy ở khung phía trên để bắt đầu!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
            marginTop: 10
          }}>
            {uploadedGallery.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 10,
                  border: '1px solid var(--card-border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ width: '100%', height: 140, background: '#0b1120', position: 'relative' }}>
                  <img
                    src={item.url}
                    alt={item.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.7rem',
                    color: '#38bdf8',
                    fontWeight: 600
                  }}>
                    📁 {item.folder}
                  </span>
                </div>

                <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 4
                  }} title={item.filename}>
                    {item.filename}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Dung lượng: {item.size} • {item.time}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, fontSize: '0.72rem', padding: '3px 6px' }}
                      onClick={() => copyToClipboard(item.url)}
                    >
                      📋 Copy URL
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    >
                      Xem ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
