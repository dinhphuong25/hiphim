# Kế hoạch phát triển Ứng dụng Hi Phim iOS (React Native Expo)

> **Mục tiêu:** Xây dựng ứng dụng Native cho hệ điều hành iOS (iPhone & iPad) với hiệu năng mượt mà 60-120fps, trình phát video chuyên dụng (HLS stream), đồng bộ lịch sử xem và yêu thích, đặt trong thư mục riêng `mobile/` mà **hoàn toàn không làm ảnh hưởng đến website Next.js hiện tại**.

---

## 🛡️ Cam kết An Toàn Tuyệt Đối cho Website (Zero-Impact Guarantee)
1. **Cô lập thư mục:** Toàn bộ mã nguồn app iOS nằm trọn vẹn trong thư mục `mobile/`, có `package.json` và `node_modules` riêng biệt.
2. **Không đổi cấu trúc Web:** Thư mục gốc `app/`, `components/`, `lib/`, `next.config.ts` của website giữ nguyên trạng 100%.
3. **Quy trình Deploy Web không đổi:** File workflow GitHub Actions (`deploy-cloudflare.yml`) chỉ đóng gói Next.js web, bỏ qua thư mục `mobile/`.
4. **Git Ignore:** Thêm các file tạm và build của iOS (`mobile/.expo/`, `mobile/ios/`, `mobile/node_modules/`) vào `.gitignore`.

---

## 🏗️ Kiến trúc & Công nghệ (Tech Stack)
* **Framework:** React Native + **Expo SDK 52+** (Hỗ trợ iOS 15.0+ trở lên, sẵn sàng cho iOS 18+).
* **Điều hướng (Navigation):** **Expo Router** (Định tuyến dạng file-based tương đồng với Next.js App Router).
* **Trình phát Video Native:** **`expo-video`** (AVPlayer native của Apple với hỗ trợ HLS streaming, tua mượt, chế độ toàn màn hình xoay ngang, điều chỉnh tốc độ, khóa màn hình).
* **Lưu trữ dữ liệu cục bộ (Offline):** `@react-native-async-storage/async-storage` (Lưu lịch sử xem, phim yêu thích tức thì ngay trên máy).
* **Giao diện & Chủ đề:** Chuẩn phong cách **Hi Phim Dark Cinema** (Nền tối OLED `#050807`, `#111714`, điểm nhấn xanh neon `#20D66B`).
* **Icons:** `lucide-react-native` hoặc `@expo/vector-icons`.

---

## 📁 Cấu trúc Thư mục Dự kiến (`mobile/`)

```text
mobile/
├── app/                         # Expo Router screens
│   ├── (tabs)/                  # Bottom Tab Navigator
│   │   ├── index.tsx            # Trang Chủ (Featured banner, danh sách phim hot)
│   │   ├── cinema.tsx           # Phim Chiếu Rạp
│   │   ├── explore.tsx          # Khám Phá (Thể loại, Quốc gia, Năm)
│   │   ├── favorites.tsx        # Phim Yêu Thích
│   │   └── history.tsx          # Lịch Sử Xem
│   ├── movie/
│   │   └── [slug].tsx           # Chi tiết phim (Poster, tóm tắt, danh sách tập)
│   ├── watch/
│   │   └── [slug].tsx           # Trình xem phim Native Player toàn màn hình
│   ├── search.tsx               # Tìm kiếm phim tức thì với bộ lọc
│   └── _layout.tsx              # Root Layout & Theme Provider
├── components/
│   ├── ui/
│   │   ├── BrandLogo.tsx        # Logo Hi Phim phong cách Vector Native
│   │   ├── MovieCard.tsx        # Thẻ phim mượt mà (FlatList tối ưu)
│   │   └── NativeHeader.tsx     # Thanh Header iOS với nút Menu và Tìm kiếm
│   ├── player/
│   │   └── VideoPlayer.tsx      # Bộ điều khiển trình phát phim (Play, Pause, Tua, Server, Tập)
│   └── explore/
│       └── ExploreModals.tsx    # Modal chọn Quốc gia, Thể loại, Năm phát hành
├── services/
│   ├── api.ts                   # Gọi API PhimAPI (Lấy danh sách, chi tiết, tập phim)
│   └── storage.ts               # Quản lý lưu và đồng bộ Lịch sử & Yêu thích
├── constants/
│   └── theme.ts                 # Màu sắc thương hiệu (#20D66B, #050807, typography)
├── app.json                     # Cấu hình Expo & iOS Bundle Identifier (com.hiphim.app)
└── package.json                 # Quản lý thư viện độc lập của mobile
```

---

## 📋 Lộ trình Triển khai (5 Giai đoạn)

### Giai đoạn 1: Khởi tạo nền móng ứng dụng Expo trong `mobile/`
- [ ] Cập nhật `.gitignore` ở thư mục gốc để bỏ qua các thư mục build của mobile.
- [ ] Khởi tạo dự án Expo TypeScript trong `mobile/` với cấu trúc Expo Router.
- [ ] Cấu hình `app.json` (Tên hiển thị: **Hi Phim**, bundle ID, splash screen, icon nền tối, quyền truy cập mạng).
- [ ] Cài đặt các gói cốt lõi: `expo-router`, `expo-video`, `react-native-safe-area-context`, `expo-status-bar`, `lucide-react-native`, `@react-native-async-storage/async-storage`.

### Giai đoạn 2: Thiết kế Hệ thống UI & Thanh Điều Hướng (Bottom Tabs)
- [ ] Xây dựng theme token (`constants/theme.ts`) với màu xanh thương hiệu `#20D66B` và nền cinema `#050807`.
- [ ] Xây dựng thanh điều hướng dưới đáy (Bottom Tab Dock) chuẩn iOS với 5 tab: **Trang Chủ**, **Chiếu Rạp**, **Khám Phá**, **Yêu Thích**, **Lịch Sử**.
- [ ] Xây dựng `NativeHeader` với Logo Hi Phim và nút tìm kiếm phim nhanh.

### Giai đoạn 3: Kết nối API Phim & Hiển thị Danh Sách
- [ ] Xây dựng `services/api.ts` kết nối với API nguồn phim (hỗ trợ phân trang, lọc thể loại, quốc gia, năm).
- [ ] Xây dựng component `MovieCard` sử dụng `FlatList` tối ưu bộ nhớ (tránh giật lag khi cuộn hàng trăm phim).
- [ ] Xây dựng màn hình tìm kiếm phim `search.tsx` với debounce tìm kiếm thời gian thực.
- [ ] Xây dựng màn hình Khám Phá với danh sách chọn 26 Thể loại & 36 Quốc gia dạng lưới to rõ.

### Giai đoạn 4: Màn hình Chi tiết & Trình phát Video Native (`expo-video`)
- [ ] Xây dựng màn hình chi tiết phim `movie/[slug].tsx` (Poster nghệ thuật, thông tin diễn viên, nội dung, danh sách server và số tập).
- [ ] Xây dựng màn hình xem phim `watch/[slug].tsx`:
  - Phát luồng HLS `.m3u8` mượt mà với phần cứng Apple AVPlayer.
  - Tự động xoay ngang toàn màn hình (Landscape auto-rotate).
  - Cử chỉ chạm 2 lần để tua 10 giây trước/sau.
  - Tự động lưu mốc thời gian đang xem (Resume playback).
  - Chuyển tập và chọn server dự phòng nhanh chóng.

### Giai đoạn 5: Đồng bộ Dữ liệu & Kiểm thử (Verification)
- [ ] Lưu trữ cục bộ Lịch sử xem và Phim yêu thích qua AsyncStorage (xem lại bất cứ lúc nào không cần mạng).
- [ ] Kiểm tra tương thích các dòng iPhone (Dynamic Island, Tai thỏ Notch, iPhone SE màn hình nhỏ).
- [ ] Hướng dẫn chạy thử nghiệm trực tiếp trên iPhone qua ứng dụng **Expo Go** (chỉ cần quét mã QR).
