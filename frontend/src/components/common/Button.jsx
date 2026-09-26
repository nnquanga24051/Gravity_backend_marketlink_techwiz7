import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'accent' | 'outline' | 'ghost' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon = null,
  iconRight = null,
  loading = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`ml-btn ml-btn--${variant} ml-btn--${size} ${fullWidth ? 'ml-btn--full' : ''} ${loading ? 'ml-btn--loading' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="ml-btn-spinner" aria-hidden="true" />
      ) : (
        icon && <span className="ml-btn-icon-left">{icon}</span>
      )}
      <span className="ml-btn-label">{children}</span>
      {!loading && iconRight && <span className="ml-btn-icon-right">{iconRight}</span>}
    </button>
  );
}
