$VPS_IP = "36.50.176.64"
$USER = "root"

Write-Host "=========================================="
Write-Host "🚀 DEPLOY BACKEND & CƠ SỞ DỮ LIỆU LÊN VPS"
Write-Host "⚠️ MẬT KHẨU VPS: Propao123pro!"
Write-Host "=========================================="

Write-Host "1. Đang đóng gói lại Backend (build JAR)..."
cmd.exe /c "mvnw.cmd clean package -DskipTests"

Write-Host "2. Đưa file chạy JAR lên máy chủ..."
scp .\target\marketlink-0.0.1-SNAPSHOT.jar ${USER}@${VPS_IP}:/var/www/marketlink/app/marketlink.jar

Write-Host "3. Đưa file cấu trúc và dữ liệu mẫu CSDL lên máy chủ..."
scp .\schema.sql ${USER}@${VPS_IP}:/tmp/schema.sql
scp .\seed_all_tables_sample_data.sql ${USER}@${VPS_IP}:/tmp/seed.sql

Write-Host "4. Nạp Cơ Sở Dữ Liệu và Khởi động lại dịch vụ..."
# Cập nhật DB và khởi động lại ứng dụng
ssh ${USER}@${VPS_IP} "mysql -u marketlink_user -pMarketLink@2026Secure marketlink_db < /tmp/schema.sql && mysql -u marketlink_user -pMarketLink@2026Secure marketlink_db < /tmp/seed.sql && systemctl restart marketlink"

Write-Host "✅ Hoàn Tất Đưa Backend & CSDL Lên VPS! Bạn có thể kiểm tra lại dữ liệu và API."
