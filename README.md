# ToxicTask (毒舌待办)

一款基于"损失厌恶"心理的待办事项微信小程序。用户通过押注虚拟货币（尊严币）来激励自己完成任务，失败则扣除押金并触发毒舌嘲讽。

## 项目状态

🚀 **当前版本**: v0.2.0 (MVP阶段)  
📅 **最后更新**: 2026-04-05

### 已实现功能

- ✅ 用户认证系统（微信登录）
- ✅ 单次任务管理
- ✅ 重复任务与每日打卡
- ✅ 尊严币交易系统
- ✅ 成就系统（13个成就）
- ✅ 耻辱墙展示
- ✅ 每日签到系统
- ✅ 调试工具（时间推进）

### 待实现功能

- ⏳ AI毒舌嘲讽（接入大模型）
- ⏳ 成就页面UI优化
- ⏳ 邀请好友系统
- ⏳ 广告观看系统
- ⏳ 充值购买系统

详细功能说明请查看：[功能总览文档](./ToxicTask-MiniProgram/docs/FEATURE_SUMMARY.md)

## 技术栈

### 小程序端
- **框架**: Taro 4.1.11 (React)
- **语言**: TypeScript
- **状态管理**: Zustand
- **样式**: SCSS
- **平台**: 微信小程序

### 数据存储
- **本地存储**: Taro.storage
- **后端**: Supabase (计划中)

## 项目结构

```
ToxicTask/
├── ToxicTask-MiniProgram/          # 微信小程序项目
│   ├── src/
│   │   ├── pages/                  # 页面
│   │   │   ├── auth/              # 登录页
│   │   │   ├── index/             # 首页（任务列表）
│   │   │   ├── tasks/             # 任务相关
│   │   │   ├── shame/             # 耻辱墙
│   │   │   ├── profile/           # 个人中心
│   │   │   ├── checkin/           # 签到页
│   │   │   └── achievements/      # 成就页
│   │   ├── lib/
│   │   │   ├── stores/            # Zustand状态管理
│   │   │   │   ├── appStore.ts    # 用户和档案
│   │   │   │   ├── taskStore.ts   # 任务管理
│   │   │   │   ├── achievementStore.ts  # 成就系统
│   │   │   │   ├── coinStore.ts   # 尊严币系统
│   │   │   │   └── checkinStore.ts # 签到系统
│   │   │   └── auth.ts            # 认证逻辑
│   │   ├── types/                 # TypeScript类型定义
│   │   └── app.config.ts          # 小程序配置
│   ├── docs/                      # 项目文档
│   │   ├── FEATURE_SUMMARY.md     # 功能总览
│   │   ├── achievement-system-implementation.md
│   │   ├── achievement-testing-guide.md
│   │   ├── COIN_SYSTEM_DESIGN.md
│   │   └── DEBUG_GUIDE.md
│   └── dist/                      # 编译输出
└── README.md                      # 本文件
```

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8
- 微信开发者工具

### 安装依赖

```bash
cd ToxicTask-MiniProgram
npm install
```

### 开发模式

```bash
# 启动开发服务器（自动监听文件变化）
npm run dev:weapp

# 在微信开发者工具中打开 dist 目录
```

### 生产构建

```bash
npm run build:weapp
```

## 核心功能说明

### 1. 任务系统

**单次任务**：
- 设置任务标题和时限
- 押注尊严币（5-50币）
- 完成返还押金，失败扣除押金

**重复任务**：
- 设置连续打卡天数（如"7天不喝奶茶"）
- 每天需要手动打卡
- 漏打卡任意一天则任务失败
- 全部打卡完成后自动完成

### 2. 成就系统

13个成就分为3类：
- **时间管理类**（5个）：早起的鸟、零点战神、DDL战神等
- **押注与资产类**（5个）：大慈善家、梭哈大师、华尔街之羊等
- **状态与社交类**（3个）：耻辱墙钉子户、仰卧起坐选手、Flag收藏家

成就解锁后可领取尊严币奖励（5-30币）。

### 3. 尊严币系统

**获取途径**：
- 初始赠送：100币
- 任务完成：返还押金
- 成就奖励：5-30币
- 每日签到：5币（待实现）
- 邀请好友：10币（待实现）

**消耗途径**：
- 任务押注
- 任务失败扣款

### 4. 耻辱墙

展示所有失败任务记录，包括：
- 任务标题
- 押注金额
- 失败时间
- AI毒舌嘲讽（当前为预设文案）

## 开发指南

### 调试工具

首页提供调试面板：
- **推进一天**：模拟时间前进，用于测试重复任务和时间相关成就
- **重置日期**：恢复到真实日期

### 数据查看

使用微信开发者工具的 Storage 面板查看本地数据：
- `toxictask_profiles`：用户档案
- `toxictask_tasks`：任务列表
- `toxictask_transactions`：交易记录
- `toxictask_user_achievements`：用户成就

### 日志查看

在控制台搜索以下标签：
- `[TaskStore]`：任务相关日志
- `[AchievementStore]`：成就相关日志
- `[CoinStore]`：尊严币相关日志

## 测试指南

### 功能测试

1. **任务流程**
   - 创建单次任务 → 完成 → 验证押金返还
   - 创建重复任务 → 每日打卡 → 验证自动完成
   - 让任务超时 → 验证扣款和耻辱记录

2. **成就测试**
   - 参考 `docs/achievement-testing-guide.md`
   - 使用调试面板推进时间
   - 验证成就解锁和奖励发放

## 文档索引

- [功能总览](./ToxicTask-MiniProgram/docs/FEATURE_SUMMARY.md)
- [成就系统实现](./ToxicTask-MiniProgram/docs/achievement-system-implementation.md)
- [成就系统测试](./ToxicTask-MiniProgram/docs/achievement-testing-guide.md)
- [尊严币系统设计](./ToxicTask-MiniProgram/docs/COIN_SYSTEM_DESIGN.md)
- [调试指南](./ToxicTask-MiniProgram/docs/DEBUG_GUIDE.md)

## 开发规范

### 代码风格
- TypeScript 严格模式
- 遵循 ESLint 规则
- 单文件不超过150行

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

### 分支管理
- `main`：主分支，保持稳定
- `develop`：开发分支
- `feature/*`：功能分支
- `fix/*`：修复分支

## 已知问题

- 成就检测在大量任务时可能存在性能问题
- 交易记录未分页，数据量大时可能卡顿
- AI毒舌嘲讽功能待接入大模型API

## 更新日志

### v0.2.0 (2026-04-05)
- ✅ 实现完整的成就系统（13个成就）
- ✅ 修复调试日期推进时任务过期检测问题
- ✅ 优化重复任务交互体验
- ✅ 添加详细的项目文档

### v0.1.0 (2026-04-04)
- ✅ 实现重复任务和每日打卡功能
- ✅ 实现尊严币获取机制
- ✅ 添加调试工具

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

- **项目仓库**: https://github.com/fengyao1wang/ToxicTask
- **问题反馈**: GitHub Issues

---

**注意**：本项目仅供学习交流使用，请勿用于商业用途。
