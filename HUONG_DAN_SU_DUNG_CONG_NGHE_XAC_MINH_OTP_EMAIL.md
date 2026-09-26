# 📖 TÀI LIỆU HƯỚNG DẪN KỸ THUẬT & SỬ DỤNG HỆ THỐNG XÁC MINH OTP QUA EMAIL THỰC TẾ
## Nền Tảng Chợ Phiên Nông Sản Trực Tuyến - MarketLink Platform

---

## 📌 MỤC LỤC
1. [Giới Thiệu Tổng Quan](#1-giới-thiệu-tổng-quan)
2. [Kiến Trúc Kỹ Thuật & Công Nghệ](#2-kiến-trúc-kỹ-thuật--công-nghệ)
3. [Cấu Hình Hệ Thống & Google SMTP](#3-cấu-hình-hệ-thống--google-smtp)
4. [Cơ Sở Dữ Liệu & Vòng Đời Mã OTP](#4-cơ-sở-dữ-liệu--vòng-đời-mã-otp)
5. [Thiết Kế Mẫu Email HTML Thương Hiệu](#5-thiết-kế-mẫu-email-html-thương-hiệu)
6. [Tài Liệu Chi Tiết Các API Endpoints](#6-tài-liệu-chi-tiết-các-api-endpoints)
7. [Tích Hợp Giao Diện Frontend (React)](#7-tích-hợp-giao-diện-frontend-react)
8. [Quy Trình Kiểm Thử Thực Tế & Kịch Bản](#8-quy-trình-kiểm-thử-thực-tế--kịch-bản)
9. [Hướng Dẫn Giám Sát, Nhật Ký & Khắc Phục Sự Cố](#9-hướng-dẫn-giám-sát-nhật-ký--khắc-phục-sự-cố)
10. [Tiêu Chuẩn Bảo Mật Đạt Được](#10-tiêu-chuẩn-bảo-mật-đạt-được)

---

## 1. GIỚI THIỆU TỔNG QUAN

Tính năng **Xác minh mã OTP qua Email thực tế** của MarketLink phục vụ các nghiệp vụ bảo mật quan trọng:
- **Khôi phục & Đặt lại mật khẩu** cho Khách hàng (`CUSTOMER`), Nông dân (`FARMER`), và Quản trị viên (`ADMIN`).
- **Xác thực quyền sở hữu hòm thư điện tử** khi kích hoạt tài khoản.
- **Loại bỏ hoàn toàn cơ chế Dev Mock OTP**: Mã OTP không bao giờ được trả về phía Client thông qua API response (`devCode: null`), ngăn chặn 100% nguy cơ lộ mã bảo mật qua DevTools Network.
- **Gửi trực tiếp đến hộp thư cá nhân thật** của người dùng qua giao thức bảo mật SMTP STARTTLS với template HTML chuyên nghiệp.

---

## 2. KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ

### 2.1. Ngăn Xếp Công Nghệ (Tech Stack)
* **Backend:** Spring Boot 3.x / 4.x, Java 21 LTS, Spring WebFlux (Reactive Streams), Spring Data R2DBC.
* **Mail Client:** `spring-boot-starter-mail` (JavaMailSender / Jakarta Mail API).
* **Luồng xử lý bất đồng bộ:** Project Reactor với `Schedulers.boundedElastic()` để giải phóng WebFlux EventLoop threads.
* **Mã hóa:** `BCryptPasswordEncoder` (Spring Security Crypto) bảo vệ mật khẩu mới.
* **Cơ sở dữ liệu:** MySQL 8.0 trên VPS với R2DBC Connection Pooling.
* **Giao thức Email:** SMTP qua cổng 587 (STARTTLS) kết nối đến máy chủ Google Mail Server (`smtp.gmail.com`).
* **Frontend:** React 19, Vite, Vanilla CSS Design System hiện đại.

### 2.2. Sơ Đồ Trình Tự Xác Minh & Đặt Lại Mật Khẩu (Sequence Diagram)

```
[Người dùng (Browser)]       [MarketLink Backend]      [MySQL Database]      [Google SMTP Server]      [Hộp thư Email]
        │                            │                        │                       │                       │
        │── 1. Gửi Email yêu cầu ───>│                        │                       │                       │
        │   (/verification/send-otp) │                        │                       │                       │
        │                            │── 2. Kiểm tra user ───>│                       │                       │
        │                            │<── Trả về thông tin ───│                       │                       │
        │                            │                                                │                       │
        │                            │── 3. Sinh OTP (6 số)                           │                       │
        │                            │   Lưu user_verifications (10p, max 5 lần) ────>│                       │
        │                            │                                                │                       │
        │                            │── 4. Chuyển sang Schedulers.boundedElastic()   │                       │
        │                            │      Gửi Email HTML qua JavaMailSender ───────>│                       │
        │                            │                                                │── 5. Phát thư OTP ───>│
        │                            │                                                │                       │
        │<── 6. Phản hồi thành công ─│                                                │                       │
        │    (devCode = null)        │                                                │                       │
        │                            │                                                │                       │
        │    (Người dùng mở mail) ───────────────────────────────────────────────────────────────────────────>│ Đọc mã OTP
        │                            │                                                │                       │
        │── 7. Nhập OTP + Pass mới ─>│                                                │                       │
        │   (/reset-password)        │                                                │                       │
        │                            │── 8. Kiểm tra OTP hợp lệ & chưa dùng ─────────>│                       │
        │                            │── 9. Mã hóa mật khẩu BCrypt & cập nhật DB ────>│                       │
        │                            │── 10. Đánh dấu OTP is_used = TRUE ────────────>│                       │
        │<── 11. Đặt lại thành công ─│                                                │                       │
        │                            │                                                │                       │
        │── 12. Đăng nhập ngay ─────>│                                                │                       │
        │   với mật khẩu mới         │                                                │                       │
```

---

## 3. CẤU HÌNH HỆ THỐNG & GOOGLE SMTP

### 3.1. Cấu hình `application.properties` (Môi trường phát triển & Mặc định)
File: `src/main/resources/application.properties`

```properties
# ===================================================================
# CẤU HÌNH GỬI EMAIL (JavaMailSender / SMTP)
# ===================================================================
spring.mail.host=${SPRING_MAIL_HOST:smtp.gmail.com}
spring.mail.port=${SPRING_MAIL_PORT:587}
spring.mail.username=${SPRING_MAIL_USERNAME:nnquanga24051@cusc.ctu.edu.vn}
spring.mail.password=${SPRING_MAIL_PASSWORD:zzhklxfgtdtfmkhh}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.ssl.trust=smtp.gmail.com
spring.mail.default-encoding=UTF-8
```

### 3.2. Cấu hình Production trên VPS (`/etc/systemd/system/marketlink.service`)
Trên môi trường máy chủ Linux VPS, thông tin bảo mật được truyền thông qua biến môi trường an toàn của Systemd:

```ini
[Unit]
Description=MarketLink Spring Boot Backend API
After=syslog.target network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/marketlink/app

# Biến môi trường Email SMTP
Environment="SPRING_MAIL_HOST=smtp.gmail.com"
Environment="SPRING_MAIL_PORT=587"
Environment="SPRING_MAIL_USERNAME=nnquanga24051@cusc.ctu.edu.vn"
Environment="SPRING_MAIL_PASSWORD=zzhklxfgtdtfmkhh"

ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /var/www/marketlink/app/marketlink.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3.3. Hướng Dẫn Tạo & Cập Nhật Mật Khẩu Ứng Dụng (Google App Password) Khi Cần Đổi Email
Nếu sau này cần đổi email gửi thông báo sang một tài khoản khác, thực hiện các bước sau:
1. Đăng nhập tài khoản Google muốn dùng gửi mail.
2. Truy cập: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Đặt tên ứng dụng là **MarketLink** -> Bấm **Tạo**.
4. Google sẽ cấp một chuỗi gồm **16 chữ cái** (ví dụ: `zzhk lxfg tdtf mkhh`).
5. Cập nhật biến môi trường trên VPS:
   ```bash
   nano /etc/systemd/system/marketlink.service
   # Sửa SPRING_MAIL_USERNAME và SPRING_MAIL_PASSWORD (viết liền 16 ký tự không dấu cách)
   systemctl daemon-reload
   systemctl restart marketlink
   ```

---

## 4. CƠ SỞ DỮ LIỆU & VÒNG ĐỜI MÃ OTP

### 4.1. Bảng Dữ Liệu `user_verifications`
Mọi yêu cầu gửi mã xác minh đều được lưu trữ và kiểm soát nghiêm ngặt trong bảng `user_verifications`:

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| `verification_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính bản ghi xác minh |
| `user_id` | BIGINT | FOREIGN KEY -> `users(user_id)` | Định danh người dùng nhận mã |
| `verification_type` | VARCHAR(50) | NOT NULL | Loại xác minh: `PASSWORD_RESET`, `EMAIL_VERIFICATION` |
| `verification_code` | VARCHAR(10) | NOT NULL | Mã OTP ngẫu nhiên 6 chữ số (`100000` - `999999`) |
| `target_destination`| VARCHAR(150)| NOT NULL | Địa chỉ email hoặc SĐT người nhận |
| `is_used` | BOOLEAN | DEFAULT FALSE | Trạng thái đã sử dụng (chống Replay Attack) |
| `attempts_count` | INT | DEFAULT 0 | Số lần nhập sai mã (tối đa 5 lần) |
| `expires_at` | DATETIME | NOT NULL | Thời điểm hết hạn (thời lượng hiệu lực 10 phút) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm phát hành mã |

### 4.2. Cơ Chế Chống Gian Lận & Tấn Công (Brute-force & Replay)
* **Thời hạn hiệu lực:** Mã tự động vô hiệu sau 10 phút tính từ lúc tạo.
* **Giới hạn số lần thử (Max Attempts):** Cho phép tối đa **5 lần** nhập sai. Ở lần sai thứ 5, mã bị khóa vĩnh viễn, người dùng buộc phải yêu cầu mã mới.
* **Duy nhất một lần (One-Time-Use):** Sau khi xác minh hoặc đặt mật khẩu thành công, `is_used` được chuyển sang `TRUE`. Mã cũ không bao giờ được tái sử dụng.

---

## 5. THIẾT KẾ MẪU EMAIL HTML THƯƠNG HIỆU

Mẫu email được biên soạn trong [EmailService.java](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/src/main/java/com/gravity/marketlink/modules/auth/service/EmailService.java) với các đặc điểm cao cấp:
1. **Nhận diện thương hiệu MarketLink:** Header gradient xanh lá nông sản (`#16a34a` đến `#14532d`) cùng biểu tượng mầm cây `🌱`.
2. **Hộp mã OTP nổi bật:** Nền sáng viền nét đứt màu xanh, font chữ monospace kích thước lớn (`36px`), giãn cách chữ cái `8px` dễ nhìn trên màn hình điện thoại.
3. **Cảnh báo an toàn (Amber Warning Box):** Nhắc nhở người dùng không chia sẻ mã cho bất kỳ ai kể cả nhân viên hệ thống.
4. **Tương thích toàn diện:** Tương thích chuẩn hiển thị của Gmail (Web, iOS, Android), Apple Mail, Outlook.

---

## 6. TÀI LIỆU CHI TIẾT CÁC API ENDPOINTS

Base URL Production: `http://36.50.176.64/api/auth` (hoặc `/api/auth` qua proxy cục bộ).

### 6.1. API 1: Yêu Cầu Gửi Mã OTP (`send-otp`)
* **Endpoint:** `POST /api/auth/verification/send-otp`
* **Quyền truy cập:** Công khai (`public`).
* **Request Body:**
  ```json
  {
    "emailOrPhone": "nnquanga24051@cusc.ctu.edu.vn",
    "type": "PASSWORD_RESET"
  }
  ```
* **Response Thành Công (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Mã OTP đã được gửi.",
    "data": {
      "success": true,
      "message": "Mã xác minh OTP đã được gửi đến email n***1@cusc.ctu.edu.vn. Vui lòng kiểm tra hộp thư đến (Inbox) hoặc mục Spam.",
      "devCode": null
    },
    "timestamp": "2026-09-27T05:00:12.872751235"
  }
  ```
  *(Lưu ý: `devCode` luôn luôn là `null`, bảo đảm không rò rỉ mã OTP qua mạng).*

* **Các mã lỗi thường gặp:**
  * `404 Not Found`: Email không tồn tại trên hệ thống.
  * `500 Internal Server Error`: Lỗi kết nối máy chủ SMTP.

---

### 6.2. API 2: Kiểm Tra Mã OTP (`verify-otp`)
* **Endpoint:** `POST /api/auth/verification/verify-otp`
* **Request Body:**
  ```json
  {
    "emailOrPhone": "nnquanga24051@cusc.ctu.edu.vn",
    "code": "371128",
    "type": "PASSWORD_RESET"
  }
  ```
* **Response Thành Công (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Xác minh mã OTP thành công cho loại: PASSWORD_RESET",
    "data": {
      "success": true,
      "message": "Xác minh mã OTP thành công cho loại: PASSWORD_RESET",
      "devCode": null
    }
  }
  ```

---

### 6.3. API 3: Xác Nhận Đặt Lại Mật Khẩu Mới (`reset-password`)
* **Endpoint:** `POST /api/auth/reset-password`
* **Request Body:**
  ```json
  {
    "emailOrPhone": "nnquanga24051@cusc.ctu.edu.vn",
    "code": "371128",
    "newPassword": "MatKhauMoi@2026"
  }
  ```
* **Response Thành Công (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
    "data": {
      "success": true,
      "message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
      "devCode": null
    },
    "timestamp": "2026-09-27T05:00:27.496416661"
  }
  ```
* **Các lỗi có thể xảy ra:**
  * `Mã OTP không chính xác. Số lần còn lại: X` (Nếu nhập sai).
  * `Đã nhập sai mã quá 5 lần` (Nếu thử sai quá nhiều).
  * `Mã OTP đặt lại mật khẩu đã hết hạn` (Sau 10 phút).

---

## 7. TÍCH HỢP GIAO DIỆN FRONTEND (REACT)

File: [frontend/src/components/common/AuthModal.jsx](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/frontend/src/components/common/AuthModal.jsx)

### 7.1. Trạng Thái & Quy Trình Trên Giao Diện:
1. **Bước 1: Nhập Email:**
   * Người dùng nhấn `"Quên mật khẩu?"` trên màn hình đăng nhập.
   * Nhập email và nhấn nút `"Gửi mã xác minh OTP"`.
   * Giao diện kích hoạt bộ đếm ngược 60 giây (`countdown`) để hạn chế spam gửi lại liên tục.
2. **Bước 2: Hướng Dẫn & Nhập Mã OTP:**
   * Hiển thị bảng thông báo màu xanh lá:
     > 📬 *Mã xác minh bảo mật đã gửi tới **email_cua_ban**. Vui lòng kiểm tra hộp thư đến (Inbox) hoặc thư mục Spam/Rác.*
   * Người dùng nhập 6 số OTP và mật khẩu mới (tối thiểu 6 ký tự).
   * Kiểm tra khớp mật khẩu xác nhận tức thời phía client.
3. **Bước 3: Hoàn Tất:**
   * Sau khi đặt mật khẩu thành công, thông báo hiển thị tích xanh `✅`.
   * Sau 1.5 giây, modal tự động chuyển về màn hình đăng nhập và người dùng đăng nhập ngay bằng mật khẩu vừa tạo.

---

## 8. QUY TRÌNH KIỂM THỬ THỰC TẾ & KỊCH BẢN

### Kịch Bản 1: Khôi phục mật khẩu tài khoản thật
1. Mở trình duyệt truy cập website MarketLink (ví dụ `http://localhost:5173`).
2. Mở Modal Đăng nhập -> Chọn **Quên mật khẩu?**.
3. Điền email cá nhân thật của bạn: `nnquanga24051@cusc.ctu.edu.vn`.
4. Bấm **Gửi mã xác minh OTP**.
5. Mở hòm thư Gmail (hoặc Outlook/Yahoo tuỳ theo email người dùng), tìm thư có tiêu đề:
   `[MarketLink] Mã xác nhận đặt lại mật khẩu của bạn`.
6. Lấy mã 6 số (ví dụ: `371128`), quay lại website điền mã và nhập mật khẩu mới.
7. Bấm **Xác nhận đặt lại mật khẩu**.
8. Hệ thống thông báo thành công và chuyển về màn hình đăng nhập. Đăng nhập ngay bằng mật khẩu mới để vào trang chủ.

---

## 9. HƯỚNG DẪN GIÁM SÁT, NHẬT KÝ & KHẮC PHỤC SỰ CỐ

### 9.1. Lệnh Kiểm Tra Nhật Ký Gửi Mail Thời Gian Thực Trên VPS
Khi muốn theo dõi quá trình gửi mail trên server:

```bash
# Xem 50 dòng log gần nhất của dịch vụ backend
journalctl -u marketlink -n 50 --no-pager

# Bám sát log thời gian thực (Follow logs)
journalctl -u marketlink -f
```

Khi có yêu cầu gửi mail, log sẽ xuất hiện tương tự:
```
INFO  c.g.m.m.a.service.VerificationService    : Đã tạo mã OTP [xxxxxx] loại [PASSWORD_RESET] cho người dùng ID [...]
INFO  c.g.m.modules.auth.service.EmailService  : Bắt đầu gửi email OTP [xxxxxx] loại [PASSWORD_RESET] đến địa chỉ: ...
INFO  c.g.m.modules.auth.service.EmailService  : Đã gửi thành công email OTP tới: ...
```

### 9.2. Bảng Tra Cứu Sự Cố & Cách Xử Lý (Troubleshooting)

| Hiện Tượng | Nguyên Nhân Chính | Giải Pháp Xử Lý |
| :--- | :--- | :--- |
| **Lỗi 535: Authentication failed** | Mật khẩu ứng dụng sai hoặc tài khoản đổi mật khẩu Google | Tạo lại Mật khẩu ứng dụng 16 ký tự trên Google Account và cập nhật lại biến `SPRING_MAIL_PASSWORD`. |
| **Không thấy email trong Inbox** | Bộ lọc thư của nhà mạng đưa vào Spam/Junk | Kiểm tra thư mục **Spam** hoặc **Thư rác**; đánh dấu "Không phải spam" (Not Spam) để các thư sau vào thẳng Inbox. |
| **Mã OTP báo hết hạn** | Quá thời gian 10 phút kể từ lúc bấm gửi | Nhấn nút "Gửi lại mã" trên giao diện để nhận mã mới. |
| **Đã nhập sai quá 5 lần** | Người dùng hoặc kẻ xấu cố tình dò mã | Yêu cầu gửi lại mã mới để khởi tạo lại bộ đếm số lần thử. |

---

## 10. TIÊU CHUẨN BẢO MẬT ĐẠT ĐƯỢC

1. ✅ **Zero Dev-Code Exposure:** Loại bỏ hoàn toàn mã OTP trong JSON trả về phía Client.
2. ✅ **Non-blocking Execution:** Tác vụ gửi thư qua mạng chạy trên `Schedulers.boundedElastic()`, không làm giảm hiệu năng xử lý các request khác của ứng dụng Reactive WebFlux.
3. ✅ **Brute-force Protection:** Giới hạn 5 lần thử ngăn chặn tấn công dò quét tự động.
4. ✅ **Replay Attack Defense:** Mã bị vô hiệu ngay lập tức sau lần sử dụng đầu tiên (`is_used = true`).
5. ✅ **Time-based Invalidation:** Mã hết hạn nghiêm ngặt sau 10 phút.
6. ✅ **TLS/SSL Encryption:** Mã OTP được truyền tải mã hóa toàn trình qua kết nối STARTTLS của Google SMTP Server.
