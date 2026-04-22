@echo off
echo Starting Supabase deployment...
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Supabase CLI not installed
    echo Please run: npm install -g supabase
    pause
    exit /b 1
)

echo Supabase CLI is installed
echo.

REM Check if logged in
echo Checking login status...
supabase projects list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Not logged in to Supabase
    echo Please run: supabase login
    pause
    exit /b 1
)

echo Logged in to Supabase
echo.

REM Link project
echo Linking to Supabase project...
supabase link --project-ref tjhbzbfireyyuwbdpwwg

REM Push database migrations
echo Pushing database migrations...
supabase db push

REM Deploy Edge Function
echo Deploying wechat-login Edge Function...
supabase functions deploy wechat-login

echo.
echo Deployment complete!
echo.
echo IMPORTANT REMINDERS:
echo 1. Set environment variables in Supabase Dashboard:
echo    - WECHAT_APPID (WeChat Mini Program AppID)
echo    - WECHAT_SECRET (WeChat Mini Program AppSecret)
echo.
echo 2. Add server domain in WeChat Mini Program backend:
echo    https://tjhbzbfireyyuwbdpwwg.supabase.co
echo.
echo 3. View deployment logs:
echo    https://supabase.com/dashboard/project/tjhbzbfireyyuwbdpwwg/logs/edge-functions
echo.
pause
