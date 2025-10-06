# Supabase 目录结构

本目录包含所有与 Supabase 相关的文件，统一管理后端配置和功能。

## 📁 目录结构

```
supabase/
├── migrations/              # 数据库迁移脚本
│   └── 001_initial_setup.sql
├── policies/                # RLS 安全策略
│   └── rls_policies.sql
├── functions/               # Edge Functions (每个函数独立文件夹)
│   ├── sign-up/            # 用户注册
│   │   └── index.ts
│   ├── sign-in/            # 用户登录
│   │   └── index.ts
│   ├── get-profile/        # 获取用户资料
│   │   └── index.ts
│   ├── update-profile/     # 更新用户资料
│   │   └── index.ts
│   ├── get-favorites/      # 获取收藏列表
│   │   └── index.ts
│   ├── add-favorite/       # 添加收藏
│   │   └── index.ts
│   └── remove-favorite/    # 移除收藏
│       └── index.ts
├── types/                   # TypeScript 类型定义
│   └── database.types.ts
└── README.md               # 本文件
```

## 🚀 使用方法

### 1. 数据库迁移

在 Supabase SQL Editor 中执行：

```sql
-- 执行初始设置
\i migrations/001_initial_setup.sql

-- 执行 RLS 策略
\i policies/rls_policies.sql
```

### 2. 在代码中使用

```typescript
// 导入需要的函数
import { signUp, signIn, getCurrentUserProfile } from '@/supabase/functions'

// 使用
const handleSignUp = async () => {
  try {
    await signUp({
      email: 'user@example.com',
      password: 'password123',
      username: 'username',
    })
    console.log('注册成功！')
  } catch (error) {
    console.error('注册失败:', error)
  }
}
```

### 3. 类型支持

```typescript
import type { UserProfile, FavoriteSong } from '@/supabase/types/database.types'

const profile: UserProfile = {
  // TypeScript 会提供完整的类型提示
}
```

## 📝 文件说明

### migrations/

数据库迁移脚本，按版本号命名：
- `001_initial_setup.sql` - 初始数据库设置
- `002_xxx.sql` - 后续迁移（按需添加）

### policies/

Row Level Security (RLS) 策略：
- `rls_policies.sql` - 所有表的 RLS 策略

### functions/

Supabase Edge Functions，每个函数独立文件夹：
- `sign-up/` - 用户注册
- `sign-in/` - 用户登录
- `get-profile/` - 获取用户资料
- `update-profile/` - 更新用户资料
- `get-favorites/` - 获取收藏列表
- `add-favorite/` - 添加收藏
- `remove-favorite/` - 移除收藏

每个函数文件夹包含：
- `index.ts` - 函数入口文件（Deno 运行时）

### types/

TypeScript 类型定义：
- `database.types.ts` - 数据库表的类型定义

## 🔧 开发规范

### 添加新功能

1. **添加数据库表**：
   - 在 `migrations/` 创建新的迁移文件
   - 命名格式：`00X_description.sql`

2. **添加 RLS 策略**：
   - 在 `policies/` 中添加对应的策略

3. **添加 Edge Function**：
   - 在 `functions/` 创建新的函数文件夹
   - 文件夹名使用 kebab-case（如：`get-user-stats`）
   - 在文件夹内创建 `index.ts` 文件

4. **添加类型定义**：
   - 在 `types/database.types.ts` 中添加类型

### 命名规范

- **文件名**：小写，使用连字符（kebab-case）
- **函数名**：驼峰命名（camelCase）
- **类型名**：帕斯卡命名（PascalCase）

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [项目 API 设计文档](../doc/user-system-spec/04-api-part1.md)
- [数据库设计文档](../doc/user-system-spec/03-database-part1.md)

## ✅ 已实现功能

- ✅ 用户认证（注册、登录、登出）
- ✅ 用户资料管理
- ✅ 收藏歌曲管理
- ⏳ 播放历史（待实现）
- ⏳ 歌单管理（待实现）
- ⏳ 社交功能（待实现）

---

**最后更新**: 2025-10-05  
**维护者**: One Music 开发团队
