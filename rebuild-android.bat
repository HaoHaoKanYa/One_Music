@echo off
echo ========================================
echo 清理并重新编译 Android 应用
echo ========================================
echo.

echo [1/5] 清理 Android 构建缓存...
cd android
call gradlew.bat clean
cd ..
echo 完成!
echo.

echo [2/5] 删除构建文件...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
echo 完成!
echo.

echo [3/5] 删除 node_modules (可选，按 Ctrl+C 跳过)...
pause
if exist node_modules rmdir /s /q node_modules
echo 完成!
echo.

echo [4/5] 重新安装依赖...
call npm install
echo 完成!
echo.

echo [5/5] 重新编译并运行应用...
call npm run android
echo.

echo ========================================
echo 重新编译完成!
echo ========================================
pause
