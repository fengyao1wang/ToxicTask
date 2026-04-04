# ToxicTask 微信小程序开发总结

## 项目概述

ToxicTask（毒舌待办）是一款基于"损失厌恶"心理的待办事项微信小程序。用户创建任务并押注虚拟货币（尊严币），任务超时未完成将扣除押金并触发 AI 毒舌嘲讽，失败记录公开至"耻辱墙"。

## 技术栈

- **框架**: Taro 4.1.11 + React 18 + TypeScript
- **状态管理**: Zustand
- **样式**: SCSS
- **数据存储**: 微信小程序本地存储（Taro Storage API）
- **认证**: 微信原生登录（getUserProfile + login）

## 已完成功能

### 1. 用户认证系统
- ✅ 微信授权登录（`Taro.getUserProfile` + `Taro.login`）
- ✅ 自动创建本地用户档案
- ✅ 初始尊严币：100
- ✅ 退出登录功能

**实现文件**:
- `src/lib/auth/index.ts` - 认证 API
- `src/pages/auth/index.tsx` - 登录页面
- `src/lib/stores/appStore.ts` - 用户状态管理

### 2. 任务管理系统
- ✅ 创建任务
  - 任务标题输入（最多50字）
  - 自定义押注金额（1-100尊严币）
    - 快速选择按钮：5, 10, 20, 30, 50
    - 滑块精确调整：1-100
  - iOS 风格时间选择器
    - 小时：0-71 小时
    - 分钟：0-59 分钟
- ✅ 任务列表展示
  - 显示任务标题、押注金额、状态、截止时间
  - 状态标识：进行中、已完成、已失败
  - 按创建时间倒序排列
- ✅ 任务状态管理
  - pending（进行中）
  - completed（已完成）
  - failed（已失败）

**实现文件**:
- `src/pages/tasks/create.tsx` - 创建任务页面
- `src/pages/index/index.tsx` - 任务列表页面
- `src/lib/stores/taskStore.ts` - 任务状态管理

### 3. 自动过期检查机制
- ✅ 页面加载时立即检查过期任务
- ✅ 每10秒自动检查一次
- ✅ 过期任务自动标记为"已失败"
- ✅ 自动扣除尊严币
- ✅ 自动生成耻辱记录

**实现逻辑** (`src/pages/index/index.tsx`):
```typescript
useEffect(() => {
  const checkExpiredTasks = async () => {
    const now = new Date().getTime();
    for (const task of tasks) {
      if (task.status === 'pending') {
        const deadline = new Date(task.deadline).getTime();
        if (now > deadline) {
          // 标记为失败
          await updateTaskStatus(task.id, 'failed');
          // 扣除尊严币
          updateDignityCoins(user.id, newCoins);
          // 创建耻辱记录
          // ...
        }
      }
    }
  };
  
  checkExpiredTasks();
  const timer = setInterval(checkExpiredTasks, 10000);
  return () => clearInterval(timer);
}, [user, tasks, profile]);
```

### 4. 耻辱墙系统
- ✅ 展示所有失败任务记录
- ✅ 显示任务标题、损失金额、AI 评论、失败时间
- ✅ 按时间倒序排列
- ✅ 空状态提示

**实现文件**:
- `src/pages/shame/index.tsx` - 耻辱墙页面

### 5. 个人资料页面
- ✅ 显示用户头像（微信头像首字母）
- ✅ 显示用户名（微信昵称）
- ✅ 显示尊严币余额
- ✅ 统计数据（已完成、进行中、已失败）
- ✅ 用户信息（用户ID、注册时间）
- ✅ 退出登录功能

**实现文件**:
- `src/pages/profile/index.tsx` - 个人资料页面

### 6. 底部导航栏
- ✅ 打卡首页（任务列表）
- ✅ 耻辱墙
- ✅ 个人资料

**配置文件**:
- `src/app.config.ts` - 页面路由和 tabBar 配置

## 数据结构

### 本地存储 Keys

1. **`supabase_token`** - 用户登录凭证
```typescript
{
  user: {
    id: string;
    email: string;
    user_metadata: {
      nickname: string;
      avatar_url: string;
    };
  };
  access_token: string;
}
```

2. **`toxictask_profiles`** - 用户档案
```typescript
{
  [userId: string]: {
    id: string;
    username: string;
    avatar_url?: string;
    dignity_coins: number;
    created_at: string;
    updated_at: string;
  }
}
```

3. **`toxictask_tasks`** - 任务列表
```typescript
{
  [userId: string]: Task[]
}

interface Task {
  id: string;
  user_id: string;
  title: string;
  bet_amount: number;
  status: 'pending' | 'completed' | 'failed';
  deadline: string;
  created_at: string;
  updated_at: string;
}
```

4. **`toxictask_shame_logs`** - 耻辱记录
```typescript
ShameLog[] // 全局共享

interface ShameLog {
  id: string;
  task_id: string;
  user_id: string;
  task_title: string;
  bet_amount: number;
  ai_comment: string;
  created_at: string;
}
```

## 项目结构

```
ToxicTask-MiniProgram/
├── src/
│   ├── app.config.ts           # 应用配置（页面路由、tabBar）
│   ├── app.scss                # 全局样式
│   ├── app.ts                  # 应用入口
│   ├── lib/
│   │   ├── auth/
│   │   │   └── index.ts        # 认证 API（本地存储）
│   │   └── stores/
│   │       ├── appStore.ts     # 用户状态管理
│   │       └── taskStore.ts    # 任务状态管理
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── index.tsx       # 登录页面
│   │   │   └── index.scss
│   │   ├── index/
│   │   │   ├── index.tsx       # 任务列表（首页）
│   │   │   └── index.scss
│   │   ├── profile/
│   │   │   ├── index.tsx       # 个人资料页面
│   │   │   └── index.scss
│   │   ├── shame/
│   │   │   ├── index.tsx       # 耻辱墙页面
│   │   │   └── index.scss
│   │   └── tasks/
│   │       ├── create.tsx      # 创建任务页面
│   │       └── create.scss
│   └── types/
│       └── index.ts            # TypeScript 类型定义
├── dist/                       # 编译输出目录
├── config/                     # Taro 配置
├── package.json
└── project.config.json         # 微信小程序配置
```

## 关键技术实现

### 1. 微信登录流程

```typescript
// src/pages/auth/index.tsx
const handleWechatLogin = async () => {
  // 1. 获取微信用户信息
  const userInfoRes = await Taro.getUserProfile({
    desc: '用于完善用户资料',
  });
  const { nickName, avatarUrl } = userInfoRes.userInfo;

  // 2. 获取微信登录凭证
  const loginRes = await Taro.login();
  const code = loginRes.code;

  // 3. 创建本地用户
  const mockUser = {
    id: `wx_${code.substring(0, 10)}`,
    email: `${code.substring(0, 10)}@wechat.user`,
    user_metadata: {
      nickname: nickName,
      avatar_url: avatarUrl,
    },
  };

  // 4. 保存到本地存储
  Taro.setStorageSync('supabase_token', {
    user: mockUser,
    access_token: `mock_token_${code}`,
  });

  // 5. 初始化用户档案
  initProfile(mockUser.id);
};
```

### 2. 本地存储管理

```typescript
// src/lib/stores/taskStore.ts
const loadTasksFromStorage = (userId: string): Task[] => {
  const allTasks = Taro.getStorageSync(TASKS_STORAGE_KEY) || {};
  return allTasks[userId] || [];
};

const saveTasksToStorage = (userId: string, tasks: Task[]) => {
  const allTasks = Taro.getStorageSync(TASKS_STORAGE_KEY) || {};
  allTasks[userId] = tasks;
  Taro.setStorageSync(TASKS_STORAGE_KEY, allTasks);
};
```

### 3. iOS 风格时间选择器

```typescript
// src/pages/tasks/create.tsx
const hoursRange = Array.from({ length: 72 }, (_, i) => i);
const minutesRange = Array.from({ length: 60 }, (_, i) => i);

<PickerView
  value={[hours, minutes]}
  onChange={handlePickerChange}
>
  <PickerViewColumn>
    {hoursRange.map((h) => (
      <View key={h}>
        <Text>{h} 小时</Text>
      </View>
    ))}
  </PickerViewColumn>
  <PickerViewColumn>
    {minutesRange.map((m) => (
      <View key={m}>
        <Text>{m} 分钟</Text>
      </View>
    ))}
  </PickerViewColumn>
</PickerView>
```

## 已解决的问题

### 1. 白屏问题
**原因**: 页面引用了已删除的 Supabase API 模块
**解决方案**:
- 删除 `src/lib/supabase/api.ts`、`client.ts`
- 简化 `auth.ts` 并移至 `src/lib/auth/index.ts`
- 更新所有页面的导入路径

### 2. TypeError: n[e] is not a function
**原因**: 编译后的代码仍在尝试调用不存在的 Supabase 函数
**解决方案**:
- 完全移除 Supabase 依赖
- 所有数据操作改用本地存储
- 清除微信开发者工具缓存后重新编译

### 3. 任务过期不更新状态
**原因**: 没有自动检查机制
**解决方案**:
- 在首页添加 `useEffect` 定时器
- 每10秒检查一次过期任务
- 自动更新状态、扣除尊严币、生成耻辱记录

## 开发环境配置

### 必需工具
- Node.js 16+
- 微信开发者工具
- AppID: `wx105b7b22f5b871fc`

### 安装依赖
```bash
cd ToxicTask-MiniProgram
npm install
```

### 开发命令
```bash
# 开发模式（监听文件变化）
npm run dev:weapp

# 生产构建
npm run build:weapp
```

### 微信开发者工具配置
1. 打开微信开发者工具
2. 导入项目：选择 `ToxicTask-MiniProgram/dist` 目录
3. AppID: `wx105b7b22f5b871fc`
4. 清除缓存：工具 → 清除缓存 → 清除全部缓存

## 待开发功能

### 1. 任务完成功能
- [ ] 添加"完成任务"按钮
- [ ] 完成后返还押金
- [ ] 显示成就反馈

### 2. AI 毒舌评论
- [ ] 集成大模型 API（如 OpenAI、通义千问）
- [ ] 根据任务内容生成个性化嘲讽
- [ ] 设置 Prompt：毒舌但幽默，不超过50字

### 3. 数据统计
- [ ] 完成率统计
- [ ] 尊严币收支记录
- [ ] 任务完成趋势图表

### 4. 社交功能
- [ ] 好友系统
- [ ] 好友对战 PvP 模式
- [ ] 耻辱墙点赞/评论

### 5. 通知提醒
- [ ] 任务即将到期提醒（微信订阅消息）
- [ ] 任务失败通知

### 6. 数据备份
- [ ] 云端同步（可选接入 Supabase 或其他后端）
- [ ] 导出/导入数据

## Git 提交记录

### 最新提交 (2026-04-04)
```
commit 64a6084
feat: 完成微信小程序核心功能开发

- 移除 Supabase 依赖，切换到本地存储
- 实现微信原生登录
- 任务创建功能优化（自定义押注 + iOS 时间选择器）
- 自动过期检查机制（每10秒）
- 修复白屏和 TypeError 错误
```

### 之前的提交
```
commit c091131
feat: 尝试修复移动端兼容性并配置 EAS 构建

commit e6f7095
feat: 完成 MVP 核心功能开发

commit b60a8a5
feat: 实现用户注册与认证系统
```

## 注意事项

### 1. 环境变量
- 目前未使用环境变量
- 如需接入 AI API，需在 `.env` 中配置 API Key
- 使用 `EXPO_PUBLIC_` 前缀（虽然现在是 Taro 项目）

### 2. 数据安全
- 所有数据存储在本地，未加密
- 敏感信息（如 API Key）不要硬编码
- 生产环境建议接入云端数据库

### 3. 性能优化
- 任务列表较多时考虑分页加载
- 耻辱墙记录较多时考虑虚拟列表
- 定时器在页面卸载时需清理（已实现）

### 4. 微信小程序限制
- 本地存储上限：10MB
- 单个 key 存储上限：1MB
- 需定期清理过期数据

## 联系方式

- GitHub: https://github.com/fengyao1wang/ToxicTask
- 项目文档: `CLAUDE.md`
- 开发计划: `MINIPROGRAM_PLAN.md`

## 更新日志

### v0.2.0 (2026-04-04)
- ✅ 完成微信小程序核心功能
- ✅ 移除 Supabase 依赖
- ✅ 实现本地存储
- ✅ 自动过期检查机制

### v0.1.0 (2026-04-03)
- ✅ 初始化 Taro 项目
- ✅ 基础页面结构
- ✅ Supabase 集成（已废弃）

---

**最后更新**: 2026-04-04
**当前版本**: v0.2.0
**开发状态**: MVP 核心功能已完成，可进行功能测试
