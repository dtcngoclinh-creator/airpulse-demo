// Đọc, kiểm tra và chuẩn hóa public/flights.json.
// Không tạo thêm chuyến bay: mọi con số hiển thị đều tính từ dữ liệu gốc.
import { dateOf, timeOf, hourOf, minutesBetween, bucketOf, median, isValidPrice } from '../utils/format.js';

export const FLIGHTS_URL = `${import.meta.env.BASE_URL || '/'}flights.json`;

export function normalizeFlight(raw) {
  const id = String(raw.id ?? [raw.flight_number, raw.origin, raw.destination, raw.departure_at].join('_'));
  const price = isValidPrice(raw.price_vnd) ? Number(raw.price_vnd) : null;
  const depHour = hourOf(raw.departure_at);
  return {
    ...raw,
    id,
    origin: String(raw.origin || '').toUpperCase(),
    destination: String(raw.destination || '').toUpperCase(),
    airline: raw.airline || 'Chưa rõ hãng',
    flight_number: raw.flight_number || '',
    price_vnd: price,
    date: dateOf(raw.flight_date || raw.departure_at),
    depTime: timeOf(raw.departure_at),
    arrTime: timeOf(raw.arrival_at),
    depHour,
    bucket: bucketOf(depHour),
    durationMin: minutesBetween(raw.departure_at, raw.arrival_at),
    // Chuỗi giá theo thời gian (nếu pipeline bổ sung sau): [{observed_at, price_vnd}]
    price_history: Array.isArray(raw.price_history) ? raw.price_history : null,
  };
}

export function parseFlightPayload(payload) {
  const list = Array.isArray(payload) ? payload : payload?.flights;
  if (!Array.isArray(list)) throw new Error('flights.json không có mảng "flights".');
  const flights = list
    .filter((f) => f && f.origin && f.destination && f.departure_at)
    .map(normalizeFlight);
  return { metadata: Array.isArray(payload) ? {} : payload.metadata || {}, flights };
}

export const routeKey = (o, d) => `${o}-${d}`;

export function summarize(list) {
  const prices = list.map((f) => f.price_vnd).filter(Number.isFinite);
  return {
    count: list.length,
    priced: prices.length,
    min: prices.length ? Math.min(...prices) : null,
    max: prices.length ? Math.max(...prices) : null,
    median: median(prices),
  };
}

/** Chỉ mục tuyến/ngày/hãng dựng từ dữ liệu thật. */
export function buildIndex(flights) {
  const routes = new Map();
  const dates = new Set();
  const airlines = new Map();
  for (const f of flights) {
    const k = routeKey(f.origin, f.destination);
    if (!routes.has(k)) routes.set(k, { key: k, origin: f.origin, destination: f.destination, flights: [] });
    routes.get(k).flights.push(f);
    dates.add(f.date);
    airlines.set(f.airline, (airlines.get(f.airline) || 0) + 1);
  }
  const routeList = [...routes.values()].map((r) => ({
    ...r,
    ...summarize(r.flights),
    dates: [...new Set(r.flights.map((f) => f.date))].sort(),
  }));
  routeList.sort((a, b) => b.count - a.count);
  return {
    routes: routeList,
    routeMap: new Map(routeList.map((r) => [r.key, r])),
    origins: [...new Set(routeList.map((r) => r.origin))].sort(),
    destinations: [...new Set(routeList.map((r) => r.destination))].sort(),
    dates: [...dates].sort(),
    airlines: [...airlines.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

export function searchFlights(flights, { origin, destination, date }) {
  return flights.filter(
    (f) =>
      (!origin || f.origin === origin) &&
      (!destination || f.destination === destination) &&
      (!date || f.date === date),
  );
}

/** Ngữ cảnh giá của một chuyến trong nhóm cùng tuyến + cùng ngày (thống kê mô tả). */
export function priceContext(flight, flights) {
  const peers = flights.filter(
    (f) => f.origin === flight.origin && f.destination === flight.destination && f.date === flight.date && Number.isFinite(f.price_vnd),
  );
  const stats = summarize(peers);
  if (!Number.isFinite(flight.price_vnd) || !peers.length) return { peers, ...stats, rank: null };
  const sorted = [...peers].sort((a, b) => a.price_vnd - b.price_vnd);
  const rank = sorted.findIndex((f) => f.id === flight.id) + 1;
  const cheaperCount = peers.filter((f) => f.price_vnd < flight.price_vnd).length;
  return { peers: sorted, ...stats, rank, cheaperCount };
}

/** Các tuyến có dữ liệu bay tới một sân bay, rẻ nhất trước. */
export function routesTo(index, code) {
  return index.routes.filter((r) => r.destination === code).sort((a, b) => (a.min ?? Infinity) - (b.min ?? Infinity));
}
