#!/bin/bash
# ===================================================================
# SCRIPT KHỞI TẠO VPS UBUNTU TỰ ĐỘNG CHO MARKETLINK BACKEND
# Dành cho Ubuntu 20.04 / 22.04 / 24.04 LTS
# ===================================================================

set -e

echo "=========================================================="
echo "🚀 BẮT ĐẦU CÀI ĐẶT MÔI TRƯỜNG CHO MARKETLINK TRÊN VPS UBUNTU"
echo "=========================================================="

# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt các gói phụ thuộc
echo "📦 Cài đặt Java 21, MariaDB, Nginx..."
sudo apt install -y openjdk-21-jdk mariadb-server nginx ufw curl git

# 3. Tạo 2GB Swap RAM ảo để chống tràn bộ nhớ
if [ ! -f /swapfile ]; then
    echo "🧠 Tạo 2GB Swap RAM..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 4. Khởi động MariaDB và tạo Database
echo "🗄️ Cấu hình MariaDB..."
sudo systemctl enable mariadb
sudo systemctl start mariadb

DB_NAME="marketlink_db"
DB_USER="marketlink_user"
DB_PASS="MarketLink@2026Secure"

sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 5. Tạo thư mục ứng dụng và thư mục upload ảnh
echo "📁 Tạo thư mục lưu trữ /var/www/marketlink..."
sudo mkdir -p /var/www/marketlink/app
sudo mkdir -p /var/www/marketlink/uploads
sudo chown -R $USER:$USER /var/www/marketlink
sudo chmod -R 755 /var/www/marketlink/uploads

# 6. Copy cấu hình Service và Nginx nếu script chạy từ thư mục dự án
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/marketlink.service" ]; then
    sudo cp "${SCRIPT_DIR}/marketlink.service" /etc/systemd/system/marketlink.service
    sudo systemctl daemon-reload
    sudo systemctl enable marketlink
fi

if [ -f "${SCRIPT_DIR}/nginx-marketlink.conf" ]; then
    sudo cp "${SCRIPT_DIR}/nginx-marketlink.conf" /etc/nginx/sites-available/marketlink.conf
    sudo ln -sf /etc/nginx/sites-available/marketlink.conf /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl restart nginx
fi

# 7. Cấu hình Firewall UFW
echo "🛡️ Cấu hình tường lửa UFW..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "=========================================================="
echo "✅ HOÀN TẤT CÀI ĐẶT MÔI TRƯỜNG TRÊN VPS!"
echo "Database: ${DB_NAME} | User: ${DB_USER}"
echo "Thư mục chạy: /var/www/marketlink/app"
echo "Thư mục ảnh: /var/www/marketlink/uploads"
echo "=========================================================="
