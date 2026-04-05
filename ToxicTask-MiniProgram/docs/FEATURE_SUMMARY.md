# ToxicTask 功能总览

> 最后更新：2026-04-05

## 项目简介

ToxicTask（毒舌待办）是一款基于"损失厌恶"心理的待办事项小程序。用户通过押注虚拟货币（尊严币）来激励自己完成任务，失败则扣除押金并触发毒舌嘲讽。

## 核心功能模块

### 1. 用户认证系统 ✅

**功能描述**：
- 微信一键登录
- 自动创建用户档案
- 初始赠送100尊严币

**技术实现**：
- 使用 Taro.login() 获取微信授权
- 本地存储用户信息（`toxictask_profiles`）
- 自动生成唯一用户ID

**相关文件**：
- `src/pages/auth/index.tsx`
- `src/lib/auth.ts`
- `src/lib/stores/appStore.ts`

---

### 2. 任务管理系统 ✅

#### 2.1 单次任务

**功能描述**：
- 创建一次性任务
- 设置任务标题
- 选择押注金额（5/10/20/30/50币或自定义）
- 设置时限（小时+分钟）
- 手动完成或自动失败

**业务逻辑**：
- 创建时扣除押金
- 完成时返还押金
- 超时自动失败并扣除押金
- 失败时创建耻辱记录

#### 2.2 重复任务 ✅

**功能描述**：
- 创建需要连续打卡的任务（如"7天不喝奶茶"）
- 预设天数选项（3/7/14/21/30天）或自定义天数
- 每日打卡机制
- 可视化打卡进度（圆点显示）
- 漏打卡自动失败

**业务逻辑**：
- 创建时生成N天的打卡记录
- 每天需要手动打卡
- 今日打卡点用红色边框标识
- 已打卡用绿色填充
- 错过任意一天打卡则任务失败
- 全部打卡完成后自动完成任务（无需确认）

**相关文件**：
- `src/pages/tasks/create.tsx`
- `src/pages/tasks/create.scss`
- `src/lib/stores/taskStore.ts`
- `src/types/index.ts`

---

### 3. 尊严币系统 ✅

#### 3.1 交易记录

**功能描述**：
- 完整的交易历史记录
- 支持多种交易类型

**交易类型**：
- `task_bet`：任务押注（支出）
- `task_refund`：任务完成退款（收入）
- `task_penalty`：任务失败扣款（支出）
- `check_in`：签到奖励（收入）
- `achievement`：成就奖励（收入）
- `invite`：邀请奖励（收入）
- `ad_watch`：观看广告（收入）
- `recharge`：充值（收入）

#### 3.2 获取途径

**已实现**：
- ✅ 初始赠送：100币
- ✅ 任务完成：返还押金
- ✅ 成就奖励：5-30币不等

**待实现**：
- ⏳ 每日签到：5币/天
- ⏳ 邀请好友：10币/人
- ⏳ 观看广告：视频3币，横幅1币
- ⏳ 充值购买

**相关文件**：
- `src/lib/stores/coinStore.ts`
- `src/types/index.ts`

---

### 4. 成就系统 ✅

#### 4.1 时间管理类（5个）

| 成就名称 | 触发条件 | 奖励 | 描述 |
|---------|---------|------|------|
| 早起的鸟 | 制定计划早于08:00且完成 | 10币 | 早起的鸟儿有虫吃 |
| 早起的虫 | 制定计划早于08:00且失败 | 5币 | 醒得早有什么用，还不是被鸟吃。 |
| 零点战神 | 制定计划在00:00-02:00 | 15币 | 别人深夜emo，你深夜计划，赢了！ |
| DDL战神 | 截止前5分钟内完成 | 20币 | 这不是拖延，是效率。 |
| 消失的爱人 | 失败后24小时未进入 | 5币 | 不敢面对失败的自己。 |

#### 4.2 押注与资产类（5个）

| 成就名称 | 触发条件 | 奖励 | 描述 |
|---------|---------|------|------|
| 大慈善家 | 单次押注>20且失败 | 10币 | 致力于将尊严币重新分配给全宇宙。 |
| 散财童子 | 连续3次失败且押注>20 | 15币 | 致力于撒币 |
| 铁公鸡 | 累计完成10个任务押注都是1 | 20币 | 勤俭节约，传统美德 |
| 梭哈大师 | 单次押注占余额80%以上 | 30币 | 要么自律成神，要么穷得叮当响。 |
| 华尔街之羊 | 单次失败破产 | 10币 | 辛苦攒币大半年，一朝回到解放前。 |

#### 4.3 状态与社交类（3个）

| 成就名称 | 触发条件 | 奖励 | 描述 |
|---------|---------|------|------|
| 耻辱墙钉子户 | 自然周7天内5天有失败 | 15币 | 墙上没你，大家都觉得这小程序出 Bug 了。 |
| 仰卧起坐选手 | 连续3天完成+连续3天失败 | 20币 | 间歇性踌躇满志，持续性混吃等死。 |
| Flag收藏家 | 同时5个进行中任务 | 10币 | 计划列得越多，看上去就越像个自律的人。 |

**技术实现**：
- 自动检测触发条件
- 解锁时显示Toast提示
- 需要手动领取奖励
- 领取后自动发放尊严币

**相关文件**：
- `src/lib/stores/achievementStore.ts`
- `src/pages/achievements/index.tsx`
- `docs/achievement-system-implementation.md`
- `docs/achievement-testing-guide.md`

---

### 5. 耻辱墙系统 ✅

**功能描述**：
- 展示所有失败任务记录
- 显示任务标题、押注金额、失败时间
- AI毒舌嘲讽（当前为预设文案）

**业务逻辑**：
- 任务失败时自动创建耻辱记录
- 按时间倒序排列
- 永久保存（不可删除）

**相关文件**：
- `src/pages/shame/index.tsx`
- `src/pages/shame/index.scss`

---

### 6. 个人资料页 ✅

**功能描述**：
- 显示用户名和头像
- 显示当前尊严币余额
- 快速导航到各功能页面

**导航入口**：
- 签到页面
- 成就页面
- 耻辱墙页面

**相关文件**：
- `src/pages/profile/index.tsx`
- `src/pages/profile/index.scss`

---

### 7. 调试工具 ✅

**功能描述**：
- 时间推进：模拟日期前进一天
- 时间重置：恢复到真实日期
- 用于测试重复任务和时间相关成就

**使用场景**：
- 测试重复任务的打卡和过期逻辑
- 测试时间相关成就（如耻辱墙钉子户）
- 快速验证多日任务流程

**相关文件**：
- `src/pages/index/index.tsx`（调试面板UI）
- `docs/DEBUG_GUIDE.md`

---

## 技术栈

### 前端框架
- **Taro 4.1.11**：跨平台小程序框架
- **React**：UI组件库
- **TypeScript**：类型安全

### 状态管理
- **Zustand**：轻量级状态管理
  - `appStore`：用户和档案管理
  - `taskStore`：任务管理
  - `achievementStore`：成就管理
  - `coinStore`：尊严币管理
  - `checkinStore`：签到管理（待实现）

### 样式方案
- **SCSS**：CSS预处理器
- 暗黑主题设计
- 响应式布局

### 数据存储
- **Taro.storage**：本地持久化存储
- 按用户ID隔离数据
- 支持多用户切换

---

## 数据结构

### 本地存储Keys

```typescript
STORAGE_KEYS = {
  TOKEN: 'supabase_token',
  PROFILES: 'toxictask_profiles',
  TASKS: 'toxictask_tasks',
  SHAME_LOGS: 'toxictask_shame_logs',
  CHECKINS: 'toxictask_checkins',
  ACHIEVEMENTS: 'toxictask_achievements',
  USER_ACHIEVEMENTS: 'toxictask_user_achievements',
  INVITES: 'toxictask_invites',
  AD_WATCHES: 'toxictask_ad_watches',
  RECHARGES: 'toxictask_recharges',
  TRANSACTIONS: 'toxictask_transactions',
}
```

### 核心数据模型

#### Profile（用户档案）
```typescript
{
  id: string;
  username: string;
  avatar_url?: string;
  dignity_coins: number;
  created_at: string;
  updated_at: string;
}
```

#### Task（任务）
```typescript
{
  id: string;
  user_id: string;
  title: string;
  bet_amount: number;
  status: 'pending' | 'completed' | 'failed';
  deadline: string;
  task_type: 'single' | 'repeat';
  repeat_days?: number;
  check_ins?: CheckIn[];
  created_at: string;
  updated_at: string;
}
```

#### CheckIn（打卡记录）
```typescript
{
  date: string; // YYYY-MM-DD
  checked: boolean;
  checked_at?: string;
}
```

#### Achievement（成就）
```typescript
{
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  coins_reward: number;
  condition: {
    target: number;
  };
}
```

#### CoinTransaction（交易记录）
```typescript
{
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // 正数=收入，负数=支出
  balance_after: number;
  source_id?: string;
  description: string;
  created_at: string;
}
```

---

## 页面路由

| 路径 | 页面名称 | 功能描述 |
|------|---------|---------|
| `/pages/auth/index` | 登录页 | 微信授权登录 |
| `/pages/index/index` | 首页 | 任务列表、打卡、调试面板 |
| `/pages/tasks/create` | 创建任务 | 创建单次/重复任务 |
| `/pages/shame/index` | 耻辱墙 | 失败任务记录 |
| `/pages/profile/index` | 个人中心 | 用户信息、功能导航 |
| `/pages/checkin/index` | 签到页 | 每日签到（待实现） |
| `/pages/achievements/index` | 成就页 | 成就列表、领取奖励 |

---

## 待实现功能

### 高优先级
1. **签到系统** ⏳
   - 每日签到获得5币
   - 连续签到奖励
   - 签到日历展示

2. **AI毒舌嘲讽** ⏳
   - 接入大模型API
   - 根据任务内容生成个性化嘲讽
   - 离线降级方案

3. **成就页面UI** ⏳
   - 成就卡片展示
   - 进度条显示
   - 领取奖励交互

### 中优先级
4. **邀请系统** ⏳
   - 生成邀请码
   - 邀请好友获得10币
   - 邀请记录展示

5. **广告系统** ⏳
   - 视频广告（3币/次，每天5次）
   - 横幅广告（1币/次，每天10次）
   - 每日限额控制

6. **充值系统** ⏳
   - 充值套餐设计
   - 微信支付接入
   - 充值记录

### 低优先级
7. **社交功能** ⏳
   - 好友系统
   - 任务分享
   - 排行榜

8. **数据统计** ⏳
   - 任务完成率
   - 尊严币收支统计
   - 成就完成度

---

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件拆分原则：单文件不超过150行

### 命名规范
- 组件：PascalCase
- 函数：camelCase
- 常量：UPPER_SNAKE_CASE
- 类型：PascalCase

### Git提交规范
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 测试指南

### 功能测试
1. **任务流程测试**
   - 创建单次任务 → 完成 → 验证押金返还
   - 创建单次任务 → 超时 → 验证扣款和耻辱记录
   - 创建重复任务 → 每日打卡 → 验证自动完成

2. **成就测试**
   - 参考 `docs/achievement-testing-guide.md`
   - 使用调试面板推进时间
   - 验证成就解锁和奖励发放

3. **边界测试**
   - 余额不足时创建任务
   - 同时创建多个任务
   - 快速切换页面

### 调试技巧
- 使用微信开发者工具的 Storage 面板查看数据
- 使用调试面板推进时间
- 查看控制台日志（搜索 `[Store]` 标签）

---

## 性能优化

### 已实现
- ✅ 任务列表按状态分组
- ✅ 使用 Zustand 避免不必要的重渲染
- ✅ 本地存储缓存用户数据

### 待优化
- ⏳ 任务列表虚拟滚动（大量任务时）
- ⏳ 图片懒加载
- ⏳ 代码分割和按需加载

---

## 已知问题

### 已修复
- ✅ 调试日期推进时单次任务不失败
- ✅ 自定义输入框无法完全清空
- ✅ 重复任务完成时弹出不必要的确认框

### 待修复
- ⏳ 成就检测可能存在性能问题（大量任务时）
- ⏳ 交易记录未分页（数据量大时可能卡顿）

---

## 文档索引

- **功能总览**：`docs/FEATURE_SUMMARY.md`（本文档）
- **成就系统实现**：`docs/achievement-system-implementation.md`
- **成就系统测试**：`docs/achievement-testing-guide.md`
- **尊严币系统设计**：`docs/COIN_SYSTEM_DESIGN.md`
- **尊严币系统进度**：`docs/COIN_SYSTEM_PROGRESS.md`
- **调试指南**：`docs/DEBUG_GUIDE.md`

---

## 更新日志

### 2026-04-05
- ✅ 实现完整的成就系统（13个成就）
- ✅ 修复调试日期推进时任务过期检测问题
- ✅ 优化重复任务交互体验
- ✅ 添加成就系统文档

### 2026-04-04
- ✅ 实现重复任务和每日打卡功能
- ✅ 实现尊严币获取机制
- ✅ 添加调试工具

---

## 联系方式

- **项目仓库**：https://github.com/fengyao1wang/ToxicTask
- **问题反馈**：GitHub Issues
