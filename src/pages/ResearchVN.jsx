import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { LoadingBlock, ErrorState } from '../components/common/States.jsx';
import { Availability, ByWindowChart, ConfusionMatrix, CostBars, Segmented, Stat, WindowPicker } from '../components/research/ResearchUI.jsx';
import SeriesExplorer from '../components/research/SeriesExplorer.jsx';
import {
  EXPERIMENTS,
  MODELS,
  WINDOWS,
  backtestVerdict,
  formatPct,
  formatRatio,
  formatSignedVND,
  formatSignedShortVND,
  fullDate,
  loadV3Series,
  loadV3Summary,
  unpackDaily,
  v3Metric,
} from '../services/researchData.js';
import { useFlightData } from '../context/FlightDataContext.jsx';
import { cityOf } from '../data/airports.js';
import { formatVND } from '../utils/format.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const clampW = (v) => (WINDOWS.includes(Number(v)) ? Number(v) : 2);

function ModelColumn({ metric, model }) {
  if (!metric) return null;
  const verdict = backtestVerdict(metric);
  return (
    <div className="model-col">
      <div className="model-col-head">
        <h3>{MODELS[model]}</h3>
        <span className={`verdict-chip v-${verdict.level}`}>{verdict.label}</span>
      </div>
      <dl className="rs-stats">
        <Stat label="ROC-AUC" value={formatRatio(metric.roc_auc)} tone={metric.roc_auc > 0.5 ? 'good' : 'bad'} hint="0,5 tương đương đoán ngẫu nhiên" />
        <Stat label="Balanced accuracy" value={formatRatio(metric.balanced_accuracy)} />
        <Stat label="Ngưỡng quyết định" value={metric.threshold} sub="chọn trên tập validation" />
        <Stat label="Precision WAIT" value={formatRatio(metric.precision_wait)} />
        <Stat label="Recall WAIT" value={formatRatio(metric.recall_wait)} />
        <Stat label="F1 WAIT" value={formatRatio(metric.f1_wait)} />
        <Stat
          label="Tiết kiệm / mốc"
          value={formatSignedVND(metric.savings_per_anchor_vnd)}
          tone={metric.savings_per_anchor_vnd > 0 ? 'good' : 'bad'}
          sub={`tổng ${formatSignedVND(metric.savings_total_vnd)}`}
        />
        <Stat label="Đạt so với oracle" value={formatPct(metric.oracle_capture_pct)} tone={metric.oracle_capture_pct > 0 ? 'good' : 'bad'} hint="Phần tiết kiệm đạt được so với mức tối đa nếu biết trước giá" />
        <Stat
          label="Bị thiệt (harmed)"
          value={formatPct(metric.harmed_pct, 2)}
          sub={metric.avg_harm_when_harmed_vnd ? `TB ${formatVND(metric.avg_harm_when_harmed_vnd)}, tối đa ${formatVND(metric.max_harm_vnd)}` : null}
          tone={metric.harmed_pct > 5 ? 'bad' : 'neutral'}
        />
        <Stat label="WAIT ở mốc đầu" value={formatPct(metric.wait_at_start_pct)} />
        <Stat label="Accuracy" value={formatRatio(metric.accuracy)} />
        <Stat label="Mẫu kiểm tra" value={Number(metric.test_n).toLocaleString('vi-VN')} sub={`train ${metric.train_n} · val ${metric.val_n}`} />
      </dl>
      <ConfusionMatrix tn={metric.TN} fp={metric.FP} fn={metric.FN} tp={metric.TP} />
      <CostBars
        format={formatVND}
        caption="Chi phí trung bình mỗi mốc quyết định trên tập kiểm tra (VND). Oracle là mức thấp nhất khi biết trước giá."
        rows={[
          { label: 'Luôn mua ngay', value: metric.buy_mean_vnd },
          { label: 'Theo AirPulse', value: metric.airpulse_mean_vnd, tone: 'model' },
          { label: 'Luôn chờ hết W', value: metric.always_wait_mean_vnd },
          { label: 'Oracle', value: metric.oracle_mean_vnd, tone: 'oracle' },
        ]}
      />
    </div>
  );
}

export default function ResearchVN() {
  useDocumentTitle('Vietnam Pilot (V3)');
  const [params, setParams] = useSearchParams();
  const experiment = EXPERIMENTS[params.get('exp')] ? params.get('exp') : 'real_pilot';
  const W = clampW(params.get('W'));
  const model = MODELS[params.get('model')] ? params.get('model') : 'xgboost';
  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    next.set(k, String(v));
    if (k === 'exp') next.delete('series');
    setParams(next, { replace: true });
  };

  const [state, setState] = useState({ status: 'loading' });
  const kind = experiment === 'synthetic_only' ? 'synthetic' : 'real';
  const [series, setSeries] = useState({ kind: null, data: null });
  const { byId } = useFlightData();

  useEffect(() => {
    loadV3Summary()
      .then((summary) => setState({ status: 'ready', summary }))
      .catch((e) => setState({ status: 'error', error: e.message }));
  }, []);
  useEffect(() => {
    let off = false;
    loadV3Series(kind)
      .then((data) => !off && setSeries({ kind, data }))
      .catch(() => !off && setSeries({ kind, data: null }));
    return () => {
      off = true;
    };
  }, [kind]);

  const seriesIds = useMemo(() => {
    if (!series.data || series.kind !== kind) return [];
    return Object.keys(series.data.series)
      .filter((sid) => Object.keys(series.data.series[sid].runs).some((k) => k.startsWith(`${experiment}|`)))
      .sort();
  }, [series, kind, experiment]);
  const seriesId = seriesIds.includes(params.get('series')) ? params.get('series') : seriesIds[0];

  if (state.status === 'loading') return <div className="container subpage"><LoadingBlock label="Đang đọc kết quả V3…" rows={2} /></div>;
  if (state.status === 'error') return <div className="container subpage"><ErrorState message={state.error} onRetry={() => window.location.reload()} /></div>;

  const { summary } = state;
  const metrics = Object.keys(MODELS).map((m) => [m, v3Metric(summary, experiment, m, W)]);
  const byW = (key) =>
    Object.keys(MODELS).map((m, i) => ({
      key: m,
      label: MODELS[m],
      tone: i ? 'b' : 'a',
      values: WINDOWS.map((w) => ({ W: w, v: Number(v3Metric(summary, experiment, m, w)?.[key]) })),
    }));
  const audit = summary.data_audit;
  const join = summary.checks.join;
  const labels = summary.label_audit.filter((r) => r.dataset === (experiment === 'synthetic_only' ? 'synthetic' : 'real'));
  const inconsistentWaitN = summary.experiments.filter((r) => r.wait_n_reported_inconsistent).length;

  const entry = seriesId && series.data ? series.data.series[seriesId] : null;
  const flight = entry && kind === 'real' ? byId.get(seriesId.slice(2)) : null;
  const intraday = flight
    ? (flight.price_history || []).map((p) => ({ t: Date.parse(p.observed_at), price: Number(p.price_vnd) })).filter((p) => Number.isFinite(p.t)).sort((a, b) => a.t - b.t)
    : [];
  const seriesLabel = (sid) => {
    const m = series.data?.series[sid]?.meta || {};
    if (kind === 'real') return `${m.flight} ${m.origin}–${m.destination} ${m.departure_time}`;
    return `${m.airline_code || ''} ${m.origin || ''}–${m.destination || ''} ${m.departure_date || ''} ${m.departure_hour || ''} #${m.index || ''}`;
  };

  return (
    <div className="research">
      <section className="rs-hero rs-hero-vn">
        <div className="container">
          <nav className="crumbs" aria-label="Đường dẫn">
            <Link to="/research">Nghiên cứu</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">Vietnam Pilot (V3)</span>
          </nav>
          <h1>Vietnam Pilot · V3</h1>
          <p>
            Giá vé nội địa thật ghi nhận từ {fullDate(audit[0]?.first_observation)} đến {fullDate(audit[0]?.last_observation)} cho {audit[0]?.series} chuyến của một ngày bay,
            cùng {audit[1]?.series} chuỗi giá tổng hợp. So sánh Logistic Regression và XGBoost trong quyết định BUY/WAIT với cửa sổ chờ 1–7 ngày.
          </p>
          <dl className="rs-hero-facts">
            {audit.map((a) => (
              <div key={a.dataset}>
                <dt>{a.dataset === 'REAL' ? 'Dữ liệu thật' : 'Dữ liệu tổng hợp'}</dt>
                <dd>
                  {a.series} chuỗi · {Number(a.quote_days).toLocaleString('vi-VN')} ngày-giá · {a.departure_dates} ngày bay
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container rs-body">
        <div className="rs-sticky">
          <div className="rs-control">
            <span className="rs-control-label">Thí nghiệm</span>
            <Segmented
              label="Chọn thí nghiệm"
              value={experiment}
              onChange={(v) => setParam('exp', v)}
              options={Object.entries(EXPERIMENTS).map(([value, e]) => ({ value, label: e.label, title: e.desc }))}
            />
          </div>
          <WindowPicker value={W} onChange={(v) => setParam('W', v)} />
        </div>
        <p className="rs-exp-desc">{EXPERIMENTS[experiment].desc}</p>

        <section className="rs-section" aria-labelledby="vn-w">
          <h2 id="vn-w">Kết quả với W = {W} ngày</h2>
          <div className="model-cols">
            {metrics.map(([m, metric]) => (
              <ModelColumn key={m} model={m} metric={metric} />
            ))}
          </div>
        </section>

        <section className="rs-section" aria-labelledby="vn-trend">
          <h2 id="vn-trend">Chỉ số theo cửa sổ chờ</h2>
          <p className="muted">Bấm vào một điểm để chuyển W.</p>
          <div className="rs-chart-grid">
            <ByWindowChart title="ROC-AUC" series={byW('roc_auc')} format={(v) => formatRatio(v, 2)} selectedW={W} onSelectW={(v) => setParam('W', v)} reference={0.5} referenceLabel="0,5 = ngẫu nhiên" />
            <ByWindowChart title="Tiết kiệm trung bình mỗi mốc (VND)" series={byW('savings_per_anchor_vnd')} format={(v) => formatSignedVND(v)} axisFormat={formatSignedShortVND} selectedW={W} onSelectW={(v) => setParam('W', v)} reference={0} referenceLabel="0 = bằng Mua ngay" />
            <ByWindowChart title="Tỷ lệ mốc bị thiệt (%)" series={byW('harmed_pct')} format={(v) => formatPct(v)} selectedW={W} onSelectW={(v) => setParam('W', v)} />
            <ByWindowChart title="Đạt so với oracle (%)" series={byW('oracle_capture_pct')} format={(v) => formatPct(v, 0)} selectedW={W} onSelectW={(v) => setParam('W', v)} reference={0} />
          </div>
        </section>

        <section className="rs-section card" aria-labelledby="vn-series">
          <h2 id="vn-series">Chuỗi giá và quyết định theo ngày</h2>
          <p className="muted">
            {kind === 'real'
              ? `${seriesIds.length} chuyến có kết quả trong thí nghiệm này. Giá theo giờ lấy từ dữ liệu website; giá ngày, p_wait và backtest lấy từ file kết quả.`
              : `${seriesIds.length} chuỗi tổng hợp thuộc tập kiểm tra. Đây không phải giá vé thật.`}
          </p>
          {!series.data || series.kind !== kind ? (
            <LoadingBlock label="Đang đọc chuỗi giá…" rows={1} />
          ) : (
            <>
              <label className="rs-select">
                <span>{kind === 'real' ? 'Chuyến bay' : 'Chuỗi tổng hợp'}</span>
                <select value={seriesId || ''} onChange={(e) => setParam('series', e.target.value)}>
                  {seriesIds.map((sid) => (
                    <option key={sid} value={sid}>
                      {seriesLabel(sid)}
                    </option>
                  ))}
                </select>
              </label>
              {flight && (
                <p className="small rs-flight-link">
                  {cityOf(flight.origin)} – {cityOf(flight.destination)}, {flight.airline}.{' '}
                  <Link className="text-link" to={`/flights/${encodeURIComponent(flight.id)}`}>
                    Mở trang chuyến bay
                  </Link>
                </p>
              )}
              {entry && (
                <SeriesExplorer
                  key={`${seriesId}-${experiment}`}
                  entry={entry}
                  dates={series.data.dates}
                  daily={unpackDaily(entry.daily, series.data.dates)}
                  summary={summary}
                  experiments={[experiment]}
                  controlsExperiment={false}
                  experiment={experiment}
                  W={W}
                  onWChange={(v) => setParam('W', v)}
                  model={model}
                  onModelChange={(v) => setParam('model', v)}
                  intraday={intraday}
                  departureAt={flight ? `${flight.departure_at.replace(' ', 'T')}:00+07:00` : null}
                  departureDate={entry.meta?.departure_date}
                />
              )}
            </>
          )}
        </section>

        <section className="rs-section" aria-labelledby="vn-audit">
          <h2 id="vn-audit">Kiểm tra dữ liệu và cách ghép</h2>
          <div className="rs-two">
            <div className="card">
              <h3>Ghép với dữ liệu website</h3>
              <ul className="rs-checks">
                <li>
                  Khóa ghép: <code>series_id = "R_" + id</code>, trong đó id có số hiệu bỏ khoảng trắng, ví dụ <code>VJ 501</code> → <code>VJ501</code>.
                </li>
                <li>
                  {join.matched}/{join.real_series_in_results} chuỗi thật khớp đúng một chuyến trên website; {join.departure_or_flight_number_mismatch.length} lệch giờ bay hoặc số hiệu.
                </li>
                <li>
                  {join.daily_price_equals_vn_day_median}/{join.daily_price_checked} giá ngày trong V3 bằng trung vị các lần quan sát cùng ngày (giờ Việt Nam) trên website.
                </li>
                <li>
                  {summary.checks.matched_rows.toLocaleString('vi-VN')}/{summary.checks.predictions_rows.toLocaleString('vi-VN')} dòng predictions khớp đúng một dòng backtest theo (thí nghiệm, mô hình, W, series_id, obs_date).
                </li>
                <li>Dữ liệu thật chỉ có {audit[0]?.departure_dates} ngày bay, nên kết quả chưa kiểm chứng được trên ngày bay khác. obs_date là ngày quan sát theo giờ Việt Nam.</li>
              </ul>
            </div>
            <div className="card">
              <h3>Nhãn WAIT trong dữ liệu {experiment === 'synthetic_only' ? 'tổng hợp' : 'thật'}</h3>
              <div className="table-scroll">
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th>W</th>
                      <th>Mẫu có nhãn</th>
                      <th>WAIT</th>
                      <th>Tỷ lệ WAIT</th>
                      <th>Số chuỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labels.map((r) => (
                      <tr key={r.W} className={r.W === W ? 'is-on' : ''}>
                        <td>{r.W}</td>
                        <td>{r.valid_labeled_samples}</td>
                        <td>{r.wait_count}</td>
                        <td>{formatPct(r.wait_pct)}</td>
                        <td>{r.unique_series}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {inconsistentWaitN > 0 && (
            <p className="notice rs-warn">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                Cột <code>wait_n</code> trong experiment_results.csv không khớp TP + FN ở {inconsistentWaitN}/{summary.experiments.length} dòng (có giá trị âm).
                Website dùng ma trận nhầm lẫn (TP, FP, FN, TN) và không hiển thị <code>wait_n</code>. Nên kiểm tra lại notebook.
              </span>
            </p>
          )}
          <Availability
            items={[
              { state: 'yes', label: 'Chuỗi giá thật theo ngày và theo giờ', detail: 'predictions.csv (giá ngày) và flights.json (giá theo giờ của 232 chuyến).' },
              { state: 'yes', label: 'Dự đoán theo từng mốc (p_wait, true_wait)', detail: 'predictions.csv, 3 thí nghiệm × 2 mô hình × W 1–7.' },
              { state: 'yes', label: 'Backtest theo từng mốc', detail: '42 file backtest_*.csv: chi phí mua ngay, theo mô hình, oracle, ngày mua, tiết kiệm.' },
              { state: 'no', label: 'Giá dự báo', detail: 'Mô hình BUY/WAIT chỉ trả xác suất nên chờ, không dự báo giá. Website không vẽ đường giá dự báo.' },
              { state: 'no', label: 'Mô hình đã huấn luyện và pipeline đặc trưng', detail: 'Không có file .json/.pkl/.joblib của mô hình hay mã tạo đặc trưng, nên không thể dự đoán cho chuyến mới.' },
            ]}
          />
        </section>

        <details className="rs-section rs-full">
          <summary>Bảng đầy đủ experiment_results.csv (42 dòng)</summary>
          <div className="table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Thí nghiệm</th><th>Mô hình</th><th>W</th><th>Ngưỡng</th><th>ROC-AUC</th><th>Bal. acc</th><th>F1 WAIT</th><th>TP</th><th>FP</th><th>FN</th><th>TN</th><th>Tiết kiệm/mốc</th><th>Oracle %</th><th>Harmed %</th>
                </tr>
              </thead>
              <tbody>
                {summary.experiments.map((r) => (
                  <tr key={`${r.experiment}${r.model}${r.W}`} className={r.experiment === experiment && r.W === W ? 'is-on' : ''}>
                    <td>{EXPERIMENTS[r.experiment]?.label}</td>
                    <td>{MODELS[r.model]}</td>
                    <td>{r.W}</td>
                    <td>{r.threshold}</td>
                    <td>{formatRatio(r.roc_auc)}</td>
                    <td>{formatRatio(r.balanced_accuracy)}</td>
                    <td>{formatRatio(r.f1_wait)}</td>
                    <td>{r.TP}</td>
                    <td>{r.FP}</td>
                    <td>{r.FN}</td>
                    <td>{r.TN}</td>
                    <td className={r.savings_per_anchor_vnd > 0 ? 'pos' : 'neg'}>{formatSignedVND(r.savings_per_anchor_vnd)}</td>
                    <td>{formatPct(r.oracle_capture_pct)}</td>
                    <td>{formatPct(r.harmed_pct, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
