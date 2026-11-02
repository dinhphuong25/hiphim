@echo off
title Push Code to GitHub - Dual Repositories
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%"

echo ========================================================
echo   DANG PUSH CODE LEN 2 REPOSITORY GITHUB:
echo   1. https://github.com/dinhphuong25/hiphim
echo   2. https://github.com/dinhphuong25/rapphimchill-main
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
