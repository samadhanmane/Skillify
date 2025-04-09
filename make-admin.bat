@echo off
echo Setting Admin Privileges for Skillify Credentials Hub
echo =====================================================

if "%~1"=="" (
  echo Error: Please provide an email address.
  echo Usage: make-admin.bat user@example.com
  exit /b 1
)

cd backend
echo Making %1 an admin...
node scripts/make-admin.js %1

echo.
echo If there were no errors, the user is now an admin.
pause 