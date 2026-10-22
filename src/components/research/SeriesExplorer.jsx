import { useEffect, useMemo, useState } from 'react';
import SeriesDecisionChart from './SeriesDecisionChart.jsx';
import { Segmented, WindowPicker } from './ResearchUI.jsx';
import {
  EXPERIMENTS,
  MODELS,
  WINDOWS,
  backtestVerdict,
  daysBetween,
  formatPct,
  formatRatio,
  formatSignedVND,
  shortDate,
  unpackRun,
  v3Metric,
} from '../../services/researchData.js';
import { formatVND } from '../../utils/format.js';

/** Thẻ kết quả cho một mốc quan sát (obs_date) đã chọn. */
export function AnchorDecision({ row, metric, W, departureDate, price }) {
  if (!row) return <p className="muted small">Chọn một mốc trên biểu đồ để xem chi tiết.</p>;
  const wait = row.purchase_day > 0;
  const verdict = backtestVerdict(metric);
  const usable = verdict.level === 'positive';
  const dtd = departureDate ? daysBetween(row.date, departureDate) : null;
  const buyCost = price;
  return (
    <div className={`anchor-card ${usable ? 'usable' : 'gated'}`}>
      <div className="anchor-head">
        <div>
          <small>
            Mốc {shortDate(row.date)}
            {dtd !== null && `, còn ${dtd} ngày tới ngày bay`}, W = {W}
          </small>
          <div className="anchor-out">
            <span className={`out-badge ${wait ? 'is-wait' : 'is-buy'}`}>{wait ? 'WAIT' : 'BUY'}</span>
            <span>
              p_wait <strong>{formatRatio(row.p_wait)}</strong> {wait ? '≥' : '<'} ngưỡng <strong>{metric?.threshold ?? '—'}</strong>
            </span>
          </div>
        </div>
        <span className={`verdict-chip v-${verdict.level}`}>{verdict.label}</span>
      </div>

      <p className="anchor-say">
        {usable
          ? `Ở cấu hình này mô hình có lợi trên backtest, nên kết quả được hiển thị như một khuyến nghị tham khảo: ${wait ? 'chờ thêm' : 'mua ngay'}.`
          : `Không dùng làm khuyến nghị: trên tập kiểm tra, cấu hình này ${
              Number(metric?.roc_auc) <= 0.5 ? 'có ROC-AUC không vượt 0,5' : 'tiết kiệm trung bình âm so với Mua ngay'
            }. Đầu ra vẫn hiển thị để minh bạch.`}
      </p>

      <dl className="anchor-facts">
        <div>
          <dt>Nhãn thật (true_wait)</dt>
          <dd>{row.true_wait === 1 ? 'WAIT: giá đã giảm trong W ngày' : 'BUY: giá không giảm đủ'}</dd>
        </div>
        <div>
          <dt>Mua ngay</dt>
          <dd>{formatVND(buyCost)}</dd>
        </div>
        <div>
          <dt>Theo mô hình</dt>
          <dd>
            {formatVND(row.model_cost)}
            <small>{row.purchase_day ? `mua sau ${row.purchase_day} ngày` : 'mua ngay'}</small>
          </dd>
        </div>
        <div>
          <dt>Thấp nhất trong W ngày</dt>
          <dd>
            {formatVND(row.oracle_cost)}
            <small>chỉ biết khi nhìn lại</small>
          </dd>
        </div>
        <div>
          <dt>Chênh so với Mua ngay</dt>
          <dd className={row.savings > 0 ? 'pos' : row.savings < 0 ? 'neg' : ''}>{formatSignedVND(row.savings)}</dd>
        </div>
      </dl>
      {metric && (
        <p className="muted small">
          Chỉ số của cấu hình trên tập kiểm tra ({metric.test_n} mốc): ROC-AUC {formatRatio(metric.roc_auc)}, tiết kiệm{' '}
          {formatSignedVND(metric.savings_per_anchor_vnd)}/mốc, bị thiệt {formatPct(metric.harmed_pct, 2)} số mốc.
        </p>
      )}
    </div>
  );
}

/**
 * Bộ xem chuỗi giá + BUY/WAIT cho một series.
 * entry: { meta, daily (đã giải nén), runs (thô) }; dates: mảng ngày của file series.
 */
export default function SeriesExplorer({
  entry,
  dates,
  daily,
  summary,
  experiments,
  initialExperiment,
  intraday = [],
  departureAt,
  departureDate,
  initialW = 2,
  initialModel = 'xgboost',
  controlsExperiment = true,
  experiment: expProp,
  onExperimentChange,
  W: wProp,
  onWChange,
  model: modelProp,
  onModelChange,
}) {
  const [expState, setExpState] = useState(initialExperiment || experiments[0]);
  const [wState, setWState] = useState(initialW);
  const [modelState, setModelState] = useState(initialModel);
  const experiment = expProp ?? expState;
  const W = wProp ?? wState;
  const model = modelProp ?? modelState;
  const setExperiment = onExperimentChange ?? setExpState;
  const setW = onWChange ?? setWState;
  const setModel = onModelChange ?? setModelState;

  const availableW = WINDOWS.filter((w) => entry.runs[`${experiment}|${model}|${w}`]?.length);
  const run = useMemo(() => unpackRun(entry.runs[`${experiment}|${model}|${W}`], dates), [entry, experiment, model, W, dates]);
  const metric = v3Metric(summary, experiment, model, W);
  const [selectedDate, setSelectedDate] = useState(null);

  // mặc định chọn mốc gần ngày bay nhất có kết quả
  useEffect(() => {
    if (!run.length) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate((d) => (run.some((r) => r.date === d) ? d : run[run.length - 1].date));
  }, [run]);

  const row = run.find((r) => r.date === selectedDate) || null;
  const priceAt = row ? daily.find((d) => d.date === row.date)?.price : null;

  return (
    <div className="explorer">
      <div className="rs-controls">
        {controlsExperiment && experiments.length > 1 && (
          <div className="rs-control">
            <span className="rs-control-label">Thí nghiệm</span>
            <Segmented
              label="Chọn thí nghiệm"
              value={experiment}
              onChange={setExperiment}
              options={experiments.map((e) => ({ value: e, label: EXPERIMENTS[e].label, title: EXPERIMENTS[e].desc }))}
            />
          </div>
        )}
        <div className="rs-control">
          <span className="rs-control-label">Mô hình</span>
          <Segmented label="Chọn mô hình" value={model} onChange={setModel} options={Object.entries(MODELS).map(([value, label]) => ({ value, label }))} />
        </div>
        <WindowPicker value={W} onChange={setW} available={availableW} />
      </div>

      {run.length ? (
        <>
          <SeriesDecisionChart
            intraday={intraday}
            daily={daily}
            run={run}
            threshold={metric?.threshold}
            W={W}
            departureAt={departureAt}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <AnchorDecision row={row} metric={metric} W={W} departureDate={departureDate} price={priceAt} />
        </>
      ) : (
        <p className="notice">
          Không có kết quả {MODELS[model]} với W = {W} cho chuỗi này: chuỗi không đủ {W} ngày quan sát sau mốc đầu tiên để gắn nhãn.
        </p>
      )}
    </div>
  );
}
