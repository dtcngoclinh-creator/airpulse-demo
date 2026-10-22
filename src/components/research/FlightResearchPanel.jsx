import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Info } from 'lucide-react';
import SeriesExplorer from './SeriesExplorer.jsx';
import { EXPERIMENTS, getFlightResearch } from '../../services/researchData.js';

/** Kết quả BUY/WAIT V3 tính sẵn cho chuyến đang xem (không suy luận trực tiếp). */
export default function FlightResearchPanel({ flight }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    getFlightResearch(flight)
      .then((r) => !cancelled && setState(r))
      .catch((e) => !cancelled && setState({ status: 'ERROR', error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [flight]);

  const intraday = useMemo(
    () =>
      (flight.price_history || [])
        .map((p) => ({ t: Date.parse(p.observed_at), price: Number(p.price_vnd) }))
        .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.price))
        .sort((a, b) => a.t - b.t),
    [flight],
  );
  const departureAt = flight.departure_at ? `${flight.departure_at.replace(' ', 'T')}:00+07:00` : null;

  return (
    <section className="card research-panel" aria-labelledby="rp-title">
      <div className="rp-head">
        <div>
          <h2 id="rp-title">
            <FlaskConical size={20} aria-hidden="true" /> BUY/WAIT theo nghiên cứu V3
          </h2>
          <p className="muted">
            Xác suất nên chờ và kết quả backtest đã tính sẵn cho đúng chuyến này. Bạn chọn số ngày có thể chờ (W) để xem kết quả tương ứng.
          </p>
        </div>
        <span className="precomputed-pill">Kết quả tính sẵn</span>
      </div>

      {state.status === 'loading' && (
        <div className="skeleton-card">
          <div className="sk sk-line w40" />
          <div className="sk sk-line w70" />
        </div>
      )}
      {state.status === 'ERROR' && <p className="notice">Không đọc được dữ liệu nghiên cứu V3: {state.error}</p>}
      {state.status === 'NO_SERIES' && (
        <p className="notice">
          Chuyến này không có trong kết quả V3 (khóa ghép {state.sid}). Website không tự tạo dự đoán cho chuyến không có kết quả.
        </p>
      )}
      {state.status === 'OK' && (
        <>
          {!state.experiments.includes('real_pilot') && (
            <p className="rp-scope">
              <Info size={16} aria-hidden="true" />
              <span>
                Chuyến này không thuộc 47 chuyến của tập kiểm tra <em>Real pilot</em>, nên chỉ có kết quả của thí nghiệm{' '}
                <strong>{EXPERIMENTS.synthetic_to_real.label}</strong> (mô hình học trên dữ liệu tổng hợp).{' '}
                <Link to="/research/vietnam?exp=real_pilot" className="text-link">
                  Xem 47 chuyến có kết quả Real pilot
                </Link>
              </span>
            </p>
          )}
          <SeriesExplorer
            key={state.sid}
            entry={state.entry}
            dates={state.dates}
            daily={state.daily}
            summary={state.summary}
            experiments={state.experiments}
            initialExperiment={state.defaultExperiment}
            intraday={intraday}
            departureAt={departureAt}
            departureDate={flight.date}
          />
          <p className="muted small rp-foot">
            Mô hình trả về xác suất giá giảm trong W ngày tới (p_wait), không trả về giá dự báo. Giá trên biểu đồ là giá quan sát thật; vòng tròn
            “mua sau” là kết quả backtest trên giá thật đã xảy ra. Website chưa có file mô hình đã huấn luyện nên không chạy dự đoán cho chuyến mới.{' '}
            <Link to="/research" className="text-link">
              Tìm hiểu thêm
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
