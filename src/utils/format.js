// Định dạng tiền, ngày giờ và các phép thống kê mô tả dùng chung.

export function isValidPrice(n) {
  return n !== null && n !== undefined && n !== '' && Number.isFinite(Number(n));
}

export function formatVND(n) {
  if (!isValidPrice(n)) return 'Chưa có giá';
  return `${Math.round(Number(n)).toLocaleString('vi-VN')} ₫`;
}

/** 742061 -> "742K", 1250000 -> "1,25 tr" */
export function formatVNDShort(n) {
  if (!isValidPrice(n)) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tr`;
  return `${Math.round(v / 1000).toLocaleString('vi-VN')}K`;
}

export const dateOf = (s) => String(s || '').slice(0, 10);
export const timeOf = (s) => String(s || '').slice(11, 16) || '--:--';

/** Chuỗi "YYYY-MM-DD HH:mm" là giờ địa phương của chuyến bay -> Date (giờ máy người xem). */
export function parseLocal(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
}

export function hourOf(s) {
  const h = Number(String(s || '').slice(11, 13));
  return Number.isFinite(h) ? h : null;
}

export function minutesBetween(a, b) {
  const d1 = parseLocal(a);
  const d2 = parseLocal(b);
  if (!d1 || !d2) return null;
  let diff = Math.round((d2 - d1) / 60000);
  if (diff < 0) diff += 24 * 60; // chuyến qua đêm nhưng thiếu ngày đến
  return diff;
}

export function formatDuration(min) {
  if (!Number.isFinite(min)) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} phút`;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

export function formatDurationShort(min) {
  if (!Number.isFinite(min)) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}g${m ? ` ${String(m).padStart(2, '0')}p` : ''}` : `${m}p`;
}

/** "2026-10-14" -> "Thứ Tư, 14/10/2026" */
export function formatDateVN(ymd, { weekday = true, year = true } = {}) {
  const d = parseLocal(ymd);
  if (!d) return ymd || '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const base = year ? `${dd}/${mm}/${d.getFullYear()}` : `${dd}/${mm}`;
  if (!weekday) return base;
  const names = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${names[d.getDay()]}, ${base}`;
}

/** ISO có múi giờ (last_observed_at) -> "13/10/2026 lúc 08:28" */
export function formatObservedAt(iso) {
  if (!iso) return 'Không rõ';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} lúc ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const TIME_BUCKETS = [
  { key: 'early', label: 'Sáng sớm', range: '00:00 – 05:59', from: 0, to: 6 },
  { key: 'morning', label: 'Buổi sáng', range: '06:00 – 11:59', from: 6, to: 12 },
  { key: 'afternoon', label: 'Buổi chiều', range: '12:00 – 17:59', from: 12, to: 18 },
  { key: 'evening', label: 'Buổi tối', range: '18:00 – 23:59', from: 18, to: 24 },
];

export function bucketOf(hour) {
  if (!Number.isFinite(hour)) return null;
  return TIME_BUCKETS.find((b) => hour >= b.from && hour < b.to)?.key ?? null;
}

export function median(values) {
  const a = values.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export function pctDiff(value, base) {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base === 0) return null;
  return ((value - base) / base) * 100;
}

export function plural(n, word) {
  return `${Number(n).toLocaleString('vi-VN')} ${word}`;
}
