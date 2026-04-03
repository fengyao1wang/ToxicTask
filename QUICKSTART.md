# 🚀 快速开始指南

## ✅ 已完成
- [x] 项目初始化
- [x] 依赖安装
- [x] Supabase 配置文件创建
- [x] 环境变量配置

## 📋 接下来的步骤

### 1. 在 Supabase Dashboard 执行 SQL 脚本

**重要：这一步必须完成，否则数据库无法使用！**

1. 访问 https://app.supabase.com/
2. 选择你的项目（或创建新项目）
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**
5. 打开 `supabase/setup_complete.sql` 文件
6. 复制全部内容，粘贴到 SQL Editor
7. 点击右下角的 **Run** 按钮
8. 等待执行完成（应该显示 "Success. No rows returned"）

### 2. 启动项目并测试连接

```bash
# 启动开发服务器
npm start

# 或者直接启动 Web 版本
npm run web
```

### 3. 测试 Supabase 连接

启动后，在浏览器中访问测试页面：
- 路径：`/test-connection`
- 点击"测试连接"按钮
- 如果显示 ✅ 连接成功，说明配置正确

### 4. 如果连接失败

检查以下几点：
1. 确认已在 Supabase Dashboard 执行了 SQL 脚本
2. 确认 `.env` 文件中的 URL 和 Key 正确
3. 重启 Expo 开发服务器（Ctrl+C 然后重新 `npm start`）
4. 检查 Supabase 项目是否处于活跃状态

### 5. 连接成功后

我们可以开始开发：
- 用户注册/登录页面
- 任务创建功能
- 底部导航栏
- 打卡首页
- 耻辱墙

## 🔍 调试技巧

如果遇到问题，可以在代码中添加：

```typescript
import { supabase } from '@/lib/supabase';

// 测试连接
const test = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  console.log('Data:', data);
  console.log('Error:', error);
};
```

## 📞 需要帮助？

告诉我你遇到的问题，我会帮你解决！
