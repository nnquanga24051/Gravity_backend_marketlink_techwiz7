@echo off
chcp 65001 >nul
echo ==============================================
echo 🚀 ĐANG BUILD VÀ DEPLOY FRONTEND LÊN VPS...
echo ==============================================

cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build Frontend thất bại!
    pause
    exit /b %errorlevel%
)

cd /d "%~dp0"
python "%~dp0scripts\deploy_frontend.py"

echo.
echo ==============================================
echo ✅ FRONTEND ĐÃ ĐƯỢC CẬP NHẬT LÊN WEBSITE THỰC TẾ:
echo 👉 http://36.50.176.64
echo ==============================================
pause
