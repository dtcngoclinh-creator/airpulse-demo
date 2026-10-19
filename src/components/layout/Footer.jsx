import { Link } from 'react-router-dom';
import Logo from '../common/Logo.jsx';
import AIRLINES from '../../data/airlines.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>Khám phá điểm đến, so sánh chuyến bay và hiểu giá vé trước khi đặt tại hãng.</p>
          <p className="footer-note">
            Nguyên mẫu nghiên cứu cho AISC 2026. AirPulse không bán vé, không thu tiền và không cam kết giá còn hiệu lực.
          </p>
        </div>
        <div>
          <h4>Khám phá</h4>
          <Link to="/explore">Điểm đến</Link>
          <Link to="/flights">Tìm chuyến bay</Link>
          <Link to="/compare">So sánh chuyến bay</Link>
          <Link to="/saved">Chuyến đã lưu</Link>
        </div>
        <div>
          <h4>Minh bạch</h4>
          <Link to="/about#du-lieu">Nguồn dữ liệu</Link>
          <Link to="/about#cach-hoat-dong">Cách AirPulse hoạt động</Link>
          <Link to="/about#gioi-han">Giới hạn nghiên cứu</Link>
        </div>
        <div>
          <h4>Đặt vé tại hãng</h4>
          {AIRLINES.map((a) => (
            <a key={a.key} href={a.url} target="_blank" rel="noopener noreferrer">
              {a.name}
            </a>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 AirPulse</span>
        <span>Giá hiển thị là giá đã ghi nhận trong dữ liệu nghiên cứu, không phải giá bán thời gian thực.</span>
      </div>
    </footer>
  );
}
