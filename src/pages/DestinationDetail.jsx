import { Link, useParams } from 'react-router-dom';
import { CalendarHeart, MapPin, Car, Star, ArrowRight, Compass } from 'lucide-react';
import SmartImage from '../components/common/SmartImage.jsx';
import DestinationCard from '../components/explore/DestinationCard.jsx';
import { EmptyState } from '../components/common/States.jsx';
import { useFlightData } from '../context/FlightDataContext.jsx';
import { useUserData } from '../context/UserDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { destinationBySlug, DESTINATIONS, CATEGORIES } from '../data/destinations.js';
import { routesTo } from '../data/flights.js';
import { cityOf, airportOf } from '../data/airports.js';
import { formatVND, formatDateVN } from '../utils/format.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function DestinationDetail() {
  const { slug } = useParams();
  const dest = destinationBySlug(slug);
  const { index, status } = useFlightData();
  const { isFavRoute, toggleFavRoute } = useUserData();
  const notify = useToast();
  useDocumentTitle(dest ? `Du lịch ${dest.name}` : 'Không tìm thấy điểm đến');

  if (!dest) {
    return (
      <div className="container subpage">
        <EmptyState
          icon={Compass}
          title="Không tìm thấy điểm đến này"
          action={
            <Link className="btn btn-primary btn-sm" to="/explore">
              Về trang Khám phá
            </Link>
          }
        />
      </div>
    );
  }

  const routes = status === 'ready' ? routesTo(index, dest.airport) : [];
  const related = DESTINATIONS.filter((d) => d.slug !== dest.slug && d.categories.some((c) => dest.categories.includes(c))).slice(0, 3);
  const cats = CATEGORIES.filter((c) => dest.categories.includes(c.key));

  return (
    <div className="destination">
      <section className="dest-banner">
        <SmartImage className="banner-img" src={dest.image} alt={`Ảnh minh họa ${dest.name}`} label={dest.name} eager />
        <div className="banner-veil" />
        <div className="container banner-copy">
          <nav className="crumbs" aria-label="Đường dẫn">
            <Link to="/explore">Khám phá</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{dest.name}</span>
          </nav>
          <h1>{dest.name}</h1>
          <p>{dest.tagline}</p>
          <div className="dest-cats">
            {cats.map((c) => (
              <Link key={c.key} to={`/explore?cat=${c.key}`}>
                {c.emoji} {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container detail-grid">
        <div className="detail-main">
          <section className="card">
            <p className="lead">{dest.description}</p>
            <dl className="facts facts-3">
              <div>
                <dt>
                  <CalendarHeart size={15} aria-hidden="true" /> Thời điểm đẹp
                </dt>
                <dd>{dest.bestTime}</dd>
              </div>
              <div>
                <dt>
                  <MapPin size={15} aria-hidden="true" /> Sân bay gần nhất
                </dt>
                <dd>
                  {airportOf(dest.airport)} ({dest.airport})
                </dd>
              </div>
              <div>
                <dt>
                  <Car size={15} aria-hidden="true" /> Từ sân bay
                </dt>
                <dd>{dest.transfer}</dd>
              </div>
            </dl>
            <h3 className="sub-h">Không nên bỏ lỡ</h3>
            <ul className="highlight-list">
              {dest.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Lịch trình gợi ý {dest.itinerary.length} ngày</h2>
            <ol className="days">
              {dest.itinerary.map((d, i) => (
                <li key={d.title}>
                  <span className="day-num">Ngày {i + 1}</span>
                  <div>
                    <h4>{d.title}</h4>
                    <ul>
                      {d.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="detail-aside">
          <div className="card">
            <h3>Chuyến bay tới {cityOf(dest.airport)}</h3>
            {status === 'loading' && <p className="muted">Đang tải dữ liệu…</p>}
            {status === 'ready' && !routes.length && <p className="muted">Dữ liệu hiện tại chưa có chuyến bay tới {dest.airport}.</p>}
            <ul className="fare-list">
              {routes.map((r) => {
                const fav = isFavRoute(r.origin, r.destination);
                return (
                  <li key={r.key}>
                    <div>
                      <strong>Từ {cityOf(r.origin)}</strong>
                      <small>
                        {r.count} chuyến, {r.dates.length === 1 ? formatDateVN(r.dates[0], { weekday: false }) : `${r.dates.length} ngày`}
                      </small>
                      <span>
                        Từ <b>{formatVND(r.min)}</b>
                      </span>
                    </div>
                    <div className="fare-actions">
                      <Link className="btn btn-primary btn-sm" to={`/flights?origin=${r.origin}&destination=${r.destination}`}>
                        Xem chuyến <ArrowRight size={14} />
                      </Link>
                      <button
                        className={`icon-btn ${fav ? 'star-on' : ''}`}
                        onClick={() => notify(toggleFavRoute(r.origin, r.destination) ? 'Đã thêm hành trình yêu thích' : 'Đã bỏ hành trình yêu thích')}
                        aria-pressed={fav}
                        aria-label="Theo dõi hành trình"
                      >
                        <Star size={18} fill={fav ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="muted small">Giá đã ghi nhận trong dữ liệu nghiên cứu, không phải giá bán hiện tại.</p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <div>
              <h2>Có thể bạn cũng thích</h2>
            </div>
          </div>
          <div className="grid-3">
            {related.map((d) => (
              <DestinationCard key={d.slug} dest={d} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
