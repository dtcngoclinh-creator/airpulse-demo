// Đọc kết quả nghiên cứu đã tính sẵn (V2 Mỹ, V3 Việt Nam) từ public/data/research.
// Website KHÔNG chạy mô hình: mọi xác suất, quyết định và backtest đều đọc từ file kết quả.
// Các file JSON được sinh bởi scripts/build_research_data.py từ ZIP kết quả gốc.

const BASE = `${import.meta.env.BASE_URL || '/'}data/research/`;
const cache = new Map();

function load(name) {
  if (!cache.has(name)) {
    const p = fetch(`${BASE}${name}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Không đọc được ${name} (mã ${r.status})`);
        return r.json();
      })
      .catch((e) => {
        cache.delete(name);
        throw e;
      });
    cache.set(name, p);
  }
  return cache.get(name);
}

export const loadV2 = () => load('v2_us_benchmark.json');
export const loadV3Summary = () => load('v3_summary.json');
export const loadV3Series = (kind = 'real') => load(kind === 'synthetic' ? 'v3_series_synthetic.json' : 'v3_series_real.json');

export const WINDOWS = [1, 2, 3, 4, 5, 6, 7];

export const EXPERIMENTS = {
  real_pilot: {
    label: 'Real pilot',
    short: 'Dữ liệu thật',
    desc: 'Huấn luyện và kiểm tra trên giá vé thật Việt Nam. Kết quả theo chuyến chỉ có cho 47 chuyến thuộc tập kiểm tra.',
  },
  synthetic_to_real: {
    label: 'Synthetic → Real',
    short: 'Tổng hợp → thật',
    desc: 'Huấn luyện trên dữ liệu tổng hợp, kiểm tra trên toàn bộ 232 chuyến thật.',
  },
  synthetic_only: {
    label: 'Synthetic only',
    short: 'Chỉ tổng hợp',
    desc: 'Huấn luyện và kiểm tra trên dữ liệu tổng hợp. Không phải giá vé thật.',
  },
};

export const MODELS = {
  logistic: 'Logistic Regression',
  xgboost: 'XGBoost',
};

/** V2 dùng tên mô hình đầy đủ; đổi về khóa chung. */
export const v2ModelKey = (name) => (/xgb/i.test(name) ? 'xgboost' : 'logistic');

export function v3Metric(summary, experiment, model, W) {
  return summary?.experiments?.find((r) => r.experiment === experiment && r.model === model && Number(r.W) === Number(W)) || null;
}

/**
 * Đánh giá cấu hình (mô hình, W) trên backtest. Đây là quy tắc trình bày của website,
 * không phải chỉ số trong file: chỉ coi là "có lợi" khi tiết kiệm trung bình > 0 và ROC-AUC > 0,5.
 */
export function backtestVerdict(metric, savingsKey = 'savings_per_anchor_vnd') {
  if (!metric) return { level: 'none', label: 'Không có kết quả' };
  const s = Number(metric[savingsKey]);
  const auc = Number(metric.roc_auc);
  if (s > 0 && auc > 0.5) return { level: 'positive', label: 'Có lợi trên backtest' };
  if (auc <= 0.5) return { level: 'negative', label: 'Không tốt hơn ngẫu nhiên' };
  return { level: 'negative', label: 'Thua chiến lược Mua ngay' };
}

/** Giải nén một dòng chạy V3 theo row_format của file series. */
export function unpackRun(rows, dates) {
  return (rows || []).map(([di, p, y, day, modelCost, oracleCost, savings]) => ({
    date: dates[di],
    p_wait: p,
    true_wait: y,
    purchase_day: day,
    model_cost: modelCost,
    oracle_cost: oracleCost,
    savings,
  }));
}

export function unpackDaily(rows, dates) {
  return (rows || []).map(([di, price]) => ({ date: dates[di], price }));
}

/** Khóa ghép: series_id V3 = 'R_' + id trong flights.json. */
export const seriesIdForFlight = (flight) => (flight?.id ? `R_${flight.id}` : null);

/**
 * Lấy kết quả V3 tính sẵn cho một chuyến trên website.
 * Ưu tiên real_pilot (mô hình học trên dữ liệu thật, chuyến thuộc tập kiểm tra);
 * nếu chuyến không thuộc tập kiểm tra thì dùng synthetic_to_real và đánh dấu rõ.
 */
export async function getFlightResearch(flight) {
  const [summary, series] = await Promise.all([loadV3Summary(), loadV3Series('real')]);
  const sid = seriesIdForFlight(flight);
  const entry = sid ? series.series[sid] : null;
  if (!entry) return { status: 'NO_SERIES', sid };
  const experiments = Object.keys(EXPERIMENTS).filter((e) =>
    Object.keys(entry.runs).some((k) => k.startsWith(`${e}|`)),
  );
  return {
    status: 'OK',
    sid,
    summary,
    dates: series.dates,
    daily: unpackDaily(entry.daily, series.dates),
    entry,
    experiments,
    defaultExperiment: experiments.includes('real_pilot') ? 'real_pilot' : experiments[0],
  };
}

export function formatPct(v, digits = 1) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  return `${Number(v).toLocaleString('vi-VN', { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

export function formatRatio(v, digits = 3) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  return Number(v).toLocaleString('vi-VN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function formatUSD(v, digits = 3) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  return `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

export function formatSignedVND(v) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  const n = Math.round(Number(v));
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('vi-VN')} ₫`;
}

/** "2026-10-11" -> "11/10" */
export const shortDate = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '');

/** Số ngày từ obs_date tới ngày bay (theo lịch). */
export function daysBetween(a, b) {
  const t1 = Date.parse(`${a}T00:00:00Z`);
  const t2 = Date.parse(`${b}T00:00:00Z`);
  return Number.isFinite(t1) && Number.isFinite(t2) ? Math.round((t2 - t1) / 86400000) : null;
}

/** Nhãn trục gọn có dấu: -146483 -> "−146K" */
export function formatSignedShortVND(v) {
  if (!Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  const a = Math.abs(n);
  const body = a >= 1_000_000 ? `${(a / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tr` : `${Math.round(a / 1000).toLocaleString('vi-VN')}K`;
  return `${n < -0.5 ? '−' : n > 0.5 ? '+' : ''}${body}`;
}

/** "2026-10-04" -> "04/10/2026" */
export const fullDate = (d) => (d ? d.split('-').reverse().join('/') : '');
