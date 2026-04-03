# ToxicTask (毒舌待办) 项目开发指南

## 1. 项目简介与产品哲学
ToxicTask 是一款带有“暗黑幽默”和“反内耗”属性的待办事项 App。
核心利用人类的“损失厌恶”心理来克服拖延症。
- **机制：** 用户设定任务并押注虚拟资产（尊严币）。
- **惩罚：** 任务超时未完成，扣除押金，并触发 AI 毒舌嘲讽，将失败记录公开至“耻辱墙”。
- **奖励：** 按时完成则全额退回押金，并获得极简的成就反馈。
- **UI/UX 风格：** 暗黑系（Dark Mode 优先）、极简主义、带有一点粗犷和赛博朋克感。颜色避免使用明亮欢快的色彩，多用黑、深灰、霓虹红/荧光绿作为点缀。

## 2. 强制技术栈
在本项目中，所有代码必须严格遵循以下技术选型，不得私自更换框架：
- **前端框架：** React Native，基于 Expo (且必须使用 Expo Router 进行基于文件系统的路由)。
- **样式方案：** NativeWind (Tailwind CSS for React Native)。
- **后端/数据库/Auth：** Supabase (PostgreSQL)。
- **状态管理：** Zustand。
- **开发语言：** TypeScript (严格模式)。

## 3. 核心功能模块与数据流
- **状态栏与导航：** 底部导航栏包含 `[打卡首页, 耻辱墙, 个人资产]`。
- **任务系统：**
  - 创建任务：名称、倒计时/截止日期、押注金额 (Slider 选择)。
  - 本地状态机：`pending` (进行中) -> `completed` (成功) / `failed` (失败)。
- **毒舌 AI 系统 (核心逻辑)：**
  - 当任务状态变为 `failed`，需触发大模型 API。
  - **AI 嘲讽 Prompt 设定：** "你是一个极度毒舌、刻薄但又幽默的监督者。结合用户失败的任务，用不超过50个字狠狠嘲笑他。不带脏字，但直戳痛处、阴阳怪气。"
- **耻辱墙 (Shame Wall)：** 公开展示所有 `failed` 状态的任务记录及对应的 AI 嘲讽。

## 4. 数据库设计基准 (Supabase)
必须包含且不限于以下表，且需要配置合理的 RLS (Row Level Security)：
- `profiles`: id, username, avatar_url, dignity_coins (整数，默认值 100)。
- `tasks`: id, user_id, title, bet_amount, status, deadline, created_at。
- `shame_logs`: id, task_id, user_id, ai_comment, created_at。

## 5. Claude Code 行为守则与编码规范 (重要！)
作为本项目的 AI 资深架构师和全栈工程师，请严格遵守以下规则：
1. **不要一次性输出几百行代码：** 采用渐进式开发。每次只聚焦一个组件或一个功能点，写完核心逻辑后等待我的确认，再进行下一步。
2. **拒绝过度工程化：** 我们正在构建 MVP（最小可行性产品）。优先使用最简单、最稳健的方式实现需求，不要过早进行性能优化。
3. **注重组件拆分：** 保持单个文件不超过 150 行代码。将 UI 和业务逻辑（自定义 Hooks、Zustand store）分离。
4. **TypeScript 类型优先：** 在写任何组件或 API 交互前，先定义好 `interface` 或 `type`。
5. **处理异步与边缘情况：** 所有调用 Supabase 或 AI API 的地方，必须包含完整的 `try...catch` 错误处理和 loading 状态 UI。
6. **主动排错思维：** 如果我反馈了报错信息，请先分析堆栈日志，提出 1-2 种可能的原因再给出修复代码，不要盲目猜试。
7. **环境变量安全：** 所有 API Key 必须放在 `.env` 文件中，并使用正确的 Expo 环境变量加载方式（`EXPO_PUBLIC_` 前缀），绝不允许将密钥硬编码在代码中。

## 6. 工作流与 Git 规范 (Workflow & Version Control)
我们的开发采用“步步为营”的策略。每当你完成一个功能模块、修复一个 Bug，并在我的确认下测试跑通后，你必须主动执行以下 Git 流程：
1. 询问我是否可以提交代码。
2. 获得允许后，执行 `git status` 检查变动。
3. 执行 `git add .`。
4. 使用 Conventional Commits 规范生成精确的提交信息，例如：`feat: 增加任务押注滑块` 或 `fix: 修复倒计时为负数的bug`，并执行 `git commit`。
5. 自动执行 `git push` 推送到远程仓库。
不要在没有跑通测试的情况下提交任何破坏性的代码。

## 7. Harness Engineering & 生产级容错规范 (Harness & Reliability)
在后续的所有开发中，你必须像一个高级架构师一样思考，为系统构建“安全网（Harness）”。请严格遵守以下工程纪律：

### 7.1. 外部依赖隔离与 Mock 机制 (Mocking Harness)
- **UI 与数据解耦：** 在开发新的 UI 组件时，必须优先支持传入 Mock 数据。不要在 UI 组件内部直接写死 Supabase 请求。
- **环境隔离：** 对于耗费资源或容易被限流的 API（如 AI 嘲讽接口、发邮件、真实扣款），必须实现本地开发环境的 Mock 替代方案。例如：通过读取环境变量 `EXPO_PUBLIC_USE_MOCK=true`，让本地测试时直接返回一条预设的假毒舌评论，而不是每次都去调用真实的 LLM API。

### 7.2. 防御性编程与优雅降级 (Graceful Degradation)
- **绝不让 App 崩溃：** 所有异步操作（Network, DB, AI API）必须有兜底逻辑。如果请求超时或抛出 500/429 错误，必须捕获异常，并在前端展示友好的 fallback UI，而不是抛出红屏报错（Redbox）。
- **AI 降级预案：** 大模型接口极易出现超时或生成格式错误。当触发 AI 毒舌服务失败时，系统应自动返回本地预设的“离线毒舌语录库”中的随机一句话。

### 7.3. 功能开关与隔离控制 (Feature Flags)
- **增量交付：** 当我要求你开发一个高风险或复杂的“实验性功能”（例如：好友对战 PvP 模式、复杂的重构）时，请使用常量配置或环境变量作为 Feature Flag（功能开关）将其包裹。
- 确保在开关设为 `false` 时，该新代码的入口被完全隐藏，绝对不影响现有的 MVP 核心主干流程。

### 7.4. 可观测性底座 (Observability & Telemetry)
- 严禁在代码中留下无意义的 `console.log("here")` 或 `console.log(data)`。
- **规范化日志：** 所有日志必须带有明确的上下文标签，例如：`[Auth][Error] 登录失败: xxxx` 或 `[Task][Info] 触发AI扣款结算, TaskID: 123`。这为后续接入 Sentry 或 Datadog 等监控工具打下基础。