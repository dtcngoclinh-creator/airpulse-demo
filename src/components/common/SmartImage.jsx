import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/** Ảnh có nền chờ và nền thay thế khi lỗi tải (ví dụ link ảnh hết hạn). */
export default function SmartImage({ src, alt, className = '', label, eager = false }) {
  const [status, setStatus] = useState('loading');
  return (
    <div className={`smart-img ${status} ${className}`}>
      {status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      {status === 'error' && (
        <div className="smart-img-fallback" role="img" aria-label={alt}>
          <ImageOff size={22} aria-hidden="true" />
          {label && <span>{label}</span>}
        </div>
      )}
    </div>
  );
}
