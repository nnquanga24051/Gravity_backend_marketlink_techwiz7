import React from 'react';
import './Badge.css';

export default function Badge({
  children,
  variant = 'neutral', // 'organic' | 'pending' | 'ready' | 'completed' | 'cancelled' | 'accent' | 'neutral'
  size = 'md',        // 'sm' | 'md'
  dot = false,
  className = '',
  ...props
}) {
  return (
    <span className={`ml-badge ml-badge--${variant} ml-badge--${size} ${className}`} {...props}>
      {dot && <span className="ml-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
