import { Gauge, TrendingUp, TrendingDown, MoveRight, ShieldQuestion, RefreshCw, Code2, Loader2 } from 'lucide-react';
import useFlightInsight from '../../hooks/useFlightInsight.js';
import { MODEL_ENV_NAME } from '../../services/modelApi.js';
import { formatVND, formatObservedAt, pctDiff } from '../../utils/format.js';

function Slot({ icon: Icon, title, children, muted }) {
  return (
    <div className={`insight-slot ${muted ? 'muted-slot' : ''}`}>
      <div className="slot-head">
        <Icon size={18} aria-hidden="true" />
        <h4>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Missing({ text = 'Mô hình chưa trả về phần này.' }) {
  return <p className="slot-missing">{text}</p>;
}

function FairPrice({ fp, price }) {
  if (!fp) return <Missing />;
  const diff = pctDiff(price, fp.value_vnd);
  const hasRange = Number.isFinite(fp.low_vnd) && Number.isFinite(fp.high_vnd) && fp.high_vnd > fp.low_vnd;
  let verdict = null;
  if (Number.isFinite(price)) {
    if (hasRange) verdict = price < fp.low_vnd ? 'below' : price > fp.high_vnd ? 'above' : 'fair';
    else if (diff !== null) verdict = diff < -3 ? 'below' : diff > 3 ? 'above' : 'fair';
  }
  const labels = { below: 'Thấp hơn mức hợp lý', fair: 'Trong vùng hợp lý', above: 'Cao hơn mức hợp lý' };
  return (
    <>
      <strong className="slot-value">{formatVND(fp.value_vnd)}</strong>
      {hasRange && (
        <p className="slot-sub">
          Vùng hợp lý {formatVND(fp.low_vnd)} – {formatVND(fp.high_vnd)}
        </p>
      )}
      {verdict && <span className={`verdict verdict-${verdict}`}>{labels[verdict]}</span>}
    </>
  );
}

function Trend({ tr }) {
  if (!tr) return <Missing />;
  const map = {
    up: { Icon: TrendingUp, label: 'Có xu hướng tăng' },
    down: { Icon: TrendingDown, label: 'Có xu hướng giảm' },
    stable: { Icon: MoveRight, label: 'Tương đối ổn định' },
  };
  const { Icon, label } = map[tr.direction];
  return (
    <>
      <strong className={`slot-value trend-${tr.direction}`}>
        <Icon size={20} aria-hidden="true" /> {label}
      </strong>
      {(Number.isFinite(tr.expected_change_pct) || Number.isFinite(tr.horizon_days)) && (
        <p className="slot-sub">
          {Number.isFinite(tr.expected_change_pct) && `Thay đổi dự kiến ${tr.expected_change_pct > 0 ? '+' : ''}${tr.expected_change_pct.toFixed(1)}%`}
          {Number.isFinite(tr.horizon_days) && ` trong ${tr.horizon_days} ngày tới`}
        </p>
      )}
    </>
  );
}

/** Khu vực AirPulse Intelligence: hiển thị đúng trạng thái thật của mô hình. */
export default function InsightPanel({ flight }) {
  const { status, data, source, error, retry } = useFlightInsight(flight);
  const rec = data?.recommendation;

  return (
    <section className="insight" aria-labelledby="insight-title">
      <div className="insight-head">
        <div>
          <h2 id="insight-title">AirPulse Intelligence</h2>
          <p>Giá hợp lý, xu hướng giá và khuyến nghị nên mua hay chờ.</p>
        </div>
        <span className={`status-pill status-${status}`}>
          {status === 'loading' && (
            <>
              <Loader2 size={14} className="spin" /> Đang kiểm tra mô hình
            </>
          )}
          {status === 'ready' && 'Đã có kết quả mô hình'}
          {status === 'not_configured' && 'Chưa kết nối mô hình'}
          {status === 'empty' && 'Mô hình chưa có kết quả'}
          {status === 'error' && 'Lỗi kết nối mô hình'}
        </span>
      </div>

      {status === 'loading' && (
        <div className="insight-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="insight-slot">
              <div className="sk sk-line w40" />
              <div className="sk sk-line w70" />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="insight-message error">
          <p>
            Không lấy được kết quả từ API mô hình ({error}). AirPulse không hiển thị khuyến nghị khi chưa có kết quả hợp lệ.
          </p>
          <button className="btn btn-quiet btn-sm" onClick={retry}>
            <RefreshCw size={15} /> Thử lại
          </button>
        </div>
      )}

      {(status === 'not_configured' || status === 'empty') && (
        <>
          <div className="insight-grid">
            <Slot icon={Gauge} title="Fair Price" muted>
              <p className="slot-missing">Sẽ cho biết mức giá hợp lý và giá đang xem cao hay thấp so với mức đó.</p>
            </Slot>
            <Slot icon={TrendingUp} title="Price Trend" muted>
              <p className="slot-missing">Sẽ cho biết giá có xu hướng tăng, giảm hay đi ngang trong vài ngày tới.</p>
            </Slot>
            <Slot icon={ShieldQuestion} title="BUY / WAIT" muted>
              <p className="slot-missing">Sẽ khuyến nghị nên mua ngay hay chờ thêm, kèm độ tin cậy và lý do.</p>
            </Slot>
          </div>
          <div className="insight-message">
            <p>
              {status === 'empty'
                ? 'Mô hình đã phản hồi nhưng chưa có kết quả cho chuyến này.'
                : 'Mô hình đang được nhóm nghiên cứu phát triển.'}{' '}
              AirPulse chỉ đưa ra khuyến nghị khi có kết quả mô hình kèm độ tin cậy, không tự ước đoán.
            </p>
            <details className="dev-note">
              <summary>
                <Code2 size={14} /> Dành cho nhóm phát triển
              </summary>
              <p>
                Gắn trường <code>insight</code> vào từng chuyến trong <code>flights.json</code>, hoặc đặt biến môi trường{' '}
                <code>{MODEL_ENV_NAME}</code> trỏ tới API có endpoint <code>POST /insight</code>. Định dạng chi tiết nằm trong{' '}
                <code>src/services/modelApi.js</code> và README.
              </p>
            </details>
          </div>
        </>
      )}

      {status === 'ready' && data && (
        <>
          <div className="insight-grid">
            <Slot icon={Gauge} title="Fair Price">
              <FairPrice fp={data.fair_price} price={flight.price_vnd} />
            </Slot>
            <Slot icon={TrendingUp} title="Price Trend">
              <Trend tr={data.trend} />
            </Slot>
            <Slot icon={ShieldQuestion} title="Độ tin cậy">
              {rec && Number.isFinite(rec.confidence) ? (
                <>
                  <strong className="slot-value">{Math.round(rec.confidence * 100)}%</strong>
                  <div className="confidence-bar" aria-hidden="true">
                    <span style={{ width: `${rec.confidence * 100}%` }} />
                  </div>
                  <p className="slot-sub">{rec.confidence < 0.6 ? 'Độ tin cậy thấp, nên tham khảo thận trọng.' : 'Mức tin cậy do mô hình trả về.'}</p>
                </>
              ) : (
                <Missing />
              )}
            </Slot>
          </div>

          {rec ? (
            <div className={`decision decision-${rec.action.toLowerCase()}`}>
              <div className="decision-badge">
                <small>Khuyến nghị</small>
                <strong>{rec.action === 'BUY' ? 'MUA' : 'CHỜ'}</strong>
                <span>{rec.action}</span>
              </div>
              <div className="decision-body">
                <h4>{rec.action === 'BUY' ? 'Nên cân nhắc mua sớm' : 'Có thể chờ thêm'}</h4>
                {rec.explanation.length ? (
                  <ul>
                    {rec.explanation.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="slot-missing">Mô hình chưa kèm giải thích.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="insight-message">
              <p>Mô hình chưa trả về khuyến nghị BUY/WAIT cho chuyến này.</p>
            </div>
          )}
          <p className="insight-meta muted small">
            Nguồn: {source === 'api' ? 'API mô hình' : 'kết quả gắn trong flights.json'}
            {data.model_version && `, phiên bản ${data.model_version}`}
            {data.generated_at && `, tạo lúc ${formatObservedAt(data.generated_at)}`}. Kết quả chỉ để tham khảo, không phải cam kết giá.
          </p>
        </>
      )}
    </section>
  );
}
