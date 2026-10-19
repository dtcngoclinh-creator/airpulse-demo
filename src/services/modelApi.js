// ĐIỂM TÍCH HỢP MÔ HÌNH AIRPULSE (Fair Price, Price Trend, BUY/WAIT)
// ---------------------------------------------------------------------------
// Thứ tự lấy kết quả:
//   1) Trường `insight` gắn sẵn trong từng chuyến của flights.json (xuất offline từ notebook).
//   2) API thật, nếu đặt biến môi trường VITE_AIRPULSE_MODEL_API.
//   3) Không có gì -> trạng thái "not_configured". Website KHÔNG tự tạo dự đoán.
//
// Request (POST {API}/insight), body JSON:
//   { flight_id, origin, destination, airline, flight_number, departure_at, price_vnd, last_observed_at }
//
// Response mong đợi (mọi khối đều có thể vắng mặt, UI sẽ báo phần còn thiếu):
// {
//   "fair_price":     { "value_vnd": 820000, "low_vnd": 760000, "high_vnd": 900000 },
//   "trend":          { "direction": "up" | "down" | "stable", "expected_change_pct": 6.5, "horizon_days": 3 },
//   "recommendation": { "action": "BUY" | "WAIT", "confidence": 0.72,
//                       "explanation": ["Giá hiện thấp hơn mức hợp lý 8%", "..."] },
//   "model_version": "fairprice-v0.3", "generated_at": "2026-10-13T09:00:00+07:00"
// }

const API_BASE = (import.meta.env.VITE_AIRPULSE_MODEL_API || '').trim().replace(/\/$/, '');

export const MODEL_API_CONFIGURED = Boolean(API_BASE);
export const MODEL_ENV_NAME = 'VITE_AIRPULSE_MODEL_API';

const num = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);

/** Kiểm tra + làm sạch phản hồi. Trả null nếu không có khối nào hợp lệ. */
export function sanitizeInsight(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = { model_version: raw.model_version || null, generated_at: raw.generated_at || null };

  const fp = raw.fair_price;
  if (fp && num(fp.value_vnd) !== null) {
    out.fair_price = { value_vnd: num(fp.value_vnd), low_vnd: num(fp.low_vnd), high_vnd: num(fp.high_vnd) };
  }
  const tr = raw.trend;
  if (tr && ['up', 'down', 'stable'].includes(tr.direction)) {
    out.trend = { direction: tr.direction, expected_change_pct: num(tr.expected_change_pct), horizon_days: num(tr.horizon_days) };
  }
  const rc = raw.recommendation;
  if (rc && ['BUY', 'WAIT'].includes(String(rc.action).toUpperCase())) {
    const c = num(rc.confidence);
    out.recommendation = {
      action: String(rc.action).toUpperCase(),
      confidence: c === null ? null : Math.min(1, Math.max(0, c > 1 ? c / 100 : c)),
      explanation: Array.isArray(rc.explanation) ? rc.explanation.map(String).filter(Boolean) : rc.explanation ? [String(rc.explanation)] : [],
    };
  }
  return out.fair_price || out.trend || out.recommendation ? out : null;
}

/**
 * @returns {Promise<{status:'ready'|'not_configured'|'empty', source?:string, data?:object}>}
 * Ném lỗi khi API trả lỗi mạng/HTTP để UI hiển thị trạng thái lỗi + nút thử lại.
 */
export async function fetchFlightInsight(flight, { signal } = {}) {
  const embedded = sanitizeInsight(flight?.insight);
  if (embedded) return { status: 'ready', source: 'flights.json', data: embedded };
  if (!API_BASE) return { status: 'not_configured' };

  const res = await fetch(`${API_BASE}/insight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      flight_id: flight.id,
      origin: flight.origin,
      destination: flight.destination,
      airline: flight.airline,
      flight_number: flight.flight_number,
      departure_at: flight.departure_at,
      price_vnd: flight.price_vnd,
      last_observed_at: flight.last_observed_at,
    }),
  });
  if (!res.ok) throw new Error(`API mô hình trả mã ${res.status}`);
  const data = sanitizeInsight(await res.json());
  return data ? { status: 'ready', source: 'api', data } : { status: 'empty' };
}
