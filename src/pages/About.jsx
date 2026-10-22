import { Link } from 'react-router-dom';
import { Database, Gauge, TrendingUp, ShieldQuestion, ExternalLink, AlertTriangle } from 'lucide-react';
import AirlineBadge from '../components/flights/AirlineBadge.jsx';
import { useFlightData } from '../context/FlightDataContext.jsx';
import AIRLINES from '../data/airlines.js';
import { MODEL_API_CONFIGURED } from '../services/modelApi.js';
import { cityOf } from '../data/airports.js';
import { formatDateVN, formatVND } from '../utils/format.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const STEPS = [
  { title: 'Thu thập', text: 'Giá vé nội địa được ghi nhận nhiều lần từ Google Flights (qua SerpAPI) trong một khoảng thời gian trước ngày bay.' },
  { title: 'Làm sạch', text: 'Loại bản ghi lỗi, chuẩn hóa hãng, giờ bay, mã sân bay và giữ lần ghi nhận gần nhất cho mỗi chuyến.' },
  { title: 'Mô tả', text: 'Website so sánh từng chuyến với các chuyến cùng tuyến, cùng ngày: rẻ thứ mấy, cao hay thấp hơn trung vị.' },
  { title: 'Mô hình hóa', text: 'Fair Price ước lượng mức giá hợp lý, Price Trend ước lượng xu hướng, rồi tổng hợp thành khuyến nghị BUY/WAIT kèm độ tin cậy.' },
  { title: 'Quyết định', text: 'Người dùng tự quyết định và đặt vé trên website chính thức của hãng. AirPulse không tham gia giao dịch.' },
];

const LIMITS = [
  'Giá hiển thị là giá đã ghi nhận trong quá khứ, không phải giá bán thời gian thực và có thể đã thay đổi.',
  'Dữ liệu chỉ bao phủ một số tuyến nội địa, một số ngày bay và vé một chiều.',
  'Dữ liệu thật Việt Nam chỉ có một ngày bay (14/10/2026); kết quả mô hình chưa được kiểm chứng trên ngày bay khác.',
  'BUY/WAIT hiển thị trên website là kết quả nghiên cứu V3 tính sẵn từ file, không phải mô hình chạy trực tiếp. Chưa có file mô hình đã huấn luyện nên không dự đoán được cho chuyến mới.',
  'Kết quả V2 là chuẩn so sánh trên dữ liệu Mỹ, không dùng làm dự đoán cho chuyến bay Việt Nam.',
  'Liên kết “Đặt vé tại hãng” mở trang đặt vé chung của hãng, không giữ chỗ, không giữ giá và không chọn sẵn chuyến bay.',
  'Ảnh điểm đến là ảnh minh họa, có thể không chụp đúng địa danh được nhắc tới.',
  'Tài khoản là bản demo lưu trên trình duyệt, không có xác thực thật.',
];

export default function About() {
  useDocumentTitle('Về AirPulse');
  const { status, metadata, flights, index } = useFlightData();
  const ready = status === 'ready';

  return (
    <div className="about">
      <section className="about-hero">
        <div className="container">
          <h1>Không chỉ tìm giá vé. Hiểu giá vé.</h1>
          <p>
            AirPulse là nguyên mẫu nghiên cứu cho cuộc thi AISC 2026, giúp người mua vé máy bay nội địa Việt Nam quyết định nên mua lúc nào và chuyến
            nào đáng tiền, dựa trên dữ liệu và minh bạch về giới hạn.
          </p>
        </div>
      </section>

      <div className="container about-body">
        <section id="du-lieu" className="card about-section">
          <h2>
            <Database size={22} aria-hidden="true" /> Nguồn dữ liệu
          </h2>
          {ready ? (
            <>
              <dl className="data-facts">
                <div>
                  <dt>Nguồn</dt>
                  <dd>{metadata.source || 'Không ghi trong metadata'}</dd>
                </div>
                <div>
                  <dt>Khoảng quan sát</dt>
                  <dd>
                    {metadata.observation_start ? `${formatDateVN(metadata.observation_start, { weekday: false })} – ${formatDateVN(metadata.observation_end, { weekday: false })}` : 'Không rõ'}
                  </dd>
                </div>
                <div>
                  <dt>Ngày bay</dt>
                  <dd>{index.dates.map((d) => formatDateVN(d)).join(', ')}</dd>
                </div>
                <div>
                  <dt>Quy mô</dt>
                  <dd>
                    {flights.length} chuyến, {index.routes.length} tuyến, {index.airlines.length} hãng
                  </dd>
                </div>
              </dl>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Tuyến</th>
                      <th scope="col">Số chuyến</th>
                      <th scope="col">Thấp nhất</th>
                      <th scope="col">Trung vị</th>
                      <th scope="col">Cao nhất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {index.routes.map((r) => (
                      <tr key={r.key}>
                        <td>
                          <Link to={`/flights?origin=${r.origin}&destination=${r.destination}`}>
                            {cityOf(r.origin)} – {cityOf(r.destination)}
                          </Link>
                        </td>
                        <td>{r.count}</td>
                        <td>{formatVND(r.min)}</td>
                        <td>{formatVND(r.median)}</td>
                        <td>{formatVND(r.max)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {metadata.pricing_notice && <p className="muted small">Ghi chú trong dữ liệu: {metadata.pricing_notice}</p>}
            </>
          ) : (
            <p className="muted">{status === 'loading' ? 'Đang đọc flights.json…' : 'Không đọc được flights.json.'}</p>
          )}
        </section>

        <section id="cach-hoat-dong" className="about-section">
          <h2>AirPulse hoạt động thế nào</h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="step-num">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-section">
          <h2>Ba mô hình, một quyết định</h2>
          <div className="grid-3">
            <div className="card model-card">
              <Gauge size={24} aria-hidden="true" />
              <h3>Fair Price</h3>
              <p>Ước lượng mức giá hợp lý cho chuyến bay dựa trên tuyến, hãng, giờ bay và thời điểm mua.</p>
            </div>
            <div className="card model-card">
              <TrendingUp size={24} aria-hidden="true" />
              <h3>Price Trend</h3>
              <p>Ước lượng giá sẽ tăng, giảm hay đi ngang trong vài ngày tới, kèm mức độ bất định.</p>
            </div>
            <div className="card model-card">
              <ShieldQuestion size={24} aria-hidden="true" />
              <h3>BUY / WAIT</h3>
              <p>Tổng hợp hai mô hình trên thành khuyến nghị mua ngay hay chờ, có độ tin cậy và lý do bằng lời.</p>
            </div>
          </div>
          <p className={`model-status ${MODEL_API_CONFIGURED ? 'on' : ''}`}>
            Trạng thái hiện tại: {MODEL_API_CONFIGURED ? 'đã cấu hình API mô hình.' : 'chưa kết nối mô hình chạy trực tiếp. Website hiển thị kết quả nghiên cứu tính sẵn và không tự tạo dự đoán.'}{' '}
            <Link to="/research">Xem kết quả nghiên cứu</Link>
          </p>
        </section>

        <section id="gioi-han" className="card about-section limits">
          <h2>
            <AlertTriangle size={22} aria-hidden="true" /> Giới hạn nghiên cứu
          </h2>
          <ul>
            {LIMITS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        <section className="about-section">
          <h2>Website chính thức của các hãng</h2>
          <div className="airline-links">
            {AIRLINES.map((a) => (
              <a key={a.key} href={a.url} target="_blank" rel="noopener noreferrer" className="airline-link">
                <AirlineBadge airline={a.name} flightNumber={a.code} />
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
