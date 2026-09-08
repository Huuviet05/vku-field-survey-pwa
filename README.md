# 🏫 VKU Field Survey — Ứng Dụng Khảo Sát Hiện Trường PWA

> **Hệ thống Khảo sát Hiện trạng & Cơ sở Vật chất Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU).**
> Được xây dựng với chuẩn **Progressive Web App (PWA)**, hoạt động ngoại tuyến (Offline-First), tự động đồng bộ nền (Background Sync) và có thể cài đặt trực tiếp lên thiết bị di động / máy tính.

---

## ✨ Tính Năng Nổi Bật

- 🏛️ **Danh mục cơ sở vật chất VKU thông minh**:
  - Tích hợp sẵn 38+ phòng học, phòng lab chuyên dụng, hội trường và khu vực tại các tòa nhà Khu K, Khu V, Khu A, B, C, Khu L, KTX, Khu Thể thao.
  - Tìm kiếm tức thì và lọc nhanh theo khu vực, phân loại phòng (Lý thuyết, Thực hành/Lab, Văn phòng, Tiện ích).
- 📋 **Phiếu khảo sát chuẩn mực & Trực quan**:
  - Đánh giá hiện trạng tổng thể theo chuẩn: *Đạt chuẩn*, *Hư hỏng nhẹ*, *Cần thay thế gấp*.
  - Thiết lập mức độ ưu tiên can thiệp: *Bình thường*, *Cần lưu ý*, *Khẩn cấp*.
  - Checklist kiểm tra chi tiết từng hạng mục: Hệ thống điện & Đèn, Máy chiếu & TV, Điều hòa & Quạt, Bàn ghế, Cửa & Cửa sổ, Mạng WiFi.
- 📸 **Tối ưu hình ảnh minh chứng hiện trường**:
  - Hỗ trợ chụp ảnh trực tiếp từ camera sau (`capture="environment"`) hoặc tải ảnh từ thư viện máy.
  - Tự động **nén ảnh bằng Canvas HTML5** trước khi lưu trữ, giúp tiết kiệm bộ nhớ và truyền tải siêu nhanh.
- 📴 **Hoạt động ngoại tuyến 100% (Offline-First)**:
  - Lưu trữ dữ liệu an toàn trong trình duyệt thông qua **IndexedDB**.
  - Tự động kích hoạt **Background Sync** khi có kết nối internet trở lại.
- 📑 **Quản lý lịch sử & Xuất báo cáo**:
  - Theo dõi danh sách phiếu khảo sát, lọc theo trạng thái đồng bộ và tòa nhà.
  - Xuất dữ liệu bảng tính định dạng CSV và sao lưu JSON.
  - In biên bản khảo sát hiện trường chuẩn hành chính A4 (hoặc lưu PDF).
- 📊 **Thống kê & Theo dõi KPI hiện trường**:
  - Bảng tổng hợp tỷ lệ đạt chuẩn, danh sách các phòng cần xử lý khẩn cấp và biểu đồ tiến độ khảo sát theo từng tòa nhà.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 19, Vite
- **PWA & Offline**: `vite-plugin-pwa`, `Workbox`, Service Worker, Background Sync API
- **Local Storage**: IndexedDB (`idb`)
- **Validation**: React Hook Form, Zod
- **Styling**: Vanilla CSS (Modern Light Theme, Design System VKU)
- **Deployment**: Vercel (HTTPS, Auto CI/CD)

---

## 🚀 Khởi Chạy Dự Án Trên Local

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Đóng gói bản phát hành (Production Build)
npm run build

# 4. Xem trước bản đóng gói
npm run preview
```

---

## 🌐 Triển Khai Lên Vercel

Dự án đã được định cấu hình sẵn với tệp `vercel.json` để:
- Tự động điều hướng SPA (`rewrite` về `index.html`).
- Cung cấp tiêu đề bộ nhớ đệm chuẩn (`Cache-Control`) cho Service Worker `sw.js` và `manifest.webmanifest`.
- Đảm bảo đạt 100% tiêu chí PWA Installable qua giao thức HTTPS.

---

## 👤 Tác Giả

- **Nguyễn Hữu Việt** — [GitHub: @Huuviet05](https://github.com/Huuviet05)
- Đơn vị: Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)
