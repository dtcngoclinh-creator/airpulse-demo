import { LineChart } from 'lucide-react';
import { formatVND, formatVNDShort, formatObservedAt, formatDateVN } from '../../utils/format.js';

/**
 * Lịch sử giá của một chuyến. Chỉ vẽ khi flights.json có `price_history`
 * (mảng {observed_at, price_vnd}) với ít nhất 2 điểm; nếu không, nói rõ dữ liệu đang có gì.
 */
export default function PriceHistory({ flight, metadata }) {
  const points = (flight.price_history || [])
    .map((p) => ({ t: new Date(p.observed_at).getTime(), v: Number(p.price_vnd), raw: p }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);

  if (points.length < 2) {
    return (
      <div className="history-empty">
        <span className="history-icon">
          <LineChart size={22} aria-hidden="true" />
        </span>
        <div>
          <h4>Chưa có chuỗi giá theo thời gian cho chuyến này</h4>
          <p>
            Bộ dữ liệu hiện lưu <strong>lần ghi nhận gần nhất</strong> của mỗi chuyến
            {flight.last_observed_at ? ` (${formatObservedAt(flight.last_observed_at)})` : ''}
            {metadata?.observation_start && metadata?.observation_end
              ? `, trong đợt quan sát ${formatDateVN(metadata.observation_start, { weekday: false })} – ${formatDateVN(metadata.observation_end, { weekday: false })}`
              : ''}
            . Biểu đồ sẽ tự hiển thị khi pipeline bổ sung trường <code>price_history</code>.
          </p>
        </div>
      </div>
    );
  }

  const W = 640;
  const H = 200;
  const pad = { l: 56, r: 16, t: 16, b: 30 };
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const x = (t) => pad.l + ((t - t0) / (t1 - t0 || 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (H - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = `${d} L${x(t1)},${H - pad.b} L${x(t0)},${H - pad.b} Z`;
  const fmtDay = (t) => {
    const dt = new Date(t);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <figure className="history-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Giá dao động từ ${formatVND(lo)} đến ${formatVND(hi)}`}>
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="grid" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="axis">
              {formatVNDShort(v)}
            </text>
          </g>
        ))}
        <path d={area} className="area" />
        <path d={d} className="line" />
        {points.map((p) => (
          <circle key={p.t} cx={x(p.t)} cy={y(p.v)} r="3.5" className="pt">
            <title>{`${formatObservedAt(p.raw.observed_at)}: ${formatVND(p.v)}`}</title>
          </circle>
        ))}
        <text x={pad.l} y={H - 8} className="axis">{fmtDay(t0)}</text>
        <text x={W - pad.r} y={H - 8} textAnchor="end" className="axis">{fmtDay(t1)}</text>
      </svg>
      <figcaption className="muted small">{points.length} lần ghi nhận giá cho chuyến này.</figcaption>
    </figure>
  );
}
