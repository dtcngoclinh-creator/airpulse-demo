
import { useState } from "react";
import {
  Plane, Search, ArrowRight, ArrowLeftRight,
  CalendarDays, MapPin, TrendingUp, BarChart3,
  ShieldCheck, Bell, UserRound, Menu, X,
  Sparkles, Check, Eye, EyeOff
} from "lucide-react";
import "./App.css";

const airports = [
  { code: "SGN", city: "TP. Hồ Chí Minh" },
  { code: "HAN", city: "Hà Nội" },
  { code: "DAD", city: "Đà Nẵng" },
  { code: "DLI", city: "Đà Lạt" },
  { code: "PQC", city: "Phú Quốc" },
];

export default function App() {
  const [origin, setOrigin] = useState("SGN");
  const [destination, setDestination] = useState("HAN");
  const [date, setDate] = useState("2026-10-14");
  const [authMode, setAuthMode] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchResult, setSearchResult] = useState("");

  const [flights, setFlights] = useState([]);
const [loading, setLoading] = useState(false);

const loadFlights = async () => {
  setLoading(true);

  try {
    const response = await fetch("/flights.json");
    if (!response.ok) throw new Error("Không tải được dữ liệu");

    const data = await response.json();

    const results = data.flights.filter((flight) => {
      return (
        flight.origin === origin &&
        flight.destination === destination &&
        flight.departure_at?.slice(0, 10) === date
      );
    });

    setFlights(results);
    setSearchResult(
      `Tìm thấy ${results.length} chuyến bay phù hợp.`
    );
  } catch (error) {
    setSearchResult("Lỗi tải dữ liệu chuyến bay.");
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  const swapAirports = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (origin === destination) {
      setSearchResult("Điểm đi và điểm đến phải khác nhau.");
      return;
    }

    if (date !== "2026-10-14") {
      setSearchResult(
        "Bản demo hiện chỉ có dữ liệu lịch sử cho ngày bay 14/10/2026."
      );
      return;
    }

    setSearchResult(
      `Đã chọn tuyến ${origin} → ${destination}, ngày 14/10/2026. Danh sách chuyến bay sẽ được kết nối ở bước tiếp theo.`
    );
  };

  return (
    <div className="app">
      {/* NAVIGATION */}
      <header className="navbar">
        <div className="nav-container">
          <a className="brand" href="#home">
            <div className="brand-icon">
              <Plane size={23} strokeWidth={2.5} />
            </div>
            <span>Air<span className="brand-blue">Pulse</span></span>
          </a>

          <nav className={menuOpen ? "nav-links active" : "nav-links"}>
            <a href="#home" onClick={() => setMenuOpen(false)}>
              Trang chủ
            </a>
            <a href="#search" onClick={() => setMenuOpen(false)}>
              Tìm chuyến bay
          
            </a>
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Phân tích giá
            </a>
            <a href="#how" onClick={() => setMenuOpen(false)}>
              Cách hoạt động
            </a>
          </nav>

          <div className="nav-actions">
            <button className="login-btn" onClick={() => setAuthMode("login")}>
              Đăng nhập
            </button>
            <button className="signup-btn" onClick={() => setAuthMode("signup")}>
              Đăng ký miễn phí <ArrowRight size={16} />
            </button>
          </div>

          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Mở menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* HERO */}
      <main id="home">
        <section className="hero">
          <div className="hero-decoration hero-decoration-one" />
          <div className="hero-decoration hero-decoration-two" />

          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={15} />
              TRỢ LÝ PHÂN TÍCH GIÁ VÉ THÔNG MINH
            </div>

            <h1>
              Đặt vé đúng thời điểm.
              <br />
              <span>Bay thông minh hơn.</span>
            </h1>

            <p className="hero-description">
              Không chỉ biết giá vé đang cao hay thấp.
              AirPulse giúp bạn đánh giá thời điểm nên mua,
              nên chờ hay tiếp tục theo dõi giá vé máy bay.
            </p>

            <div className="hero-points">
              <span><Check size={16} /> Phân tích mức giá</span>
              <span><Check size={16} /> Dự báo xu hướng</span>
              <span><Check size={16} /> Hỗ trợ quyết định</span>
            </div>
          </div>
        </section>

        {/* SEARCH CARD */}
        <section className="search-section" id="search">
          <div className="search-card">
            <div className="search-card-header">
              <div>
                <div className="section-kicker">KHÁM PHÁ CHUYẾN BAY</div>
                <h2>Bạn muốn bay đến đâu?</h2>
                <p>Chọn hành trình để bắt đầu phân tích giá vé.</p>
              </div>

              <div className="demo-label">
                <span className="demo-dot" />
                Bản thử nghiệm
              </div>
            </div>

            <form onSubmit={handleSearch}>
              <div className="search-grid">
                <div className="field">
                  <label><MapPin size={16} /> Điểm khởi hành</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  >
                    {airports.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="swap-button"
                  type="button"
                  onClick={swapAirports}
                  title="Đổi điểm đi và điểm đến"
                >
                  <ArrowLeftRight size={18} />
                </button>

                <div className="field">
                  <label><MapPin size={16} /> Điểm đến</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {airports.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label><CalendarDays size={16} /> Ngày khởi hành</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="search-footer">
                <span>
                  <ShieldCheck size={16} />
                  Dữ liệu nghiên cứu các tuyến bay nội địa Việt Nam
                </span>

            <button
              className="search-button"
              type="button"
              onClick={loadFlights}
              disabled={loading}
>                  <Search size={19} /> Tìm chuyến bay
                  <ArrowRight size={17} />
                </button>
              </div>

              {searchResult && (
                <div className="search-message" role="status">
                  {searchResult}
                </div>
              )}
              {flights.length > 0 && (
  <div className="flight-results">
    <h3>Danh sách chuyến bay ({flights.length})</h3>

    <p>
      Giá vé quan sát từ dữ liệu nghiên cứu,
      không phải giá đặt vé trực tiếp.
    </p>

    {flights.map((flight) => (
      <div className="flight-card" key={flight.id}>
        <div>
          <strong>{flight.airline}</strong>
          <p>{flight.flight_number}</p>
        </div>

        <div>
          <strong>
            {flight.departure_at?.slice(11, 16)}
          </strong>
          <p>{flight.origin}</p>
        </div>

        <div>✈️</div>

        <div>
          <strong>
            {flight.arrival_at?.slice(11, 16)}
          </strong>
          <p>{flight.destination}</p>
        </div>

        <div>
          <strong>
            {Number(flight.price_vnd).toLocaleString("vi-VN")} ₫
          </strong>
        </div>
      </div>
    ))}
  </div>
)}
            </form>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features-section" id="features">
          <div className="section-heading">
            <div className="section-kicker">TẠI SAO CHỌN AIRPULSE?</div>
            <h2>Không chỉ tìm vé. Hãy hiểu giá vé.</h2>
            <p>
              AirPulse hướng tới việc chuyển dữ liệu giá thành
              thông tin hỗ trợ quyết định mua vé.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon blue">
                <BarChart3 size={26} />
              </div>
              <h3>Đánh giá mức giá</h3>
              <p>
                So sánh giá hiện tại với mức giá tham chiếu
                của các lựa chọn chuyến bay tương đương.
              </p>
              <span>FAIR PRICE <ArrowRight size={15} /></span>
            </div>

            <div className="feature-card">
              <div className="feature-icon purple">
                <TrendingUp size={26} />
              </div>
              <h3>Dự báo xu hướng</h3>
              <p>
                Phân tích biến động giá được quan sát để
                nghiên cứu khả năng tăng hoặc giảm trong tương lai.
              </p>
              <span>PRICE TREND <ArrowRight size={15} /></span>
            </div>

            <div className="feature-card">
              <div className="feature-icon teal">
                <Bell size={26} />
              </div>
              <h3>Khuyến nghị thông minh</h3>
              <p>
                Định hướng MUA NGAY, CHỜ hoặc THEO DÕI
                và giải thích các tín hiệu hỗ trợ quyết định.
              </p>
              <span>BUY / WAIT / MONITOR <ArrowRight size={15} /></span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how">
          <div className="section-heading">
            <div className="section-kicker">ĐƠN GIẢN & DỄ SỬ DỤNG</div>
            <h2>AirPulse hoạt động như thế nào?</h2>
          </div>

          <div className="steps-grid">
            {[
              ["01", "Tìm chuyến bay",
                "Nhập điểm đi, điểm đến và ngày khởi hành."],
              ["02", "Chọn chuyến phù hợp",
                "Xem giá và thông tin hành trình."],
              ["03", "Phân tích giá",
                "Xem đánh giá giá và xu hướng dự báo."],
              ["04", "Nhận khuyến nghị",
                "Tham khảo MUA / CHỜ / THEO DÕI kèm giải thích."]
            ].map(([number, title, description]) => (
              <div className="step" key={number}>
                <div className="step-number">{number}</div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Plane size={20} />
            <strong>AirPulse</strong>
          </div>
          <p>
            Dự án nghiên cứu hỗ trợ quyết định mua vé máy bay.
          </p>
          <span>© 2026 AirPulse · Research Prototype</span>
        </div>
      </footer>

      {/* AUTH MODAL */}
      {authMode && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAuthMode(null);
          }}
        >
          <div className="auth-modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              onClick={() => setAuthMode(null)}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>

            <div className="modal-logo"><Plane size={25} /></div>

            <h2>
              {authMode === "login"
                ? "Chào mừng trở lại!"
                : "Bắt đầu cùng AirPulse"}
            </h2>

            <p className="modal-description">
              {authMode === "login"
                ? "Đăng nhập để tiếp tục hành trình."
                : "Tạo tài khoản để khám phá AirPulse."}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(
                  "Đây là giao diện demo. Chức năng xác thực chưa được triển khai."
                );
              }}
            >
              {authMode === "signup" && (
                <div className="auth-field">
                  <label>Họ và tên</label>
                  <input type="text" placeholder="Nguyễn Văn A" required />
                </div>
              )}

              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Mật khẩu</label>
                <div className="password-box">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <button className="auth-submit" type="submit">
                {authMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="auth-switch">
              {authMode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button onClick={() => setAuthMode("signup")}>
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button onClick={() => setAuthMode("login")}>
                    Đăng nhập
                  </button>
                </>
              )}
            </div>

            <p className="auth-demo-note">
              <UserRound size={14} />
              Giao diện thử nghiệm – chưa lưu tài khoản.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
