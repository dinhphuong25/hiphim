@echo off
title Push Code to GitHub - Dual Repositories
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%"

echo ========================================================
echo   DANG DONG BO VA PUSH CODE LEN REPOSITORIES...
echo ========================================================
echo.
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [THANH CONG] Toan bo code da duoc day dong thoi len ca 2 repo GitHub!
) else (
    echo [CANH BAO] Co loi khi push, vui long kiem tra ket noi hoac quyen truy cap.
)
echo.
pause
