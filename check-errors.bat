@echo off
echo ========================================
echo 检查应用错误
echo ========================================
echo.

echo [1] 检查应用是否运行...
adb shell pidof online.onetvs.music.mobile
if %ERRORLEVEL% EQU 0 (
    echo 应用正在运行
) else (
    echo 应用未运行
)
echo.

echo [2] 查看最近的日志（过滤数据库相关）...
adb logcat -d | findstr /C:"database" /C:"Database" /C:"setUp" /C:"SyncEngine" /C:"Failed to initialize"
echo.

echo [3] 查看 React Native 日志...
adb logcat -d | findstr /C:"ReactNativeJS"
echo.

echo ========================================
echo 检查完成
echo ========================================
pause
