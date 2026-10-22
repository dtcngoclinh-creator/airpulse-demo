import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe2, MapPinned, PlayCircle, Archive, CircleSlash } from 'lucide-react';
import { LoadingBlock } from '../components/common/States.jsx';
import { MODEL_API_CONFIGURED } from '../services/modelApi.js';
import { MODELS, backtestVerdict, formatRatio, formatSignedVND, formatUSD, loadV2, loadV3Summary, v2ModelKey } from '../services/researchData.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

function bestBy(rows, key) {
  return rows.reduce((best, r) => (best === null || Number(r[key]) > Number(best[key]) ? r : best), null);
}

function positiveWindows(rows, savingsKey) {
  return rows.filter((r) => backtestVerdict(r, savingsKey).level === 'positive').map((r) => r.W).sort((a, b) => a - b);
}

const wList = (ws) => (ws.length ? ws.map((w) => `W${w}`).join(', ') : 'không có W nào');

export default function Research() {
  useDocumentTitle('Nghiên cứu AirPulse');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([loadV2(), loadV3Summary()])
      .then(([v2, v3]) => setData({ v2, v3 }))
      .catch((e) => setError(e.message));
  }, []);

  let v2Facts = null;
  let v3Facts = null;
  if (data) {
    v2Facts = Object.keys(MODELS).map((m) => {
      const rows = data.v2.results.filter((r) => v2ModelKey(r.model) === m);
      return { m, best: bestBy(rows, 'savings_per_passenger_usd'), auc: bestBy(rows, 'roc_auc'), pos: positiveWindows(rows, 'savings_per_passenger_usd') };
    });
    v3Facts = Object.keys(MODELS).map((m) => {
      const rows = data.v3.experiments.filter((r) => r.experiment === 'real_pilot' && r.model === m);
      return { m, best: bestBy(rows, 'savings_per_anchor_vnd'), auc: bestBy(rows, 'roc_auc'), pos: positiveWindows(rows) };
    });
  }

  return (
    <div className="research">
      <section className="rs-hero">
        <div className="container">
          <h1>Nghiên cứu đằng sau quyết định BUY/WAIT</h1>
          <p>
            Hai bộ dữ liệu, cùng một câu hỏi: nếu có thể chờ W ngày, nên mua vé ngay hay chờ giá giảm? Mọi con số ở đây đọc trực tiếp từ file kết quả của
            nhóm nghiên cứu.
          </p>
        </div>
      </section>

      <div className="container rs-body">
        {error && <p className="notice">Không đọc được kết quả nghiên cứu: {error}</p>}
        {!data && !error && <LoadingBlock label="Đang đọc kết quả nghiên cứu…" rows={1} />}

        {data && (
          <div className="rs-datasets">
            <Link to="/research/us" className="ds-card ds-us">
              <span className="ds-icon">
                <Globe2 size={22} aria-hidden="true" />
              </span>
              <h2>US Benchmark · V2</h2>
              <p>
                {Number(data.v2.data_audit.series).toLocaleString('vi-VN')} chuỗi giá Mỹ, {data.v2.data_audit.route_count} tuyến. Chuẩn so sánh phương pháp.
              </p>
              <ul>
                {v2Facts.map((f) => (
                  <li key={f.m}>
                    <strong>{MODELS[f.m]}</strong>: ROC-AUC cao nhất {formatRatio(f.auc.roc_auc)} (W{f.auc.W}); tiết kiệm tốt nhất {formatUSD(f.best.savings_per_passenger_usd, 3)}/khách (W{f.best.W}); có lợi ở {wList(f.pos)}.
                  </li>
                ))}
              </ul>
              <span className="text-link">Mở dashboard V2</span>
            </Link>
            <Link to="/research/vietnam" className="ds-card ds-vn">
              <span className="ds-icon">
                <MapPinned size={22} aria-hidden="true" />
              </span>
              <h2>Vietnam Pilot · V3</h2>
              <p>
                {data.v3.data_audit[0]?.series} chuyến nội địa thật, {data.v3.data_audit[1]?.series} chuỗi tổng hợp, 3 thí nghiệm. Kết quả theo từng chuyến và từng ngày.
              </p>
              <ul>
                {v3Facts.map((f) => (
                  <li key={f.m}>
                    <strong>{MODELS[f.m]}</strong> (real pilot): ROC-AUC cao nhất {formatRatio(f.auc.roc_auc)} (W{f.auc.W}); tiết kiệm tốt nhất {formatSignedVND(f.best.savings_per_anchor_vnd)}/mốc (W{f.best.W}); có lợi ở {wList(f.pos)}.
                  </li>
                ))}
              </ul>
              <span className="text-link">Mở dashboard V3</span>
            </Link>
          </div>
        )}

        <section className="rs-section" aria-labelledby="rs-status">
          <h2 id="rs-status">Website đang làm gì thật, cái gì là kết quả tính sẵn</h2>
          <div className="status-cols">
            <div className="status-col st-live">
              <h3>
                <PlayCircle size={18} aria-hidden="true" /> Chạy thật trên website
              </h3>
              <ul>
                <li>Tìm, lọc, so sánh, lưu chuyến bay từ 232 chuyến trong flights.json.</li>
                <li>Biểu đồ giá quan sát theo giờ và theo ngày của từng chuyến.</li>
                <li>Ghép chuyến bay với kết quả V3 theo khóa series_id và kiểm tra khớp giá.</li>
                <li>Chọn mô hình, thí nghiệm và W = 1–7 để lọc kết quả tương ứng.</li>
              </ul>
            </div>
            <div className="status-col st-pre">
              <h3>
                <Archive size={18} aria-hidden="true" /> Hiển thị kết quả tính sẵn
              </h3>
              <ul>
                <li>p_wait, ngưỡng, BUY/WAIT và backtest theo từng mốc (V3, predictions.csv và backtest_*.csv).</li>
                <li>ROC-AUC, F1, ma trận nhầm lẫn, tiết kiệm, harmed rate (V2 và V3).</li>
                <li>Fair Price và Price Trend trên trang chuyến bay: baseline thực nghiệm gắn sẵn trong flights.json, tách biệt với V3.</li>
              </ul>
            </div>
            <div className="status-col st-missing">
              <h3>
                <CircleSlash size={18} aria-hidden="true" /> Chưa có
              </h3>
              <ul>
                <li>File mô hình đã huấn luyện (Logistic Regression, XGBoost) và pipeline tạo đặc trưng, nên không dự đoán cho chuyến mới.</li>
                <li>Giá dự báo: mô hình BUY/WAIT không dự báo giá.</li>
                <li>Chuỗi giá, dự đoán và backtest theo từng mốc của V2.</li>
                <li>API mô hình: {MODEL_API_CONFIGURED ? 'đã cấu hình biến môi trường' : 'chưa cấu hình VITE_AIRPULSE_MODEL_API'}.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
