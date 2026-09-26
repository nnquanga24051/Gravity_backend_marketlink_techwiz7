# Hướng Dẫn Deploy MarketLink lên VPS (Backend & Database)

Tài liệu này tổng hợp toàn bộ thông tin cấu hình, kiến trúc và các bước cần thiết để deploy, quản lý ứng dụng MarketLink trên môi trường máy chủ (VPS).

---

## 1. Thông tin chung
- **IP VPS:** `36.50.176.64`
- **Tài khoản SSH:** `root`
- **Mật khẩu SSH:** `Propao123pro!`

### Thông tin Cơ Sở Dữ Liệu (MariaDB)
- **Database Name:** `marketlink_db`
- **Database User:** `marketlink_user`
- **Database Password:** `MarketLink@2026Secure`
- **Port:** `3306`

---

## 2. Kiến trúc hệ thống trên VPS
Hệ thống được thiết lập để chạy Backend độc lập, nhận request thông qua Proxy, cụ thể như sau:
- **Backend (Spring Boot):** Chạy ngầm ở cổng `8081` (localhost), được quản lý tự động bởi file service của Linux (`marketlink.service`). Khi VPS khởi động lại, Backend sẽ tự động chạy.
- **Database (MariaDB):** Chạy ở cổng `3306`.
- **Web Server (Nginx):** Lắng nghe ở cổng `80` (HTTP). Nginx đóng vai trò là cửa ngõ (Reverse Proxy):
  - Chuyển tiếp các request có tiền tố `/api`, `/swagger-ui/`, `/v3/` vào Backend (cổng 8081).
  - Trả về trực tiếp các file ảnh trong thư mục `/var/www/marketlink/uploads/` khi có request.

### Cấu trúc thư mục ứng dụng trên VPS:
- File chạy Backend (`.jar`): `/var/www/marketlink/app/`
- Thư mục Uploads (lưu hình ảnh sản phẩm, avatar...): `/var/www/marketlink/uploads/`

---

## 3. Quy trình Deploy Cập nhật (Sử dụng Script tự động)
Để tiện lợi cho quá trình phát triển, mọi thao tác Build và Deploy đã được tự động hóa vào file script `deploy_backend_db.ps1`.

**Các bước thực hiện:**
1. Mở Terminal (PowerShell) trên máy tính cá nhân.
2. Đảm bảo bạn đang đứng ở thư mục gốc của Backend (`Gravity_backend_marketlink_techwiz7`).
3. Chạy lệnh sau:
   ```powershell
   .\deploy_backend_db.ps1
   ```

**Script trên sẽ tự động làm các việc sau:**
- Dọn dẹp và đóng gói mã nguồn Spring Boot ra file `.jar` (`mvn clean package -DskipTests`).
- Đẩy (Upload) file `.jar` mới nhất lên VPS (thư mục `/var/www/marketlink/app/`).
- Đẩy 2 file SQL (`schema.sql` và `seed_all_tables_sample_data.sql`) lên VPS.
- Kết nối SSH vào VPS và tự động thực thi chuỗi lệnh:
  1. Tạm dừng Backend (`systemctl stop marketlink`).
  2. Xóa toàn bộ dữ liệu cũ và chạy lại 2 file SQL để khởi tạo cấu trúc và nạp dữ liệu mẫu mới.
  3. Khởi động lại Backend với bản cập nhật mới (`systemctl start marketlink`).

*(Lưu ý: Nếu quá trình chạy script hiển thị yêu cầu nhập password (hỏi nhiều lần ở các bước `scp` và `ssh`), bạn hãy nhập hoặc paste mật khẩu VPS: `Propao123pro!`)*

---

## 4. Quản trị Cơ Sở Dữ Liệu qua Giao diện web
Thay vì dùng dòng lệnh (CLI), bạn có thể dễ dàng xem và chỉnh sửa dữ liệu thông qua phpMyAdmin.
- **Đường dẫn truy cập:** `http://36.50.176.64/phpmyadmin`
- **Tài khoản đăng nhập:** `root`
- **Mật khẩu:** (Mật khẩu tài khoản root của MariaDB mà bạn đã thiết lập)

---

## 5. Kết nối Frontend (Local) với Backend (VPS)
Để code giao diện React trên máy cá nhân nhưng dùng dữ liệu và test API thật trên VPS:
- File cấu hình `frontend/vite.config.js` đã được thiết lập sẵn Proxy trỏ về VPS (`http://36.50.176.64`).
- Bạn chỉ việc chạy Frontend như bình thường:
  ```bash
  npm run dev
  ```
- Khi truy cập `http://localhost:5173`, mọi thao tác gọi API hoặc Upload hình ảnh đều sẽ chạy ngầm thẳng lên VPS.

**Test nhanh API (Không cần Frontend):**
- Truy cập vào Swagger UI trên VPS để test trực tiếp: `http://36.50.176.64/swagger-ui/index.html`

---

## 6. Các lệnh Linux quan trọng (Dành cho việc Debug/Bảo trì)
Khi có sự cố xảy ra (như API gọi không được, 502 Bad Gateway), bạn cần kết nối SSH vào VPS (`ssh root@36.50.176.64`) và dùng các lệnh sau:

- **Xem trạng thái hoạt động của Backend:**
  ```bash
  systemctl status marketlink
  ```

- **Xem LOG lỗi thời gian thực của Backend (Rất quan trọng khi debug):**
  ```bash
  journalctl -u marketlink -f
  ```
  *(Nhấn `Ctrl + C` để thoát màn hình xem log)*

- **Khởi động lại Backend (khi bị treo):**
  ```bash
  systemctl restart marketlink
  ```

- **Xem trạng thái / Khởi động lại Nginx:**
  ```bash
  systemctl status nginx
  systemctl restart nginx
  ```
