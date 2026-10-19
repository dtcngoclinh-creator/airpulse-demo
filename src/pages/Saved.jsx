import { Link, useSearchParams } from 'react-router-dom';
import { Heart, Bell, Star, Trash2, ArrowRight, TrendingDown, TrendingUp, Minus, Target, AlertTriangle, Info } from 'lucide-react';
import AirlineBadge from '../components/flights/AirlineBadge.jsx';
import { EmptyState, LoadingBlock } from '../components/common/States.jsx';
import { useFlightData } from '../context/FlightDataContext.jsx';
import { useUserData } from '../context/UserDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { routeKey } from '../data/flights.js';
import { cityOf, shortCityOf } from '../data/airports.js';
import { formatDateVN, formatVND, timeOf, dateOf } from '../utils/format.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const TABS = [
  { key: 'saved', label: 'Chuyến đã lưu', Icon: Heart },
  { key: 'watch', label: 'Theo dõi giá', Icon: Bell },
  { key: 'routes', label: 'Hành trình yêu thích', Icon: Star },
];

function PriceChange({ before, now }) {
  if (!Number.isFinite(before) || !Number.isFinite(now)) return null;
  const diff = now - before;
  if (diff === 0)
    return (
      <span className="delta flat">
        <Minus size={14} /> Chưa thay đổi so với lúc lưu
      </span>
    );
  return (
    <span className={`delta ${diff < 0 ? 'down' : 'up'}`}>
      {diff < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
      {diff < 0 ? 'Giảm' : 'Tăng'} {formatVND(Math.abs(diff))} so với lúc lưu
    </span>
  );
}

function SavedList() {
  const { saved, removeSaved } = useUserData();
  const { byId } = useFlightData();
  const notify = useToast();
  if (!saved.length)
    return (
      <EmptyState
        icon={Heart}
        title="Chưa có chuyến bay nào được lưu"
        action={
          <Link className="btn btn-primary btn-sm" to="/flights">
            Tìm chuyến bay
          </Link>
        }
      >
        <p>Bấm biểu tượng trái tim trên thẻ chuyến bay để lưu lại và quay lại so sánh sau.</p>
      </EmptyState>
    );
  return (
    <div className="saved-grid">
      {saved.map((s) => {
        const live = byId.get(s.id);
        return (
          <article className="saved-card" key={s.id}>
            <header>
              <AirlineBadge airline={s.airline} flightNumber={s.flight_number} size="sm" />
              <button
                className="icon-btn"
                onClick={() => {
                  removeSaved(s.id);
                  notify('Đã bỏ lưu chuyến bay');
                }}
                aria-label="Bỏ lưu"
              >
                <Trash2 size={17} />
              </button>
            </header>
            <div className="saved-route">
              <strong>{timeOf(s.departure_at)}</strong>
              <span>
                {s.origin} – {s.destination}
              </span>
              <strong>{timeOf(s.arrival_at)}</strong>
            </div>
            <p className="muted small">{formatDateVN(dateOf(s.departure_at))}</p>
            <div className="saved-price">
              <strong>{formatVND(live ? live.price_vnd : s.price_vnd)}</strong>
              {live ? <PriceChange before={s.price_vnd} now={live.price_vnd} /> : (
                <span className="delta warn">
                  <AlertTriangle size={14} /> Không còn trong dữ liệu hiện tại
                </span>
              )}
            </div>
            {live && (
              <Link className="btn btn-quiet btn-sm btn-block" to={`/flights/${encodeURIComponent(s.id)}`}>
                Xem phân tích giá
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}

function WatchList() {
  const { watch, unwatch } = useUserData();
  const { byId } = useFlightData();
  const notify = useToast();
  if (!watch.length)
    return (
      <EmptyState
        icon={Bell}
        title="Bạn chưa theo dõi giá chuyến nào"
        action={
          <Link className="btn btn-primary btn-sm" to="/flights">
            Chọn một chuyến để theo dõi
          </Link>
        }
      >
        <p>Mở trang chi tiết chuyến bay, nhập mức giá mong muốn và bấm “Theo dõi chuyến này”.</p>
      </EmptyState>
    );
  return (
    <div className="watch-list">
      {watch.map((w) => {
        const live = byId.get(w.id);
        const now = live?.price_vnd;
        const reached = Number.isFinite(w.targetPrice) && Number.isFinite(now) && now <= w.targetPrice;
        return (
          <article className={`watch-row ${reached ? 'reached' : ''}`} key={w.id}>
            <AirlineBadge airline={w.flight.airline} flightNumber={w.flight.flight_number} size="sm" />
            <div className="watch-info">
              <strong>
                {shortCityOf(w.flight.origin)} – {shortCityOf(w.flight.destination)}, {timeOf(w.flight.departure_at)}
              </strong>
              <small>{formatDateVN(dateOf(w.flight.departure_at))}</small>
            </div>
            <dl className="watch-nums">
              <div>
                <dt>Lúc bắt đầu theo dõi</dt>
                <dd>{formatVND(w.priceAtWatch)}</dd>
              </div>
              <div>
                <dt>Trong dữ liệu hiện tại</dt>
                <dd>{live ? formatVND(now) : 'Không còn'}</dd>
              </div>
              <div>
                <dt>
                  <Target size={13} aria-hidden="true" /> Mức mong muốn
                </dt>
                <dd>{w.targetPrice ? formatVND(w.targetPrice) : 'Chưa đặt'}</dd>
              </div>
            </dl>
            <div className="watch-status">
              {reached ? (
                <span className="delta down">Đã chạm mức mong muốn</span>
              ) : live ? (
                <PriceChange before={w.priceAtWatch} now={now} />
              ) : (
                <span className="delta warn">Chuyến không còn trong dữ liệu</span>
              )}
              <div className="row-gap">
                {live && (
                  <Link className="btn btn-quiet btn-sm" to={`/flights/${encodeURIComponent(w.id)}`}>
                    Chi tiết
                  </Link>
                )}
                <button
                  className="link-btn"
                  onClick={() => {
                    unwatch(w.id);
                    notify('Đã ngừng theo dõi giá');
                  }}
                >
                  Ngừng theo dõi
                </button>
              </div>
            </div>
          </article>
        );
      })}
      <p className="disclaimer">
        <Info size={16} aria-hidden="true" />
        AirPulse so sánh giá mỗi khi bạn mở trang với dữ liệu mới nhất trong flights.json. Thông báo qua email/điện thoại cần máy chủ và chưa có
        trong bản nghiên cứu này.
      </p>
    </div>
  );
}

function RouteList() {
  const { routes, toggleFavRoute } = useUserData();
  const { index } = useFlightData();
  const notify = useToast();
  if (!routes.length)
    return (
      <EmptyState
        icon={Star}
        title="Chưa có hành trình yêu thích"
        action={
          <Link className="btn btn-primary btn-sm" to="/explore">
            Khám phá điểm đến
          </Link>
        }
      >
        <p>Bấm “Theo dõi hành trình” ở trang kết quả tìm kiếm để lưu tuyến bạn hay bay.</p>
      </EmptyState>
    );
  return (
    <div className="route-grid">
      {routes.map((r) => {
        const info = index.routeMap.get(routeKey(r.origin, r.destination));
        return (
          <article className="route-card static" key={routeKey(r.origin, r.destination)}>
            <div className="route-codes">
              <strong>{r.origin}</strong>
              <span className="route-dash" />
              <strong>{r.destination}</strong>
              <button
                className="icon-btn star-on"
                onClick={() => {
                  toggleFavRoute(r.origin, r.destination);
                  notify('Đã bỏ hành trình yêu thích');
                }}
                aria-label="Bỏ theo dõi hành trình"
              >
                <Star size={18} fill="currentColor" />
              </button>
            </div>
            <p>
              {cityOf(r.origin)} đến {cityOf(r.destination)}
            </p>
            <div className="route-meta">
              {info ? (
                <>
                  <span>{info.count} chuyến trong dữ liệu</span>
                  <span>
                    Từ <strong>{formatVND(info.min)}</strong>
                  </span>
                </>
              ) : (
                <span>Chưa có chuyến trong dữ liệu hiện tại</span>
              )}
            </div>
            {info && (
              <Link className="text-link" to={`/flights?origin=${r.origin}&destination=${r.destination}`}>
                Xem chuyến bay <ArrowRight size={15} />
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default function Saved() {
  useDocumentTitle('Đã lưu');
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'saved';
  const { saved, watch, routes, profile } = useUserData();
  const { status } = useFlightData();
  const counts = { saved: saved.length, watch: watch.length, routes: routes.length };

  return (
    <div className="container subpage">
      <header className="page-head">
        <h1>{profile ? `Chuyến đi của ${profile.name}` : 'Chuyến đi của bạn'}</h1>
        <p>Mọi thứ bạn lưu nằm trong trình duyệt này. Không cần đăng nhập, không gửi lên máy chủ.</p>
      </header>

      <div className="dash-stats">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} className={`dash-stat ${tab === key ? 'on' : ''}`} onClick={() => setParams(key === 'saved' ? {} : { tab: key })}>
            <Icon size={20} aria-hidden="true" />
            <strong>{counts[key]}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {status === 'loading' ? <LoadingBlock rows={2} /> : tab === 'saved' ? <SavedList /> : tab === 'watch' ? <WatchList /> : <RouteList />}
    </div>
  );
}
