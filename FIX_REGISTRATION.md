# 修复注册功能 - 执行指南

## 问题说明

注册时出现 401 错误，原因是前端尝试手动向 `profiles` 表插入数据，但被 RLS 策略拦截。

## 解决方案

使用数据库触发器自动创建 profile，而不是在前端手动插入。

## 执行步骤

### 1. 在 Supabase Dashboard 执行 SQL

1. 访问 https://app.supabase.com/
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**
5. 复制 `supabase/migrations/004_auto_create_profile.sql` 的全部内容
6. 粘贴到 SQL Editor
7. 点击右下角的 **Run** 按钮
8. 确认显示 "Success"

### 2. 重新构建前端

```bash
npm run build:web
```

### 3. 刷新浏览器测试

访问 `http://localhost:63895/auth` 并尝试注册。

## 工作原理

### 触发器流程

1. 用户在前端填写注册信息（用户名、邮箱、密码）
2. 前端调用 `supabase.auth.signUp()`，将 username 放入 `user_metadata`
3. Supabase Auth 在 `auth.users` 表创建用户
4. **触发器自动触发**，在 `public.profiles` 表创建对应记录
5. 前端获取自动创建的 profile

### 代码变更

**之前（错误）：**
```typescript
// 前端手动创建 profile
const profile = await profileApi.upsertProfile({
  id: authData.user.id,
  username,
  dignity_coins: 100,
});
```

**现在（正确）：**
```typescript
// 注册时将 username 放入 metadata
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { username },
  },
});

// 触发器自动创建 profile
// 前端只需要获取
const profile = await profileApi.getCurrentProfile();
```

## 验证

注册成功后，检查：
1. 用户能够成功注册
2. 自动跳转到主页
3. 个人资产页面显示 100 尊严币
4. 用户名正确显示

---
更新时间: 2026/04/03
