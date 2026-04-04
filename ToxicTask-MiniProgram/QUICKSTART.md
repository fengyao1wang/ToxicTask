# ToxicTask 微信小程序 - 快速开始

## 项目状态

✅ **已完成核心功能迁移**

从 React Native 项目成功迁移到 Taro 微信小程序，所有核心业务逻辑已复用。

## 已完成的功能

### 1. 基础架构
- ✅ Taro 4.1.11 项目初始化
- ✅ TypeScript 配置
- ✅ Zustand 状态管理
- ✅ Supabase 客户端集成

### 2. 页面和功能
- ✅ 登录/注册页面 (`pages/auth`)
- ✅ 任务列表首页 (`pages/index`)
- ✅ 创建任务页面 (`pages/tasks/create`)
- ✅ 耻辱墙页面 (`pages/shame`)
- ✅ 个人资产页面 (`pages/profile`)
- ✅ 底部 TabBar 导航

### 3. 业务逻辑（100% 复用）
- ✅ 认证 API (注册、登录、登出)
- ✅ Profile API (用户资料、尊严币)
- ✅ Task API (任务 CRUD)
- ✅ ShameLog API (耻辱记录)

### 4. UI/UX
- ✅ 暗黑主题设计
- ✅ 响应式布局
- ✅ 加载状态处理
- ✅ 错误提示

## 如何运行

### 1. 安装依赖

```bash
cd ToxicTask-MiniProgram
npm install
```

### 2. 配置环境变量

已配置在 `.env.development`：

```
TARO_APP_SUPABASE_URL=https://jtgiggzizzipxhwgnavx.supabase.co
TARO_APP_SUPABASE_ANON_KEY=sb_publishable_XAO3ZvtPxZ8ZdaZmsppkgA_4Pko-mrK
TARO_APP_USE_MOCK=true
```

### 3. 构建项目

```bash
npm run build:weapp
```

### 4. 在微信开发者工具中打开

1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具
3. 选择"导入项目"
4. 项目目录选择：`D:\ToxicTask\ToxicTask-MiniProgram\dist`
5. AppID：选择"测试号"或输入你的小程序 AppID

### 5. 开发模式（可选）

```bash
npm run dev:weapp
```

开发模式会监听文件变化并自动重新编译。

## 小程序配置要求

### 服务器域名配置

在微信小程序后台需要配置以下合法域名：

**request 合法域名：**
- `https://jtgiggzizzipxhwgnavx.supabase.co`

**uploadFile 合法域名：**
- `https://jtgiggzizzipxhwgnavx.supabase.co`

**downloadFile 合法域名：**
- `https://jtgiggzizzipxhwgnavx.supabase.co`

### TabBar 图标

当前配置中引用的图标路径需要实际文件：
- `assets/tab-home.png`
- `assets/tab-home-active.png`
- `assets/tab-shame.png`
- `assets/tab-shame-active.png`
- `assets/tab-profile.png`
- `assets/tab-profile-active.png`

建议尺寸：81px × 81px

## 待完成功能

### 高优先级
1. **任务详情页面** - 查看任务详情、标记完成/失败
2. **实时倒计时** - 显示任务剩余时间
3. **任务过期处理** - 自动标记过期任务为失败
4. **AI 毒舌集成** - 任务失败时生成嘲讽

### 中优先级
5. **下拉刷新** - 刷新任务列表
6. **统计数据** - 个人资产页面显示真实统计
7. **TabBar 图标** - 设计并添加图标文件
8. **错误处理优化** - 更友好的错误提示

### 低优先级
9. **动画效果** - 页面切换、任务卡片动画
10. **分享功能** - 分享到微信好友/朋友圈
11. **通知提醒** - 任务即将到期提醒

## 技术栈

- **框架**: Taro 4.1.11 + React 18
- **语言**: TypeScript
- **样式**: Sass
- **状态管理**: Zustand
- **后端**: Supabase (PostgreSQL + Auth)
- **构建工具**: Webpack 5

## 项目结构

```
src/
├── lib/
│   ├── supabase/       # Supabase 客户端和 API
│   └── stores/         # Zustand 状态管理
├── pages/              # 页面
│   ├── auth/           # 登录/注册
│   ├── index/          # 首页
│   ├── tasks/          # 任务相关
│   ├── shame/          # 耻辱墙
│   └── profile/        # 个人资产
├── types/              # TypeScript 类型
└── app.config.ts       # 应用配置
```

## 常见问题

### Q: 构建后无法在微信开发者工具中打开？
A: 确保选择的是 `dist` 目录，而不是项目根目录。

### Q: 提示"不在以下 request 合法域名列表中"？
A: 在微信小程序后台配置 Supabase 域名，或在开发者工具中勾选"不校验合法域名"。

### Q: TabBar 图标不显示？
A: 需要在 `assets/` 目录下添加对应的图标文件。

## 下一步

1. 在微信开发者工具中测试基础功能
2. 完善任务详情和操作功能
3. 集成 AI 毒舌系统
4. 准备小程序提审材料

---

**开发时间**: 2026/04/04
**版本**: 1.0.0
**状态**: MVP 开发完成，待测试
