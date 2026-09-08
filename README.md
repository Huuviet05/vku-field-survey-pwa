# 🏫 VKU Field Survey — Ứng Dụng Khảo Sát Hiện Trường PWA

> **Dự án**: Hệ thống Khảo sát Hiện trạng & Cơ sở Vật chất Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)  
> **Sinh viên thực hiện**: Nguyễn Hữu Việt  
> **Mã số sinh viên (MSV)**: 23IT309  
> **Đơn vị**: Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU) — Đại học Đà Nẵng  
> **Trực tuyến (Live Demo)**: Đã cấu hình triển khai tự động qua Vercel (HTTPS PWA)

---

## 📖 1. Giới Thiệu Ứng Dụng

**VKU Field Survey PWA** là giải pháp phần mềm chuyên biệt phục vụ công tác thanh tra, khảo sát, kiểm kê và đánh giá hiện trạng cơ sở vật chất phòng học, phòng lab chuyên dụng, hội trường và giảng đường tại toàn bộ khuôn viên Đại học VKU.

Ứng dụng được thiết kế theo triết lý **Offline-First (Ưu tiên ngoại tuyến)** dựa trên chuẩn **Progressive Web App (PWA)** hiện đại, giải quyết triệt để vấn đề nhân viên khảo sát phải làm việc tại các góc khuất, phòng kín, tầng hầm hoặc khu vực sóng di động/WiFi yếu chập chờn. Mọi thao tác ghi nhận, chụp ảnh minh chứng, đánh giá mức độ khẩn cấp đều diễn ra mượt mà, lưu trữ cục bộ và tự động đồng bộ lên máy chủ ngay khi thiết bị có kết nối mạng trở lại.

### ✨ Các Tính Năng Cốt Lõi
- 🏛️ **Danh mục cơ sở vật chất VKU thông minh**: Tích hợp sẵn dữ liệu 38+ phòng học và khu vực trọng điểm (Khu K, V, A, B, C, L, KTX, Nhà đa năng) với Modal tìm kiếm, lọc nhanh theo mã phòng và phân loại.
- 📋 **Phiếu khảo sát hiện trường chuẩn mực**: Đánh giá hiện trạng 3 cấp độ (*Đạt chuẩn*, *Hư hỏng nhẹ*, *Cần thay thế gấp*), gán mức độ ưu tiên (*Bình thường*, *Lưu ý*, *Khẩn cấp*), cùng checklist chi tiết từng hạng mục (Điện/đèn, Máy chiếu/TV, Điều hòa, Bàn ghế, Cửa, WiFi).
- 📸 **Nén & Xử lý ảnh hiện trường tối ưu**: Hỗ trợ chụp trực tiếp từ camera sau hoặc tải từ thư viện, tự động nén kích thước qua Canvas HTML5 để tối ưu hóa dung lượng lưu trữ cục bộ.
- 📴 **Hoạt động ngoại tuyến 100% (Offline-First)**: Lưu trữ dữ liệu an toàn trên **IndexedDB** và tự động đồng bộ nền thông qua **Background Sync API**.
- 📊 **Thống kê & Quản lý lịch sử**: Xem danh sách phiếu đã tạo, lọc theo tòa nhà/trạng thái đồng bộ, xuất dữ liệu ra file CSV/JSON và in biên bản khảo sát A4 chuyên nghiệp.
- 📱 **Đa nền tảng & Mobile Ready**: Giao diện Responsive chuẩn Mobile & Tablet, tích hợp Bottom Navigation tiện lợi và sẵn sàng đóng gói thành file **Android APK** thông qua Capacitor Bridge.

---

## 📁 2. Cấu Trúc Thư Mục Dự Án

```text
VKUFieldSurveyPWA/
├── dist/                         # Thư mục chứa mã nguồn sau khi build sản xuất
├── public/                       # Tài nguyên tĩnh công khai
│   ├── favicon.ico               # Favicon trình duyệt
│   ├── icon-192x192.png          # App Icon PWA độ phân giải 192px
│   ├── icon-512x512.png          # App Icon PWA độ phân giải 512px
│   ├── vku-logo.png              # Logo nhận diện thương hiệu VKU chính thức
│   ├── offline.html              # Trang fallback khi mất mạng hoàn toàn
│   └── manifest.webmanifest      # Cấu hình PWA Web App Manifest
├── src/                          # Mã nguồn chính ứng dụng
│   ├── components/               # Các React Components giao diện
│   │   ├── EquipmentChecklist.jsx# Bảng kiểm định trang thiết bị phòng
│   │   ├── Header.jsx            # Thanh điều hướng trên cùng & nhận diện VKU
│   │   ├── MobileBottomNav.jsx   # Thanh điều hướng đáy dành cho thiết bị di động
│   │   ├── PhotoCapture.jsx      # Module chụp, chọn và nén ảnh hiện trường
│   │   ├── PrintReportModal.jsx  # Modal xem trước và in biên bản khảo sát A4
│   │   ├── RoomPickerModal.jsx   # Modal tìm kiếm & chọn phòng học thông minh
│   │   ├── StatusBanner.jsx      # Thanh cảnh báo trạng thái mạng & số phiếu chờ sync
│   │   ├── SurveyDetailModal.jsx # Modal hiển thị chi tiết biên bản đã lưu
│   │   ├── SurveyForm.jsx        # Biểu mẫu nhập liệu khảo sát chính
│   │   ├── SurveyHistory.jsx     # Danh sách lịch sử khảo sát & tính năng xuất CSV
│   │   └── SurveyStats.jsx       # Thống kê, biểu đồ tiến độ & chỉ số KPI
│   ├── data/
│   │   └── vkuRooms.js           # Cơ sở dữ liệu danh mục phòng & giảng đường VKU
│   ├── db/
│   │   └── indexedDB.js          # Tầng lưu trữ IndexedDB (pending-surveys & surveys-history)
│   ├── hooks/
│   │   └── useOnlineStatus.js    # Custom Hook theo dõi trạng thái mạng online/offline
│   ├── utils/
│   │   └── imageCompressor.js    # Tiện ích nén ảnh phía client bằng HTML5 Canvas
│   ├── App.jsx                   # Component gốc điều phối trạng thái và layout
│   ├── index.css                 # Hệ thống CSS Design System (Theme sáng, biến màu VKU)
│   ├── main.jsx                  # Điểm khởi động React và kích hoạt Service Worker
│   └── sw.js                     # Custom Service Worker (Cache-First + Background Sync)
├── capacitor.config.ts           # Cấu hình đóng gói Native Android qua Capacitor
├── index.html                    # File HTML gốc tích hợp thẻ meta PWA
├── package.json                  # Định nghĩa dependencies và kịch bản scripts
├── vercel.json                   # Cấu hình định tuyến và caching headers trên Vercel
└── vite.config.js                # Cấu hình Vite & vite-plugin-pwa (InjectManifest)
```

---

## 🛠️ 3. Các Công Nghệ Sử Dụng

| Công Nghệ / Thư Viện | Phiên Bản | Vai Trò Trong Dự Án |
| :--- | :--- | :--- |
| **React** | 19.x | Thư viện xây dựng giao diện người dùng Component-based |
| **Vite** | 8.x | Build tool thế hệ mới với tốc độ Hot Reload siêu nhanh |
| **vite-plugin-pwa** | 1.3.x | Tích hợp quy chuẩn PWA và tạo Manifest tự động |
| **Workbox (Workbox-SW)** | 7.x | Quản lý Pre-caching và các chiến lược Caching nâng cao |
| **IndexedDB (`idb`)** | 8.x | Cơ sở dữ liệu NoSQL cục bộ không giới hạn dung lượng lưu trữ |
| **React Hook Form & Zod** | 7.x / 4.x | Quản lý state biểu mẫu và xác thực (validation) chặt chẽ |
| **Background Sync API** | Native W3C | Hàng đợi đồng bộ dữ liệu chạy nền khi có internet |
| **HTML5 Canvas API** | Native | Nén ảnh trực tiếp tại client giảm 85% tải lưu trữ |
| **Capacitor Bridge** | 7.x | Nền tảng đóng gói mã nguồn Web thành ứng dụng Android APK |
| **Vanilla Modern CSS** | CSS3 Grid/Flex | Hệ thống Design System màu sắc nhận diện chuẩn VKU |

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local)

### Yêu Cầu Hệ Thống
- Đã cài đặt **Node.js** phiên bản `>= 18.x` trở lên.
- Trình quản lý gói **npm** hoặc **yarn**.

### Các Bước Thực Hiện

```bash
# Bước 1: Clone kho lưu trữ về máy tính
git clone https://github.com/Huuviet05/vku-field-survey-pwa.git
cd VKUFieldSurveyPWA

# Bước 2: Cài đặt các gói phụ thuộc (dependencies)
npm install

# Bước 3: Khởi chạy máy chủ phát triển (Development Server)
npm run dev
# Truy cập giao diện tại: http://localhost:5173

# Bước 4: Đóng gói dự án phục vụ môi trường Production (PWA & Service Worker kích hoạt đầy đủ)
npm run build

# Bước 5: Chạy thử bản build đóng gói
npm run preview

# Bước 6 (Tùy chọn): Đồng bộ và xuất bản Android APK bằng Capacitor
npm run build:mobile
npm run cap:open
```

---

## ☁️ 5. Triển Khai & Kiểm Định PWA

- **Vercel Deployment**: Dự án tích hợp cấu hình bảo mật HTTPS và chính sách `Cache-Control` tối ưu thông qua tệp `vercel.json`.
- **Tiêu chuẩn PWA**: Đạt chuẩn đánh giá **Google Lighthouse**:
  - ✅ Cài đặt được lên màn hình chính (Installable PWA).
  - ✅ Hỗ trợ Offline với Service Worker và Fallback Document.
  - ✅ Đạt chuẩn Web App Manifest và Responsive trên mọi kích thước màn hình.

---

## 👨‍🎓 6. Thông Tin Sinh Viên Thực Hiện

- **Họ và tên**: **Nguyễn Hữu Việt**
- **Mã số sinh viên (MSV)**: **23IT309**
- **Trường**: Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)
- **GitHub**: [@Huuviet05](https://github.com/Huuviet05)
