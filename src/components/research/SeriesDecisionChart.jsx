import { formatVND, formatVNDShort } from '../../utils/format.js';
import { shortDate } from '../../services/researchData.js';

const DAY = 86400000;
const noonVN = (d) => Date.parse(`${d}T12:00:00+07:00`);

/**
 * Chuỗi giá có thật + kết quả BUY/WAIT tính sẵn.
 * - intraday: [{t (ms), price}] — giá quan sát theo giờ (flights.json), nếu có
 * - daily: [{date, price}] — giá ngày đầu vào của mô hình (predictions.csv)
 * - run: [{date, p_wait, true_wait, purchase_day, model_cost, oracle_cost, savings}]
 * Không vẽ giá dự báo: mô hình BUY/WAIT chỉ trả xác suất nên chờ (p_wait).
 */
export default function SeriesDecisionChart({
  intraday = [],
  daily = [],
  run = [],
  threshold,
  W,
  departureAt,
  selectedDate,
  onSelectDate,
  formatPrice = formatVND,
  formatShort = formatVNDShort,
}) {
  if (!daily.length) return null;
  const Wd = 900;
  const top = { t: 18, h: 230 };
  const bot = { t: 290, h: 92 };
  const H = 420;
  const padL = 70;
  const padR = 18;

  const depT = departureAt ? Date.parse(departureAt) : null;
  const t0 = Math.min(Date.parse(`${daily[0].date}T00:00:00+07:00`), ...(intraday.length ? [intraday[0].t] : []));
  const lastDaily = Date.parse(`${daily[daily.length - 1].date}T23:59:00+07:00`);
  const t1 = Math.max(lastDaily, depT || 0, ...(intraday.length ? [intraday[intraday.length - 1].t] : []));
  const x = (t) => padL + ((t - t0) / (t1 - t0)) * (Wd - padL - padR);

  const prices = [...daily.map((d) => d.price), ...intraday.map((p) => p.price), ...run.map((r) => r.oracle_cost)].filter(Number.isFinite);
  let lo = Math.min(...prices);
  let hi = Math.max(...prices);
  const m = Math.max((hi - lo) * 0.12, hi * 0.02);
  lo -= m;
  hi += m;
  const y = (v) => top.t + (1 - (v - lo) / (hi - lo)) * top.h;
  const yp = (p) => bot.t + (1 - p) * bot.h;

  const dailyByDate = new Map(daily.map((d) => [d.date, d.price]));
  const sel = run.find((r) => r.date === selectedDate) || null;

  // đường bậc thang cho giá theo giờ (giữ giá tới lần quan sát kế tiếp, không nội suy)
  const stepPath = intraday
    .map((p, i) => {
      const px = x(p.t).toFixed(1);
      const py = y(p.price).toFixed(1);
      if (!i) return `M${px},${py}`;
      return `H${px} V${py}`;
    })
    .join(' ');
  const dailyPath = daily.map((d, i) => `${i ? 'L' : 'M'}${x(noonVN(d.date)).toFixed(1)},${y(d.price).toFixed(1)}`).join(' ');

  const dayTicks = [];
  for (let t = Date.parse(`${daily[0].date}T00:00:00+07:00`); t <= t1; t += DAY) dayTicks.push(t);

  return (
    <figure className="sdc">
      <svg viewBox={`0 0 ${Wd} ${H}`} role="img" aria-label="Chuỗi giá quan sát và xác suất nên chờ theo ngày">
        {/* lưới ngày */}
        {dayTicks.map((t) => {
          const d = new Date(t + 7 * 3600000).toISOString().slice(0, 10);
          return (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={top.t} y2={bot.t + bot.h} className="grid-v" />
              {x(t + DAY / 2) < Wd - padR - 12 && (
                <text x={x(t + DAY / 2)} y={H - 10} textAnchor="middle" className="axis">
                  {shortDate(d)}
                </text>
              )}
            </g>
          );
        })}
        {[0, 0.5, 1].map((r) => {
          const v = lo + m + r * (hi - lo - 2 * m);
          return (
            <g key={r}>
              <line x1={padL} x2={Wd - padR} y1={y(v)} y2={y(v)} className="grid" />
              <text x={padL - 8} y={y(v) + 4} textAnchor="end" className="axis">
                {formatShort(v)}
              </text>
            </g>
          );
        })}

        {/* khung W ngày của mốc đang chọn */}
        {sel && (
          <g className="win">
            <rect
              x={x(noonVN(sel.date))}
              y={top.t}
              width={Math.max(0, Math.min(x(noonVN(sel.date) + W * DAY), Wd - padR) - x(noonVN(sel.date)))}
              height={top.h}
            />
            <line
              x1={x(noonVN(sel.date))}
              x2={Math.min(x(noonVN(sel.date) + W * DAY), Wd - padR)}
              y1={y(sel.oracle_cost)}
              y2={y(sel.oracle_cost)}
              className="oracle"
            >
              <title>{`Giá thấp nhất thực tế trong ${W} ngày (nhìn lại): ${formatPrice(sel.oracle_cost)}`}</title>
            </line>
          </g>
        )}

        {departureAt && depT && (
          <g>
            <line x1={x(depT)} x2={x(depT)} y1={top.t} y2={bot.t + bot.h} className="dep" />
            <text x={x(depT) - 6} y={top.t + 12} textAnchor="end" className="axis dep-label">
              Cất cánh
            </text>
          </g>
        )}

        {intraday.length > 1 && <path d={stepPath} className="intraday" />}
        <path d={dailyPath} className="daily" />
        {daily.map((d) => (
          <circle key={d.date} cx={x(noonVN(d.date))} cy={y(d.price)} r={3} className="daily-pt">
            <title>{`${shortDate(d.date)} — giá ngày: ${formatPrice(d.price)}`}</title>
          </circle>
        ))}

        {/* quyết định của mô hình tại từng mốc */}
        {run.map((r) => {
          const p = dailyByDate.get(r.date);
          if (!Number.isFinite(p)) return null;
          const wait = r.purchase_day > 0;
          const on = selectedDate === r.date;
          return (
            <g
              key={r.date}
              className={`anchor ${wait ? 'is-wait' : 'is-buy'} ${on ? 'on' : ''}`}
              onClick={onSelectDate ? () => onSelectDate(r.date) : undefined}
              style={onSelectDate ? { cursor: 'pointer' } : undefined}
            >
              <circle cx={x(noonVN(r.date))} cy={y(p)} r={on ? 8 : 6} />
              <title>{`${shortDate(r.date)}: ${wait ? 'WAIT' : 'BUY'} (p_wait ${r.p_wait?.toFixed(3)})`}</title>
            </g>
          );
        })}

        {sel && sel.purchase_day > 0 && (
          <g className="bought">
            <circle cx={x(noonVN(sel.date) + sel.purchase_day * DAY)} cy={y(sel.model_cost)} r={10} />
            <title>{`Theo backtest, mô hình mua sau ${sel.purchase_day} ngày với giá ${formatPrice(sel.model_cost)}`}</title>
          </g>
        )}

        {/* panel xác suất */}
        <text x={padL} y={bot.t - 10} className="axis panel-title">
          Xác suất nên chờ (p_wait) và ngưỡng quyết định
        </text>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={padL} x2={Wd - padR} y1={yp(v)} y2={yp(v)} className="grid" />
            <text x={padL - 8} y={yp(v) + 4} textAnchor="end" className="axis">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {run.map((r) => {
          const cx = x(noonVN(r.date));
          const above = Number.isFinite(threshold) && r.p_wait >= threshold;
          return (
            <g key={r.date} className={`pbar ${above ? 'is-wait' : 'is-buy'} ${selectedDate === r.date ? 'on' : ''}`}
              onClick={onSelectDate ? () => onSelectDate(r.date) : undefined}
              style={onSelectDate ? { cursor: 'pointer' } : undefined}
            >
              <rect x={cx - 9} y={yp(r.p_wait)} width={18} height={Math.max(1, yp(0) - yp(r.p_wait))} />
              {r.true_wait === 1 && <rect x={cx - 3} y={bot.t - 3} width={6} height={6} className="truth" />}
              <title>{`${shortDate(r.date)}: p_wait ${r.p_wait?.toFixed(3)}${r.true_wait === 1 ? ' · nhãn thật: WAIT' : ' · nhãn thật: BUY'}`}</title>
            </g>
          );
        })}
        {Number.isFinite(threshold) && (
          <g>
            <line x1={padL} x2={Wd - padR} y1={yp(threshold)} y2={yp(threshold)} className="thr" />
            <text x={Wd - padR} y={yp(threshold) - 5} textAnchor="end" className="axis thr-label">
              ngưỡng {threshold}
            </text>
          </g>
        )}
      </svg>
      <ul className="sdc-legend">
        {intraday.length > 1 && <li className="k-intraday">Giá quan sát theo giờ</li>}
        <li className="k-daily">Giá ngày (đầu vào mô hình)</li>
        <li className="k-buy">Mô hình: BUY</li>
        <li className="k-wait">Mô hình: WAIT</li>
        <li className="k-truth">Nhãn thật là WAIT</li>
        <li className="k-oracle">Giá thấp nhất trong W ngày (nhìn lại)</li>
      </ul>
    </figure>
  );
}
