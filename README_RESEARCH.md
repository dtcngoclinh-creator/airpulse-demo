# AirPulse 4.1 – tích hợp kết quả nghiên cứu V2 và V3

## Chạy trên GitHub Codespaces
```bash
npm install && npm run dev
```
Mở cổng 5173 khi Codespaces hỏi. Kiểm tra bản build: `npm run build && npm run preview`.

## Trang mới
| Đường dẫn | Nội dung |
|---|---|
| `/research` | Tổng quan: điều gì chạy thật, điều gì là kết quả tính sẵn, điều gì còn thiếu |
| `/research/us` | US Benchmark (V2): chỉ số LR và XGBoost theo W, ma trận nhầm lẫn, tiết kiệm, harmed |
| `/research/vietnam` | Vietnam Pilot (V3): 3 thí nghiệm, W 1–7, chuỗi giá và BUY/WAIT theo ngày, kiểm tra ghép |
| `/flights/:id` | Thêm panel “BUY/WAIT theo nghiên cứu V3” cho đúng chuyến đang xem; biểu đồ lịch sử giá có chế độ “Toàn kỳ” |

`/research/vietnam` nhận tham số URL: `?exp=real_pilot|synthetic_to_real|synthetic_only&W=1..7&model=logistic|xgboost&series=<series_id>`, tiện mở sẵn đúng màn hình khi thuyết trình.

## Dữ liệu
- `research/V2`, `research/V3`: nội dung gốc của hai ZIP kết quả (không phục vụ cho trình duyệt).
- `public/data/research/*.json`: sinh từ file gốc bằng `npm run research:data` (cần Python 3 + pandas). Không tạo số liệu mới.
- Khóa ghép V3 ↔ website: `series_id = "R_" + id` trong `public/flights.json`. Script kiểm tra và ghi kết quả vào `v3_summary.json → checks.join`.

## Ranh giới trung thực
- Website **không chạy mô hình**. p_wait, BUY/WAIT, backtest đều đọc từ predictions.csv và backtest_*.csv.
- Chỉ hiện như khuyến nghị khi cấu hình (thí nghiệm, mô hình, W) có tiết kiệm trung bình > 0 và ROC-AUC > 0,5 trên tập kiểm tra. Các cấu hình khác vẫn hiện đầu ra nhưng ghi rõ “không dùng làm khuyến nghị”.
- Không có giá dự báo: mô hình BUY/WAIT chỉ trả xác suất nên chờ.
- Panel “AirPulse Intelligence · baseline” là đường cong giá thực nghiệm gắn sẵn trong flights.json, tách biệt với V3.

## Để chạy dự đoán cho chuyến mới cần bổ sung
1. File mô hình đã huấn luyện cho từng W (XGBoost `.json`/`.ubj`, Logistic `.joblib` kèm scaler).
2. Mã tạo đặc trưng từ chuỗi giá + danh sách cột đặc trưng đúng thứ tự.
3. Một API nhỏ (ví dụ FastAPI) nhận chuỗi giá, trả `p_wait`; đặt `VITE_AIRPULSE_MODEL_API`.

## Để vẽ chuỗi giá V2 cần bổ sung
- Chuỗi giá đã làm sạch: `series_id, search_date, flight_date, origin, destination, airline, price_usd`
- `predictions_V2.csv`: `series_id, search_date, W, model, p_wait, true_wait`
- `backtest_V2_{model}_W{1..7}.csv`: `series_id, search_date, buy_cost, model_cost, oracle_cost, purchase_day, savings, harm`
