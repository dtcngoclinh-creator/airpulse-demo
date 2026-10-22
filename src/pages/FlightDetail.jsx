import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Heart, Scale, Share2, Bell, BellOff, ShieldCheck, ChevronRight, PlaneTakeoff, PlaneLanding, Clock, SearchX, Check } from 'lucide-react';
import SmartImage from '../components/common/SmartImage.jsx';
import AirlineBadge from '../components/flights/AirlineBadge.jsx';
import PriceStrip from '../components/flights/PriceStrip.jsx';
import FlightCard from '../components/flights/FlightCard.jsx';
import PriceHistory from '../components/insight/PriceHistory.jsx';
import InsightPanel from '../components/insight/InsightPanel.jsx';
import { LoadingBlock, ErrorState, EmptyState } from '../components/common/States.jsx';
import { useFlightData } from '../context/FlightDataContext.jsx';
import { useUserData, COMPARE_LIMIT } from '../context/UserDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { priceContext } from '../data/flights.js';
import { findAirline, googleFlightsUrl } from '../data/airlines.js';
import { airportOf, cityOf, shortCityOf } from '../data/airports.js';
import { primaryDestinationForAirport } from '../data/destinations.js';
import { IMAGES } from '../data/images.js';
import { formatDateVN, formatDuration, formatObservedAt, formatVND, pctDiff } from '../utils/format.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import FlightResearchPanel from '../components/research/FlightResearchPanel.jsx';
function WatchBox({ flight }) {
  const { isWatched, watchFlight, unwatch, watch } = useUserData();
  const notify = useToast();
  const entry = watch.find((w) => w.id === flight.id);
  const [target, setTarget] = useState(entry?.targetPrice ? String(entry.targetPrice) : '');
  const watched = isWatched(flight.id);

  const submit = (e) => {
    e.preventDefault();
    const v = Number(String(target).replace(/\D/g, ''));
    watchFlight(flight, v > 0 ? v : null);
    notify(watched ? 'Đã cập nhật mức giá mong muốn' : 'Đã thêm vào danh sách theo dõi giá');
  };

  return (
    <form className="watch-box" onSubmit={submit}>
      <div className="watch-head">
        <Bell size={17} aria-hidden="true" />
        <strong>Theo dõi giá</strong>
      </div>
      <p className="muted small">
        Đặt mức giá mong muốn. Khi dữ liệu được cập nhật, trang Đã lưu sẽ cho biết giá mới có chạm mức này không.
      </p>
      <label className="input-money">
        <span className="sr-only">Giá mong muốn (VND)</span>
        <input
          inputMode="numeric"
          placeholder={Number.isFinite(flight.price_vnd) ? `Ví dụ ${Math.round(flight.price_vnd * 0.9).toLocaleString('vi-VN')}` : 'Giá mong muốn'}
          value={target ? Number(String(target).replace(/\D/g, '') || 0).toLocaleString('vi-VN') : ''}
          onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))}
        />
        <span>₫</span>
      </label>
      <div className="row-gap">
        <button className="btn btn-quiet btn-sm" type="submit">
          {watched ? 'Cập nhật mức giá' : 'Theo dõi chuyến này'}
        </button>
        {watched && (
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              unwatch(flight.id);
              setTarget('');
              notify('Đã ngừng theo dõi giá');
            }}
          >
            <BellOff size={14} /> Ngừng theo dõi
          </button>
        )}
      </div>
    </form>
  );
}

export default function FlightDetail() {
  const { id } = useParams();
  const { status, byId, flights, metadata, error, retry } = useFlightData();
  const { isSaved, toggleSaved, inCompare, toggleCompare } = useUserData();
  const notify = useToast();
  const flight = byId.get(id) || byId.get(decodeURIComponent(id || ''));
  useDocumentTitle(flight ? `${flight.flight_number} ${flight.origin} – ${flight.destination}` : 'Chi tiết chuyến bay');

  const ctx = useMemo(() => (flight ? priceContext(flight, flights) : null), [flight, flights]);
  if (status === 'loading') {
    return (
      <div className="container subpage">
        <LoadingBlock label="Đang tải thông tin chuyến bay…" rows={2} />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="container subpage">
        <ErrorState message={error} onRetry={retry} />
      </div>
    );
  }
  if (!flight) {
    return (
      <div className="container subpage">
        <EmptyState
          icon={SearchX}
          title="Không tìm thấy chuyến bay này trong dữ liệu hiện tại"
          action={
            <>
              <Link className="btn btn-primary btn-sm" to="/flights">
                Tìm chuyến khác
              </Link>
              <Link className="btn btn-quiet btn-sm" to="/saved">
                Xem chuyến đã lưu
              </Link>
            </>
          }
        >
          <p>Có thể bộ dữ liệu đã được cập nhật và chuyến này không còn, hoặc đường dẫn bị sai.</p>
        </EmptyState>
      </div>
    );
  }

  const partner = findAirline(flight.airline, flight.flight_number);
  const saved = isSaved(flight.id);
  const comparing = inCompare(flight.id);
  const dest = primaryDestinationForAirport(flight.destination);
  const vsMedian = pctDiff(flight.price_vnd, ctx?.median);
  const cheapest = ctx?.peers?.[0];
  const alternatives = (ctx?.peers || []).filter((f) => f.id !== flight.id).slice(0, 3);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `AirPulse: ${flight.flight_number} ${flight.origin}–${flight.destination}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify('Đã sao chép liên kết chuyến bay');
    } catch {
      notify('Không chia sẻ được, bạn hãy sao chép địa chỉ trên trình duyệt', 'info');
    }
  };

  return (
    <div className="detail">
      <section className="detail-banner">
        <SmartImage className="banner-img" src={dest?.image || IMAGES.hero} alt={`Ảnh minh họa ${cityOf(flight.destination)}`} label={cityOf(flight.destination)} eager />
        <div className="banner-veil" />
        <div className="container banner-copy">
          <nav className="crumbs" aria-label="Đường dẫn">
            <Link to="/flights">Tìm chuyến bay</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <Link to={`/flights?origin=${flight.origin}&destination=${flight.destination}&date=${flight.date}`}>
              {flight.origin} – {flight.destination}
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">{flight.flight_number}</span>
          </nav>
          <h1>
            {cityOf(flight.origin)} đến {cityOf(flight.destination)}
          </h1>
          <p>
            {formatDateVN(flight.date)}, {flight.airline} {flight.flight_number}
          </p>
        </div>
      </section>

      <div className="container detail-grid">
        <div className="detail-main">
          <section className="card itinerary">
            <h2>Hành trình</h2>
            <div className="itin">
              <div className="itin-stop">
                <PlaneTakeoff size={18} aria-hidden="true" />
                <div>
                  <strong>{flight.depTime}</strong>
                  <span>
                    {cityOf(flight.origin)} ({flight.origin})
                  </span>
                  <small>{airportOf(flight.origin)}</small>
                </div>
              </div>
              <div className="itin-leg">
                <Clock size={15} aria-hidden="true" />
                <span>Thời gian bay {formatDuration(flight.durationMin)}</span>
                <AirlineBadge airline={flight.airline} flightNumber={flight.flight_number} size="sm" />
              </div>
              <div className="itin-stop">
                <PlaneLanding size={18} aria-hidden="true" />
                <div>
                  <strong>{flight.arrTime}</strong>
                  <span>
                    {cityOf(flight.destination)} ({flight.destination})
                  </span>
                  <small>{airportOf(flight.destination)}</small>
                </div>
              </div>
            </div>
            <dl className="facts">
              <div>
                <dt>Ngày bay</dt>
                <dd>{formatDateVN(flight.date)}</dd>
              </div>
              <div>
                <dt>Số hiệu</dt>
                <dd>{flight.flight_number || 'Chưa rõ'}</dd>
              </div>
              <div>
                <dt>Ghi nhận giá lần cuối</dt>
                <dd>{formatObservedAt(flight.last_observed_at)}</dd>
              </div>
            </dl>
          </section>

          {ctx && ctx.rank && (
            <section className="card">
              <h2>Giá này đứng ở đâu trên tuyến?</h2>
              <p className="lead-sm">
                {ctx.rank === 1
                  ? `Đây là chuyến rẻ nhất trong ${ctx.count} chuyến ${shortCityOf(flight.origin)} – ${shortCityOf(flight.destination)} cùng ngày.`
                  : `Rẻ thứ ${ctx.rank} trong ${ctx.count} chuyến cùng tuyến, cùng ngày. Có ${ctx.cheaperCount} chuyến rẻ hơn.`}{' '}
                {vsMedian !== null &&
                  (Math.abs(vsMedian) < 1
                    ? 'Mức giá gần bằng trung vị của tuyến.'
                    : `Giá ${vsMedian < 0 ? 'thấp' : 'cao'} hơn trung vị tuyến ${Math.abs(Math.round(vsMedian))}%.`)}
              </p>
              <PriceStrip peers={ctx.peers} current={flight} min={ctx.min} max={ctx.max} median={ctx.median} />
              <div className="strip-foot">
                <p className="muted small">Thống kê mô tả từ dữ liệu đã ghi nhận, không phải dự đoán của mô hình.</p>
                {cheapest && cheapest.id !== flight.id && (
                  <Link className="text-link" to={`/flights/${encodeURIComponent(cheapest.id)}`}>
                    Xem chuyến rẻ nhất ({cheapest.flight_number}, {formatVND(cheapest.price_vnd)})
                  </Link>
                )}
              </div>
            </section>
          )}

          <section className="card">
            <h2>Lịch sử giá</h2>
            <PriceHistory flight={flight} metadata={metadata} />
          </section>

          <FlightResearchPanel flight={flight} />

          <InsightPanel flight={flight} />

          {alternatives.length > 0 && (
            <section className="alt">
              <div className="section-head">
                <div>
                  <h2>Chuyến khác cùng tuyến, cùng ngày</h2>
                  <p>Ba lựa chọn có giá ghi nhận thấp nhất để bạn cân nhắc.</p>
                </div>
                <Link className="text-link" to={`/flights?origin=${flight.origin}&destination=${flight.destination}&date=${flight.date}`}>
                  Xem tất cả {ctx.count} chuyến
                </Link>
              </div>
              <div className="pass-list">
                {alternatives.map((f) => (
                  <FlightCard key={f.id} flight={f} median={ctx.median} />
                ))}
              </div>
            </section>
          )}

          {dest && (
            <Link to={`/explore/${dest.slug}`} className="dest-teaser">
              <SmartImage src={dest.image} alt={`Ảnh minh họa ${dest.name}`} label={dest.name} />
              <div>
                <h3>Đến {dest.name} rồi đi đâu?</h3>
                <p>{dest.tagline}</p>
                <span className="text-link">Xem gợi ý lịch trình</span>
              </div>
            </Link>
          )}
        </div>

        <aside className="detail-aside">
          <div className="card book-card">
            <small className="muted">Giá đã ghi nhận</small>
            <strong className="book-price">{formatVND(flight.price_vnd)}</strong>
            <p className="muted small">Lần ghi nhận {formatObservedAt(flight.last_observed_at)}. Giá tại hãng có thể đã thay đổi.</p>

            {partner ? (
              <a className="btn btn-primary btn-block" href={partner.url} target="_blank" rel="noopener noreferrer">
                Kiểm tra & đặt vé tại {partner.name} <ExternalLink size={16} />
              </a>
            ) : (
              <p className="notice">Chưa có liên kết đã xác minh cho hãng này. Hãy tìm website chính thức của hãng.</p>
            )}
            <a className="btn btn-quiet btn-block" href={googleFlightsUrl(flight.origin, flight.destination, flight.date)} target="_blank" rel="noopener noreferrer">
              Đối chiếu giá trên Google Flights <ExternalLink size={15} />
            </a>

            <div className="book-actions">
              <button
                className={`tool-btn ${saved ? 'on' : ''}`}
                onClick={() => notify(toggleSaved(flight) ? 'Đã lưu chuyến bay' : 'Đã bỏ lưu chuyến bay')}
                aria-pressed={saved}
              >
                <Heart size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Đã lưu' : 'Lưu'}
              </button>
              <button
                className={`tool-btn ${comparing ? 'on' : ''}`}
                onClick={() => {
                  const r = toggleCompare(flight);
                  if (!r.ok) notify(`Chỉ so sánh tối đa ${COMPARE_LIMIT} chuyến`, 'info');
                  else notify(r.added ? 'Đã thêm vào so sánh' : 'Đã bỏ khỏi so sánh');
                }}
                aria-pressed={comparing}
              >
                {comparing ? <Check size={17} /> : <Scale size={17} />} So sánh
              </button>
              <button className="tool-btn" onClick={share}>
                <Share2 size={17} /> Chia sẻ
              </button>
            </div>

            <WatchBox flight={flight} />
          </div>

          <div className="card checklist">
            <h3>Trước khi thanh toán tại hãng</h3>
            <ul>
              <li>
                Tìm lại đúng chuyến <strong>{flight.flight_number}</strong>, cất cánh {flight.depTime} ngày {formatDateVN(flight.date, { weekday: false })}.
              </li>
              <li>Xem giá đã gồm thuế, phí và hành lý ký gửi chưa.</li>
              <li>Đọc điều kiện đổi, hoàn vé của hạng giá bạn chọn.</li>
              <li>Kiểm tra họ tên khớp giấy tờ tùy thân.</li>
            </ul>
            <p className="muted small">
              <ShieldCheck size={14} aria-hidden="true" /> AirPulse không giữ chỗ, không giữ giá, không thu tiền và không chuyển thông tin của bạn cho hãng bay.
            </p>
          </div>
        </aside>
      </div>

      <div className="mobile-book-bar">
        <div>
          <small>Giá đã ghi nhận</small>
          <strong>{formatVND(flight.price_vnd)}</strong>
        </div>
        {partner ? (
          <a className="btn btn-primary btn-sm" href={partner.url} target="_blank" rel="noopener noreferrer">
            Đặt tại hãng <ExternalLink size={15} />
          </a>
        ) : (
          <a className="btn btn-quiet btn-sm" href="#main">Xem chi tiết</a>
        )}
      </div>
    </div>
  );
}
