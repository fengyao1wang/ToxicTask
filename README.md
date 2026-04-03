# ToxicTask (毒舌待办)

一款带有"暗黑幽默"和"反内耗"属性的待办事项 App。

## 技术栈

- **前端框架**: React Native + Expo (Expo Router)
- **样式方案**: NativeWind (Tailwind CSS)
- **后端/数据库**: Supabase (PostgreSQL)
- **状态管理**: Zustand
- **开发语言**: TypeScript

## 环境配置

1. 复制 `.env.example` 为 `.env`
2. 填入你的 Supabase 配置和 AI API 密钥

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_AI_API_KEY=your_ai_api_key_here
EXPO_PUBLIC_AI_API_URL=your_ai_api_url_here
```

## 安装依赖

```bash
npm install
```

## 运行项目

```bash
# 启动开发服务器
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 项目结构

```
ToxicTask/
├── app/                    # Expo Router 路由页面
│   └── (tabs)/            # 底部导航标签页
├── components/            # 可复用组件
├── lib/
│   ├── supabase/         # Supabase 客户端配置
│   └── stores/           # Zustand 状态管理
├── types/                # TypeScript 类型定义
├── hooks/                # 自定义 Hooks
└── assets/               # 静态资源
```

## 核心功能

- 任务创建与押注系统
- AI 毒舌嘲讽机制
- 耻辱墙公开展示
- 尊严币资产系统
