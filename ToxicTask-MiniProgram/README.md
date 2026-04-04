# ToxicTask 小程序 - 开发指南

## 项目结构

```
src/
├── lib/
│   ├── supabase/       # Supabase 客户端和 API
│   │   ├── client.ts   # Supabase 客户端初始化
│   │   ├── auth.ts     # 认证 API
│   │   └── api.ts      # 数据库 API (Profile, Task, ShameLog)
│   └── stores/         # Zustand 状态管理
│       ├── appStore.ts # 全局应用状态
│       └── taskStore.ts # 任务状态管理
├── pages/              # 页面
│   ├── auth/           # 登录/注册页面
│   ├── index/          # 首页（任务列表）
│   ├── tasks/          # 任务相关页面
│   │   └── create/     # 创建任务
│   ├── shame/          # 耻辱墙
│   └── profile/        # 个人资产
├── types/              # TypeScript 类型定义
└── app.config.ts       # 应用配置（路由、TabBar）
```

## 已完成功能

✅ 项目初始化和依赖安装
✅ Supabase 客户端配置
✅ 类型定义 (Profile, Task, ShameLog)
✅ 认证 API (注册、登录、登出)
✅ 数据库 API (Profile, Task, ShameLog)
✅ Zustand 状态管理
✅ 登录/注册页面
✅ 首页（任务列表）
✅ 创建任务页面
✅ 耻辱墙页面
✅ 个人资产页面
✅ 底部 TabBar 导航

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式（微信小程序）
npm run dev:weapp

# 构建（微信小程序）
npm run build:weapp
```

## 环境变量配置

在 `.env.development` 中配置：

```
TARO_APP_SUPABASE_URL=你的_supabase_url
TARO_APP_SUPABASE_ANON_KEY=你的_supabase_anon_key
TARO_APP_USE_MOCK=true
```

## 下一步开发计划

1. **测试基础功能**
   - 在微信开发者工具中测试登录/注册
   - 测试任务创建和列表显示
   - 测试页面导航

2. **完善任务功能**
   - 任务详情页面
   - 标记任务完成/失败
   - 实时倒计时显示
   - 任务过期自动处理

3. **集成 AI 毒舌系统**
   - 选择 AI 服务提供商
   - 实现毒舌嘲讽生成
   - 任务失败时自动调用

4. **UI/UX 优化**
   - 下拉刷新
   - 加载动画
   - 错误提示优化
   - 空状态优化

5. **小程序配置**
   - 配置服务器域名白名单
   - 上传 TabBar 图标
   - 配置小程序基本信息

## 注意事项

- 小程序需要配置合法域名（Supabase 域名需要在小程序后台添加）
- TabBar 图标需要准备（目前配置中引用的图标路径需要实际文件）
- 环境变量使用 `process.env.TARO_APP_*` 格式访问
