# Supabase 部署指南

## 前置条件

1. 安装 Supabase CLI
```bash
npm install -g supabase
```

2. 登录 Supabase
```bash
supabase login
```

## 步骤 1：链接到你的 Supabase 项目

```bash
supabase link --project-ref tjhbzbfireyyuwbdpwwg
```

## 步骤 2：运行数据库迁移

```bash
supabase db push
```

这会创建 `profiles` 表及相关的 RLS 策略。

## 步骤 3：设置环境变量

在 Supabase Dashboard 中设置以下环境变量：

1. 进入 https://supabase.com/dashboard/project/tjhbzbfireyyuwbdpwwg/settings/functions
2. 点击 "Edge Functions" > "Secrets"
3. 添加以下环境变量：

```
WECHAT_APPID=你的微信小程序AppID
WECHAT_SECRET=你的微信小程序AppSecret
```

**重要**：你需要从微信小程序后台获取这两个值：
- 登录 https://mp.weixin.qq.com/
- 进入"开发" > "开发管理" > "开发设置"
- 复制 AppID 和 AppSecret

## 步骤 4：部署 Edge Function

```bash
supabase functions deploy wechat-login
```

## 步骤 5：验证部署

部署成功后，你的 Edge Function 地址为：
```
https://tjhbzbfireyyuwbdpwwg.supabase.co/functions/v1/wechat-login
```

测试请求：
```bash
curl -X POST https://tjhbzbfireyyuwbdpwwg.supabase.co/functions/v1/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","nickname":"测试用户","avatar_url":""}'
```

## 步骤 6：配置微信小程序服务器域名

1. 登录微信小程序后台 https://mp.weixin.qq.com/
2. 进入"开发" > "开发管理" > "开发设置" > "服务器域名"
3. 在 "request合法域名" 中添加：
```
https://tjhbzbfireyyuwbdpwwg.supabase.co
```

## 常见问题

### 1. 部署失败：权限不足
确保你已经登录正确的 Supabase 账号：
```bash
supabase logout
supabase login
```

### 2. 环境变量未生效
部署后需要等待几分钟让环境变量生效，或者重新部署：
```bash
supabase functions deploy wechat-login --no-verify-jwt
```

### 3. 数据库表不存在
运行迁移：
```bash
supabase db push
```

### 4. RLS 策略阻止访问
暂时禁用 RLS 进行测试：
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

## 本地测试

启动本地 Supabase：
```bash
supabase start
```

部署到本地：
```bash
supabase functions serve wechat-login
```

测试本地 Function：
```bash
curl -X POST http://localhost:54321/functions/v1/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","nickname":"测试用户","avatar_url":""}'
```

## 下一步

部署完成后：
1. 重新编译小程序
2. 上传体验版
3. 让朋友重新扫码测试

如果还有问题，查看 Supabase Dashboard 的 Logs：
https://supabase.com/dashboard/project/tjhbzbfireyyuwbdpwwg/logs/edge-functions
