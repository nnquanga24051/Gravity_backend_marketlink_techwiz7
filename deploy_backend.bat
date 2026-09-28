@echo off
chcp 65001 >nul
echo ==============================================
echo 🚀 ĐANG BUILD VÀ DEPLOY BACKEND LÊN VPS...
echo ==============================================

cd /d "%~dp0"
echo 1. Đang đóng gói file JAR (Bỏ qua Unit Tests)...
call .\mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Biên dịch Maven thất bại! Vui lòng kiểm tra lại code Java.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Đang tải file JAR lên VPS và khởi động lại dịch vụ...
python "%~dp0scripts\deploy_backend.py"

echo.
echo ==============================================
echo ✅ BACKEND ĐÃ ĐƯỢC CẬP NHẬT THÀNH CÔNG!
echo 👉 API URL: http://36.50.176.64/api/
echo ==============================================
pause
