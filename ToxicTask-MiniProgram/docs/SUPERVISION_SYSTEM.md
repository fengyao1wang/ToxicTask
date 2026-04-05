# 好友监督机制实现文档

> 实现日期：2026-04-05
> 版本：v0.3.0

## 功能概述

好友监督机制是一个社交契约功能，允许用户在创建任务时邀请好友监督，通过社交压力和经济激励来提高任务完成率。

## 核心机制

### 1. 创建监督任务

用户创建任务时可以选择开启"好友监督"：
- 设置监督赏金（5-50币）
- 系统扣除：本金 + 赏金
- 任务状态：`waiting_invite`

### 2. 邀请好友

- 通过小程序分享功能邀请好友
- 好友点击分享链接进入任务详情页
- 好友接受监督后成为该任务的监督者
- 任务状态：`invited`

### 3. 提交证据

任务完成后，发起人需要提交证据：
- 上传图片（必选或可选）
- 填写文字说明（可选）
- 任务状态：`evidence_submitted`

### 4. 审核证据

监督者审核证据，有两种结果：

#### 通过（Approved）
- 发起人：返还本金
- 监督者：获得赏金
- 任务状态：`completed`

#### 拒绝（Rejected）
- 发起人：本金没收
- 监督者：获得赏金 + 50%本金分红
- 任务状态：`failed`
- 创建耻辱记录

### 5. 超时机制

如果证据提交后24小时内监督者未审核：
- 自动判定任务成功
- 返还本金给发起人
- 退回赏金给发起人
- 任务状态：`completed`

## 数据结构

### Task 扩展字段

```typescript
interface Task {
  // ... 原有字段
  
  // 好友监督相关
  is_supervised: boolean;              // 是否开启监督
  supervisor_id?: string | null;       // 监督者ID
  bounty_coins: number;                // 监督赏金
  evidence_image?: string | null;      // 证据图片URL
  evidence_text?: string | null;       // 证据文字
  supervision_status: SupervisionStatus; // 监督状态
  evidence_submitted_at?: string;      // 证据提交时间
}

type SupervisionStatus =
  | 'none'                // 未开启监督
  | 'waiting_invite'      // 等待邀请
  | 'invited'             // 已邀请
  | 'evidence_submitted'  // 已提交证据
  | 'approved'            // 已通过
  | 'rejected';           // 已拒绝
```

### TransactionType 扩展

```typescript
type TransactionType =
  | ... // 原有类型
  | 'bounty_freeze'   // 冻结赏金
  | 'bounty_reward'   // 监督奖励
  | 'bounty_refund';  // 赏金退回
```

## 核心API

### taskStore 新增方法

```typescript
// 接受监督
acceptSupervision(taskId: string, supervisorId: string): Promise<void>

// 提交证据
submitEvidence(taskId: string, evidenceImage?: string, evidenceText?: string): Promise<void>

// 审核证据
reviewEvidence(taskId: string, approved: boolean, reviewerId: string): Promise<void>

// 检查监督超时
checkSupervisionTimeout(userId: string): Promise<void>
```

## 成就系统扩展

新增3个与监督相关的成就：

### 1. 大义灭亲
- **触发条件**：作为监督者，累计拒绝好友任务达到3次
- **奖励**：20币
- **图标**：⚔️

### 2. 包庇狂魔
- **触发条件**：作为监督者，连续通过好友任务5次
- **奖励**：10币
- **图标**：🤝

### 3. 交友不慎
- **触发条件**：作为发起者，因被好友拒绝而导致破产（余额归零）
- **奖励**：15币
- **图标**：💔

## UI/UX 设计

### 任务创建页

1. **监督开关**
   - Switch 组件控制是否开启监督
   - 开启后显示赏金设置区域

2. **赏金设置**
   - 快捷选项：5/10/20/30币
   - 滑块调整：5-50币
   - 显示总花费：本金 + 赏金

3. **规则说明**
   - 通过：返还本金，好友获得赏金
   - 拒绝：本金没收，好友获得赏金+50%本金
   - 超时：24小时未审核自动通过，赏金退回

### 任务详情页

根据用户角色和任务状态显示不同内容：

#### 发起人视角
- **等待邀请**：显示分享按钮
- **已邀请**：显示证据提交表单（图片上传 + 文字说明）
- **待审核**：显示已提交的证据，等待监督者审核
- **已完成/已拒绝**：显示最终结果

#### 监督者视角
- **待审核**：显示证据内容，提供"通过"和"拒绝"按钮
- **已完成/已拒绝**：显示审核结果

#### 访客视角
- **等待邀请**：显示"接受监督"按钮

### 首页任务卡片

- 显示监督状态标签（🔍 好友监督）
- 开启监督的任务，"完成任务"按钮改为"查看详情"
- 点击跳转到任务详情页

## 技术实现细节

### 1. 创建任务时的扣款逻辑

```typescript
// 在 taskStore.createTask 中
if (task.is_supervised && task.bounty_coins > 0) {
  // 扣除本金
  await coinStore.addTransaction(userId, 'task_bet', -task.bet_amount, taskId);
  // 冻结赏金
  await coinStore.addTransaction(userId, 'bounty_freeze', -task.bounty_coins, taskId);
}
```

### 2. 审核通过的结算逻辑

```typescript
// 返还本金给发起人
await coinStore.addTransaction(task.user_id, 'task_refund', task.bet_amount, taskId);

// 监督者获得赏金
await coinStore.addTransaction(reviewerId, 'bounty_reward', task.bounty_coins, taskId);
```

### 3. 审核拒绝的结算逻辑

```typescript
// 监督者获得赏金 + 50%本金分红
const totalReward = task.bounty_coins + Math.floor(task.bet_amount * 0.5);
await coinStore.addTransaction(reviewerId, 'bounty_reward', totalReward, taskId);

// 创建耻辱记录
await appStore.createShameLog(taskId, task.user_id, task.title, task.bet_amount);
```

### 4. 超时自动通过逻辑

```typescript
// 在 taskStore.checkSupervisionTimeout 中
if (now - submittedTime > 24 * 60 * 60 * 1000) {
  // 返还本金
  await coinStore.addTransaction(task.user_id, 'task_refund', task.bet_amount, taskId);
  // 退回赏金
  await coinStore.addTransaction(task.user_id, 'bounty_refund', task.bounty_coins, taskId);
  // 更新任务状态为完成
  task.status = 'completed';
  task.supervision_status = 'approved';
}
```

## 文件清单

### 新增文件
- `src/pages/tasks/detail.tsx` - 任务详情页
- `src/pages/tasks/detail.scss` - 任务详情页样式
- `docs/SUPERVISION_SYSTEM.md` - 本文档

### 修改文件
- `src/types/index.ts` - 扩展类型定义
- `src/lib/stores/taskStore.ts` - 添加监督相关方法
- `src/lib/stores/coinStore.ts` - 添加新的交易类型描述
- `src/lib/stores/achievementStore.ts` - 添加3个新成就
- `src/pages/tasks/create.tsx` - 添加监督开关和赏金设置
- `src/pages/tasks/create.scss` - 添加监督相关样式
- `src/pages/index/index.tsx` - 添加监督状态显示和超时检查
- `src/pages/index/index.scss` - 添加监督状态样式
- `src/app.config.ts` - 注册任务详情页路由

## 测试指南

### 1. 创建监督任务
1. 进入任务创建页
2. 开启"好友监督"开关
3. 设置赏金金额
4. 确认总花费正确（本金 + 赏金）
5. 创建任务
6. 验证余额扣除正确

### 2. 邀请好友
1. 创建监督任务后，点击"去分享"
2. 分享给好友（或在另一个账号中打开）
3. 好友点击"接受监督"
4. 验证任务状态变为"已邀请"

### 3. 提交证据
1. 发起人进入任务详情页
2. 上传证据图片
3. 填写文字说明
4. 提交证据
5. 验证任务状态变为"待审核"

### 4. 审核通过
1. 监督者进入任务详情页
2. 查看证据
3. 点击"通过"
4. 验证发起人获得本金退款
5. 验证监督者获得赏金
6. 验证任务状态变为"已完成"

### 5. 审核拒绝
1. 监督者进入任务详情页
2. 查看证据
3. 点击"拒绝"
4. 验证监督者获得赏金 + 50%本金分红
5. 验证创建耻辱记录
6. 验证任务状态变为"已失败"
7. 验证相关成就解锁

### 6. 超时自动通过
1. 提交证据后，使用调试工具推进时间超过24小时
2. 验证任务自动完成
3. 验证本金和赏金都退回给发起人

## 已知限制

1. **图片存储**：当前图片只存储在本地临时路径，未上传到云存储
2. **分享功能**：小程序分享需要在真机上测试，开发工具中可能无法完整测试
3. **通知功能**：未实现消息通知，用户需要主动查看任务状态
4. **好友系统**：未实现好友列表，只能通过分享邀请

## 后续优化方向

1. **图片上传**：接入云存储服务（如微信云开发、七牛云）
2. **消息通知**：接入微信模板消息或订阅消息
3. **好友系统**：实现好友列表和好友管理
4. **监督历史**：添加监督历史记录页面
5. **信用评分**：根据监督行为计算信用分
6. **争议仲裁**：添加申诉机制处理争议

## 经济模型分析

### 发起人视角
- **成本**：本金 + 赏金
- **收益**：
  - 通过：返还本金（净成本 = 赏金）
  - 拒绝：损失本金 + 赏金
- **风险**：选择不靠谱的监督者可能导致破产

### 监督者视角
- **成本**：时间成本
- **收益**：
  - 通过：赏金
  - 拒绝：赏金 + 50%本金分红
- **风险**：过于严格可能失去朋友信任

### 平衡性
- 50%本金分红机制鼓励监督者认真审核
- 超时自动通过机制保护发起人利益
- 赏金机制补偿监督者的时间成本

## 更新日志

### v0.3.0 (2026-04-05)
- ✅ 实现好友监督机制核心功能
- ✅ 添加任务详情页
- ✅ 扩展成就系统（3个新成就）
- ✅ 实现证据提交和审核流程
- ✅ 实现超时自动通过机制
- ✅ 更新UI显示监督状态

---

**注意**：本功能为实验性功能，建议在小范围用户中测试后再全面推广。
