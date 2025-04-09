@echo off
echo Stopping any running Vite servers...
taskkill /f /im node.exe /fi "WINDOWTITLE eq vite" 2>nul
timeout /t 2 /nobreak >nul

echo Cleaning Vite cache...
if exist "node_modules/.vite" (
  rmdir /s /q "node_modules\.vite"
)

echo Starting dev server...
npm run dev

pause 