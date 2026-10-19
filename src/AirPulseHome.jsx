import React, { useState } from 'react';
import './AirPulseHome.css';

const destinations = [
  { code: 'DAD', name: 'Đà Nẵng', tag: 'Biển & nghỉ dưỡng', description: 'Biển xanh, nắng vàng và những ngày thật chill.', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2e?w=1000&q=85', group: 'sea' },
  { code: 'PQC', name: 'Phú Quốc', tag: 'Biển đảo', description: 'Tạm gác deadline, đón hoàng hôn trên bãi biển.', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1000&q=85', group: 'sea' },
  { code: 'DLI', name: 'Đà Lạt', tag: 'Thiên nhiên & thư giãn', description: 'Cà phê nóng, sương sớm và những con dốc bình yên.', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1000&q=85', group: 'weekend' },
  { code: 'HAN', name: 'Hà Nội', tag: 'Văn hóa & ẩm thực', description: 'Đi qua phố cổ, thưởng thức những món ngon thân thuộc.', image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=1000&q=85', group: 'culture' },
  { code: 'SGN', name: 'TP. Hồ Chí Minh', tag: 'City break', description: 'Thành phố không ngủ và vô vàn trải nghiệm thú vị.', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&q=85', group: 'culture' },
  { code: 'HUI', name: 'Huế', tag: 'Di sản & lịch sử', description: 'Một nhịp sống chậm giữa kiến trúc và dấu ấn cố đô.', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&q=85', group: 'culture', inspirationOnly: true },
];

const airports = [
  { code: 'SGN', name: 'TP. Hồ Chí Minh' },
  { code: 'HAN', name: 'Hà Nội' },
  { code: 'DAD', name: 'Đà Nẵng' },
  { code: 'DLI', name: 'Đà Lạt' },
  { code: 'PQC', name: 'Phú Quốc' },
];

const topics = [
  { id: 'all', label: 'Dành cho bạn', emoji: '✦' },
  { id: 'sea', label: 'Biển xanh', emoji: '🌊' },
  { id: 'weekend', label: 'Trốn phố cuối tuần', emoji: '☕' },
  { id: 'culture', label: 'Văn hóa & ẩm thực', emoji: '📷' },
];

export default function AirPulseHome({ onSearch, onLogin, flights = [], loading = false, searchResult = "", hasSearched = false }) {
  const [origin, setOrigin] = useState('SGN');
  const [destination, setDestination] = useState('DAD');
  const [departureDate, setDepartureDate] = useState('2026-10-14');
  const [topic, setTopic] = useState('all');
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const goSearch = (overrides = {}) => {
    const search = { origin, destination, departureDate, ...overrides };
    if (search.origin === search.destination) {
      setError('Điểm đi và điểm đến phải khác nhau.');
      document.getElementById('ap-flight-search')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setError('');
    // Nếu App cha có callback tìm kiếm thì chuyển các input đến logic cũ.
    if (typeof onSearch === 'function') {
      onSearch(search);
      setTimeout(() => document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
      return;
    }
    // Tương thích fallback: chuyển đến trang tìm kiếm đang có, không giả lập dữ liệu/chuyến bay.
    sessionStorage.setItem('airpulse_pending_search', JSON.stringify(search));
    window.location.hash = 'search';
  };

  const selectDestination = (d) => {
    if (d.inspirationOnly) return;
    const nextOrigin = origin === d.code ? (d.code === 'SGN' ? 'HAN' : 'SGN') : origin;
    setOrigin(nextOrigin);
    setDestination(d.code);
    goSearch({ origin: nextOrigin, destination: d.code });
  };

  const visibleDestinations = topic === 'all' ? destinations : destinations.filter(d => d.group === topic);

  return (
    <div className="ap-home">
      <header className="ap-navbar">
        <a className="ap-brand" href="#home" aria-label="AirPulse trang chủ"><span className="ap-logo">✈</span> airpulse<span className="ap-brand-dot">.</span></a>
        <button type="button" className="ap-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">☰</button>
        <nav className={menuOpen ? 'ap-nav ap-nav-open' : 'ap-nav'}>
          <a href="#destinations" onClick={() => setMenuOpen(false)}>Khám phá</a>
          <a href="#ap-flight-search" onClick={() => setMenuOpen(false)}>Tìm chuyến bay</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>Cách hoạt động</a>
          <a href="#search-results" onClick={() => setMenuOpen(false)}>Kết quả</a>
        </nav>
        <button className="ap-login-btn" type="button" onClick={() => typeof onLogin === 'function' ? onLogin() : window.location.hash = 'login'}>Đăng nhập <span>↗</span></button>
      </header>

      <main id="home">
        <section className="ap-hero">
          <div className="ap-hero-shade" />
          <div className="ap-wrap ap-hero-inner">
            <span className="ap-eyebrow ap-hero-eyebrow">✦ SMARTER FLIGHTS, BETTER JOURNEYS</span>
            <h1>Chuyến đi tuyệt vời bắt đầu từ <em>một quyết định thông minh.</em></h1>
            <p>Khám phá điểm đến yêu thích, theo dõi giá vé và tìm thời điểm mua phù hợp cùng AirPulse.</p>
            <a className="ap-hero-link" href="#destinations">Khám phá Việt Nam <span>↗</span></a>
          </div>
        </section>

        <section className="ap-search-shell ap-wrap" id="ap-flight-search" aria-label="Tìm kiếm chuyến bay">
          <div className="ap-search-heading"><div><span className="ap-eyebrow">CHUYẾN ĐI CỦA BẠN</span><h2>Bạn muốn bay đến đâu?</h2></div><span className="ap-domestic">✈ Chuyến bay nội địa</span></div>
          <div className="ap-search-grid">
            <label className="ap-field"><span>Điểm khởi hành</span><select value={origin} onChange={e => setOrigin(e.target.value)}>{airports.map(a => <option value={a.code} key={a.code}>{a.name} ({a.code})</option>)}</select></label>
            <button className="ap-swap" title="Đổi điểm đi và đến" type="button" onClick={() => { setOrigin(destination); setDestination(origin); }}>⇄</button>
            <label className="ap-field"><span>Điểm đến</span><select value={destination} onChange={e => setDestination(e.target.value)}>{airports.map(a => <option value={a.code} key={a.code}>{a.name} ({a.code})</option>)}</select></label>
            <label className="ap-field"><span>Ngày bay</span><input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} /></label>
            <button className="ap-search-btn" type="button" onClick={() => goSearch()}>{loading ? "Đang tìm..." : "⌕  Tìm chuyến bay"}</button>
          </div>
          {error && <p className="ap-error" role="alert">{error}</p>}
          <p className="ap-search-note">AirPulse hỗ trợ phân tích giá và ra quyết định — không trực tiếp bán vé.</p>
        </section>


        {hasSearched && <section className="ap-wrap ap-results" id="search-results" aria-live="polite">
          <div className="ap-section-top"><div><span className="ap-eyebrow">FLIGHT SEARCH</span><h2>Kết quả chuyến bay</h2><p>{searchResult}</p></div></div>
          {loading ? <p className="ap-loading">Đang tìm chuyến bay trong dữ liệu nghiên cứu...</p> : flights.length === 0 ? <div className="ap-empty"><strong>Chưa tìm thấy chuyến bay phù hợp</strong><p>Hãy chọn tuyến và ngày nằm trong dữ liệu. Bản demo hiện có các chuyến bay ngày 14/10/2026.</p></div> : <>
            <div className="ap-results-bar"><span>{flights.length} chuyến bay</span><span>Giá quan sát, không phải báo giá đặt vé trực tiếp</span></div>
            <div className="ap-results-list">{flights.map((flight, i) => <article className="ap-flight-row" key={`${flight.id || flight.flight_number || 'flight'}-${i}`}>
              <div className="ap-airline"><span className="ap-airline-logo">✈</span><div><strong>{flight.airline || 'Hãng bay'}</strong><small>{flight.flight_number || 'Chuyến bay'}</small></div></div>
              <div className="ap-times"><div><strong>{flight.departure_at?.slice(11,16) || '--:--'}</strong><small>{flight.origin}</small></div><span className="ap-route-line">✈ Bay thẳng</span><div><strong>{flight.arrival_at?.slice(11,16) || '--:--'}</strong><small>{flight.destination}</small></div></div>
              <div className="ap-fare"><small>Giá đã quan sát</small><strong>{Number.isFinite(Number(flight.price_vnd)) ? `${Number(flight.price_vnd).toLocaleString('vi-VN')} ₫` : 'Chưa có giá'}</strong><span>Chưa có dự báo BUY / WAIT</span></div>
            </article>)}</div>
          </>}
        </section>}

        <section className="ap-section ap-wrap" id="destinations">
          <div className="ap-section-top"><div><span className="ap-eyebrow">KHÁM PHÁ VIỆT NAM</span><h2>Đi đâu cho chuyến tiếp theo?</h2><p>Từ những bãi biển đầy nắng đến góc phố thân quen — chọn nơi bạn muốn đến.</p></div><span className="ap-section-spark">✳</span></div>
          <div className="ap-topic-row" role="group" aria-label="Lọc điểm đến theo sở thích">{topics.map(t => <button type="button" key={t.id} className={'ap-topic ' + (topic === t.id ? 'active' : '')} onClick={() => setTopic(t.id)}>{t.emoji} {t.label}</button>)}</div>
          <div className="ap-destination-grid">{visibleDestinations.map(d => <article className="ap-destination-card" key={d.code}>
            <div className="ap-destination-image"><img src={d.image} alt={`Ảnh gợi cảm hứng du lịch ${d.name}`} loading="lazy" /><span className="ap-city-code">{d.code}</span></div>
            <div className="ap-destination-info"><span className="ap-city-tag">{d.tag}</span><h3>{d.name}</h3><p>{d.description}</p><button type="button" onClick={() => selectDestination(d)} disabled={Boolean(d.inspirationOnly)}>{d.inspirationOnly ? 'Đang mở rộng dữ liệu' : 'Khám phá chuyến bay →'}</button></div>
          </article>)}</div>
          <p className="ap-data-note">Ảnh mang tính minh họa. Chuyến bay chỉ hiển thị khi có dữ liệu; AirPulse không tạo giá vé giả.</p>
        </section>

        <section className="ap-intelligence"><div className="ap-wrap ap-intelligence-inner"><div><span className="ap-eyebrow">AIRPULSE INTELLIGENCE</span><h2>Giá vé thay đổi.<br/><em>Quyết định của bạn không cần dựa vào may mắn.</em></h2><p>AirPulse kết hợp lịch sử giá quan sát, giá tham chiếu và phân tích xu hướng để hỗ trợ bạn đánh giá thời điểm mua vé.</p><a href="#ap-flight-search" className="ap-dark-cta">Xem chuyến bay <span>↗</span></a></div><div className="ap-intel-cards"><div><span>01 / FAIR PRICE</span><strong>Giá này có hợp lý?</strong><p>So sánh giá hiện tại với mức tham chiếu khi có mô hình.</p></div><div><span>02 / PRICE TREND</span><strong>Giá đang biến động thế nào?</strong><p>Theo dõi lịch sử giá; dự báo sẽ bổ sung khi kiểm định xong.</p></div><div><span>03 / BUY OR WAIT</span><strong>Nên mua hay chờ?</strong><p>Khuyến nghị theo thời hạn bạn chọn và mức độ tin cậy.</p></div></div></div></section>

        <section className="ap-section ap-wrap" id="how-it-works"><span className="ap-eyebrow">ĐƠN GIẢN HƠN BẠN NGHĨ</span><h2>Ba bước để bay thông minh hơn</h2><div className="ap-steps"><div><span>01</span><div className="ap-step-icon">⌕</div><h3>Chọn hành trình</h3><p>Chọn điểm đi, điểm đến và ngày bay bạn quan tâm.</p></div><div><span>02</span><div className="ap-step-icon">↗</div><h3>Hiểu giá vé</h3><p>Xem mức giá thực tế và lịch sử thay đổi đã quan sát.</p></div><div><span>03</span><div className="ap-step-icon">✓</div><h3>Quyết định tự tin</h3><p>Nhận phân tích mua hoặc chờ khi mô hình đủ dữ liệu tin cậy.</p></div></div></section>

        <section className="ap-final-cta"><div className="ap-wrap"><span className="ap-eyebrow">READY FOR TAKEOFF?</span><h2>Chuyến đi đáng nhớ đang chờ bạn.</h2><p>Bắt đầu từ một hành trình, rồi để dữ liệu giúp bạn cân nhắc thời điểm mua.</p><a href="#ap-flight-search">Tìm chuyến bay ↗</a></div></section>
      </main>
      <footer className="ap-footer"><div className="ap-wrap ap-footer-inner"><div><a className="ap-brand" href="#home"><span className="ap-logo">✈</span> airpulse<span className="ap-brand-dot">.</span></a><p>Travel inspiration meets price intelligence.</p></div><div><a href="#destinations">Khám phá</a><a href="#ap-flight-search">Tìm chuyến bay</a><a href="#how-it-works">Giới thiệu</a></div></div><div className="ap-wrap ap-footer-bottom">AirPulse · Research demo · Giá vé và phân tích phụ thuộc phạm vi dữ liệu quan sát.</div></footer>
    </div>
  );
}
