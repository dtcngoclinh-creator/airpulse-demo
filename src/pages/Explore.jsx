import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, Info } from 'lucide-react';
import DestinationCard from '../components/explore/DestinationCard.jsx';
import SmartImage from '../components/common/SmartImage.jsx';
import { EmptyState } from '../components/common/States.jsx';
import { DESTINATIONS, CATEGORIES, TRIP_IDEAS, destinationBySlug } from '../data/destinations.js';
import { IMAGES } from '../data/images.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export default function Explore() {
  useDocumentTitle('Khám phá điểm đến');
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || params.get('type') || 'all'; // "type" giữ tương thích link V3
  const q = params.get('q') || '';

  const update = (patch) => {
    const next = new URLSearchParams(params);
    next.delete('type');
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const needle = strip(q.trim());
    return DESTINATIONS.filter(
      (d) =>
        (cat === 'all' || d.categories.includes(cat)) &&
        (!needle || strip(`${d.name} ${d.region} ${d.highlights.join(' ')}`).includes(needle)),
    );
  }, [cat, q]);

  return (
    <div className="explore">
      <section className="explore-hero">
        <SmartImage className="explore-hero-img" src={IMAGES.halong} alt="Ảnh minh họa phong cảnh Việt Nam" eager label="Khám phá Việt Nam" />
        <div className="banner-veil" />
        <div className="container explore-hero-copy">
          <h1>Đi đâu để có thêm một câu chuyện hay?</h1>
          <p>Chọn điều bạn thích, xem nên đi mùa nào, rồi tìm chuyến bay tới sân bay gần nhất.</p>
          <label className="explore-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Tìm điểm đến</span>
            <input value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Tìm Đà Lạt, biển, phố cổ…" />
            {q && (
              <button type="button" onClick={() => update({ q: '' })} aria-label="Xóa tìm kiếm">
                <X size={16} />
              </button>
            )}
          </label>
        </div>
      </section>

      <div className="container section-tight">
        <div className="pill-tabs" role="tablist" aria-label="Danh mục du lịch">
          <button role="tab" aria-selected={cat === 'all'} className={cat === 'all' ? 'on' : ''} onClick={() => update({ cat: '' })}>
            Tất cả
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.key} role="tab" aria-selected={cat === c.key} className={cat === c.key ? 'on' : ''} onClick={() => update({ cat: c.key })}>
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>

        {list.length ? (
          <div className="grid-3 explore-grid">
            {list.map((d) => (
              <DestinationCard key={d.slug} dest={d} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Không tìm thấy điểm đến phù hợp"
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setParams({}, { replace: true })}>
                Xem tất cả điểm đến
              </button>
            }
          >
            <p>Thử từ khóa ngắn hơn như “biển” hoặc tên thành phố.</p>
          </EmptyState>
        )}

        <section id="hanh-trinh" className="section">
          <div className="section-head">
            <div>
              <h2>Hành trình gợi ý</h2>
              <p>Lịch trình gọn theo từng ngày. Bấm vào để xem chi tiết và chuyến bay phù hợp.</p>
            </div>
          </div>
          <div className="trip-row">
            {TRIP_IDEAS.map((t) => {
              const d = destinationBySlug(t.slug);
              return (
                <Link key={t.title} to={`/explore/${t.slug}`} className="trip-card">
                  <SmartImage src={d.image} alt={`Ảnh minh họa ${d.name}`} label={d.name} />
                  <div>
                    <small>{t.length}</small>
                    <h3>{t.title}</h3>
                    <p>{t.blurb}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <p className="disclaimer">
          <Info size={16} aria-hidden="true" />
          Ảnh mang tính minh họa. Giá “từ” lấy từ chuyến rẻ nhất trong dữ liệu quan sát tới sân bay gần điểm đến, không phải giá bán hiện tại.
        </p>
      </div>
    </div>
  );
}
