# 🚗 Car Flow Planner

Ứng dụng lập kế hoạch luồng xe nhập khẩu — theo dõi hành trình xe từ lúc **nhập về → bãi tạm → đăng ký → depot**, kèm tính toán chi phí lưu bãi theo từng tháng.

**🌐 Dùng thử:** https://nguyenhieutrung2101.github.io/car-flow-planner/

Toàn bộ ứng dụng nằm trong **một file `index.html` duy nhất** — không cần cài đặt, không cần server, không phụ thuộc thư viện ngoài. Mở file bằng trình duyệt là chạy.

## ✨ Tính năng

### 📋 Board kéo thả
- Bảng kế hoạch theo dòng thời gian từng tháng.
- Kéo thả batch xe vào ô bãi tạm / depot để phân bổ.
- Cảnh báo trực quan khi **còn xe chưa phân bổ** hoặc **phân bổ vượt số lượng nhập**.

### 📦 Batch & Đăng ký
- Quản lý các lô xe nhập: tên batch, loại xe, số lượng, ngày nhập.
- Theo dõi tiến độ các bước đăng ký (quota, TERA, KIR, KP, STNK).
- Tự động tính **thời điểm dự kiến hoàn tất đăng ký** để chuyển xe về depot.

### 💰 Chi phí Bãi tạm & Depot
- Khai báo danh sách bãi tạm / depot: tên, khu vực, địa chỉ, sức chứa, đơn giá.
- Tự động tổng hợp chi phí lưu bãi theo tháng dựa trên phân bổ trên board.
- Tùy chỉnh định nghĩa chi phí trong phần Cài đặt.

### 🛠 Tiện ích
- **Lưu / Mở JSON** — sao lưu và khôi phục toàn bộ dữ liệu kế hoạch.
- **Xuất Excel** — xuất bảng số liệu để báo cáo.
- **Song ngữ 🇻🇳 Việt / 🇬🇧 Anh** — chuyển đổi bằng một nút bấm.

## 🚀 Cách sử dụng

**Cách 1 — Online:** truy cập trang demo ở trên.

**Cách 2 — Offline:** tải file `index.html` về máy và mở bằng trình duyệt bất kỳ (Chrome, Edge, Firefox...).

> 💡 Dữ liệu làm việc không tự động lưu trên server. Hãy dùng nút **Lưu JSON** để giữ lại kế hoạch của bạn, và **Mở JSON** để tải lại khi cần.

## 🧱 Công nghệ

- HTML + CSS + JavaScript thuần, gói gọn trong 1 file.
- Không backend, không build tool, không dependency.
- Deploy tĩnh ở bất kỳ đâu: GitHub Pages, Cloudflare Pages, Netlify...
