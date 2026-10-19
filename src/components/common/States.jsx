import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function LoadingBlock({ label = 'Đang tải dữ liệu chuyến bay…', rows = 3 }) {
  return (
    <div className="loading-block" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="sk sk-line w40" />
          <div className="sk sk-line w70" />
          <div className="sk sk-line w25" />
        </div>
      ))}
      <p className="loading-label">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-icon">
          <Icon size={28} aria-hidden="true" />
        </span>
      )}
      <h3>{title}</h3>
      {children && <div className="empty-body">{children}</div>}
      {action && <div className="empty-actions">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Không đọc được dữ liệu chuyến bay', message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={24} aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
        <p className="muted small">Kiểm tra file <code>public/flights.json</code> đã có trong repo và đã được deploy.</p>
        <div className="row-gap">
          {onRetry && (
            <button className="btn btn-primary btn-sm" onClick={onRetry}>
              <RefreshCw size={16} /> Thử tải lại
            </button>
          )}
          <Link to="/about" className="btn btn-quiet btn-sm">Xem nguồn dữ liệu</Link>
        </div>
      </div>
    </div>
  );
}
