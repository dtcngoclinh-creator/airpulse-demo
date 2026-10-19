import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Scale, ExternalLink, X, Link2 } from 'lucide-react';
import AirlineBadge from '../components/flights/AirlineBadge.jsx';
import { LoadingBlock, ErrorState, EmptyState } from '../components/common/States.jsx';
import { useFlightData } from '../context/FlightDataContext.jsx';
import { useUserData } from '../context/UserDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { priceContext } from '../data/flights.js';
import { findAirline } from '../data/airlines.js';
import { cityOf } from '../data/airports.js';
import { formatDateVN, formatDuration, formatObservedAt, formatVND } from '../utils/format.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function Compare() {
  useDocumentTitle('So sánh chuyến bay');
  const [params, setParams] = useSearchParams();
  const { status, byId, flights, error, retry } = useFlightData();
  const { compare, toggleCompare, clearCompare, setCompareIds } = useUserData();
  const notify = useToast();

  // Liên kết chia sẻ ?ids=a,b,c sẽ nạp vào danh sách so sánh
  useEffect(() => {
    const ids = params.get('ids');
    if (ids && status === 'ready') {
      setCompareIds(ids.split(',').filter((x) => byId.has(x)));
      setParams({}, { replace: true });
    }
  }, [params, status, byId, setCompareIds, setParams]);

  const items = useMemo(() => compare.map((id) => byId.get(id)).filter(Boolean), [compare, byId]);
  const contexts = useMemo(() => new Map(items.map((f) => [f.id, priceContext(f, flights)])), [items, flights]);
  const prices = items.map((f) => f.price_vnd).filter(Number.isFinite);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const durations = items.map((f) => f.durationMin).filter(Number.isFinite);
  const minDur = durations.length ? Math.min(...durations) : null;

  const copyLink = async () => {
    const url = `${window.location.origin}/compare?ids=${items.map((f) => encodeURIComponent(f.id)).join(',')}`;
    try {
      await navigator.clipboard.writeText(url);
      notify('Đã sao chép liên kết so sánh');
    } catch {
      notify('Trình duyệt không cho sao chép tự động', 'info');
    }
  };

  const rows = [
    { label: 'Hãng', render: (f) => <AirlineBadge airline={f.airline} flightNumber={f.flight_number} size="sm" /> },
    { label: 'Hành trình', render: (f) => `${cityOf(f.origin)} đến ${cityOf(f.destination)}` },
    { label: 'Ngày bay', render: (f) => formatDateVN(f.date) },
    { label: 'Cất cánh', render: (f) => <strong>{f.depTime}</strong> },
    { label: 'Hạ cánh', render: (f) => <strong>{f.arrTime}</strong> },
    {
      label: 'Thời gian bay',
      render: (f) => (
        <span className={f.durationMin === minDur && items.length > 1 ? 'best' : ''}>{formatDuration(f.durationMin)}</span>
      ),
    },
    {
      label: 'Giá đã ghi nhận',
      render: (f) => (
        <span className={`cmp-price ${f.price_vnd === minPrice && items.length > 1 ? 'best' : ''}`}>{formatVND(f.price_vnd)}</span>
      ),
    },
    {
      label: 'Chênh với chuyến rẻ nhất',
      render: (f) =>
        Number.isFinite(f.price_vnd) && Number.isFinite(minPrice)
          ? f.price_vnd === minPrice
            ? 'Rẻ nhất trong nhóm'
            : `+${formatVND(f.price_vnd - minPrice)}`
          : '—',
    },
    {
      label: 'Vị trí giá trên tuyến',
      render: (f) => {
        const c = contexts.get(f.id);
        return c?.rank ? `Rẻ thứ ${c.rank}/${c.count} chuyến` : '—';
      },
    },
    { label: 'Ghi nhận lần cuối', render: (f) => formatObservedAt(f.last_observed_at) },
  ];

  return (
    <div className="container subpage">
      <header className="page-head">
        <h1>So sánh chuyến bay</h1>
        <p>Đặt tối đa ba chuyến cạnh nhau. Ô được tô màu là lựa chọn tốt nhất ở từng tiêu chí.</p>
      </header>

      {status === 'loading' && <LoadingBlock rows={1} />}
      {status === 'error' && <ErrorState message={error} onRetry={retry} />}
      {status === 'ready' && items.length === 0 && (
        <EmptyState
          icon={Scale}
          title="Chưa có chuyến nào để so sánh"
          action={
            <Link className="btn btn-primary btn-sm" to="/flights">
              Tìm chuyến bay
            </Link>
          }
        >
          <p>Bấm nút “So sánh” trên thẻ chuyến bay để thêm vào đây.</p>
        </EmptyState>
      )}

      {status === 'ready' && items.length > 0 && (
        <>
          <div className="row-gap compare-tools">
            <button className="btn btn-quiet btn-sm" onClick={copyLink}>
              <Link2 size={15} /> Sao chép liên kết so sánh
            </button>
            <button className="link-btn" onClick={clearCompare}>
              Xóa tất cả
            </button>
            {items.length < 3 && (
              <Link className="text-link" to="/flights">
                Thêm chuyến
              </Link>
            )}
          </div>
          <div className="table-scroll">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">Tiêu chí</th>
                  {items.map((f) => (
                    <th scope="col" key={f.id}>
                      <div className="cmp-head">
                        <span>
                          {f.flight_number} <small>{f.origin}–{f.destination}</small>
                        </span>
                        <button className="icon-btn" onClick={() => toggleCompare(f)} aria-label={`Bỏ ${f.flight_number}`}>
                          <X size={16} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    {items.map((f) => (
                      <td key={f.id}>{r.render(f)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Tiếp theo</th>
                  {items.map((f) => {
                    const partner = findAirline(f.airline, f.flight_number);
                    return (
                      <td key={f.id}>
                        <div className="cmp-actions">
                          <Link className="btn btn-quiet btn-sm" to={`/flights/${encodeURIComponent(f.id)}`}>
                            Xem phân tích
                          </Link>
                          {partner && (
                            <a className="btn btn-primary btn-sm" href={partner.url} target="_blank" rel="noopener noreferrer">
                              Đặt tại hãng <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
