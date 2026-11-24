@echo off
title Reelhouse - TikTok sign-in helper
cd /d "%~dp0"
echo.
echo  =============================================
echo    REELHOUSE - TikTok sign-in helper
echo  =============================================
echo.
echo  TikTok only signs in through an https:// web address.
echo  This window makes a temporary one for your studio.
echo  You only need it once, to click "Connect TikTok". See TIKTOK.md, Part C.
echo.

netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if errorlevel 1 (
  echo !! Reelhouse is not running. Double-click "Start Reelhouse" first,
  echo !! wait until the studio opens, then double-click this file again.
  pause
  exit /b 1
)

findstr /r /c:"^REELHOUSE_PASSWORD=." .env.local >nul 2>nul
if errorlevel 1 (
  echo !! Heads up: your studio has no password.
  echo !! While this window is open, anyone who knows the address could open your studio.
  echo !! The address is random and hard to guess, and it stops working when you close
  echo !! this window, so a few minutes is fine. For extra safety see TIKTOK.md, "Optional: a password".
  echo.
  echo Press any key to go ahead, or close this window to stop.
  pause >nul
)

if not exist .tools mkdir .tools
if not exist .tools\cloudflared.exe (
  echo Downloading the free Cloudflare tunnel tool, about 60 MB. This happens once...
  curl -L --fail -o .tools\cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
  if errorlevel 1 (
    del .tools\cloudflared.exe >nul 2>nul
    echo !! The download failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo.
echo  In a few seconds a box appears below with an address that ends in .trycloudflare.com
echo  for example: https://happy-blue-river.trycloudflare.com
echo.
echo  To copy it: drag over it with the mouse, then press Enter. Then follow TIKTOK.md, Part C.
echo  Keep this window open until Reelhouse says TikTok is connected. Then close it.
echo.
.tools\cloudflared.exe tunnel --url http://localhost:3000
pause
