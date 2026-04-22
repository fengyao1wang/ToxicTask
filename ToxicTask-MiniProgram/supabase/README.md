# Supabase 微信登录配置

## 快速开始

### 方法 1：使用自动部署脚本（推荐）

**Windows 用户：**
```bash
cd supabase
deploy.bat
```

**Mac/Linux 用户：**
```bash
cd supabase
chmod +x deploy.sh
./deploy.sh
```

### 方法 2：手动部署

详细步骤请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 必需配置

部署完成后，必须在 Supabase Dashboard 中配置以下环境变量：

1. 访问 https://supabase.com/dashboard/project/tjhbzbfireyyuwbdpwwg/settings/functions
2. 点击 "Edge Functions" > "Secrets"
3. 添加：
   - `WECHAT_APPID`: 你的微信小程序 AppID
   - `WECHAT_SECRET`: 你的微信小程序 AppSecret

**获取微信小程序密钥：**
1. 登录 https://mp.weixin.qq.com/
2. 进入"开发" > "开发管理" > "开发设置"
3. 复制 AppID 和 AppSecret

## 微信小程序配置

在微信小程序后台添加服务器域名：

1. 登录 https://mp.weixin.qq.com/
2. 进入"开发" > "开发管理" > "开发设置" > "服务器域名"
3. 在 "request合法域名" 中添加：
   ```
   https://tjhbzbfireyyuwbdpwwg.supabase.co
   ```

## 验证部署

部署成功后，Edge Function 地址为：
```
https://tjhbzbfireyyuwbdpwwg.supabase.co/functions/v1/wechat-login
```

查看日志：
https://supabase.com/dashboard/project/tjhbzbfireyyuwbdpwwg/logs/edge-functions

## 文件说明

- `functions/wechat-login/index.ts` - 微信登录 Edge Function
- `migrations/20240101000000_create_profiles.sql` - 数据库表结构
- `config.toml` - Supabase 项目配置
- `deploy.sh` / `deploy.bat` - 自动部署脚本
- `DEPLOYMENT.md` - 详细部署文档

## 故障排查

如果登录失败，请检查：

1. ✅ Edge Function 是否部署成功
2. ✅ 环境变量是否配置正确
3. ✅ 微信小程序服务器域名是否添加
4. ✅ 数据库表是否创建成功
5. ✅ 查看 Supabase 日志是否有错误

## 需要帮助？

查看详细文档：[DEPLOYMENT.md](./DEPLOYMENT.md)
