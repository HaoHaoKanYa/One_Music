# GitHub Actions 构建配置说明

## 🔍 问题诊断

### 当前错误
```
/home/runner/work/_temp/xxx.sh: line 2: app/: Is a directory
Error: Process completed with exit code 1.
```

### 错误原因
GitHub Actions 工作流需要签名密钥来构建 Release 版本的 APK，但仓库中没有配置相关的 Secrets，导致构建失败。

---

## ✅ 解决方案

### 方案一：配置签名密钥（推荐 - 用于正式发布）

#### 1. 生成签名密钥

在项目根目录执行：

```bash
# 进入 android/app 目录
cd android/app

# 生成 keystore 文件
keytool -genkeypair -v -storetype PKCS12 \
  -keystore one-music-release-key.keystore \
  -alias one-music-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**填写信息时请记住：**
- 密码（至少 6 个字符）
- 名字、组织等信息

#### 2. 转换为 Base64

**Windows PowerShell:**
```powershell
cd android/app
[Convert]::ToBase64String([IO.File]::ReadAllBytes("one-music-release-key.keystore")) | Out-File keystore-base64.txt
```

**Linux/Mac:**
```bash
base64 android/app/one-music-release-key.keystore > keystore-base64.txt
```

#### 3. 在 GitHub 设置 Secrets

1. 打开仓库：https://github.com/HaoHaoKanYa/One_Music
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 5 个 Secrets：

| Secret Name | Value | 说明 |
|------------|-------|------|
| `KEYSTORE_STORE_FILE_BASE64` | keystore-base64.txt 的内容 | keystore 文件的 Base64 编码 |
| `KEYSTORE_STORE_FILE` | `one-music-release-key.keystore` | keystore 文件名 |
| `KEYSTORE_KEY_ALIAS` | `one-music-key` | 密钥别名 |
| `KEYSTORE_PASSWORD` | 你设置的密码 | keystore 密码 |
| `KEYSTORE_KEY_PASSWORD` | 你设置的密码 | 密钥密码 |

#### 4. 保存 keystore 文件

**重要：** 将 `one-music-release-key.keystore` 文件保存到安全的地方，不要提交到 Git！

---

### 方案二：使用 Debug 构建（已实施 - 临时方案）

我已经修改了工作流文件，现在会自动检测：
- ✅ 如果配置了签名密钥 → 构建 Release 版本
- ✅ 如果没有配置 → 构建 Debug 版本

**优点：**
- 无需配置即可构建成功
- 适合开发测试

**缺点：**
- Debug 版本性能较差
- 不适合正式发布
- APK 体积较大

---

## 📋 配置检查清单

### 必需的 GitHub Secrets

- [ ] `KEYSTORE_STORE_FILE_BASE64` - keystore 文件的 Base64 编码
- [ ] `KEYSTORE_STORE_FILE` - keystore 文件名
- [ ] `KEYSTORE_KEY_ALIAS` - 密钥别名
- [ ] `KEYSTORE_PASSWORD` - keystore 密码
- [ ] `KEYSTORE_KEY_PASSWORD` - 密钥密码

### 本地文件

- [ ] `android/app/one-music-release-key.keystore` - 已生成并保存
- [ ] `keystore-base64.txt` - 已生成（用于上传到 GitHub）
- [ ] 密码已记录在安全的地方

---

## 🚀 测试构建

### 本地测试

```bash
# 测试 Debug 构建
cd android
./gradlew assembleDebug

# 测试 Release 构建（需要配置 keystore）
./gradlew assembleRelease \
  -PMYAPP_UPLOAD_STORE_FILE='one-music-release-key.keystore' \
  -PMYAPP_UPLOAD_KEY_ALIAS='one-music-key' \
  -PMYAPP_UPLOAD_STORE_PASSWORD='你的密码' \
  -PMYAPP_UPLOAD_KEY_PASSWORD='你的密码'
```

### GitHub Actions 测试

1. 提交并推送代码
2. 查看 Actions 页面：https://github.com/HaoHaoKanYa/One_Music/actions
3. 检查构建日志

---

## 🔒 安全注意事项

### ⚠️ 不要提交到 Git

以下文件**绝对不能**提交到 Git：
- ❌ `*.keystore` - 签名密钥文件
- ❌ `keystore-base64.txt` - Base64 编码
- ❌ `keystore.properties` - 密钥配置文件

### ✅ 已添加到 .gitignore

```gitignore
# Keystore files
*.keystore
*.jks
keystore.properties
keystore-base64.txt
```

### 🔐 密码管理

建议使用密码管理器保存：
- Keystore 密码
- Key 密码
- Keystore 文件的备份位置

---

## 📊 构建产物

### Release 构建（签名版本）

构建成功后会生成：
```
android/app/build/outputs/apk/release/
├── lx-music-mobile-v1.0.0-arm64-v8a.apk
├── lx-music-mobile-v1.0.0-armeabi-v7a.apk
├── lx-music-mobile-v1.0.0-x86_64.apk
├── lx-music-mobile-v1.0.0-x86.apk
└── lx-music-mobile-v1.0.0-universal.apk
```

### Debug 构建（未签名版本）

```
android/app/build/outputs/apk/debug/
└── app-debug.apk
```

---

## 🆘 常见问题

### Q1: 忘记了 keystore 密码怎么办？
**A**: 无法恢复，需要重新生成 keystore。如果已经发布过应用，用户将无法升级。

### Q2: keystore 文件丢失了怎么办？
**A**: 无法恢复，需要重新生成。建议多处备份。

### Q3: 可以使用原版的 keystore 吗？
**A**: 不建议。应该为 One Music 生成新的签名密钥。

### Q4: Debug 版本可以发布吗？
**A**: 不建议。Debug 版本性能差，体积大，不适合正式发布。

### Q5: 如何验证 Secrets 是否配置正确？
**A**: 推送代码后查看 GitHub Actions 构建日志，如果显示"使用签名密钥构建 Release 版本"则配置正确。

---

## 📞 技术支持

如果遇到问题：
1. 查看 GitHub Actions 构建日志
2. 检查 Secrets 是否正确配置
3. 验证 keystore 文件是否有效
4. 确认密码是否正确

---

**最后更新**: 2024年12月  
**项目**: One Music Mobile v1.0.0  
**状态**: ✅ 工作流已优化，支持无签名构建
