# Hướng Dẫn Toàn Diện Tích Hợp Cloudflare (Miễn Phí) Phía Trước Vercel Cho Hi Phim

> **Mục tiêu:** Tăng tốc độ mở trang gần như tức thì tại Việt Nam, giảm 95% - 99% băng thông Origin (Fast Data Transfer) và lượt gọi Serverless trên Vercel, giúp hệ thống chịu tải hàng chục nghìn lượt xem mỗi ngày mà không vượt quá hạn mức miễn phí.

---

## 🌟 1. Lợi Ích Cốt Lõi Khi Đặt Cloudflare Phía Trước Vercel

1. **Edge Cache tại Việt Nam (Hà Nội & TP.HCM):** Toàn bộ poster, hình ảnh, file CSS, JavaScript và API dữ liệu phim được lưu tại cụm máy chủ Cloudflare trong nước, phản hồi đến người dùng với độ trễ cực thấp (< 15ms).
2. **Tiết kiệm 99% Băng thông Vercel:** Vercel chỉ nhận yêu cầu khi cache tại Cloudflare hết hạn hoặc khi có thay đổi mới.
3. **Bảo vệ toàn diện (Anti-DDoS & Bot Shield):** Tự động lọc các cuộc tấn công DDoS tầng ứng dụng (Lớp 7), bot crawl rác, crawler AI tiêu tốn tài nguyên.
4. **Chuẩn mã hóa SSL/TLS hiện đại:** Hỗ trợ HTTP/3 (QUIC), TLS 1.3 và nén dữ liệu Brotli tối ưu tốc độ.

---

## 🚀 2. Hướng Dẫn Cấu Hình Từng Bước

### Bước 1: Thêm Tên Miền Vào Cloudflare

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Bấm nút **Add a site** (Thêm trang web) ➔ Nhập tên miền của bạn (ví dụ: `hiphim.one`).
3. Chọn gói **Free** (Miễn phí) ➔ Bấm **Continue**.
4. Cloudflare sẽ tự động quét các bản ghi DNS hiện tại. Bấm **Continue**.
5. Cloudflare sẽ cung cấp 2 địa chỉ Nameservers (ví dụ: `carl.ns.cloudflare.com` và `maya.ns.cloudflare.com`).
6. Đăng nhập vào nhà cung cấp tên miền (Namecheap, Porkbun, Tenten, PA Vietnam, Inet...) ➔ Thay đổi Nameserver của tên miền trỏ về 2 địa chỉ của Cloudflare cung cấp.

---

### Bước 2: Cấu Hình Bản Ghi DNS (Bật Đám Mây Cam - Proxied)

Trong menu **DNS** ➔ **Records** của Cloudflare, thiết lập các bản ghi trỏ về Vercel:

| Type (Loại) | Name (Tên) | Content (Giá trị) | Proxy status (Trạng thái) | TTL |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | **Proxied (Đám mây cam bật)** | Auto |
| **CNAME** | `www` | `cname.vercel-dns.com` | **Proxied (Đám mây cam bật)** | Auto |

> ⚠️ **Lưu ý:** Bắt buộc phải bật **Proxied (Đám mây màu cam)** thì lưu lượng mới đi qua bộ nhớ đệm và tường lửa của Cloudflare.

---

### Bước 3: Cấu Hình SSL/TLS (Cực Kỳ Quan Trọng)

Truy cập menu **SSL/TLS** trên Cloudflare:

1. **Mục Overview:** Chọn chế độ mã hóa là **Full (strict)**.
   - 🔴 **Tuyệt đối KHÔNG chọn Flexible:** Nếu chọn Flexible, bạn sẽ gặp lỗi vòng lặp chuyển hướng vô tận `ERR_TOO_MANY_REDIRECTS` vì Vercel luôn tự động chuyển hướng sang HTTPS.
2. **Mục Edge Certificates:**
   - **Always Use HTTPS:** Bật **ON** (Tự động chuyển mọi kết nối HTTP sang HTTPS).
   - **Automatic HTTPS Rewrites:** Bật **ON** (Tự động sửa các link ảnh mixed-content).
   - **Minimum TLS Version:** Chọn `TLS 1.2` hoặc `TLS 1.3`.
   - **Opportunistic Encryption:** Bật **ON**.

---

### Bước 4: Thiết Lập Cache Rules (Tối Ưu 99% Băng Thông Vercel)

Truy cập menu **Caching** ➔ **Cache Rules** ➔ Bấm **Create rule** để tạo 3 rules (gói Free hỗ trợ tối đa 10 rules):

#### Rule 1: Bypass Cache Cho Quản Trị & Đăng Nhập (Ưu tiên cao nhất)
- **Rule name:** `Bypass Admin and Auth`
- **When incoming requests match:**
  - `(http.request.uri.path starts_with "/admin") or (http.request.uri.path starts_with "/api/admin") or (http.request.uri.path starts_with "/api/auth")`
- **Cache eligibility:** Chọn **Bypass cache**.
- 💡 *Mục đích: Đảm bảo dữ liệu quản trị, lượt xem, phiên đăng nhập tài khoản luôn là thời gian thực.*

#### Rule 2: Cache Static Assets Tối Đa (Lưu ảnh & mã nguồn trên máy chủ VN)
- **Rule name:** `Cache NextJS Static Assets`
- **When incoming requests match:**
  - `(http.request.uri.path starts_with "/_next/static/") or (http.request.uri.path starts_with "/images/") or (http.request.uri.path.extension in {"woff2" "woff" "ttf" "png" "jpg" "jpeg" "webp" "svg" "ico"})`
- **Cache eligibility:** Chọn **Eligible for cache**.
- **Edge Cache TTL:** Chọn `Ignore cache-control header and use this TTL` ➔ Nhập `1 month` (30 ngày).
- **Browser Cache TTL:** Chọn `Override origin and use this TTL` ➔ Nhập `1 month` (30 ngày).

#### Rule 3: Cache API Phim (Giảm tải 95% CPU Vercel Serverless)
- **Rule name:** `Cache Movie API`
- **When incoming requests match:**
  - `(http.request.uri.path starts_with "/api/phim")`
- **Cache eligibility:** Chọn **Eligible for cache**.
- **Edge Cache TTL:** Chọn `Ignore cache-control header and use this TTL` ➔ Nhập `2 hours` (hoặc `4 hours`).
- 💡 *Mục đích: Khi hàng nghìn người cùng tìm kiếm hoặc xem một bộ phim, chỉ 1 yêu cầu đầu tiên gọi đến Vercel/phimapi, toàn bộ lượt xem còn lại được Cloudflare phản hồi ngay lập tức.*

---

### Bước 5: Cấu Hình Tăng Tốc Độ Mở Trang (Speed)

Truy cập menu **Speed** ➔ **Optimization**:

1. **Brotli:** Bật **ON** (Thuật toán nén cao cấp của Google, tiết kiệm thêm 20% dung lượng so với Gzip).
2. **Early Hints:** Bật **ON** (Gửi tín hiệu nạp trước CSS/Font cho trình duyệt trong khi đợi HTML).
3. **HTTP/3 (with QUIC):** Vào **Network** ➔ Bật **ON** (Tăng tốc tải video và giảm rớt gói trên mạng 4G/5G).
4. **0-RTT Connection Resumption:** Bật **ON** (Kết nối lại tức thì cho người dùng đã từng vào web).

---

### Bước 6: Bảo Mật & Chống Bot Quét (Security)

Truy cập menu **Security** ➔ **Bots**:
1. **Bot Fight Mode:** Bật **ON** (Tự động phát hiện và chặn các scraper rác, scanner lỗ hổng phổ biến).
2. **Security Level:** Để ở mức `Medium` (hoặc `High` khi website bị tấn công).

---

## 🔍 3. Kiểm Tra Sau Khi Cấu Hình

Sau khi cấu hình xong, bạn có thể kiểm tra hiệu quả bằng cách:

1. Mở trình duyệt ➔ Bấm phím `F12` (Developer Tools) ➔ Chuyển qua tab **Network**.
2. Tải lại trang web ➔ Bấm vào một file hình ảnh hoặc file JS bất kỳ:
   - Xem trường **Response Headers**:
     - `cf-cache-status: HIT` ➔ ✅ Tuyệt vời! File đã được phục vụ trực tiếp từ bộ nhớ đệm Cloudflare tại Việt Nam.
     - `cf-ray: ... - HAN` hoặc `SGN` ➔ ✅ Đang kết nối tới máy chủ Cloudflare Hà Nội hoặc TP. Hồ Chí Minh.
     - `server: cloudflare` ➔ ✅ Đám mây bảo vệ Cloudflare đang hoạt động chuẩn xác.
