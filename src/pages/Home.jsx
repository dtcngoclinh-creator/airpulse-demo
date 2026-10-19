import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Scale, Gauge, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import SearchForm from '../components/flights/SearchForm.jsx';
import DestinationCard from '../components/explore/DestinationCard.jsx';
import PriceStrip from '../components/flights/PriceStrip.jsx';
import SmartImage from '../components/common/SmartImage.jsx';
import { useFlightData } from '../context/FlightDataContext.jsx';
import { useUserData } from '../context/UserDataContext.jsx';
import { DESTINATIONS, CATEGORIES, TRIP_IDEAS, destinationBySlug } from '../data/destinations.js';
import { IMAGES } from '../data/images.js';
import { shortCityOf, cityOf } from '../data/airports.js';
import { formatVND, formatVNDShort, formatDateVN } from '../utils/format.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const JOURNEY = [
  { Icon: Compass, title: 'Tìm cảm hứng', text: 'Lướt điểm đến theo sở thích, xem nên đi mùa nào và đi đâu.', to: '/explore', cta: 'Khám phá' },
  { Icon: Scale, title: 'So sánh chuyến bay', text: 'Lọc theo hãng, giờ bay, giá và đặt tối đa ba chuyến cạnh nhau.', to: '/flights', cta: 'Tìm chuyến' },
  { Icon: Gauge, title: 'Hiểu mức giá', text: 'Xem giá chuyến này đứng ở đâu so với cả tuyến, và kết quả mô hình khi sẵn sàng.', to: '/about#cach-hoat-dong', cta: 'Cách hoạt động' },
  { Icon: ExternalLink, title: 'Đặt tại hãng', text: 'Mở website chính thức của hãng để kiểm tra giá hiện tại và đặt vé.', to: '/about#gioi-han', cta: 'Vì sao' },
];

export default function Home() {
  useDocumentTitle('');
  const { index, status, metadata, flights } = useFlightData();
  const { profile } = useUserData();
  const firstInterest = profile?.interests?.find((k) => CATEGORIES.some((c) => c.key === k));
  const [cat, setCat] = useState(firstInterest || 'sea');

  const featured = ['phu-quoc', 'da-nang', 'da-lat', 'ha-noi', 'hoi-an'].map(destinationBySlug).filter(Boolean);
  const byInterest = DESTINATIONS.filter((d) => d.categories.includes(cat)).slice(0, 3);
  const spotlight = index.routes[0];
  const spotlightPeers = useMemo(
    () => (spotlight ? spotlight.flights.filter((f) => Number.isFinite(f.price_vnd) && f.date === spotlight.dates[0]) : []),
    [spotlight],
  );
  const cheapestSpot = spotlightPeers.reduce((m, f) => (!m || f.price_vnd < m.price_vnd ? f : m), null);

  return (
    <div className="home">
      <section className="hero">
        <SmartImage className="hero-img" src={IMAGES.hero} alt="Nhìn ra cánh máy bay phía trên những tầng mây" eager />
        <div className="hero-veil" />
        <div className="container hero-copy">
          <h1>Đi xa hơn, mua vé sáng suốt hơn.</h1>
          <p>
            Khám phá điểm đến khắp Việt Nam, so sánh chuyến bay từ dữ liệu giá đã ghi nhận, rồi đặt vé an toàn tại website của hãng.
          </p>
        </div>
      </section>

      <div className="container hero-search">
        <SearchForm variant="hero" />
        {status === 'ready' && (
          <div className="route-chips" aria-label="Tuyến đang có dữ liệu">
            <span className="route-chips-label">Tuyến có dữ liệu:</span>
            {index.routes.map((r) => (
              <Link key={r.key} to={`/flights?origin=${r.origin}&destination=${r.destination}`} className="route-chip">
                {shortCityOf(r.origin)} – {shortCityOf(r.destination)}
                <strong>{formatVNDShort(r.min)}</strong>
              </Link>
            ))}
          </div>
        )}
      </div>

      <section className="container section">
        <div className="section-head">
          <div>
            <h2>Việt Nam đẹp thế, mình đi đâu đây?</h2>
            <p>Một chút biển, một chút núi, hay một thành phố mới để thương.</p>
          </div>
          <Link to="/explore" className="text-link">
            Xem tất cả điểm đến <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mosaic">
          {featured.map((d, i) => (
            <DestinationCard key={d.slug} dest={d} size={i === 0 ? 'xl' : 'md'} />
          ))}
        </div>
      </section>

      <section className="interest-band">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>{profile ? `Gợi ý cho ${profile.name}` : 'Đi theo sở thích của bạn'}</h2>
              <p>Chưa biết đi đâu cũng không sao. Chọn điều bạn đang thèm, AirPulse gợi ý nơi để bắt đầu.</p>
            </div>
          </div>
          <div className="pill-tabs" role="tablist" aria-label="Sở thích du lịch">
            {CATEGORIES.map((c) => (
              <button key={c.key} role="tab" aria-selected={cat === c.key} className={cat === c.key ? 'on' : ''} onClick={() => setCat(c.key)}>
                <span aria-hidden="true">{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
          <div className="grid-3" role="tabpanel">
            {byInterest.map((d) => (
              <DestinationCard key={d.slug} dest={d} />
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <h2>Từ cảm hứng đến tấm vé, trong bốn bước</h2>
            <p>AirPulse giúp bạn quyết định. Việc mua vé luôn diễn ra trên website chính thức của hãng.</p>
          </div>
        </div>
        <ol className="journey">
          {JOURNEY.map(({ Icon, title, text, to, cta }, i) => (
            <li key={title}>
              <span className="journey-num">{i + 1}</span>
              <Icon size={22} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
              <Link to={to} className="text-link">
                {cta}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {spotlight && cheapestSpot && (
        <section className="spotlight">
          <div className="container spotlight-inner">
            <div className="spotlight-copy">
              <h2>Đừng chỉ xem giá. Hãy biết giá đó cao hay thấp.</h2>
              <p>
                Ngày {formatDateVN(spotlight.dates[0], { weekday: false })}, tuyến {cityOf(spotlight.origin)} – {cityOf(spotlight.destination)} có{' '}
                {spotlightPeers.length} chuyến trong dữ liệu. Giá ghi nhận chênh nhau tới {formatVND(spotlight.max - spotlight.min)} giữa
                chuyến rẻ nhất và đắt nhất.
              </p>
              <p className="spotlight-note">
                Mỗi chấm là một chuyến bay thật trong dữ liệu. Fair Price, Price Trend và khuyến nghị BUY/WAIT sẽ xuất hiện ở trang chi tiết khi
                mô hình sẵn sàng.
              </p>
              <Link className="btn btn-sun" to={`/flights/${encodeURIComponent(cheapestSpot.id)}`}>
                Xem chuyến rẻ nhất tuyến này
              </Link>
            </div>
            <div className="spotlight-card">
              <div className="spotlight-route">
                <strong>{spotlight.origin}</strong>
                <span />
                <strong>{spotlight.destination}</strong>
              </div>
              <PriceStrip peers={spotlightPeers} current={cheapestSpot} min={spotlight.min} max={spotlight.max} median={spotlight.median} />
              <dl className="spotlight-stats">
                <div>
                  <dt>Thấp nhất</dt>
                  <dd>{formatVND(spotlight.min)}</dd>
                </div>
                <div>
                  <dt>Trung vị</dt>
                  <dd>{formatVND(spotlight.median)}</dd>
                </div>
                <div>
                  <dt>Cao nhất</dt>
                  <dd>{formatVND(spotlight.max)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      )}

      <section className="container section">
        <div className="section-head">
          <div>
            <h2>Hành trình gợi ý</h2>
            <p>Lịch trình gọn để bạn hình dung chuyến đi trước khi chọn chuyến bay.</p>
          </div>
          <Link to="/explore#hanh-trinh" className="text-link">
            Thêm gợi ý <ArrowRight size={16} />
          </Link>
        </div>
        <div className="trip-row">
          {TRIP_IDEAS.map((t) => {
            const d = destinationBySlug(t.slug);
            return (
              <Link key={t.title} to={`/explore/${t.slug}`} className="trip-card">
                <SmartImage src={d.image} alt={`Ảnh minh họa ${d.name}`} label={d.name} />
                <div>
                  <small>{t.length}</small>
                  <h3>{t.title}</h3>
                  <p>{t.blurb}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container closing">
        <SmartImage className="closing-img" src={IMAGES.roadTrip} alt="Một chuyến đi đang chờ phía trước" label="AirPulse" />
        <div className="closing-copy">
          <h2>Chuyến đi tiếp theo bắt đầu từ một lần so sánh.</h2>
          <p>
            {status === 'ready'
              ? `${flights.length} chuyến bay, ${index.routes.length} tuyến, ${index.airlines.length} hãng trong dữ liệu ${metadata.observation_start ? `quan sát từ ${formatDateVN(metadata.observation_start, { weekday: false })} đến ${formatDateVN(metadata.observation_end, { weekday: false })}` : 'hiện tại'}.`
              : 'Đang tải dữ liệu chuyến bay…'}
          </p>
          <div className="row-gap">
            <Link className="btn btn-primary" to="/flights">
              Bắt đầu tìm chuyến
            </Link>
            <Link className="btn btn-quiet" to="/about#du-lieu">
              <ShieldCheck size={17} /> Dữ liệu đến từ đâu?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
