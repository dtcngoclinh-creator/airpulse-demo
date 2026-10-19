import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, CalendarDays, PlaneLanding, PlaneTakeoff, Search, Info } from 'lucide-react';
import { useFlightData } from '../../context/FlightDataContext.jsx';
import { useUserData } from '../../context/UserDataContext.jsx';
import { cityOf } from '../../data/airports.js';
import { routeKey } from '../../data/flights.js';
import { formatDateVN, formatVNDShort } from '../../utils/format.js';

/**
 * Form tìm chuyến bay. Danh sách điểm đi/điểm đến/ngày lấy trực tiếp từ flights.json,
 * nên người dùng không thể chọn một tổ hợp chắc chắn ra kết quả rỗng.
 */
export default function SearchForm({ initial = {}, variant = 'hero' }) {
  const { index, status } = useFlightData();
  const { homeAirport } = useUserData();
  const navigate = useNavigate();
  const ready = status === 'ready' && index.routes.length > 0;

  const pickOrigin = (o) => (index.origins.includes(o) ? o : index.origins.includes(homeAirport) ? homeAirport : index.origins[0] || '');
  const destsFrom = (o) => index.routes.filter((r) => r.origin === o).map((r) => r.destination);
  const datesFor = (o, d) => {
    if (d) return index.routeMap.get(routeKey(o, d))?.dates || [];
    return [...new Set(index.routes.filter((r) => r.origin === o).flatMap((r) => r.dates))].sort();
  };

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  // Đồng bộ khi dữ liệu tải xong hoặc URL thay đổi
  useEffect(() => {
    if (!ready) return;
    const o = pickOrigin(initial.origin);
    const dests = destsFrom(o);
    const d = initial.destination === '' ? '' : dests.includes(initial.destination) ? initial.destination : dests.includes('DAD') ? 'DAD' : dests[0] || '';
    const dates = datesFor(o, d);
    const dt = initial.date === undefined ? dates[0] || '' : dates.includes(initial.date) ? initial.date : '';
    setOrigin(o);
    setDestination(d);
    setDate(dt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, initial.origin, initial.destination, initial.date]);

  const destOptions = useMemo(() => (origin ? destsFrom(origin) : []), [origin, index]); // eslint-disable-line react-hooks/exhaustive-deps
  const dateOptions = useMemo(() => (origin ? datesFor(origin, destination) : []), [origin, destination, index]); // eslint-disable-line react-hooks/exhaustive-deps
  const route = destination ? index.routeMap.get(routeKey(origin, destination)) : null;
  const canSwap = Boolean(destination && index.routeMap.get(routeKey(destination, origin)));

  const changeOrigin = (o) => {
    setOrigin(o);
    const dests = destsFrom(o);
    const d = dests.includes(destination) ? destination : '';
    setDestination(d);
    const dates = datesFor(o, d);
    if (date && !dates.includes(date)) setDate(dates[0] || '');
  };
  const changeDestination = (d) => {
    setDestination(d);
    const dates = datesFor(origin, d);
    if (date && !dates.includes(date)) setDate(dates[0] || '');
  };
  const swap = () => {
    if (!canSwap) return;
    const o = destination;
    const d = origin;
    setOrigin(o);
    setDestination(d);
    const dates = datesFor(o, d);
    if (date && !dates.includes(date)) setDate(dates[0] || '');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!origin) return;
    const q = new URLSearchParams({ origin });
    if (destination) q.set('destination', destination);
    if (date) q.set('date', date);
    navigate(`/flights?${q.toString()}`);
  };

  return (
    <form className={`search-form search-${variant}`} onSubmit={submit} aria-label="Tìm chuyến bay">
      <div className="search-grid">
        <label className="sf-field">
          <span className="sf-label">
            <PlaneTakeoff size={15} aria-hidden="true" /> Từ
          </span>
          <select value={origin} onChange={(e) => changeOrigin(e.target.value)} disabled={!ready}>
            {!ready && <option>Đang tải…</option>}
            {index.origins.map((c) => (
              <option key={c} value={c}>
                {cityOf(c)} ({c})
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="sf-swap"
          onClick={swap}
          disabled={!canSwap}
          aria-label="Đổi chiều điểm đi và điểm đến"
          title={canSwap ? 'Đổi chiều' : 'Dữ liệu chưa có chiều ngược lại của tuyến này'}
        >
          <ArrowLeftRight size={17} />
        </button>

        <label className="sf-field">
          <span className="sf-label">
            <PlaneLanding size={15} aria-hidden="true" /> Đến
          </span>
          <select value={destination} onChange={(e) => changeDestination(e.target.value)} disabled={!ready}>
            {!ready && <option>Đang tải…</option>}
            {ready && <option value="">Mọi điểm đến</option>}
            {destOptions.map((c) => (
              <option key={c} value={c}>
                {cityOf(c)} ({c})
              </option>
            ))}
          </select>
        </label>

        <label className="sf-field">
          <span className="sf-label">
            <CalendarDays size={15} aria-hidden="true" /> Ngày bay
          </span>
          <select value={date} onChange={(e) => setDate(e.target.value)} disabled={!ready}>
            {!ready && <option>Đang tải…</option>}
            {ready && dateOptions.length > 1 && <option value="">Tất cả ngày có dữ liệu</option>}
            {ready && dateOptions.length === 0 && <option value="">Chưa có ngày bay</option>}
            {dateOptions.map((d) => (
              <option key={d} value={d}>
                {formatDateVN(d)}
              </option>
            ))}
          </select>
        </label>

        <button className="btn btn-primary sf-submit" type="submit" disabled={!ready}>
          <Search size={18} /> Tìm chuyến bay
        </button>
      </div>
      <p className="sf-hint">
        <Info size={14} aria-hidden="true" />
        {route && Number.isFinite(route.min)
          ? `Tuyến này có ${route.count} chuyến trong dữ liệu, giá ghi nhận từ ${formatVNDShort(route.min)}.`
          : 'Chỉ hiển thị tuyến và ngày có trong dữ liệu quan sát của AirPulse.'}
      </p>
    </form>
  );
}
