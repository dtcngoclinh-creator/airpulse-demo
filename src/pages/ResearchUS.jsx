import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, LineChart } from 'lucide-react';
import { LoadingBlock, ErrorState } from '../components/common/States.jsx';
import { Availability, ByWindowChart, ConfusionMatrix, CostBars, Stat, WindowPicker } from '../components/research/ResearchUI.jsx';
import { MODELS, WINDOWS, backtestVerdict, formatPct, formatRatio, formatUSD, loadV2, v2ModelKey } from '../services/researchData.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const clampW = (v) => (WINDOWS.includes(Number(v)) ? Number(v) : 2);

function ModelColumn({ r }) {
  const [[tn, fp], [fn, tp]] = r.confusion_matrix;
  const verdict = backtestVerdict(r, 'savings_per_passenger_usd');
  return (
    <div className="model-col">
      <div className="model-col-head">
        <h3>{r.model}</h3>
        <span className={`verdict-chip v-${verdict.level}`}>{verdict.label}</span>
      </div>
      <dl className="rs-stats">
        <Stat label="ROC-AUC" value={formatRatio(r.roc_auc)} tone={r.roc_auc > 0.5 ? 'good' : 'bad'} />
        <Stat label="Balanced accuracy" value={formatRatio(r.balanced_accuracy)} />
        <Stat label="Ngưỡng quyết định" value={r.threshold} sub={r.policy} />
        <Stat label="F1 WAIT" value={formatRatio(r.f1_wait)} />
        <Stat label="Dự đoán WAIT" value={formatPct(r.pred_wait_pct, 2)} sub={`thực tế ${formatPct(r.true_wait_pct, 2)}`} />
        <Stat label="Accuracy" value={formatRatio(r.accuracy)} />
        <Stat
          label="Tiết kiệm / hành khách"
          value={formatUSD(r.savings_per_passenger_usd, 4)}
          tone={r.savings_per_passenger_usd > 0 ? 'good' : 'bad'}
          sub={`tổng ${formatUSD(r.savings_total_usd, 2)}`}
        />
        <Stat label="Đạt so với oracle" value={formatPct(r.oracle_capture_pct)} sub={`oracle tối đa ${formatUSD(r.oracle_possible_savings_total_usd, 0)}`} />
        <Stat label="Bị thiệt (harmed)" value={formatPct(r.harmed_pct, 2)} sub={`TB ${formatUSD(r.avg_harm_if_harmed_usd, 2)} khi thiệt, tối đa ${formatUSD(r.max_harm_usd, 0)}`} />
        <Stat label="WAIT ở mốc đầu" value={formatPct(r.wait_at_start_pct, 2)} />
        <Stat label="Ngày mua trung bình" value={formatRatio(r.average_purchase_day, 3)} sub="sau mốc đầu" />
        <Stat label="Mẫu kiểm tra chung" value={Number(r.common_test_n).toLocaleString('vi-VN')} sub={`validation ${Number(r.common_validation_n).toLocaleString('vi-VN')}`} />
      </dl>
      <ConfusionMatrix tn={tn} fp={fp} fn={fn} tp={tp} />
      <CostBars
        format={(v) => formatUSD(v, 3)}
        caption="Giá vé trung bình mỗi hành khách trên tập kiểm tra chung (USD)."
        rows={[
          { label: 'Luôn mua ngay', value: r.always_buy_mean },
          { label: 'Theo AirPulse', value: r.airpulse_mean, tone: 'model' },
          { label: 'Luôn chờ hết W', value: r.always_wait_mean },
          { label: 'Oracle', value: r.oracle_mean, tone: 'oracle' },
        ]}
      />
    </div>
  );
}

export default function ResearchUS() {
  useDocumentTitle('US Benchmark (V2)');
  const [params, setParams] = useSearchParams();
  const W = clampW(params.get('W'));
  const setW = (v) => setParams({ W: String(v) }, { replace: true });
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    loadV2()
      .then((data) => setState({ status: 'ready', data }))
      .catch((e) => setState({ status: 'error', error: e.message }));
  }, []);

  if (state.status === 'loading') return <div className="container subpage"><LoadingBlock label="Đang đọc kết quả V2…" rows={2} /></div>;
  if (state.status === 'error') return <div className="container subpage"><ErrorState message={state.error} onRetry={() => window.location.reload()} /></div>;

  const { data } = state;
  const rows = data.results.filter((r) => r.W === W);
  const byW = (key) =>
    Object.keys(MODELS).map((m, i) => ({
      key: m,
      label: MODELS[m],
      tone: i ? 'b' : 'a',
      values: data.results.filter((r) => v2ModelKey(r.model) === m).map((r) => ({ W: r.W, v: Number(r[key]) })),
    }));
  const a = data.data_audit;
  const fmtInt = (v) => Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 0 });

  return (
    <div className="research">
      <section className="rs-hero rs-hero-us">
        <div className="container">
          <nav className="crumbs" aria-label="Đường dẫn">
            <Link to="/research">Nghiên cứu</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">US Benchmark (V2)</span>
          </nav>
          <h1>US Benchmark · V2</h1>
          <p>
            Bộ dữ liệu giá vé Mỹ dùng làm chuẩn so sánh trước khi áp dụng cho Việt Nam. Logistic Regression và XGBoost được backtest công bằng trên cùng{' '}
            {fmtInt(data.results[0]?.common_test_n)} mốc kiểm tra cho mọi W. Không phải dữ liệu hay dự đoán cho chuyến bay Việt Nam.
          </p>
          <dl className="rs-hero-facts">
            <div>
              <dt>Bản ghi giá</dt>
              <dd>{fmtInt(a.rows)}</dd>
            </div>
            <div>
              <dt>Chuỗi giá</dt>
              <dd>{fmtInt(a.series)}</dd>
            </div>
            <div>
              <dt>Quan sát mỗi chuỗi</dt>
              <dd>
                TB {formatRatio(a.mean_observations_per_series, 2)}, trung vị {a.median_observations_per_series}
              </dd>
            </div>
            <div>
              <dt>Tuyến</dt>
              <dd>{a.route_count}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="container rs-body">
        <div className="rs-sticky">
          <WindowPicker value={W} onChange={setW} />
        </div>

        <section className="rs-section" aria-labelledby="us-w">
          <h2 id="us-w">Kết quả với W = {W} ngày</h2>
          <div className="model-cols">
            {rows.map((r) => (
              <ModelColumn key={r.model} r={r} />
            ))}
          </div>
        </section>

        <section className="rs-section" aria-labelledby="us-trend">
          <h2 id="us-trend">Chỉ số theo cửa sổ chờ</h2>
          <p className="muted">Bấm vào một điểm để chuyển W.</p>
          <div className="rs-chart-grid">
            <ByWindowChart title="ROC-AUC" series={byW('roc_auc')} format={(v) => formatRatio(v, 2)} selectedW={W} onSelectW={setW} reference={0.5} referenceLabel="0,5 = ngẫu nhiên" />
            <ByWindowChart title="Tiết kiệm mỗi hành khách (USD)" series={byW('savings_per_passenger_usd')} format={(v) => formatUSD(v, 3)} axisFormat={(v) => formatUSD(v, 2)} selectedW={W} onSelectW={setW} reference={0} referenceLabel="0 = bằng Mua ngay" />
            <ByWindowChart title="Tỷ lệ bị thiệt (%)" series={byW('harmed_pct')} format={(v) => formatPct(v, 2)} selectedW={W} onSelectW={setW} />
            <ByWindowChart title="Đạt so với oracle (%)" series={byW('oracle_capture_pct')} format={(v) => formatPct(v, 0)} selectedW={W} onSelectW={setW} reference={0} />
          </div>
        </section>

        <section className="rs-section card" aria-labelledby="us-series">
          <h2 id="us-series">
            <LineChart size={20} aria-hidden="true" /> Chuỗi giá theo thời gian
          </h2>
          <p className="lead-sm">
            Gói kết quả V2 chỉ có chỉ số tổng hợp, không có giá theo từng ngày tìm kiếm hay dự đoán theo từng mốc. Vì vậy trang này không vẽ chuỗi giá Mỹ,
            và không tạo số liệu thay thế.
          </p>
          <p className="muted small">
            Theo kiểm tra dữ liệu của V2: {formatPct(a.pct_series_constant_price)} chuỗi có giá không đổi, chỉ {formatPct(a.pct_rows_have_7_consecutive_future_days)} số dòng có đủ 7
            ngày liên tiếp phía sau, và {formatPct(a.pct_missing_price_change_3d)} thiếu biến thay đổi giá 3 ngày.
          </p>
          <Availability
            items={[
              { state: 'yes', label: 'Chỉ số tổng hợp theo mô hình và W', detail: 'results_V2_fair.csv/.json, split_summary_V2.csv, data_audit.csv.' },
              { state: 'no', label: 'Chuỗi giá đã làm sạch', detail: 'Cần một file dạng series_id, search_date, flight_date, origin, destination, airline, price_usd (hoặc file mẫu vài trăm chuỗi thuộc tập kiểm tra).' },
              { state: 'no', label: 'Dự đoán theo từng mốc', detail: 'Cần predictions_V2.csv: series_id, search_date, W, model, p_wait, true_wait.' },
              { state: 'no', label: 'Backtest theo từng mốc', detail: 'Cần backtest_V2_{model}_W{1..7}.csv: series_id, search_date, buy_cost, model_cost, oracle_cost, purchase_day, savings, harm.' },
              { state: 'no', label: 'Mô hình đã huấn luyện và pipeline đặc trưng', detail: 'Không có trong gói V2.' },
            ]}
          />
        </section>

        <section className="rs-section" aria-labelledby="us-split">
          <h2 id="us-split">Chia tập dữ liệu</h2>
          <p className="muted">
            Số mẫu train/validation/test theo W trước khi lấy tập kiểm tra chung. Chỉ số ở trên tính trên {fmtInt(data.results[0]?.common_test_n)} mốc chung để mọi W so sánh công bằng.
          </p>
          <div className="table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Mô hình</th><th>W</th><th>Train</th><th>Validation</th><th>Test</th><th>Tỷ lệ WAIT (train)</th>
                </tr>
              </thead>
              <tbody>
                {data.split_summary.map((r) => (
                  <tr key={`${r.model}${r.W}`} className={r.W === W ? 'is-on' : ''}>
                    <td>{r.model}</td>
                    <td>{r.W}</td>
                    <td>{fmtInt(r.train_n)}</td>
                    <td>{fmtInt(r.validation_n)}</td>
                    <td>{fmtInt(r.test_n)}</td>
                    <td>{formatPct(r.train_wait_pct, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <details className="rs-section rs-full">
          <summary>Bảng đầy đủ results_V2_fair.csv (14 dòng)</summary>
          <div className="table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Mô hình</th><th>W</th><th>Ngưỡng</th><th>ROC-AUC</th><th>Bal. acc</th><th>F1 WAIT</th><th>Tiết kiệm/khách</th><th>Tổng tiết kiệm</th><th>Oracle %</th><th>Harmed %</th><th>Max harm</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={`${r.model}${r.W}`} className={r.W === W ? 'is-on' : ''}>
                    <td>{r.model}</td>
                    <td>{r.W}</td>
                    <td>{r.threshold}</td>
                    <td>{formatRatio(r.roc_auc)}</td>
                    <td>{formatRatio(r.balanced_accuracy)}</td>
                    <td>{formatRatio(r.f1_wait)}</td>
                    <td className={r.savings_per_passenger_usd > 0 ? 'pos' : 'neg'}>{formatUSD(r.savings_per_passenger_usd, 4)}</td>
                    <td>{formatUSD(r.savings_total_usd, 2)}</td>
                    <td>{formatPct(r.oracle_capture_pct)}</td>
                    <td>{formatPct(r.harmed_pct, 2)}</td>
                    <td>{formatUSD(r.max_harm_usd, 2)}</td>
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
