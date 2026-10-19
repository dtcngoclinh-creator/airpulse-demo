import { Link } from 'react-router-dom';
import { Heart, Plane, Scale, Check } from 'lucide-react';
import AirlineBadge from './AirlineBadge.jsx';
import { useUserData, COMPARE_LIMIT } from '../../context/UserDataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDurationShort, formatVND, pctDiff } from '../../utils/format.js';
import { airportOf } from '../../data/airports.js';

const TAG_LABELS = { cheapest: 'Rẻ nhất', fastest: 'Bay nhanh nhất', earliest: 'Sớm nhất' };

/** Thẻ chuyến bay dạng cuống vé. `tags` do trang kết quả tính từ dữ liệu thật. */
export default function FlightCard({ flight: f, tags = [], median, showRoute = false }) {
  const { isSaved, toggleSaved, inCompare, toggleCompare } = useUserData();
  const notify = useToast();
  const saved = isSaved(f.id);
  const comparing = inCompare(f.id);
  const vsMedian = pctDiff(f.price_vnd, median);

  const onSave = () => {
    const now = toggleSaved(f);
    notify(now ? `Đã lưu ${f.flight_number || 'chuyến bay'}` : 'Đã bỏ lưu chuyến bay');
  };
  const onCompare = () => {
    const r = toggleCompare(f);
    if (!r.ok) notify(`Chỉ so sánh tối đa ${COMPARE_LIMIT} chuyến cùng lúc`, 'info');
  };

  return (
    <article className={`pass ${comparing ? 'is-comparing' : ''}`}>
      <div className="pass-body">
        <header className="pass-head">
          <AirlineBadge airline={f.airline} flightNumber={f.flight_number} />
          <div className="pass-tools">
            <button
              type="button"
              className={`chip-toggle ${comparing ? 'on' : ''}`}
              onClick={onCompare}
              aria-pressed={comparing}
            >
              {comparing ? <Check size={15} /> : <Scale size={15} />} So sánh
            </button>
            <button
              type="button"
              className={`icon-btn heart ${saved ? 'on' : ''}`}
              onClick={onSave}
              aria-pressed={saved}
              aria-label={saved ? 'Bỏ lưu chuyến bay' : 'Lưu chuyến bay'}
            >
              <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </header>

        <div className="pass-route">
          <div className="pass-point">
            <strong>{f.depTime}</strong>
            <span>{f.origin}</span>
            <small>{airportOf(f.origin)}</small>
          </div>
         <div className="pass-line" aria-label={`Thời gian bay ${formatDurationShort(f.durationMin)}`}>
  <span className="pass-duration">
    {formatDurationShort(f.durationMin)}
  </span>

  <div className="pass-track">
    <Plane size={17} aria-hidden="true" />
  </div>

  <span className="pass-direct">Bay thẳng</span>
</div>
          <div className="pass-point end">
            <strong>{f.arrTime}</strong>
            <span>{f.destination}</span>
            <small>{airportOf(f.destination)}</small>
          </div>
        </div>
        {showRoute && <p className="pass-date muted small">Ngày bay {f.date}</p>}
      </div>

      <div className="pass-stub">
        <div className="stub-tags">
          {tags.map((t) => (
            <span key={t} className={`tag tag-${t}`}>
              {TAG_LABELS[t]}
            </span>
          ))}
        </div>
        <small className="stub-label">Giá đã ghi nhận</small>
        <strong className="stub-price">{formatVND(f.price_vnd)}</strong>
        {vsMedian !== null && Math.abs(vsMedian) >= 1 && (
          <small className={`stub-delta ${vsMedian < 0 ? 'down' : 'up'}`}>
            {vsMedian < 0 ? 'Thấp hơn' : 'Cao hơn'} trung vị tuyến {Math.abs(Math.round(vsMedian))}%
          </small>
        )}
        <Link className="btn btn-primary btn-sm stub-cta" to={`/flights/${encodeURIComponent(f.id)}`}>
          Xem phân tích giá
        </Link>
      </div>
    </article>
  );
}
