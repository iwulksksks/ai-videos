@echo off
title Reelhouse
cd /d "%~dp0"
echo.
echo  =====================================
echo    REELHOUSE - opening the studio...
echo  =====================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo !! Node.js is not installed.
  echo !! Get the "LTS" version from https://nodejs.org , install it, then double-click this file again.
  start https://nodejs.org
  pause
  exit /b 1
)

node scripts\check-node.mjs
if errorlevel 1 (
  start https://nodejs.org
  pause
  exit /b 1
)

echo "%~dp0" | findstr /i "\OneDrive\" >nul
if not errorlevel 1 (
  echo !! Heads up: this folder is inside OneDrive. OneDrive tries to sync the thousands of
  echo !! files Reelhouse installs, which is slow and can lock files so installing fails.
  echo !! If anything goes wrong, move the whole folder to C:\Reelhouse and run it from there.
  echo.
)

where ollama >nul 2>nul
if errorlevel 1 (
  echo !! Ollama is not installed. Stories will use the built-in demo writer for now.
  echo !! For free AI stories, install it from https://ollama.com and run this file again.
  set NO_OLLAMA=1
)

set PYOK=0
where py >nul 2>nul && set PYOK=1
where python >nul 2>nul && set PYOK=1
if "%PYOK%"=="0" (
  echo !! Python 3 is not installed, so videos will have no voices for now.
  echo !! Get it from https://www.python.org and tick "Add python.exe to PATH" when installing.
)

if not exist .env.local (
  copy .env.example .env.local >nul
)

if not exist node_modules\.reelhouse-installed (
  echo Installing the studio. The first time takes a few minutes...
  call npm install
  if errorlevel 1 goto installfailed
  echo ok> node_modules\.reelhouse-installed
)

if "%PYOK%"=="1" (
  if not exist voices\en_US-lessac-medium.onnx (
    echo Downloading the voices...
    call npm run setup:voice
  )
)

if not defined NO_OLLAMA (
  ollama list >nul 2>nul
  if errorlevel 1 (
    echo Starting Ollama...
    start "" /min ollama serve
    timeout /t 5 >nul
  )
  ollama list | findstr /i "qwen2.5:7b" >nul
  if errorlevel 1 (
    echo Downloading the story AI, about 4.7 GB. This happens once and can take a while...
    ollama pull qwen2.5:7b
  )
)

netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo Reelhouse is already running in another window. Opening the page...
  start "" http://localhost:3000
  timeout /t 5 >nul
  exit /b 0
)

echo Getting the studio ready...
call npm run build
if errorlevel 1 ( echo !! The build failed. Scroll up to see why. & pause & exit /b 1 )

echo.
echo  The studio is open at http://localhost:3000
echo  Keep this window open while autopilot is on. Close it to stop Reelhouse.
echo.
start "" http://localhost:3000
set RESTARTS=0
:serve
call npm run start
set /a RESTARTS+=1
if %RESTARTS% GEQ 5 (
  echo !! The studio stopped 5 times in a row. Take a screenshot of the lines above and send it over.
  pause
  exit /b 1
)
echo.
echo !! The studio stopped unexpectedly. Starting it again in 5 seconds...
echo !! (Close this window if you want Reelhouse to stop.)
timeout /t 5 >nul
goto serve

:installfailed
echo.
echo !! Installing failed. The real reason is in the red "npm error" lines above.
echo !! Common causes:
echo !!   - No internet connection, or a firewall or antivirus blocking npm.
echo !!   - The folder is inside OneDrive and OneDrive locked some files.
echo !!     Move the whole folder to C:\Reelhouse and try again.
echo !!   - "gyp" or "Visual Studio" errors: an old copy of Reelhouse. Download the latest version.
echo !! Then delete the node_modules folder and double-click this file again.
echo !! Still stuck? Send a screenshot of the first red lines.
pause
exit /b 1
