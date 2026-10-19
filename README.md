# AirPulse V4 – Hỗ trợ quyết định mua vé máy bay (AISC 2026)

AirPulse giúp người dùng **khám phá điểm đến → tìm chuyến bay → hiểu giá vé → lưu chuyến → đặt vé tại website chính thức của hãng**.
AirPulse **không bán vé, không thanh toán, không giữ chỗ**.

## 1. Chạy trên máy / GitHub Codespaces

```bash
rm -rf node_modules package-lock.json   # xóa lock cũ của V3 để tránh xung đột phiên bản
npm install
npm run build                            # phải báo "built in ..." không lỗi
npm run dev -- --host                    # mở cổng 5173
```

## 2. Thay file trong repo GitHub (Codespaces)

1. Sao lưu repo cũ: `git checkout -b backup-v3 && git push -u origin backup-v3 && git checkout main`
2. Ở thư mục gốc repo, **xóa**: `src/`, `index.html`, `vite.config.js`, `package.json`, `package-lock.json`, `vercel.json`.
   **Giữ** `public/flights.json` (bản trong ZIP giống hệt bản bạn gửi; dùng bản nào cũng được).
3. Kéo thả toàn bộ nội dung thư mục `airpulse/` trong ZIP vào thư mục gốc repo (cùng cấp `.git`).
   Nếu repo có `eslint.config.js` cũ, có thể giữ nguyên – không ảnh hưởng build.
4. Chạy các lệnh ở mục 1, kiểm tra trang trên cổng 5173.
5. `git add -A && git commit -m "AirPulse V4" && git push`

## 3. Deploy Vercel

Vercel tự deploy khi push lên GitHub. Kiểm tra trong **Project → Settings → Build & Deployment**:
Framework `Vite`, Build Command `npm run build`, Output Directory `dist`.
`vercel.json` đã rewrite mọi đường dẫn về `index.html`, nên mở thẳng `/flights/VJ501_...` hay F5 ở trang con không bị 404.

Kiểm tra sau deploy: `/`, `/flights`, `/flights?origin=SGN&destination=DAD`, một trang chi tiết, `/explore/da-nang`, `/saved`, `/account`, `/about`, và `/flights.json` (phải trả JSON).

## 4. Cấu trúc

```
public/flights.json          dữ liệu chuyến bay (nguồn duy nhất cho giá, tuyến, hãng)
src/
  main.jsx, App.jsx          khởi động + định tuyến (React Router)
  pages/                     Home, Flights, FlightDetail, Compare, Explore, DestinationDetail,
                             Saved, Account, About, NotFound
  components/
    layout/                  Navbar, Footer, MobileTabBar, Layout
    flights/                 SearchForm, FlightCard, FiltersPanel, HourChart, PriceStrip,
                             CompareTray, AirlineBadge
    insight/                 InsightPanel (Fair Price / Trend / BUY-WAIT), PriceHistory
    explore/                 DestinationCard
    common/                  SmartImage, States (loading/empty/error), Logo
  context/                   FlightDataContext (tải flights.json 1 lần), UserDataContext
                             (lưu chuyến, theo dõi giá, hành trình, so sánh, hồ sơ demo), Toast
  data/                      flights.js (chuẩn hóa + thống kê), airports, airlines (link chính thức),
                             destinations (nội dung du lịch), images (ảnh minh họa)
  services/modelApi.js       ĐIỂM TÍCH HỢP MÔ HÌNH
  hooks/, utils/, styles/
```

## 5. Các URL

| URL | Trang |
|---|---|
| `/` | Trang chủ |
| `/flights` | Tổng quan các tuyến có dữ liệu |
| `/flights?origin=SGN&destination=DAD&date=2026-10-14&sort=early` | Kết quả (destination/date/sort tùy chọn) |
| `/flights/:id` | Chi tiết chuyến (id trong flights.json) |
| `/compare` | So sánh tối đa 3 chuyến (`?ids=a,b` để chia sẻ) |
| `/explore?cat=sea&q=bien`, `/explore/:slug` | Khám phá, chi tiết điểm đến |
| `/saved?tab=watch` | Đã lưu / theo dõi giá / hành trình yêu thích |
| `/account`, `/about` | Tài khoản demo, giới thiệu |

## 6. Dữ liệu chuyến bay

Định dạng hiện tại được giữ nguyên: `{ metadata, flights: [{ id, origin, destination, airline, flight_number, departure_at, arrival_at, flight_date, price_vnd, last_observed_at }] }`.
Thay file `public/flights.json` là website tự cập nhật tuyến, ngày, hãng, bộ lọc và thống kê – không cần sửa code.

**Lịch sử giá:** thêm vào từng chuyến (không bắt buộc)
```json
"price_history": [ { "observed_at": "2026-10-04T08:00:00+07:00", "price_vnd": 820000 }, ... ]
```
Có từ 2 điểm trở lên, trang chi tiết sẽ vẽ biểu đồ. Không có thì hiện thông báo rõ ràng.

## 7. Tích hợp mô hình (Fair Price / Price Trend / BUY-WAIT)

Hai cách, xem chi tiết trong `src/services/modelApi.js`:

**Cách A – offline:** gắn trường `insight` vào từng chuyến trong flights.json.
**Cách B – API:** đặt biến môi trường `VITE_AIRPULSE_MODEL_API=https://api-cua-nhom.example.com`
(Vercel: Settings → Environment Variables, rồi Redeploy). Website gọi `POST {API}/insight`.

Định dạng kết quả (khối nào thiếu, giao diện báo "Mô hình chưa trả về phần này"):
```json
{
  "fair_price": { "value_vnd": 820000, "low_vnd": 760000, "high_vnd": 900000 },
  "trend": { "direction": "up", "expected_change_pct": 6.5, "horizon_days": 3 },
  "recommendation": { "action": "BUY", "confidence": 0.72, "explanation": ["Giá thấp hơn mức hợp lý 8%"] },
  "model_version": "v0.3", "generated_at": "2026-10-13T09:00:00+07:00"
}
```
API cần bật CORS cho domain Vercel. Khi chưa có mô hình: hiển thị "Chưa kết nối mô hình", **không tạo dự đoán giả**.

## 8. Giới hạn cần nói rõ khi trình bày

- Giá là giá đã ghi nhận trong quá khứ, không phải giá bán thời gian thực.
- Link "Đặt tại hãng" mở trang đặt vé chung của hãng, không phải deep-link tới đúng chuyến.
- "Theo dõi giá" so sánh với dữ liệu mới nhất mỗi khi mở trang; thông báo email/điện thoại cần backend.
- Tài khoản là demo: lưu trong localStorage, không lưu mật khẩu, không xác thực.
- Ảnh Unsplash trong `src/data/images.js` là ảnh minh họa, có thể không đúng địa danh. Nên thay bằng ảnh có giấy phép
  (đặt vào `public/images/` rồi sửa đường dẫn). Ảnh lỗi sẽ tự hiện nền thay thế.
