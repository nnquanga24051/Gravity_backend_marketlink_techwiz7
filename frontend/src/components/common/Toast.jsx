import React from 'react';
import './Toast.css';

export default function Toast({ toasts = [], onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="ml-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`ml-toast ml-toast--${toast.type || 'success'} ${toast.onClick ? 'is-clickable' : ''}`}
          onClick={(e) => {
            if (e.target.closest('.ml-toast-close')) return;
            if (toast.onClick) toast.onClick();
          }}
          style={toast.onClick ? { cursor: 'pointer' } : {}}
        >
          <span className="ml-toast-icon">
            {toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '🌿'}
          </span>
          <div className="ml-toast-content">
            {toast.title && <div className="ml-toast-title">{toast.title}</div>}
            <div className="ml-toast-message">{toast.message}</div>
          </div>
          <button 
            type="button" 
            className="ml-toast-close" 
            onClick={() => onRemove(toast.id)}
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
