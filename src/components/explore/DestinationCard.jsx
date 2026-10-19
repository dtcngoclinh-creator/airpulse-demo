import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import SmartImage from '../common/SmartImage.jsx';
import { useFlightData } from '../../context/FlightDataContext.jsx';
import { routesTo } from '../../data/flights.js';
import { CATEGORIES } from '../../data/destinations.js';
import { formatVNDShort } from '../../utils/format.js';
import { shortCityOf } from '../../data/airports.js';

/** Thẻ điểm đến. Giá "từ" lấy từ tuyến rẻ nhất có trong flights.json, nếu có. */
export default function DestinationCard({ dest, size = 'md' }) {
  const { index, status } = useFlightData();
  const best = status === 'ready' ? routesTo(index, dest.airport)[0] : null;
  const cats = CATEGORIES.filter((c) => dest.categories.includes(c.key)).slice(0, 2);

  return (
    <article className={`dest-card dest-${size}`}>
      <Link to={`/explore/${dest.slug}`} className="dest-link" aria-label={`Khám phá ${dest.name}`}>
        <SmartImage src={dest.image} alt={`Cảnh du lịch ${dest.name} (ảnh minh họa)`} label={dest.name} />
        <div className="dest-overlay">
          <div className="dest-cats">
            {cats.map((c) => (
              <span key={c.key}>
                {c.emoji} {c.label}
              </span>
            ))}
          </div>
          <h3>{dest.name}</h3>
          <p>{dest.tagline}</p>
        </div>
      </Link>
      <div className="dest-foot">
        <span className="dest-airport">
          <MapPin size={14} aria-hidden="true" /> Bay đến {dest.airport}
        </span>
        {best && Number.isFinite(best.min) ? (
          <Link className="dest-fare" to={`/flights?origin=${best.origin}&destination=${best.destination}`}>
            Từ {shortCityOf(best.origin)} <strong>{formatVNDShort(best.min)}</strong>
          </Link>
        ) : (
          <span className="dest-fare none">{status === 'loading' ? 'Đang tải giá…' : 'Chưa có dữ liệu bay'}</span>
        )}
      </div>
    </article>
  );
}
