import { useState } from "react";
import { Plane, X, ArrowRight, UserRound, Eye, EyeOff } from "lucide-react";
import AirPulseHome from "./AirPulseHome";
import "./App.css";

export default function App() {
  const [authMode, setAuthMode] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const loadFlights = async ({ origin, destination, departureDate }) => {
    setHasSearched(true);
    setFlights([]);
    if (!departureDate) {
      setSearchResult("Vui lòng chọn ngày khởi hành.");
      return;
    }
    if (origin === destination) {
      setSearchResult("Điểm khởi hành và điểm đến phải khác nhau.");
      return;
    }
    setLoading(true);
    setSearchResult("Đang tra cứu chuyến bay...");
    try {
      const response = await fetch("/flights.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const observations = Array.isArray(data) ? data : data.flights;
      if (!Array.isArray(observations)) throw new Error("flights.json cần là mảng hoặc đối tượng chứa mảng flights");
      const matching = observations.filter((flight) =>
        flight.origin === origin &&
        flight.destination === destination &&
        flight.departure_at?.slice(0, 10) === departureDate
      );
      setFlights(matching);
      setSearchResult(matching.length > 0
        ? `Tìm thấy ${matching.length} chuyến bay ${origin} → ${destination} ngày ${departureDate}.`
        : `Không có chuyến bay ${origin} → ${destination} ngày ${departureDate} trong dữ liệu demo.`);
    } catch (error) {
      console.error("Flight search error:", error);
      setSearchResult("Không tải được dữ liệu từ /flights.json. Hãy kiểm tra file public/flights.json.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="app">
    <AirPulseHome onSearch={loadFlights} onLogin={() => setAuthMode("login")}
      flights={flights} loading={loading} searchResult={searchResult} hasSearched={hasSearched} />
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
  </div>;
}
