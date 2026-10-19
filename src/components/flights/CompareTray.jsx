import { Link, useLocation } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { useUserData, COMPARE_LIMIT } from '../../context/UserDataContext.jsx';
import { useFlightData } from '../../context/FlightDataContext.jsx';
import { formatVNDShort } from '../../utils/format.js';

/** Khay so sánh nổi ở cuối màn hình khi người dùng chọn chuyến để so sánh. */
export default function CompareTray() {
  const { compare, toggleCompare, clearCompare } = useUserData();
  const { byId } = useFlightData();
  const { pathname } = useLocation();
  const items = compare.map((id) => byId.get(id)).filter(Boolean);
  if (!items.length || pathname === '/compare') return null;

  return (
    <aside className="compare-tray" aria-label="Chuyến bay đang so sánh">
      <div className="tray-inner">
        <span className="tray-title">
          <Scale size={18} /> So sánh {items.length}/{COMPARE_LIMIT}
        </span>
        <ul className="tray-items">
          {items.map((f) => (
            <li key={f.id}>
              <span>
                <strong>{f.flight_number}</strong> {f.depTime} · {formatVNDShort(f.price_vnd)}
              </span>
              <button type="button" onClick={() => toggleCompare(f)} aria-label={`Bỏ ${f.flight_number} khỏi so sánh`}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
        <div className="tray-actions">
          <button type="button" className="link-btn light" onClick={clearCompare}>
            Xóa hết
          </button>
          {items.length >= 2 ? (
            <Link className="btn btn-sun btn-sm" to="/compare">
              So sánh ngay
            </Link>
          ) : (
            <span className="tray-note">Chọn thêm 1 chuyến</span>
          )}
        </div>
      </div>
    </aside>
  );
}
