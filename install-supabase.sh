#!/bin/bash

echo "🚀 开始安装 Supabase 相关依赖..."

# 安装 Supabase 客户端
echo "📦 安装 @supabase/supabase-js..."
npm install @supabase/supabase-js

# 安装 AsyncStorage（用于会话存储）
echo "📦 安装 @react-native-async-storage/async-storage..."
npm install @react-native-async-storage/async-storage

# iOS 需要安装 pods
if [ -d "ios" ]; then
  echo "🍎 安装 iOS pods..."
  cd ios
  pod install
  cd ..
fi

echo "✅ 所有依赖安装完成！"
echo ""
echo "下一步："
echo "1. 运行 npm start 启动项目"
echo "2. 在 App.tsx 中导入测试函数测试连接"
