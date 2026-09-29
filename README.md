# 🌿 MarketLink - Detailed Installation & Operation Guide (A to Z)

> **Project**: MarketLink - Local Agricultural Marketplace & Pre-order Community Platform  
> **Competition / Event**: Techwiz 7 - Gravity Team  
> **Core Tech Stack**: Spring Boot 3 / WebFlux Reactive (Java 21) + React (Vite) + MySQL 8 / R2DBC + Google Gemini AI + Nginx  

---

## 📑 TABLE OF CONTENTS
1. [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
2. [MySQL Database Setup](#2-mysql-database-setup)
3. [Running on Localhost (Development & Testing)](#3-running-on-localhost-development--testing)
4. [Deploying to Windows Server (e.g., Windows 10 - IP 172.16.2.89)](#4-deploying-to-windows-server)
5. [Deploying to Linux VPS (Ubuntu / Production)](#5-deploying-to-linux-vps)
6. [Test Accounts & Verification Matrix](#6-test-accounts--verification-matrix)
7. [AI Assistant Setup (Google Gemini API)](#7-ai-assistant-setup-google-gemini-api)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. PREREQUISITES & SYSTEM REQUIREMENTS

Before getting started, make sure the following dependencies are installed on your workstation or host server:

| Component | Recommended Version | Official Download Link | Verification Command |
| :--- | :--- | :--- | :--- |
| **Java JDK** | OpenJDK 17 or 21 LTS | [Eclipse Temurin](https://adoptium.net/temurin/releases/) | `java -version` |
| **Node.js & npm** | Node.js 18.x or 20.x LTS | [Node.js Official](https://nodejs.org/) | `node -v` && `npm -v` |
| **MySQL Server** | MySQL 8.0+ or XAMPP / MariaDB | [MySQL Community](https://dev.mysql.com/downloads/) / [XAMPP](https://www.apachefriends.org/) | `mysql --version` |
| **Git** | 2.40+ | [Git SCM](https://git-scm.com/) | `git --version` |

---

## 2. MYSQL DATABASE SETUP

### Step 1: Start MySQL Server
* **If using MySQL Windows Service**: Ensure the MySQL Service is running on port `3306`.
* **If using XAMPP**: Open XAMPP Control Panel $\rightarrow$ Click **Start** next to **MySQL** (until the text turns green on Port 3306).

### Step 2: Create Database & Import Schema and Data
Open your database management tool (phpMyAdmin at `http://localhost/phpmyadmin`, HeidiSQL, DBeaver, or MySQL Workbench):

1. **Create the Database**:
   ```sql
   CREATE DATABASE IF NOT EXISTS `marketlink_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE `marketlink_db`;
   ```

2. **Import SQL Files in Sequential Order**:
   * **File 1**: [`schema.sql`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/schema.sql)  
     *(Creates all 23 database tables, primary keys, foreign keys, and indexes)*.
   * **File 2**: [`seed_roles_test_users.sql`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/seed_roles_test_users.sql)  
     *(Initializes the 3 core roles: ADMIN, FARMER, CUSTOMER and creates ready-to-use verified accounts)*.
   * **File 3**: [`seed_100_records_all_tables.sql`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/seed_100_records_all_tables.sql)  
     *(Loads 100 comprehensive sample records across agricultural products, seasonal markets, stall bookings, and customer orders)*.

> [!TIP]
> You can also use the single, all-in-one file [`deploy_windows_server/1_CLICK_FULL_DATABASE.sql`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/deploy_windows_server/1_CLICK_FULL_DATABASE.sql) to import the database, schema, test users, and mock data in a single operation.

---

## 3. RUNNING ON LOCALHOST (DEVELOPMENT & TESTING)

### 🟢 Starting the Backend (Spring Boot WebFlux)
1. Verify the local environment configuration in [`.env`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/.env) in the project root:
   ```properties
   PORT=8081
   DB_URL=r2dbc:mysql://localhost:3306/marketlink_db?sslMode=disabled&allowPublicKeyRetrieval=true
   DB_USERNAME=root
   DB_PASSWORD=root   # Leave blank if using default XAMPP without a password
   ```
2. Open a terminal at the project root and execute:
   * **Windows**:
     ```cmd
     .\mvnw.cmd spring-boot:run
     ```
     *(Or double-click the included [`CHAY_LOCAL.bat`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/CHAY_LOCAL.bat) script)*.
   * **Linux / macOS**:
     ```bash
     ./mvnw spring-boot:run
     ```
3. Once the console outputs `Started MarketlinkApplication in ... seconds`:
   * **Backend Base URL**: `http://localhost:8081`
   * **Interactive Swagger UI**: `http://localhost:8081/swagger-ui/index.html`
   * **OpenAPI 3 Docs**: `http://localhost:8081/v3/api-docs`

---

### 🟢 Starting the Frontend (React / Vite)
1. Open a second terminal window and navigate into the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies (first run only):
   ```bash
   npm install
   ```
3. Launch the Vite Development Server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser: `http://localhost:5173`  
   *All API requests under `/api/...` are automatically forwarded to the backend (`http://localhost:8081`) via Vite reverse proxy with full SSE streaming support.*

---

## 4. DEPLOYING TO WINDOWS SERVER (e.g., Windows 10 - IP 172.16.2.89)

The directory [`deploy_windows_server`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/deploy_windows_server) contains a self-contained, standalone deployment bundle designed for Windows Server / Windows 10 environments:

### Server Information:
* **Host IP**: `172.16.2.89`
* **Operating System**: Windows 10 Pro / Enterprise
* **Remote Desktop (RDP)**: `mstsc /v:172.16.2.89` (User: `admin` / Password: `admin@123`)
* **Backend Port**: `8081`
* **MySQL Port**: `3306` (Database: `marketlink_db`)

### Deployment Steps:
1. **Transfer Directory**: Connect to `172.16.2.89` via Remote Desktop and copy the `deploy_windows_server` folder to `C:\` or `Desktop`.
2. **Open Firewall Ports**:
   * Right-click [`1_MO_CONG_FIREWALL.bat`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/deploy_windows_server/1_MO_CONG_FIREWALL.bat) $\rightarrow$ Select **Run as administrator** (opens inbound TCP ports 8081 and 3306).
3. **Database Initialization**:
   * Double-click [`2_IMPORT_DATABASE.bat`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/deploy_windows_server/2_IMPORT_DATABASE.bat), or open phpMyAdmin (`http://localhost:1000/phpmyadmin` or `http://localhost/phpmyadmin`) and import [`1_CLICK_FULL_DATABASE.sql`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/deploy_windows_server/1_CLICK_FULL_DATABASE.sql).
4. **Configure Parameters**:
   * Verify [`application-server.properties`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/deploy_windows_server/application-server.properties):
     ```properties
     server.port=8081
     spring.r2dbc.url=r2dbc:mysql://127.0.0.1:3306/marketlink_db?sslMode=disabled&allowPublicKeyRetrieval=true
     spring.r2dbc.username=root
     spring.r2dbc.password=root
     ```
5. **Start Backend Service**:
   * Double-click [`3_CHAY_BACKEND.bat`](file:///d:/Techwiz7_Gravity/marketlink/Gravity_backend_marketlink_techwiz7/deploy_windows_server/3_CHAY_BACKEND.bat).
6. **Verify Endpoints**:
   * Swagger Documentation: `http://172.16.2.89:8081/swagger-ui/index.html`
   * Health & Markets API: `http://172.16.2.89:8081/api/markets`

---

## 5. DEPLOYING TO LINUX VPS (UBUNTU / PRODUCTION)

### 1. Configure Nginx Reverse Proxy
Install Nginx and copy the optimized site configuration:
```bash
sudo cp scripts/nginx-marketlink.conf /etc/nginx/sites-available/marketlink.conf
sudo ln -sf /etc/nginx/sites-available/marketlink.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

> **Key Nginx Directives Configured**:
> * `proxy_pass http://172.16.2.89:8081/api/;` forwards API requests to backend.
> * `proxy_buffering off;` and `proxy_read_timeout 300s;` ensure real-time Server-Sent Events (SSE) streaming for AI Chatbot and instant push notifications.
> * `try_files $uri $uri/ /index.html;` ensures seamless React Router client-side routing on page refresh.

### 2. Free HTTPS SSL Certificate (Certbot)
```bash
sudo certbot --nginx -d gravity-techwiz7.cusc.vn --non-interactive --agree-tos -m admin@marketlink.vn --redirect
```

### 3. Systemd Background Service Setup
Configure Spring Boot as a resilient daemon service:
```bash
sudo cp scripts/marketlink.service /etc/systemd/system/marketlink.service
sudo systemctl daemon-reload
sudo systemctl enable marketlink
sudo systemctl restart marketlink
```
Check service status and streaming logs:
```bash
sudo systemctl status marketlink
journalctl -u marketlink -f
```

---

## 6. TEST ACCOUNTS & VERIFICATION MATRIX

All sample accounts are initialized with the default test password: **`Admin@123`** *(Capital **A**)*.

| Role | Login Email | Default Password | Key Features to Test |
| :--- | :--- | :--- | :--- |
| 👑 **System Administrator** | `admin@marketlink.vn` | `Admin@123` | User and stall management, farmer KYC document review (Approve/Reject/Request Revision with real-time SSE push notifications), market schedules, revenue statistics |
| 🌾 **Verified Farmer** | `farmer@marketlink.vn`<br>*(or `farmer.001@marketlink.vn`)* | `Admin@123` | Agricultural product catalog, weekly stock quotas, daily order cutoff limits, stall registration, review responses |
| 🛒 **Pre-order Customer** | `customer@marketlink.vn`<br>*(or `customer.001@marketlink.vn`)* | `Admin@123` | Exploring weekend farmers' markets, pre-ordering seasonal produce, selecting pickup time slots, AI Assistant consultation |

---

## 7. AI ASSISTANT SETUP (GOOGLE GEMINI API)

The built-in intelligent agricultural and marketplace assistant leverages the **Google Gemini API**:

* **API Key**: Retrieve your free key from [Google AI Studio](https://aistudio.google.com/).
* **Active Production Model**: **`gemini-3.6-flash`** (optimized for low-latency streaming and high-accuracy Vietnamese/English responses).
* **Configuration Parameters** (`.env` or `application.properties`):
  ```properties
  ai.gemini.api-key=${GEMINI_API_KEY:your_gemini_api_key_here}
  ai.gemini.model=gemini-3.6-flash
  ai.gemini.api-url=https://generativelanguage.googleapis.com/v1beta/models
  ```
* **Key AI Capabilities**:
  * Real-time querying of active market sessions, available vendors, and fresh agricultural produce.
  * Bilingual multi-turn conversation support (Vietnamese & English).
  * Automated recipe suggestions based on seasonal produce ordered in customer carts.

---

## 8. TROUBLESHOOTING & FAQS

### ❓ 1. `Failed to obtain R2DBC Connection` / Handshake Error
* **Root Cause**: MySQL 8.0/8.4 defaults to `caching_sha2_password` authentication over non-TLS connections, or wrong database credentials.
* **Resolution**:
  1. Append `?sslMode=disabled&allowPublicKeyRetrieval=true` to the R2DBC connection URL:
     ```properties
     spring.r2dbc.url=r2dbc:mysql://127.0.0.1:3306/marketlink_db?sslMode=disabled&allowPublicKeyRetrieval=true
     ```
  2. Confirm whether the MySQL root account has a password (`root`) or an empty string (`""`).

### ❓ 2. `Plugin caching_sha2_password could not be loaded: caching_sha2_password.dll`
* **Root Cause**: Calling XAMPP's command-line `mysql.exe` against a MySQL 8.x server (XAMPP MariaDB client lacks the MySQL 8 plugin dll).
* **Resolution**:
  * This error only impacts command-line `mysql.exe` and **DOES NOT affect Spring Boot Backend**.
  * Manage database tables via phpMyAdmin (`http://localhost/phpmyadmin` or `http://172.16.2.89:1000/phpmyadmin`).

### ❓ 3. `Port 8081 is already in use`
* **Root Cause**: A previous backend instance or background process is already listening on port 8081.
* **Resolution** (Windows Command Prompt):
  ```cmd
  netstat -ano | findstr :8081
  taskkill /PID <FOUND_PID> /F
  ```

### ❓ 4. React Single Page App (SPA) Returns 404 on Browser Refresh
* **Root Cause**: Nginx cannot locate direct server routes for client-side React paths (e.g. `/farmer/products`).
* **Resolution**: Ensure the SPA fallback block is active in Nginx configuration:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```

---

*Authored and verified by Gravity Team - Techwiz 7.*
