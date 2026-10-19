import { formatVND, formatVNDShort } from '../../utils/format.js';

/**
 * Dải phân bố giá của các chuyến cùng tuyến + cùng ngày (dữ liệu thật).
 * Mỗi chấm là một chuyến; chấm lớn là chuyến đang xem. Đây là thống kê mô tả, không phải dự đoán.
 */
export default function PriceStrip({ peers, current, min, max, median, compact = false }) {
  if (!peers?.length || !Number.isFinite(min) || !Number.isFinite(max)) return null;
  const span = max - min || 1;
  const pos = (v) => `${((v - min) / span) * 100}%`;
  return (
    <figure className={`price-strip ${compact ? 'compact' : ''}`}>
      <div className="strip-track" role="img" aria-label={`Giá trên tuyến từ ${formatVND(min)} đến ${formatVND(max)}, trung vị ${formatVND(median)}`}>
        <span className="strip-zone" />
        {peers.map((p) => (
          <span key={p.id} className="strip-dot" style={{ left: pos(p.price_vnd) }} />
        ))}
        {Number.isFinite(median) && (
          <span className="strip-median" style={{ left: pos(median) }}>
            <span>Trung vị {formatVNDShort(median)}</span>
          </span>
        )}
        {current && Number.isFinite(current.price_vnd) && (
          <span className="strip-current" style={{ left: pos(current.price_vnd) }}>
            <span className="strip-flag">{formatVNDShort(current.price_vnd)}</span>
          </span>
        )}
      </div>
      <figcaption className="strip-scale">
        <span>{formatVND(min)}</span>
        <span>{formatVND(max)}</span>
      </figcaption>
    </figure>
  );
}
