# HƯỚNG DẪN ĐỒNG BỘ, DEPLOY VÀ VẬN HÀNH WEBSITE MARKETLINK TRÊN VPS
> **Dự án:** Nền Tảng Thương Mại Điện Tử Nông Sản Sạch MarketLink (Techwiz 7)  
> **Tên miền chính thức (HTTPS):** [https://nnquangdev.id.vn](https://nnquangdev.id.vn) • [https://www.nnquangdev.id.vn](https://www.nnquangdev.id.vn)  
> **Địa chỉ IP Máy chủ VPS:** `36.50.176.64`  
> **Thời gian cập nhật:** Tháng 09/2026  

---

## 📑 MỤC LỤC

1. [TỔNG QUAN HẠ TẦNG & THÔNG TIN HỆ THỐNG](#1-tổng-quan-hạ-tầng--thông-tin-hệ-thống)
2. [VÌ SAO SỬA CODE Ở MÁY KHÔNG TỰ ĐỔI TRÊN TRANG WEB NGAY?](#2-vì-sao-sửa-code-ở-máy-không-tự-đổi-trên-trang-web-ngay)
3. [HƯỚNG DẪN 1-CLICK DEPLOY FRONTEND (REACT / CSS / JS)](#3-hướng-dẫn-1-click-deploy-frontend-react--css--js)
4. [HƯỚNG DẪN 1-CLICK DEPLOY BACKEND (JAVA SPRING BOOT)](#4-hướng-dẫn-1-click-deploy-backend-java-spring-boot)
5. [HƯỚNG DẪN TRẢI NGHIỆM TRÊN ĐIỆN THOẠI (GPS & THÔNG BÁO ĐẨY)](#5-hướng-dẫn-trải-nghiệm-trên-điện-thoại-gps--thông-báo-đẩy)
6. [BẢNG TRA CỨU CÁC LỆNH QUẢN TRỊ VPS (CHEAT-SHEET)](#6-bảng-tra-cứu-các-lệnh-quản-trị-vps-cheat-sheet)
7. [XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)](#7-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. TỔNG QUAN HẠ TẦNG & THÔNG TIN HỆ THỐNG

| Thông số | Giá trị cấu hình | Mô tả chức năng |
| :--- | :--- | :--- |
| **Domain chính thức** | `https://nnquangdev.id.vn` | Tên miền chứng nhận SSL Let's Encrypt (HTTPS) |
| **IP VPS** | `36.50.176.64` | Máy chủ Ubuntu 22.04 LTS chạy tại trung tâm dữ liệu |
| **Web Server (Nginx)** | Cổng `80` (HTTP $\rightarrow$ Redirect 301 sang HTTPS) và Cổng `443` (HTTPS) | Reverse Proxy, phục vụ Frontend tĩnh và chuyển tiếp API |
| **Backend Service** | Cổng nội bộ `8081` (`marketlink.service`) | Ứng dụng Spring Boot 3.4 WebFlux, R2DBC MariaDB |
| **Thư mục Frontend VPS** | `/var/www/marketlink/frontend` | Chứa toàn bộ các tệp mã nguồn HTML, CSS, JS sau khi build |
| **Thư mục Backend VPS** | `/var/www/marketlink/app/marketlink.jar` | File JAR chạy dịch vụ nghiệp vụ chính của sàn |
| **Thư mục Ảnh Upload** | `/var/www/marketlink/uploads` | Chứa ảnh đại diện người dùng và ảnh sản phẩm nông sản |

---

## 2. VÌ SAO SỬA CODE Ở MÁY KHÔNG TỰ ĐỔI TRÊN TRANG WEB NGAY?

Nhiều lập trình viên khi mới làm quen với máy chủ VPS thường thắc mắc tại sao vừa lưu code trong VS Code / IDE nhưng mở trang web `https://nnquangdev.id.vn` lại chưa thấy thay đổi. Dưới đây là nguyên lý kiến trúc:

```
[Máy tính của bạn (Local)]                               [Máy chủ đám mây (VPS 36.50.176.64)]
D:\Techwiz7_Gravity\...                                  /var/www/marketlink/...
  ├── frontend/src/ (Mã nguồn JSX)                        ├── frontend/dist/ (File bundle tĩnh)
  └── src/main/java/ (Mã nguồn Java)                      └── app/marketlink.jar (File thực thi)
         │                                                            ▲
         │                                                            │
         └───────────── [Thao tác DEPLOY / TẢI LÊN] ──────────────────┘
```

1. **Phân tách môi trường:**
   - **Môi trường phát triển (Local Machine):** Nằm trên ổ cứng `D:\...` của máy tính bạn. Nếu bạn chạy lệnh `npm run dev` ở máy, bạn sẽ xem được thay đổi tức thì tại `http://localhost:5173`.
   - **Môi trường vận hành thực tế (Production VPS):** Nằm trên máy chủ Internet `36.50.176.64` ở trung tâm dữ liệu. Máy chủ này chỉ đọc các tệp đã được tải lên thư mục của nó.
2. **Quy trình biên dịch tối ưu (Build/Bundle):**
   - Trình duyệt trên điện thoại của khách hàng không đọc trực tiếp file `.jsx` hay `.vue`. Nó cần file đã được **nén gọn và tối ưu (Minified & Bundled)** thông qua lệnh `npm run build`.
   - Java Spring Boot cũng cần được đóng gói thành file nhị phân `.jar` thông qua Maven (`mvn package`).
3. **Kết luận:** Mỗi khi bạn chỉnh sửa xong tính năng mới, bạn chỉ cần thực hiện 1 thao tác **Deploy** để đưa bản cập nhật mới nhất lên VPS.

---

## 3. HƯỚNG DẪN 1-CLICK DEPLOY FRONTEND (REACT / CSS / JS)

Khi bạn chỉnh sửa bất kỳ giao diện, màu sắc, bản đồ, modal hoặc file trong thư mục `frontend/src/`:

### 👉 Cách 1: Bấm chuột 1-Click (Khuyên dùng)
1. Mở thư mục gốc dự án: `d:\Techwiz7_Gravity\marketlink\Gravity_backend_marketlink_techwiz7`
2. **Nhấp đúp chuột vào file:**
   📁 **`deploy_frontend.bat`**
3. Cửa sổ dòng lệnh sẽ tự động:
   * Chạy `npm run build` để đóng gói giao diện mới nhất.
   * Kết nối SFTP lên VPS và tải toàn bộ các tệp mới lên `/var/www/marketlink/frontend`.
   * Tự động ra lệnh cho Nginx trên VPS reload để áp dụng ngay.
4. Mở trình duyệt và truy cập: **`https://nnquangdev.id.vn`** để thấy giao diện mới!

### 👉 Cách 2: Chạy bằng dòng lệnh Terminal
Mở PowerShell hoặc Command Prompt tại thư mục dự án và gõ:
```bash
.\deploy_frontend.bat
```
*(hoặc nếu dùng script Python trực tiếp: `cd frontend && npm run build && cd .. && python scripts/deploy_frontend.py`)*

### 👉 Cách 3: Nhờ AI Trợ lý làm giúp
Bạn chỉ cần gửi yêu cầu vào khung chat:
> *"Hãy build và deploy frontend lên VPS giúp tôi"*  
> Trợ lý AI sẽ tự động kích hoạt tiến trình và báo kết quả sau ~3 giây.

---

## 4. HƯỚNG DẪN 1-CLICK DEPLOY BACKEND (JAVA SPRING BOOT)

Khi bạn chỉnh sửa mã nguồn Java (Service, Controller, Repository, Entity, Logic đơn hàng, CSDL...):

### 👉 Cách 1: Bấm chuột 1-Click
1. Mở thư mục gốc dự án.
2. **Nhấp đúp chuột vào file:**
   📁 **`deploy_backend.bat`**
3. Kịch bản sẽ tự động:
   * Biên dịch Maven và đóng gói file JAR mới nhất (`.\mvnw.cmd clean package -DskipTests`).
   * Tải file `marketlink-0.0.1-SNAPSHOT.jar` lên VPS tại `/var/www/marketlink/app/marketlink.jar`.
   * Khởi động lại dịch vụ hệ thống `marketlink.service` và kiểm tra trạng thái `active`.
4. Toàn bộ API tại `https://nnquangdev.id.vn/api/` sẽ được cập nhật logic mới ngay lập tức.

### 👉 Cách 2: Nhờ AI Trợ lý làm giúp
Bạn chỉ cần nhắn:
> *"Hãy build và deploy backend lên VPS giúp tôi"*

---

## 5. HƯỚNG DẪN TRẢI NGHIỆM TRÊN ĐIỆN THOẠI (GPS & THÔNG BÁO ĐẨY)

Nhờ tên miền **`https://nnquangdev.id.vn`** đã được kích hoạt chứng chỉ SSL an toàn, bạn có thể kiểm thử toàn diện mọi tính năng phần cứng trên điện thoại:

```
[Điện thoại di động] 
       │ 
       ├── 1. Mở Safari / Chrome ──► Truy cập https://nnquangdev.id.vn
       ├── 2. Bấm "Cho phép" vị trí ─► Tự động bắt tọa độ GPS phần cứng thực tế
       ├── 3. Bấm "Cho phép" thông báo ─► Sẵn sàng nhận Desktop Push Notification
       └── 4. Vào bán kính 300m quanh chợ ──► Chuông reo Ding-Dong & Hiện Banner Chào Mừng
```

### Các bước kiểm thử từng tính năng:
1. **Kiểm tra giao diện Responsive:** Mở trên iPhone hoặc Android, giao diện tự động co giãn vừa vặn màn hình dọc, hỗ trợ cảm ứng vuốt chạm mượt mà.
2. **Kiểm tra Định vị GPS thực tế:**
   - Mở chi tiết một phiên chợ hoặc vào tab Bản đồ.
   - Trình duyệt điện thoại sẽ hiển thị hộp thoại: *"nnquangdev.id.vn muốn sử dụng vị trí của bạn"*.
   - Chọn **Cho phép khi dùng ứng dụng (Allow)**.
   - Bản đồ Leaflet sẽ lập tức định vị chấm tròn xanh tại vị trí thực tế của bạn và vẽ tuyến đường ngắn nhất (OSRM) đến chợ.
3. **Kiểm tra Vòng tròn Geofence 300m & Thông báo đẩy:**
   - Xung quanh chợ có một vòng tròn màu xanh lá bán kính 300m.
   - Khi bạn di chuyển vào bên trong vòng tròn này (hoặc đến cổng chợ), hệ thống sẽ:
     * Kích hoạt âm thanh chuông báo ngân vang qua Web Audio API.
     * Bật thông báo đẩy hệ thống trên màn hình điện thoại.
     * Bật sáng Banner Chào mừng khách hàng kèm số sạp nông dân cần ghé.
     * Phát luồng SSE thông báo đến máy nông dân: *"Khách hàng đã đến gần chợ, hãy chuẩn bị giỏ hàng"*.

---

## 6. BẢNG TRA CỨU CÁC LỆNH QUẢN TRỊ VPS (CHEAT-SHEET)

Khi cần đăng nhập SSH vào VPS (`ssh root@36.50.176.64` - Mật khẩu: `Propao123pro!`), bạn có thể sử dụng các lệnh hữu ích sau:

| Thao tác cần làm | Lệnh thực thi trên VPS |
| :--- | :--- |
| **Xem log Backend trực tiếp (Real-time)** | `journalctl -u marketlink -f` |
| **Xem 50 dòng log Backend gần nhất** | `journalctl -u marketlink -n 50 --no-pager` |
| **Khởi động lại Backend** | `systemctl restart marketlink` |
| **Kiểm tra trạng thái Backend** | `systemctl status marketlink` |
| **Kiểm tra cấu hình Nginx** | `nginx -t` |
| **Reload cấu hình Nginx** | `systemctl reload nginx` |
| **Xem thời hạn chứng chỉ SSL HTTPS** | `certbot certificates` |
| **Xem dung lượng ổ cứng VPS** | `df -h` |
| **Xem mức tiêu hao RAM & CPU** | `htop` *(hoặc `free -m`)* |

---

## 7. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### ❓ Vấn đề 1: Đã deploy code mới nhưng vào web vẫn thấy giao diện cũ
* **Nguyên nhân:** Trình duyệt web (đặc biệt là Google Chrome và Safari) thường lưu bộ nhớ đệm (Cache) của các tệp tĩnh để tăng tốc độ tải trang.
* **Cách khắc phục:**
  * **Trên máy tính:** Nhấn tổ hợp phím **`Ctrl + F5`** (hoặc `Ctrl + Shift + R`) để ép trình duyệt tải lại hoàn toàn mới từ server.
  * **Trên điện thoại:** Đóng hẳn tab web, mở tab mới ở chế độ **Tab ẩn danh (Incognito)** để xem phiên bản mới nhất, hoặc vào Cài đặt trình duyệt bấm *"Xóa dữ liệu duyệt web / Xóa bộ nhớ đệm"*.

### ❓ Vấn đề 2: Điện thoại không hiển thị popup xin quyền GPS
* **Nguyên nhân:** Trước đó bạn có thể đã vô tình bấm *"Chặn"* hoặc *"Không cho phép"* vị trí đối với tên miền này.
* **Cách khắc phục:**
  * **Trên Chrome (Android):** Bấm vào biểu tượng **Cài đặt/Ổ khóa** bên cạnh thanh địa chỉ `https://nnquangdev.id.vn` $\rightarrow$ Chọn **Quyền (Permissions)** $\rightarrow$ Bật lại mục **Vị trí (Location)** sang **Cho phép (Allow)**.
  * **Trên Safari (iPhone):** Vào **Cài đặt (Settings)** của iPhone $\rightarrow$ cuộn xuống chọn **Safari** $\rightarrow$ chọn **Vị trí (Location)** $\rightarrow$ Đổi sang **Hỏi (Ask)** hoặc **Cho phép (Allow)**.

### ❓ Vấn đề 3: Đơn hàng hoặc thao tác API báo lỗi kết nối
* **Cách khắc phục:**
  1. Kiểm tra xem service Spring Boot trên VPS có đang chạy không bằng lệnh:
     ```bash
     systemctl status marketlink
     ```
  2. Nếu service bị `inactive` hoặc `failed`, xem lỗi chi tiết bằng:
     ```bash
     journalctl -u marketlink -n 50 --no-pager
     ```
  3. Khởi động lại service bằng:
     ```bash
     systemctl restart marketlink
     ```

---
*Tài liệu này được soạn thảo đầy đủ, chuẩn hóa dành riêng cho dự án MarketLink (Techwiz 7).*
