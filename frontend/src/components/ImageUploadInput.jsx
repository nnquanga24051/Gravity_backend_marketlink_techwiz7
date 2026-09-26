import React, { useState, useRef } from 'react';
import './ImageUploadInput.css';

export default function ImageUploadInput({
  value,
  initialUrl,
  onChange,
  onUploadSuccess,
  folder = 'general',
  label = '',
  helpText = 'Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 15MB)',
  placeholder = 'Nhập đường dẫn URL ảnh (https://...)'
}) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileDetails, setFileDetails] = useState(null);
  const fileInputRef = useRef(null);

  // Fallback to value or initialUrl
  const currentValue = value !== undefined ? value : (initialUrl || '');

  const triggerChange = (newUrl) => {
    if (typeof onChange === 'function') {
      onChange(newUrl);
    }
    if (typeof onUploadSuccess === 'function') {
      onUploadSuccess(newUrl);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 15MB
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Tệp ảnh vượt quá dung lượng tối đa 15MB. Vui lòng chọn tệp nhỏ hơn!');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Support proxy via relative URL
      const res = await fetch(`/api/upload/image?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      const uploadedUrl = data.data?.fullUrl || data.data?.url || data.url;

      if (res.ok && uploadedUrl) {
        triggerChange(uploadedUrl);
        setUploadSuccess(true);
        setFileDetails({
          name: data.data?.originalFilename || file.name,
          size: (file.size / 1024).toFixed(1) + ' KB'
        });
      } else {
        setUploadError(data.message || 'Không thể tải ảnh lên máy chủ.');
      }
    } catch (err) {
      setUploadError('Lỗi kết nối khi tải ảnh: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setUploading(false);
    }
  };

  const handleClearImage = () => {
    triggerChange('');
    setFileDetails(null);
    setUploadSuccess(false);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="ml-image-upload-wrapper">
      {/* Top Header: Label + Switcher */}
      <div className="ml-upload-header-row">
        {label ? (
          <label className="ml-upload-label">{label}</label>
        ) : <div />}

        <div className="ml-upload-mode-switcher">
          <button
            type="button"
            className={`ml-upload-mode-btn ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => setMode('upload')}
          >
            📁 Tải từ máy
          </button>
          <button
            type="button"
            className={`ml-upload-mode-btn ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
          >
            🔗 Nhập link URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="ml-upload-container">
          {/* File Picker Box */}
          <div
            className={`ml-upload-dropzone ${uploading ? 'is-uploading' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {uploading ? (
              <div className="ml-upload-busy">
                <span className="ml-upload-spinner"></span>
                <span>Đang tải ảnh lên máy chủ...</span>
              </div>
            ) : (
              <div className="ml-upload-idle">
                <div className="ml-upload-camera-badge">📷</div>
                <div className="ml-upload-title">
                  Bấm vào đây để chọn ảnh từ điện thoại / máy tính
                </div>
                <div className="ml-upload-hint">{helpText}</div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="ml-upload-alert error">
              ⚠️ {uploadError}
            </div>
          )}

          {uploadSuccess && fileDetails && (
            <div className="ml-upload-alert success">
              <span>✅ Đã tải lên máy chủ:</span>
              <strong>{fileDetails.name}</strong> ({fileDetails.size})
            </div>
          )}
        </div>
      ) : (
        /* URL Input Mode */
        <div className="ml-upload-url-mode">
          <input
            type="url"
            className="ml-upload-url-input"
            placeholder={placeholder}
            value={currentValue}
            onChange={(e) => triggerChange(e.target.value)}
          />
        </div>
      )}

      {/* Image Preview Thumbnail */}
      {currentValue && (
        <div className="ml-upload-preview-card">
          <div className="ml-upload-preview-thumb">
            <img
              src={currentValue}
              alt="Preview"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <div className="ml-upload-preview-meta">
            <span className="ml-upload-preview-label">Ảnh đã chọn:</span>
            <span className="ml-upload-preview-url" title={currentValue}>
              {currentValue}
            </span>
          </div>
          <button
            type="button"
            className="ml-upload-remove-btn"
            onClick={handleClearImage}
            title="Xóa ảnh này"
          >
            ✕ Xóa ảnh
          </button>
        </div>
      )}
    </div>
  );
}
