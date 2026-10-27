# 📱 Hi Phim - iOS Native App (Build & Distribution Guide)

Ứng dụng xem phim trực tuyến Native dành cho hệ điều hành **iOS** (iPhone & iPad), được phát triển bằng **React Native (Expo SDK 52)**, **Expo Router**, và **expo-video**.

> 🔒 **Cô lập 100%:** Thư mục `mobile/` hoạt động độc lập hoàn toàn với website Next.js ở thư mục gốc (không ảnh hưởng bất kỳ file nào trên web).

---

## 🌟 Thông Số Kỹ Thuật Đóng Gói (Production Specs)

- **Bundle Identifier:** `com.hiphim.app`
- **Phiên bản:** `1.0.0` (Build `1`)
- **Icon App:** `1024x1024` chuẩn Apple (không có kênh alpha/trong suốt).
- **Splash Screen:** `2048x2048` nền đen OLED Dark Cinema (`#050807`).
- **Tuân thủ mã hóa Apple:** Đã kích hoạt `ITSAppUsesNonExemptEncryption: false` (tự động duyệt TestFlight).
- **Media Engine:** HLS `.m3u8` Stream qua Apple Native AVPlayer (`expo-video`), hỗ trợ PiP & Background Audio.

---

## 🚀 Hướng Dẫn Build File `.ipa` (EAS Cloud - Không cần máy Mac)

Vì bạn đang làm việc trên máy tính Windows, hệ thống sẽ sử dụng dịch vụ đám mây **EAS (Expo Application Services)** với máy chủ Mac mini chuyên dụng của Expo để biên dịch và xuất file `.ipa`.

### Bước 1: Đăng nhập tài khoản Expo (Miễn phí)
Nếu bạn chưa có tài khoản Expo, hãy tạo tài khoản miễn phí tại [expo.dev/signup](https://expo.dev/signup) (chỉ mất 30 giây).

Mở PowerShell tại thư mục `mobile/`:
```powershell
cd mobile
npx eas-cli login
```
*(Nhập Email/Username và Mật khẩu tài khoản Expo của bạn).*

---

### Bước 2: Liên kết dự án với tài khoản Expo
Chạy lệnh:
```powershell
npx eas-cli project:init
```
*(Bấm Enter để xác nhận liên kết dự án).*

---

### Bước 3: Build file `.ipa` để tự cài đặt hoặc ký chứng chỉ riêng

Để xuất file `.ipa` độc lập (dành cho cài đặt Ad-Hoc, Sideload qua AltStore/TrollStore/Sideloadly, hoặc ký với chứng chỉ doanh nghiệp/chứng chỉ P12 riêng):

```powershell
npm run build:ios
```
*(Hoặc chạy lệnh: `npx eas-cli build --platform ios --profile preview`)*

1. Khi được hỏi về Apple Credentials:
   - Nếu bạn có chứng chỉ riêng (`.p12` và `.mobileprovision`), bạn có thể chọn nạp file lên.
   - Hoặc bạn có thể để EAS tự động quản lý chứng chỉ (Managed Credentials).
2. Quá trình build sẽ diễn ra trên đám mây trong khoảng 5-10 phút.
3. Khi hoàn tất, terminal sẽ in ra đường link tải trực tiếp file **`.ipa`** về máy tính của bạn!

---

### Bước 4: Đẩy App lên TestFlight & App Store (Tự động)

Khi bạn muốn xuất bản ứng dụng lên **Apple TestFlight** và **App Store**:

```powershell
npm run build:production
```
*(Hoặc chạy lệnh: `npx eas-cli build --platform ios --profile production --auto-submit`)*

- EAS sẽ yêu cầu đăng nhập tài khoản Apple Developer ($99/năm) hoặc nhập App Store Connect API Key.
- Hệ thống sẽ tự động ký chứng chỉ App Store Distribution, đóng gói bản build và đẩy trực tiếp lên **TestFlight** / **App Store Connect**.

---

## 📂 Danh Sách File Cấu Hình Build
- `mobile/app.json`: Định danh Bundle ID, App Icon, Splash Screen, Quyền PiP & Background Audio.
- `mobile/eas.json`: Cấu hình hồ sơ build (`preview` cho file `.ipa` nội bộ, `production` cho TestFlight / App Store).
- `mobile/assets/icon.png`: App Icon 1024x1024 chất lượng cao.
- `mobile/assets/splash.png`: Màn hình khởi động 2048x2048.
