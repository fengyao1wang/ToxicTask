# Supabase 数据库配置指南

## 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: ToxicTask
   - **Database Password**: 设置一个强密码（请记住）
   - **Region**: 选择离你最近的区域（建议选择 Singapore 或 Tokyo）
4. 点击 "Create new project"，等待项目创建完成（约 2 分钟）

## 步骤 2: 执行数据库脚本

### 方法 1: 使用完整脚本（推荐）

1. 在 Supabase Dashboard 左侧菜单，点击 **SQL Editor**
2. 点击 "New query"
3. 复制 `supabase/setup_complete.sql` 文件的全部内容
4. 粘贴到 SQL Editor 中
5. 点击右下角的 **Run** 按钮执行
6. 等待执行完成，确保没有错误提示

### 方法 2: 分步执行（如果完整脚本失败）

按顺序执行以下文件：
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions_triggers.sql`

## 步骤 3: 验证数据库设置

在 SQL Editor 中执行以下查询来验证：

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 应该看到: profiles, tasks, shame_logs
```

## 步骤 4: 获取 API 密钥

1. 在左侧菜单点击 **Project Settings** (齿轮图标)
2. 点击 **API** 标签
3. 复制以下信息：
   - **Project URL** (类似: `https://xxxxx.supabase.co`)
   - **anon public** key (一个很长的 JWT token)

## 步骤 5: 配置环境变量

将获取的信息填入项目根目录的 `.env` 文件：

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 步骤 6: 配置认证（可选，后续需要）

1. 在左侧菜单点击 **Authentication**
2. 点击 **Providers** 标签
3. 启用你想要的认证方式：
   - **Email**: 邮箱密码登录（推荐先启用这个）
   - **Phone**: 手机号登录
   - **OAuth**: Google, GitHub 等第三方登录

### 启用 Email 认证：
1. 确保 "Enable Email provider" 开关打开
2. 可以关闭 "Confirm email" 选项（开发阶段方便测试）
3. 点击 "Save"

## 数据库结构说明

### profiles 表
- `id`: 用户 ID (关联 auth.users)
- `username`: 用户名（唯一）
- `avatar_url`: 头像 URL
- `dignity_coins`: 尊严币余额（默认 100）

### tasks 表
- `id`: 任务 ID
- `user_id`: 所属用户
- `title`: 任务标题
- `bet_amount`: 押注金额
- `status`: 状态 (pending/completed/failed)
- `deadline`: 截止时间

### shame_logs 表
- `id`: 记录 ID
- `task_id`: 关联任务
- `user_id`: 所属用户
- `ai_comment`: AI 毒舌评论

## 自动化逻辑

### 触发器功能：
1. **任务失败时**: 自动从用户的 `dignity_coins` 扣除 `bet_amount`
2. **创建任务前**: 检查用户是否有足够的尊严币
3. **更新时间戳**: 自动更新 `updated_at` 字段

## 测试数据库连接

在项目中创建一个测试文件来验证连接：

```typescript
import { supabase } from '@/lib/supabase/client';

// 测试连接
const testConnection = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('连接失败:', error);
  } else {
    console.log('连接成功!');
  }
};
```

## 常见问题

### Q: 执行 SQL 时出现权限错误？
A: 确保你在 SQL Editor 中以项目所有者身份登录。

### Q: RLS 策略导致无法访问数据？
A: 确保用户已通过 Supabase Auth 认证，并且 `auth.uid()` 返回有效值。

### Q: 如何重置数据库？
A: 在 SQL Editor 中执行：
```sql
DROP TABLE IF EXISTS shame_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```
然后重新执行 `setup_complete.sql`。

## 下一步

配置完成后，你可以：
1. 测试数据库连接
2. 实现用户注册/登录功能
3. 开始开发任务创建功能

---
需要帮助？查看 [Supabase 官方文档](https://supabase.com/docs)
