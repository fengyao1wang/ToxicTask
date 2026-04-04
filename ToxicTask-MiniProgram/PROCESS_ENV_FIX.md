# process.env 错误修复

## 问题描述

在微信开发者工具中运行时报错：
```
ReferenceError: process is not defined
```

## 原因分析

小程序环境不支持 Node.js 的 `process` 对象，因此无法使用 `process.env` 访问环境变量。

## 解决方案

### 修改前（错误）

```typescript
const supabaseUrl = process.env.TARO_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.TARO_APP_SUPABASE_ANON_KEY || '';
```

### 修改后（正确）

```typescript
// 小程序环境中直接使用配置值
const supabaseUrl = 'https://jtgiggzizzipxhwgnavx.supabase.co';
const supabaseAnonKey = 'sb_publishable_XAO3ZvtPxZ8ZdaZmsppkgA_4Pko-mrK';
```

## 注意事项

### 安全性
- Supabase Anon Key 是公开的，可以安全地放在客户端代码中
- 真正的安全控制通过 Supabase RLS (Row Level Security) 实现
- 不要将 Service Role Key 放在客户端代码中

### 环境配置
如果需要支持多环境（开发/生产），可以：

1. **使用 Taro 的编译时环境变量**
```typescript
const supabaseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://prod.supabase.co'
  : 'https://dev.supabase.co';
```

2. **使用配置文件**
```typescript
// config/index.ts
export const config = {
  supabaseUrl: 'https://jtgiggzizzipxhwgnavx.supabase.co',
  supabaseAnonKey: 'sb_publishable_XAO3ZvtPxZ8ZdaZmsppkgA_4Pko-mrK'
};
```

## 验证

重新构建并在微信开发者工具中测试：

```bash
npm run build:weapp
```

应该不再出现 `process is not defined` 错误。

## Git 提交

```bash
git add src/lib/supabase/client.ts
git commit -m "fix: 修复小程序环境中 process.env 未定义错误"
```

---

**修复时间**: 2026/04/04  
**状态**: ✅ 已修复
