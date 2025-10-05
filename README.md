# One Music Mobile

<div align="center">

![One Music Mobile](https://img.shields.io/badge/One%20Music-Mobile-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-Apache--2.0-orange)
![Platform](https://img.shields.io/badge/platform-Android-brightgreen)

一个基于 React Native 开发的免费音乐播放器

[下载体验](#-下载) | [功能特性](#-功能特性) | [常见问题](FAQ.md) | [更新日志](CHANGELOG.md)

</div>

---

## 📱 项目简介

**One Music Mobile** 是基于优秀开源项目 [lx-music-mobile](https://github.com/lyswhut/lx-music-mobile) 进行二次开发的音乐播放器，致力于为用户提供更好的音乐播放体验。

### 致谢

感谢原作者 [lyswhut](https://github.com/lyswhut) 及其团队开发的 lx-music-mobile 项目，为我们提供了坚实的技术基础和优秀的代码架构。没有他们的开源贡献，就没有 One Music Mobile 的诞生。

**原项目地址：** https://github.com/lyswhut/lx-music-mobile

---

## ✨ 功能特性

### 🎵 核心功能
- **多源音乐搜索** - 支持多个音乐平台搜索
- **在线播放** - 流畅的在线音乐播放体验
- **歌词显示** - 支持滚动歌词、翻译歌词、罗马音
- **桌面歌词** - 悬浮窗歌词显示
- **歌单管理** - 创建、编辑、导入、导出歌单
- **音质选择** - 支持多种音质选择（128k/320k/FLAC等）

### 🎨 界面功能
- **多主题支持** - 内置多款精美主题
- **动态背景** - 使用歌曲封面作为背景
- **横竖屏适配** - 完美适配不同屏幕方向
- **播放详情页** - 精美的播放界面

### 🔧 实用功能
- **播放模式** - 顺序播放、随机播放、单曲循环
- **定时关闭** - 支持定时停止播放
- **稍后播放** - 快速添加到播放队列
- **歌曲换源** - 手动指定歌曲来源
- **不喜欢歌曲** - 自动跳过不喜欢的歌曲
- **数据备份** - 支持歌单导入导出

### 🌐 高级功能
- **本地音乐** - 支持添加本地音乐文件
- **歌单导入** - 支持导入在线歌单链接
- **同步功能** - 实验性的多端同步（需配合PC端）
- **自定义源** - 支持自定义音乐源（实验性）

---

## 📥 下载

### 官方下载渠道

- **GitHub Releases:** [点击下载](https://github.com/HaoHaoKanYa/One_Music/releases)

### 版本说明

- **arm64-v8a:** 适用于大多数现代 Android 设备（推荐）
- **armeabi-v7a:** 适用于较老的 32 位设备
- **universal:** 通用版本，体积较大但兼容性最好

### 系统要求

- Android 5.0 (API 21) 及以上
- 建议 Android 8.0 及以上以获得最佳体验

---

## 🚀 快速开始

### 首次使用

1. 下载并安装应用
2. 打开应用，阅读并同意用户协议
3. 在搜索页面搜索你喜欢的音乐
4. 点击歌曲即可播放

### 创建歌单

1. 进入"我的列表"
2. 点击右上角"+"创建新列表
3. 搜索歌曲并添加到列表
4. 在"我的列表"中播放

### 导入歌单

1. 复制歌单链接（支持网易云、QQ音乐等）
2. 进入对应音源的歌单页面
3. 粘贴链接或输入歌单ID
4. 点击收藏按钮保存到"我的列表"

---

## 🛠️ 开发相关

### 技术栈

- **框架:** React Native 0.73.11
- **语言:** TypeScript / JavaScript
- **导航:** React Native Navigation
- **播放器:** React Native Track Player
- **状态管理:** React Hooks

### 环境要求

- Node.js >= 18
- npm >= 8.5.2
- JDK 17
- Android SDK

### 本地开发

```bash
# 克隆项目
git clone https://github.com/HaoHaoKanYa/One_Music.git
cd One_Music

# 安装依赖
npm install

# 运行 Android
npm run dev

# 构建 APK
npm run pack:android
```

### 项目结构

```
One_Music_mobile/
├── android/          # Android 原生代码
├── ios/              # iOS 原生代码（未完成）
├── src/              # 源代码
│   ├── components/   # 组件
│   ├── screens/      # 页面
│   ├── utils/        # 工具函数
│   ├── theme/        # 主题配置
│   └── ...
├── CHANGELOG.md      # 更新日志
├── FAQ.md            # 常见问题
└── README.md         # 项目说明
```

---

## 📝 版本历史

### v1.0.0 (2025-10)

#### 🎉 项目重构
- 基于 lx-music-mobile v1.7.1 进行二次开发
- 项目重命名为 One Music Mobile
- 更新应用标识和配置信息
- 定制化界面和品牌元素

#### ✨ 新增功能
- 添加版本检测和迁移功能
- 优化应用启动流程
- 重新打包和分发配置

#### 🛠️ 技术改进
- 代码结构优化
- 更新项目文档
- 安全性增强

详细更新日志请查看 [CHANGELOG.md](CHANGELOG.md)

---

## ❓ 常见问题

### 歌曲无法播放？
请检查网络连接，尝试切换音源或更新到最新版本。详见 [FAQ.md](FAQ.md#q3-歌曲无法播放怎么办)

### 如何导入歌单？
复制歌单链接，在对应音源的歌单页面粘贴即可。详见 [FAQ.md](FAQ.md#q6-如何导入外部歌单)

### 如何备份数据？
进入"设置 → 备份与恢复"进行操作。详见 [FAQ.md](FAQ.md#q7-如何备份和恢复歌单)

**更多问题请查看：** [完整常见问题文档](FAQ.md)

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 报告问题

如果你发现了 bug 或有功能建议，请：

1. 访问 [Issues](https://github.com/HaoHaoKanYa/One_Music/issues)
2. 搜索是否已有相关问题
3. 如果没有，创建新的 Issue
4. 详细描述问题或建议

---

## 📄 开源协议

本项目采用 [Apache-2.0](LICENSE) 开源协议。

```
Copyright 2024 One Music

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## ⚠️ 免责声明

- 本项目仅供学习交流使用
- 音乐版权归原作者所有
- 请支持正版音乐
- 禁止用于商业用途

---

## 🔗 相关链接

- **项目主页:** https://github.com/HaoHaoKanYa/One_Music
- **问题反馈:** https://github.com/HaoHaoKanYa/One_Music/issues
- **下载地址:** https://github.com/HaoHaoKanYa/One_Music/releases
- **原项目:** https://github.com/lyswhut/lx-music-mobile
- **常见问题:** [FAQ.md](FAQ.md)
- **更新日志:** [CHANGELOG.md](CHANGELOG.md)

---

## 📧 联系方式

- **邮箱:** One_Music@onescience.edu.kg
- **GitHub:** https://github.com/HaoHaoKanYa/One_Music

---

## 🌟 Star History

如果这个项目对你有帮助，请给我们一个 Star ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=HaoHaoKanYa/One_Music&type=Date)](https://star-history.com/#HaoHaoKanYa/One_Music&Date)

---

<div align="center">

**感谢使用 One Music Mobile！**

Made with ❤️ by One Music Team

基于 [lx-music-mobile](https://github.com/lyswhut/lx-music-mobile) 开发

</div>