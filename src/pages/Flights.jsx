import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Star, ExternalLink, SearchX, X, ArrowRight, Info } from 'lucide-react';
import SearchForm from '../components/flights/SearchForm.jsx';
import FlightCard from '../components/flights/FlightCard.jsx';
import FiltersPanel, { EMPTY_FILTERS, applyFilters, activeFilterCount } from '../components/flights/FiltersPanel.jsx';
import HourChart from '../components/flights/HourChart.jsx';
import AirlineBadge from '../components/flights/AirlineBadge.jsx';
import { LoadingBlock, ErrorState, EmptyState } from '../components/common/States.jsx';
import { useFlightData } from '../context/FlightDataContext.jsx';
import { useUserData } from '../context/UserDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { searchFlights, routeKey, summarize } from '../data/flights.js';
import { cityOf, shortCityOf } from '../data/airports.js';
import { googleFlightsUrl } from '../data/airlines.js';
import { bucketOf, formatDateVN, formatDurationShort, formatVND, formatVNDShort } from '../utils/format.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const SORTS = [
  { key: 'price', label: 'Rẻ nhất' },
  { key: 'early', label: 'Bay sớm nhất' },
  { key: 'duration', label: 'Nhanh nhất' },
  { key: 'late', label: 'Bay muộn nhất' },
];
const PAGE = 12;

const sorters = {
  price: (a, b) => (a.price_vnd ?? Infinity) - (b.price_vnd ?? Infinity) || a.departure_at.localeCompare(b.departure_at),
  early: (a, b) => a.departure_at.localeCompare(b.departure_at),
  late: (a, b) => b.departure_at.localeCompare(a.departure_at),
  duration: (a, b) => (a.durationMin ?? Infinity) - (b.durationMin ?? Infinity) || (a.price_vnd ?? Infinity) - (b.price_vnd ?? Infinity),
};

function uniqueBest(list, score) {
  const vals = list.map(score).filter(Number.isFinite);
  if (!vals.length) return null;
  const best = Math.min(...vals);
  const hits = list.filter((f) => score(f) === best);
  return hits.length === 1 ? hits[0].id : null;
}

function RouteOverview() {
  const { index } = useFlightData();
  return (
    <section className="section-tight">
      <div className="section-head">
        <div>
          <h2>Các tuyến đang có dữ liệu</h2>
          <p>Chọn một tuyến để xem toàn bộ chuyến bay, hoặc dùng ô tìm kiếm phía trên.</p>
        </div>
      </div>
      <div className="route-grid">
        {index.routes.map((r) => (
          <Link key={r.key} className="route-card" to={`/flights?origin=${r.origin}&destination=${r.destination}`}>
            <div className="route-codes">
              <strong>{r.origin}</strong>
              <span className="route-dash" />
              <strong>{r.destination}</strong>
            </div>
            <p>
              {cityOf(r.origin)} đến {cityOf(r.destination)}
            </p>
            <div className="route-meta">
              <span>{r.count} chuyến</span>
              <span>
                Từ <strong>{formatVND(r.min)}</strong>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Results({ origin, destination, date, sort, setSort }) {
  const { flights, index } = useFlightData();
  const { isFavRoute, toggleFavRoute } = useUserData();
  const notify = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [drawer, setDrawer] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const base = useMemo(() => searchFlights(flights, { origin, destination, date }), [flights, origin, destination, date]);
  const filtered = useMemo(() => applyFilters(base, filters).sort(sorters[sort] || sorters.price), [base, filters, sort]);
  const stats = useMemo(() => summarize(base), [base]);

  const medianByRoute = useMemo(() => {
    const m = new Map();
    for (const f of base) {
      const k = `${routeKey(f.origin, f.destination)}|${f.date}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(f);
    }
    return new Map([...m.entries()].map(([k, list]) => [k, summarize(list).median]));
  }, [base]);

  const tagIds = useMemo(
    () => ({
      cheapest: uniqueBest(filtered, (f) => f.price_vnd),
      fastest: uniqueBest(filtered, (f) => f.durationMin),
      earliest: uniqueBest(filtered, (f) => f.depHour * 60 + Number(f.depTime.slice(3, 5))),
    }),
    [filtered],
  );

  const sortSummary = useMemo(() => {
    const byPrice = [...filtered].sort(sorters.price)[0];
    const byEarly = [...filtered].sort(sorters.early)[0];
    const byDur = [...filtered].sort(sorters.duration)[0];
    const byLate = [...filtered].sort(sorters.late)[0];
    return {
      price: byPrice && formatVNDShort(byPrice.price_vnd),
      early: byEarly?.depTime,
      duration: byDur && formatDurationShort(byDur.durationMin),
      late: byLate?.depTime,
    };
  }, [filtered]);

  const route = destination ? index.routeMap.get(routeKey(origin, destination)) : null;
  const fav = destination ? isFavRoute(origin, destination) : false;
  const title = destination ? `${cityOf(origin)} đến ${cityOf(destination)}` : `Bay từ ${cityOf(origin)} đi mọi nơi`;
  const nFilters = activeFilterCount(filters);

  // Không có kết quả gốc: chỉ dẫn cụ thể
  if (!base.length) {
    const otherDates = route?.dates || [];
    const fromOrigin = index.routes.filter((r) => r.origin === origin);
    return (
      <EmptyState icon={SearchX} title={route ? 'Không có chuyến nào vào ngày này trong dữ liệu' : `Dữ liệu chưa có chuyến bay ${shortCityOf(origin)} – ${shortCityOf(destination)}`}>
        {route && otherDates.length > 0 && (
          <>
            <p>Tuyến này có dữ liệu vào các ngày sau:</p>
            <div className="chip-row">
              {otherDates.map((d) => (
                <Link key={d} className="route-chip" to={`/flights?origin=${origin}&destination=${destination}&date=${d}`}>
                  {formatDateVN(d)}
                </Link>
              ))}
            </div>
          </>
        )}
        {!route && fromOrigin.length > 0 && (
          <>
            <p>Từ {cityOf(origin)}, bạn có thể xem các tuyến:</p>
            <div className="chip-row">
              {fromOrigin.map((r) => (
                <Link key={r.key} className="route-chip" to={`/flights?origin=${r.origin}&destination=${r.destination}`}>
                  {shortCityOf(r.origin)} – {shortCityOf(r.destination)} <strong>{formatVNDShort(r.min)}</strong>
                </Link>
              ))}
            </div>
          </>
        )}
        {!route && !fromOrigin.length && <p>Hãy chọn một điểm khởi hành khác trong ô tìm kiếm.</p>}
      </EmptyState>
    );
  }

  const shownDates = [...new Set(base.map((f) => f.date))];

  return (
    <div className="results">
      <div className="results-top">
        <div>
          <h2>{title}</h2>
          <p className="muted">
            {shownDates.length === 1 ? formatDateVN(shownDates[0]) : `${shownDates.length} ngày bay`}, {base.length} chuyến, giá ghi nhận từ{' '}
            {formatVND(stats.min)} đến {formatVND(stats.max)}
          </p>
        </div>
        <div className="row-gap">
          {destination && (
            <button
              type="button"
              className={`btn btn-quiet btn-sm ${fav ? 'is-on' : ''}`}
              onClick={() => notify(toggleFavRoute(origin, destination) ? 'Đã thêm vào hành trình yêu thích' : 'Đã bỏ khỏi hành trình yêu thích')}
              aria-pressed={fav}
            >
              <Star size={16} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Đang theo dõi hành trình' : 'Theo dõi hành trình'}
            </button>
          )}
          {destination && shownDates.length === 1 && (
            <a className="btn btn-quiet btn-sm" href={googleFlightsUrl(origin, destination, shownDates[0])} target="_blank" rel="noopener noreferrer">
              Đối chiếu Google Flights <ExternalLink size={15} />
            </a>
          )}
        </div>
      </div>

      <div className="results-layout">
        <aside className={`filters-wrap ${drawer ? 'open' : ''}`} aria-label="Bộ lọc kết quả">
          <div className="drawer-head">
            <strong>Lọc kết quả</strong>
            <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Đóng bộ lọc">
              <X size={20} />
            </button>
          </div>
          <FiltersPanel
            base={base}
            filters={filters}
            onChange={(f) => {
              setFilters(f);
              setLimit(PAGE);
            }}
            priceMin={stats.min}
            priceMax={stats.max}
          />
          <button className="btn btn-primary drawer-apply" onClick={() => setDrawer(false)}>
            Xem {filtered.length} chuyến
          </button>
        </aside>
        {drawer && <div className="drawer-scrim" onClick={() => setDrawer(false)} />}

        <div className="results-main">
          <div className="sort-bar">
            <div className="sort-tabs" role="tablist" aria-label="Sắp xếp">
              {SORTS.map((s) => (
                <button key={s.key} role="tab" aria-selected={sort === s.key} className={sort === s.key ? 'on' : ''} onClick={() => setSort(s.key)}>
                  <span>{s.label}</span>
                  <small>{sortSummary[s.key] || '—'}</small>
                </button>
              ))}
            </div>
            <button className="btn btn-quiet btn-sm filter-toggle" onClick={() => setDrawer(true)}>
              <SlidersHorizontal size={16} /> Bộ lọc{nFilters ? ` (${nFilters})` : ''}
            </button>
          </div>

          <HourChart
            flights={base}
            onPickHour={(h) => {
              const b = bucketOf(h);
              setFilters((f) => ({ ...f, buckets: f.buckets.includes(b) ? f.buckets : [b] }));
              setLimit(PAGE);
            }}
          />

          {nFilters > 0 && (
            <div className="active-filters">
              <span>
                Đang hiển thị {filtered.length}/{base.length} chuyến
              </span>
              {filters.airlines.map((a) => (
                <button key={a} onClick={() => setFilters({ ...filters, airlines: filters.airlines.filter((x) => x !== a) })}>
                  <AirlineBadge airline={a} size="xs" showName={false} /> {a} <X size={13} />
                </button>
              ))}
              <button className="link-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
                Bỏ tất cả bộ lọc
              </button>
            </div>
          )}

          {!filtered.length ? (
            <EmptyState
              icon={SlidersHorizontal}
              title="Không có chuyến nào khớp bộ lọc"
              action={
                <button className="btn btn-primary btn-sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Bỏ bộ lọc
                </button>
              }
            >
              <p>Thử nới khoảng giá hoặc chọn thêm hãng, khung giờ.</p>
            </EmptyState>
          ) : (
            <div className="pass-list">
              {filtered.slice(0, limit).map((f) => (
                <FlightCard
                  key={f.id}
                  flight={f}
                  median={medianByRoute.get(`${routeKey(f.origin, f.destination)}|${f.date}`)}
                  tags={Object.keys(tagIds).filter((k) => tagIds[k] === f.id)}
                />
              ))}
              {filtered.length > limit && (
                <button className="btn btn-quiet more-btn" onClick={() => setLimit((l) => l + PAGE)}>
                  Xem thêm {Math.min(PAGE, filtered.length - limit)} chuyến (còn {filtered.length - limit})
                </button>
              )}
            </div>
          )}

          <p className="disclaimer">
            <Info size={16} aria-hidden="true" />
            Giá trên là giá đã ghi nhận trong dữ liệu nghiên cứu, không phải báo giá đặt vé. Luôn kiểm tra giá, hành lý và điều kiện vé trên website
            chính thức của hãng trước khi thanh toán.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Flights() {
  const [params, setParams] = useSearchParams();
  const { status, error, retry } = useFlightData();
  const origin = (params.get('origin') || '').toUpperCase();
  const destination = (params.get('destination') || '').toUpperCase();
  const date = params.get('date') || '';
  const sort = SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'price';
  useDocumentTitle(origin ? `Chuyến bay ${origin}${destination ? ` – ${destination}` : ''}` : 'Tìm chuyến bay');

  const setSort = (s) => {
    const next = new URLSearchParams(params);
    if (s === 'price') next.delete('sort');
    else next.set('sort', s);
    setParams(next, { replace: true });
  };

  const initial = origin ? { origin, destination, date } : {};

  return (
    <div className="container subpage">
      <header className="page-head">
        <h1>Tìm chuyến bay</h1>
        <p>So sánh chuyến bay nội địa từ dữ liệu giá đã ghi nhận. Không có giá bịa, không có phí ẩn, không bán vé.</p>
      </header>
      <SearchForm variant="bar" initial={initial} />

      {status === 'loading' && <LoadingBlock />}
      {status === 'error' && <ErrorState message={error} onRetry={retry} />}
      {status === 'ready' &&
        (origin ? (
          <Results key={`${origin}-${destination}-${date}`} origin={origin} destination={destination} date={date} sort={sort} setSort={setSort} />
        ) : (
          <RouteOverview />
        ))}
      {status === 'ready' && origin && (
        <p className="back-to-routes">
          <Link to="/flights" className="text-link">
            Xem tất cả tuyến có dữ liệu <ArrowRight size={15} />
          </Link>
        </p>
      )}
    </div>
  );
}
