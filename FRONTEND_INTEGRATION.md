# 🚀 Hướng Dẫn Tích Hợp API MarketLink Cho Front-End Developer

Tài liệu này dành riêng cho đội ngũ phát triển Front-End (React, Vite, Next.js, Vue, Mobile App Flutter/React Native) để kết nối vào hệ thống Backend MarketLink đang chạy trên máy chủ VPS.

---

## 1. 🌐 Thông Tin Địa Chỉ API (Endpoints)

* **Server Production (VPS)**: `http://36.50.176.64`
* **Base API Prefix**: `http://36.50.176.64/api`
* **Tài liệu Swagger UI Interactive (Xem đầy đủ DTO, Request/Response và Test trực tiếp)**:  
  👉 **[http://36.50.176.64/swagger-ui/index.html](http://36.50.176.64/swagger-ui/index.html)**
* **OpenAPI 3 JSON Specification**: `http://36.50.176.64/v3/api-docs`

---

## 2. ⚙️ Cấu Hình Môi Trường (.env)

Tạo file `.env` ở thư mục gốc của dự án Front-End:

```env
# URL gọi API
VITE_API_BASE_URL=http://36.50.176.64/api

# Base URL hiển thị ảnh upload từ backend
VITE_IMAGE_BASE_URL=http://36.50.176.64
```

---

## 3. 🔐 Cơ Chế Xác Thực & Phân Quyền (JWT Authentication)

### 3.1. Đăng nhập (`POST /api/auth/login`)
* **Request**:
  ```json
  {
    "username": "customer1",
    "password": "password123"
  }
  ```
* **Response**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "username": "customer1",
      "fullName": "Nguyen Van A",
      "email": "customer1@gmail.com",
      "role": "ROLE_CUSTOMER"
    }
  }
  ```

### 3.2. Đính kèm Token vào Header các Request tiếp theo
```http
Authorization: Bearer <accessToken>
```

### 3.3. Các API Auth khác
* **Đăng ký**: `POST /api/auth/register`
* **Làm mới Token**: `POST /api/auth/refresh` (Body: `{"refreshToken": "..."}`)

---

## 4. 📤 API Tải Lên Ảnh Từ Thiết Bị (Image Upload)

* **Endpoint**: `POST /api/upload/image?folder={folder_name}`
  * `folder`: `markets`, `stalls`, `products`, `avatars` (mặc định: `general`).
* **Header**: `Content-Type: multipart/form-data`
* **Form-data Field**: `file` (chọn file từ `<input type="file" accept="image/*" />`).
* **Response Trả Về**:
  ```json
  {
    "success": true,
    "url": "http://36.50.176.64/uploads/images/products/products_20260925_105314_75f315a6.png",
    "fileName": "products_20260925_105314_75f315a6.png",
    "fileSize": 128456
  }
  ```
*Ảnh được Nginx phục vụ trực tiếp với cơ chế cache 30 ngày, tốc độ tải cực nhanh.*

---

## 5. 🤖 API Trợ Lý AI Chatbot (Google Gemini)

* **Endpoint**: `POST /api/ai/assistant/chat`
* **Request**:
  ```json
  {
    "message": "Gợi ý các chợ nông sản mở vào Chủ Nhật tại Hà Nội"
  }
  ```
* **Response**:
  ```json
  {
    "reply": "Dưới đây là danh sách chợ phiên hoạt động vào Chủ Nhật...",
    "timestamp": "2026-09-25T11:00:00"
  }
  ```

---

## 6. 💻 Mã Nguồn Axios Client Mẫu

Tạo file `src/services/apiClient.js`:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://36.50.176.64/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Tự động gắn Token vào Request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý tự động khi Token hết hạn (401)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 7. 🔑 Tài Khoản Kiểm Thử Có Sẵn Dữ Liệu

| Tài khoản | Tên đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin123` | Quản lý hệ thống, phê duyệt KYC nông dân, gán sạp chợ |
| **Nông dân** | `farmer1` | `password123` | Quản lý sạp, đăng sản phẩm, xem đơn hàng |
| **Khách hàng** | `customer1` | `password123` | Tìm kiếm chợ, đặt hàng, đánh giá |
