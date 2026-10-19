import { formatVND, formatVNDShort } from '../../utils/format.js';

/** Giá thấp nhất theo giờ cất cánh trong tập kết quả hiện tại (dữ liệu thật). */
export default function HourChart({ flights, onPickHour, activeHour }) {
  const byHour = new Map();
  for (const f of flights) {
    if (!Number.isFinite(f.depHour) || !Number.isFinite(f.price_vnd)) continue;
    const cur = byHour.get(f.depHour);
    byHour.set(f.depHour, { min: Math.min(cur?.min ?? Infinity, f.price_vnd), count: (cur?.count || 0) + 1 });
  }
  if (byHour.size < 2) return null;
  const hours = [...byHour.keys()].sort((a, b) => a - b);
  const first = hours[0];
  const last = hours[hours.length - 1];
  const all = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const mins = [...byHour.values()].map((v) => v.min);
  const lo = Math.min(...mins);
  const hi = Math.max(...mins);
  const cheapestHour = hours.find((h) => byHour.get(h).min === lo);

  return (
    <section className="hour-chart" aria-label="Giá thấp nhất theo giờ cất cánh">
      <div className="hour-chart-head">
        <h3>Giá thấp nhất theo giờ cất cánh</h3>
        <p className="muted small">
          Rẻ nhất lúc {String(cheapestHour).padStart(2, '0')}:00 với {formatVND(lo)}. Bấm một cột để lọc theo khung giờ.
        </p>
      </div>
      <div className="hour-bars">
        {all.map((h) => {
          const v = byHour.get(h);
          const height = v ? 22 + ((v.min - lo) / (hi - lo || 1)) * 78 : 0;
          return (
            <button
              type="button"
              key={h}
              className={`hour-bar ${v ? '' : 'none'} ${v?.min === lo ? 'cheapest' : ''} ${activeHour === h ? 'on' : ''}`}
              disabled={!v}
              onClick={() => onPickHour?.(h)}
              title={v ? `${String(h).padStart(2, '0')}:00 · ${v.count} chuyến · từ ${formatVND(v.min)}` : `${h}:00 không có chuyến`}
            >
              <span className="bar" style={{ height: `${height}%` }}>
                {v && <em>{formatVNDShort(v.min)}</em>}
              </span>
              <small>{String(h).padStart(2, '0')}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
