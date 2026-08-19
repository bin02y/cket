@echo off
setlocal EnableExtensions DisableDelayedExpansion

where curl.exe >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Windows curl.exe was not found.
  exit /b 1
)

set "PROJECT_REF=mcqcomorniycolmbbhka"

echo CKET Email Confirmation Setup
echo This enables immediate signup without confirmation email.
echo.
set /p "SUPABASE_ACCESS_TOKEN=Supabase Personal Access Token: "

if not defined SUPABASE_ACCESS_TOKEN goto missing

echo.
echo Disabling email confirmation on the Supabase carrier project...

curl.exe --fail --silent --show-error ^
  --request PATCH "https://api.supabase.com/v1/projects/%PROJECT_REF%/config/auth" ^
  --header "Authorization: Bearer %SUPABASE_ACCESS_TOKEN%" ^
  --header "Content-Type: application/json" ^
  --data "{\"mailer_autoconfirm\":true}" ^
  | findstr /C:"\"mailer_autoconfirm\":true" >nul

if errorlevel 1 goto failed

set "SUPABASE_ACCESS_TOKEN="
echo.
echo [DONE] Email confirmation is disabled.
echo New users can sign in immediately after signup.
exit /b 0

:missing
set "SUPABASE_ACCESS_TOKEN="
echo.
echo [ERROR] Supabase Personal Access Token is required.
exit /b 1

:failed
set "SUPABASE_ACCESS_TOKEN="
echo.
echo [ERROR] Supabase Auth setup failed.
echo Check the Personal Access Token and try again.
exit /b 1
