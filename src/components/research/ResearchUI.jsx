import { CheckCircle2, CircleSlash, FileWarning } from 'lucide-react';
import { WINDOWS } from '../../services/researchData.js';

/** Nút chọn dạng phân đoạn (W, mô hình, thí nghiệm). */
export function Segmented({ label, options, value, onChange, size = 'md' }) {
  return (
    <div className={`rs-seg rs-seg-${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const text = typeof o === 'object' ? o.label : o;
        const disabled = typeof o === 'object' && o.disabled;
        return (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            className={value === v ? 'on' : ''}
            disabled={disabled}
            title={typeof o === 'object' ? o.title : undefined}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

export function WindowPicker({ value, onChange, available = WINDOWS }) {
  return (
    <div className="rs-control">
      <span className="rs-control-label">Cửa sổ chờ W</span>
      <Segmented
        label="Chọn số ngày có thể chờ W"
        value={value}
        onChange={onChange}
        options={WINDOWS.map((w) => ({ value: w, label: `${w} ngày`, disabled: !available.includes(w) }))}
      />
    </div>
  );
}

/** Ô chỉ số. tone: good | bad | neutral */
export function Stat({ label, value, sub, tone = 'neutral', hint }) {
  return (
    <div className={`rs-stat tone-${tone}`} title={hint}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export function ConfusionMatrix({ tn, fp, fn, tp, caption }) {
  const total = tn + fp + fn + tp;
  const cell = (v, kind, title) => (
    <td className={`cm-${kind}`} title={title}>
      <strong>{Number(v).toLocaleString('vi-VN')}</strong>
      <small>{total ? `${((v / total) * 100).toFixed(1)}%` : ''}</small>
    </td>
  );
  return (
    <figure className="cm">
      <table>
        <thead>
          <tr>
            <th scope="col" aria-label="Thực tế / Dự đoán" />
            <th scope="col">Dự đoán BUY</th>
            <th scope="col">Dự đoán WAIT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Thực tế BUY</th>
            {cell(tn, 'ok', 'Đúng: nên mua, mô hình bảo mua (TN)')}
            {cell(fp, 'err', 'Sai: nên mua, mô hình bảo chờ (FP)')}
          </tr>
          <tr>
            <th scope="row">Thực tế WAIT</th>
            {cell(fn, 'err', 'Sai: nên chờ, mô hình bảo mua (FN)')}
            {cell(tp, 'ok', 'Đúng: nên chờ, mô hình bảo chờ (TP)')}
          </tr>
        </tbody>
      </table>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/**
 * Biểu đồ đường theo W cho nhiều mô hình. Chỉ vẽ giá trị có trong file.
 * series: [{ key, label, tone: 'a'|'b', values: [{ W, v }] }]
 */
export function ByWindowChart({ title, series, format, axisFormat, selectedW, onSelectW, reference = null, referenceLabel, note }) {
  const Wd = 460;
  const H = 210;
  const pad = { l: 74, r: 14, t: 16, b: 34 };
  const fmtAxis = axisFormat || format;
  const all = series.flatMap((s) => s.values.map((p) => p.v)).filter(Number.isFinite);
  if (reference !== null) all.push(reference);
  if (!all.length) return null;
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const m = (hi - lo) * 0.12;
  lo -= m;
  hi += m;
  const x = (w) => pad.l + ((w - 1) / 6) * (Wd - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const ticks = [lo + m, (lo + hi) / 2, hi - m];

  return (
    <figure className="rs-chart">
      <figcaption>
        <strong>{title}</strong>
        <span className="rs-legend">
          {series.map((s) => (
            <span key={s.key} className={`lg lg-${s.tone}`}>
              {s.label}
            </span>
          ))}
          {reference !== null && referenceLabel && <span className="lg lg-ref">{referenceLabel}</span>}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${Wd} ${H}`} role="img" aria-label={title}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={Wd - pad.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="axis">
              {fmtAxis(t)}
            </text>
          </g>
        ))}
        {reference !== null && reference > lo && reference < hi && (
          <line x1={pad.l} x2={Wd - pad.r} y1={y(reference)} y2={y(reference)} className="ref" />
        )}
        {WINDOWS.map((w) => (
          <g key={w}>
            {selectedW === w && <rect x={x(w) - 16} y={pad.t} width={32} height={H - pad.t - pad.b} className="sel" />}
            <text x={x(w)} y={H - 12} textAnchor="middle" className={`axis ${selectedW === w ? 'axis-on' : ''}`}>
              W{w}
            </text>
          </g>
        ))}
        {series.map((s) => {
          const pts = s.values.filter((p) => Number.isFinite(p.v)).sort((a, b) => a.W - b.W);
          const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.W).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
          return (
            <g key={s.key} className={`srs srs-${s.tone}`}>
              <path d={d} />
              {pts.map((p) => (
                <circle
                  key={p.W}
                  cx={x(p.W)}
                  cy={y(p.v)}
                  r={selectedW === p.W ? 6 : 4.5}
                  onClick={onSelectW ? () => onSelectW(p.W) : undefined}
                  style={onSelectW ? { cursor: 'pointer' } : undefined}
                >
                  <title>{`${s.label}, W=${p.W}: ${format(p.v)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      {note && <p className="rs-note">{note}</p>}
    </figure>
  );
}

/** So sánh chi phí trung bình mỗi lượt quyết định giữa các chiến lược. */
export function CostBars({ rows, format, caption }) {
  const vals = rows.map((r) => r.value).filter(Number.isFinite);
  if (!vals.length) return null;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  return (
    <figure className="rs-costs">
      <ul>
        {rows.map((r) => (
          <li key={r.label} className={`cost-${r.tone || 'base'}`}>
            <span className="cost-label">{r.label}</span>
            <span className="cost-track">
              <span style={{ width: `${12 + ((r.value - lo) / span) * 88}%` }} />
            </span>
            <strong>{format(r.value)}</strong>
          </li>
        ))}
      </ul>
      {caption && (
        <figcaption>
          {caption} Độ dài thanh được phóng to quanh khoảng chênh lệch, không bắt đầu từ 0.
        </figcaption>
      )}
    </figure>
  );
}

/** Danh sách những gì có/thiếu trong gói kết quả. */
export function Availability({ items }) {
  return (
    <ul className="rs-avail">
      {items.map((it) => (
        <li key={it.label} className={`av-${it.state}`}>
          {it.state === 'yes' && <CheckCircle2 size={18} aria-hidden="true" />}
          {it.state === 'partial' && <FileWarning size={18} aria-hidden="true" />}
          {it.state === 'no' && <CircleSlash size={18} aria-hidden="true" />}
          <div>
            <strong>{it.label}</strong>
            {it.detail && <p>{it.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
