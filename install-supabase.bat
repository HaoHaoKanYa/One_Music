@echo off
echo 🚀 开始安装 Supabase 相关依赖...
echo.

echo 📦 安装 @supabase/supabase-js...
call npm install @supabase/supabase-js

echo.
echo 📦 安装 @react-native-async-storage/async-storage...
call npm install @react-native-async-storage/async-storage

echo.
echo ✅ 所有依赖安装完成！
echo.
echo 下一步：
echo 1. 运行 npm start 启动项目
echo 2. 在 App.tsx 中导入测试函数测试连接
echo.
pause
