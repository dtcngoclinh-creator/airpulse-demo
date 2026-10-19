import { RotateCcw } from 'lucide-react';
import AirlineBadge from './AirlineBadge.jsx';
import { TIME_BUCKETS, formatVND, formatVNDShort } from '../../utils/format.js';

export const EMPTY_FILTERS = { airlines: [], buckets: [], maxPrice: null };

export function applyFilters(list, filters) {
  return list.filter(
    (f) =>
      (!filters.airlines.length || filters.airlines.includes(f.airline)) &&
      (!filters.buckets.length || filters.buckets.includes(f.bucket)) &&
      (filters.maxPrice === null || (Number.isFinite(f.price_vnd) && f.price_vnd <= filters.maxPrice)),
  );
}

export const activeFilterCount = (f) => f.airlines.length + f.buckets.length + (f.maxPrice !== null ? 1 : 0);

/** Bộ lọc dựng từ chính tập kết quả (hãng, khung giờ, giá tối đa) kèm số lượng thật. */
export default function FiltersPanel({ base, filters, onChange, priceMin, priceMax }) {
  const toggle = (field, value) => {
    const arr = filters[field];
    onChange({ ...filters, [field]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] });
  };

  const airlineRows = [...new Set(base.map((f) => f.airline))]
    .map((name) => {
      const list = base.filter((f) => f.airline === name);
      const prices = list.map((f) => f.price_vnd).filter(Number.isFinite);
      return { name, count: list.length, min: prices.length ? Math.min(...prices) : null, sample: list[0] };
    })
    .sort((a, b) => (a.min ?? Infinity) - (b.min ?? Infinity));

  const hasRange = Number.isFinite(priceMin) && Number.isFinite(priceMax) && priceMax > priceMin;
  const step = 10000;
  const sliderMin = hasRange ? Math.floor(priceMin / step) * step : 0;
  const sliderMax = hasRange ? Math.ceil(priceMax / step) * step : 0;
  const current = filters.maxPrice ?? sliderMax;

  return (
    <div className="filters">
      <div className="filters-head">
        <h3>Bộ lọc</h3>
        <button type="button" className="link-btn" onClick={() => onChange(EMPTY_FILTERS)} disabled={!activeFilterCount(filters)}>
          <RotateCcw size={14} /> Đặt lại
        </button>
      </div>

      <fieldset className="filter-group">
        <legend>Hãng hàng không</legend>
        {airlineRows.map((a) => (
          <label key={a.name} className="check-row">
            <input type="checkbox" checked={filters.airlines.includes(a.name)} onChange={() => toggle('airlines', a.name)} />
            <AirlineBadge airline={a.name} flightNumber={a.sample?.flight_number} size="sm" showName={false} />
            <span className="check-text">
              {a.name}
              <small>{a.count} chuyến</small>
            </span>
            <span className="check-price">{formatVNDShort(a.min)}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="filter-group">
        <legend>Giờ cất cánh</legend>
        <div className="bucket-grid">
          {TIME_BUCKETS.map((b) => {
            const count = base.filter((f) => f.bucket === b.key).length;
            const on = filters.buckets.includes(b.key);
            return (
              <button
                type="button"
                key={b.key}
                className={`bucket ${on ? 'on' : ''}`}
                onClick={() => toggle('buckets', b.key)}
                disabled={!count && !on}
                aria-pressed={on}
              >
                <strong>{b.label}</strong>
                <small>{b.range}</small>
                <small>{count} chuyến</small>
              </button>
            );
          })}
        </div>
      </fieldset>

      {hasRange && (
        <fieldset className="filter-group">
          <legend>Giá tối đa</legend>
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={step}
            value={current}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({ ...filters, maxPrice: v >= sliderMax ? null : v });
            }}
            aria-label="Giá tối đa"
          />
          <div className="range-labels">
            <span>{formatVNDShort(sliderMin)}</span>
            <strong>{filters.maxPrice === null ? 'Không giới hạn' : `Đến ${formatVND(filters.maxPrice)}`}</strong>
          </div>
        </fieldset>
      )}
    </div>
  );
}
