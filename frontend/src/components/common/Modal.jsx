import React, { useEffect } from 'react';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '560px'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ml-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="ml-modal-content" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ml-modal-header">
          <div>
            {title && <h3 className="ml-modal-title">{title}</h3>}
            {subtitle && <p className="ml-modal-subtitle">{subtitle}</p>}
          </div>
          <button 
            type="button" 
            className="ml-modal-close" 
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            ✕
          </button>
        </div>

        <div className="ml-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
