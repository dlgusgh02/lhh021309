@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  echo [FoodCost Lab] Installing dependencies for the first time...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency install failed. See the error above.
    pause
    exit /b 1
  )
)

rem Free port 3000 if a previous run was left dangling (otherwise Next.js
rem silently falls back to 3001 and the browser below would open a dead tab).
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
  taskkill /PID %%a /F >nul 2>&1
)

echo [FoodCost Lab] Starting dev server at http://localhost:3000 ...
start chrome "http://localhost:3000"
call npm run dev

pause
