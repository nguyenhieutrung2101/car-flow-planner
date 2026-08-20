# 🚗 Car Flow Planner

Ứng dụng lập kế hoạch luồng xe nhập khẩu — theo dõi hành trình xe từ lúc **nhập về → bãi tạm → đăng ký → depot**, kèm tính toán chi phí lưu bãi theo từng tháng.

**🌐 Dùng thử:** https://car-flow-planner.nguyenhieutrung2101.workers.dev

Phiên bản 2.0 được viết lại bằng **React + Vite**, áp dụng ngôn ngữ thiết kế **neo-brutalism pastel** (nền giấy kem, viền mực 2px, shadow cứng, nút bấm "lún xuống" khi hover) — đồng bộ với dự án Org Builder.

## ✨ Tính năng

### 📋 Board kéo thả
- Bảng kế hoạch theo dòng thời gian từng tháng, 3 layer: Nhập xe → Bãi tạm → Depot.
- Kéo thả batch xe vào ô bãi tạm / depot để phân bổ; kéo card bãi tạm sang depot để chuyển xe.
- Dải occupancy theo tháng với cảnh báo màu (xanh <80%, vàng 80–100%, đỏ vượt capacity).
- Click card để mở panel theo dõi batch; sửa / tách đôi / xóa card ngay trong panel.

### 📦 Batch & Đăng ký
- Quản lý các lô xe nhập: tên batch, loại xe, số lượng, ngày nhập.
- Theo dõi tiến độ các bước đăng ký (Taxi Quota, TERA, KIR, KP, STNK) — click chip để chuyển trạng thái.
- Batch đã về depot đủ số lượng được tự động đánh dấu hoàn tất.

### 💰 Chi phí Bãi tạm & Depot
- Khai báo bãi tạm / depot: khu vực, địa chỉ, diện tích, sức chứa, thời hạn thuê, thời gian chuẩn bị.
- Tự động tổng hợp chi phí theo tháng (thuê đất, vận hành, xây dựng depot...) — hover ô tiền để xem chi tiết.
- Định nghĩa chi phí chuẩn tùy chỉnh + override theo từng địa điểm.

### 🛠 Tiện ích
- **Lưu / Mở JSON** — sao lưu và khôi phục toàn bộ dữ liệu kế hoạch.
- **Xuất Excel** — 6 sheet: địa điểm, batch, phân bổ, occupancy, chi phí TP/Depot.
- **Song ngữ 🇻🇳 Việt / 🇬🇧 Anh** — chuyển đổi bằng một nút bấm.

> 💡 Dữ liệu làm việc không tự động lưu trên server. Hãy dùng nút **Lưu JSON** để giữ lại kế hoạch của bạn, và **Mở JSON** để tải lại khi cần.

## 🧑‍💻 Phát triển

```bash
npm install
npm run dev      # chạy dev server (hot reload)
npm run build    # build ra thư mục dist/
npm run preview  # xem thử bản build
```

Cấu trúc source:

```
src/
  main.jsx            # entry
  App.jsx             # state trung tâm + điều phối (context)
  styles.css          # design system neo-brutalism pastel
  i18n.js             # bảng dịch VI/EN
  model.js            # state mặc định, migrate, helper thuần
  cost.js             # engine tính chi phí theo tháng
  exportio.js         # lưu/mở JSON + xuất Excel
  components/
    Toolbar, Tabs, Legend, BoardTab, BatchTab, CostTab, Panel
    modals/           # Batch, Địa điểm, Định nghĩa chi phí, Cài đặt, Nhập số lượng
```

## 🚀 Deploy

Deploy lên **Cloudflare Workers** bằng `wrangler deploy` — cấu hình trong `wrangler.jsonc` đã trỏ assets vào `./dist` và tự chạy `npm run build` trước khi deploy. Bản build là site tĩnh thuần nên cũng deploy được lên GitHub Pages, Netlify...

## 🗂 Bản cũ (v1)

Bản gốc một-file-HTML vẫn được giữ tại [`public/legacy.html`](public/legacy.html) và truy cập được ở đường dẫn `/legacy.html` trên bản deploy.
