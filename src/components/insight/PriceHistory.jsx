import { useState } from 'react';
import { LineChart } from 'lucide-react';
import { formatVND, formatVNDShort, formatObservedAt } from '../../utils/format.js';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';

function getVNDate(timestamp) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(timestamp));

  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export default function PriceHistory({ flight }) {
  const points = (flight.price_history || [])
    .map((p) => ({
      t: new Date(p.observed_at).getTime(),
      v: Number(p.price_vnd),
      raw: p
    }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);

  const dates = [...new Set(points.map((p) => getVNDate(p.t)))].sort();

  const [selectedDate, setSelectedDate] = useState('');
  const [mode, setMode] = useState('all');
  const activeDate = dates.includes(selectedDate)
    ? selectedDate
    : dates[dates.length - 1];

  if (points.length < 2) {
    return (
      <div className="history-empty">
        <LineChart size={24} />
        <p>Chưa đủ dữ liệu lịch sử giá để hiển thị biểu đồ.</p>
      </div>
    );
  }

  const DAY = 24 * 60 * 60 * 1000;
  const isAll = mode === 'all';
  const filtered = isAll ? points : points.filter((p) => getVNDate(p.t) === activeDate);

  // Theo giờ Việt Nam (UTC+7): một ngày, hoặc toàn bộ kỳ quan sát
  const start = Date.parse(`${isAll ? dates[0] : activeDate}T00:00:00+07:00`);
  const end = isAll ? Date.parse(`${dates[dates.length - 1]}T00:00:00+07:00`) + DAY : start + DAY;

  const W = 1000;
  const H = 260;
  const pad = { l: 75, r: 30, t: 25, b: 45 };

  const x = (t) =>
    pad.l + ((t - start) / (end - start)) * (W - pad.l - pad.r);

  const values = filtered.map((p) => p.v);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const margin = Math.max((hi - lo) * 0.15, 10000);
  const yMin = lo - margin;
  const yMax = hi + margin;

  const y = (v) =>
    pad.t + (1 - (v - yMin) / (yMax - yMin)) *
    (H - pad.t - pad.b);

  // Đường bậc thang: giữ giá tới lần ghi nhận kế tiếp, không nội suy
  const path = filtered.map(
    (p, i) =>
      i === 0 ? `M${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}` : `H${x(p.t).toFixed(1)} V${y(p.v).toFixed(1)}`
  ).join(' ');

  const ticks = isAll
    ? dates.map((d) => ({ t: Date.parse(`${d}T00:00:00+07:00`), label: d.slice(8, 10) + '/' + d.slice(5, 7) }))
    : Array.from({ length: 9 }, (_, i) => ({ t: start + i * 3 * 3600000, label: `${String(i * 3).padStart(2, '0')}:00` }));

  return (
    <figure className="history-chart">
      <div className="history-toolbar">
        <div>
          <strong>{isAll ? 'Lịch sử giá toàn kỳ quan sát' : 'Lịch sử giá theo giờ'}</strong>
          <p className="muted small">Quan sát thực tế · Giờ Việt Nam · {points.length} lần ghi nhận</p>
        </div>

        <div className="history-modes" role="radiogroup" aria-label="Phạm vi biểu đồ">
          <button type="button" role="radio" aria-checked={isAll} className={isAll ? 'on' : ''} onClick={() => setMode('all')}>
            Toàn kỳ
          </button>
          <button type="button" role="radio" aria-checked={!isAll} className={!isAll ? 'on' : ''} onClick={() => setMode('day')}>
            Theo ngày
          </button>
        </div>

        {!isAll && <label className="history-date-picker">
          Chọn ngày
          <select
            value={activeDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {date.split('-').reverse().join('/')}
              </option>
            ))}
          </select>
        </label>}
      </div>

      <div className="history-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: W, maxWidth: 'none', height: 'auto' }}
          role="img"
          aria-label={`Biểu đồ lịch sử giá ngày ${activeDate}`}
        >
          {[0, 0.5, 1].map((r) => {
            const v = yMin + r * (yMax - yMin);
            return (
              <g key={r}>
                <line
                  x1={pad.l}
                  x2={W - pad.r}
                  y1={y(v)}
                  y2={y(v)}
                  className="grid"
                />
                <text
                  x={pad.l - 10}
                  y={y(v) + 4}
                  textAnchor="end"
                  className="axis"
                >
                  {formatVNDShort(v)}
                </text>
              </g>
            );
          })}

          {ticks.map((tick) => {
            const pos = x(isAll ? tick.t + DAY / 2 : tick.t);
            const linePos = x(tick.t);
            return (
              <g key={tick.t}>
                <line
                  x1={linePos}
                  x2={linePos}
                  y1={pad.t}
                  y2={H - pad.b}
                  stroke="#e7edf3"
                  strokeDasharray="3 5"
                />
                <text
                  x={pos}
                  y={H - 15}
                  textAnchor="middle"
                  className="axis"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {filtered.length > 1 && (
            <path d={path} className="line" />
          )}

          {filtered.map((p, i) => (
            <circle
              key={`${p.t}-${i}`}
              cx={x(p.t)}
              cy={y(p.v)}
              r={isAll ? 2.5 : 5}
              className="pt"
            >
              <title>
                {`${formatObservedAt(p.raw.observed_at)} — ${formatVND(p.v)}`}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <figcaption className="muted small">
        {isAll
          ? `${filtered.length} lần ghi nhận từ ${dates[0].split('-').reverse().join('/')} đến ${dates[dates.length - 1].split('-').reverse().join('/')}. Đường bậc thang giữ giá tới lần ghi nhận kế tiếp, không nội suy.`
          : `${filtered.length} lần ghi nhận trong ngày. Kéo ngang để xem các mốc 3 giờ. Không nội suy giá tại các giờ chưa quan sát.`}
      </figcaption>
    </figure>
  );
}