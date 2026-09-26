$VPS_IP = "36.50.176.64"
$USER = "root"

Write-Host "=========================================="
Write-Host "🚀 DEPLOY TO VPS: $VPS_IP"
Write-Host "⚠️ PASSWORD: Propao123pro!"
Write-Host "=========================================="

Write-Host "1. Uploading Backend JAR..."
scp .\target\marketlink-0.0.1-SNAPSHOT.jar ${USER}@${VPS_IP}:/var/www/marketlink/app/marketlink.jar

Write-Host "2. Uploading Nginx Config..."
scp .\scripts\nginx-marketlink.conf ${USER}@${VPS_IP}:/etc/nginx/sites-available/marketlink.conf

Write-Host "3. Uploading Frontend..."
ssh ${USER}@${VPS_IP} "mkdir -p /var/www/marketlink/frontend"
scp -r .\frontend\dist\* ${USER}@${VPS_IP}:/var/www/marketlink/frontend/

Write-Host "4. Restarting Services on VPS..."
ssh ${USER}@${VPS_IP} "systemctl daemon-reload && systemctl restart marketlink && nginx -t && systemctl restart nginx"

Write-Host "✅ Deploy Hoàn Tất! Bạn có thể truy cập website ngay bây giờ."
