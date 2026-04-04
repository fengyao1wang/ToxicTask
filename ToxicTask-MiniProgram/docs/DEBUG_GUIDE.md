# 调试指南

## 问题1: 打卡页（首页）白屏

### 可能原因
1. `updateDignityCoins` 函数签名不匹配（已修复）
2. 其他 JavaScript 错误导致页面崩溃

### 调试步骤
1. 打开微信开发者工具
2. 打开控制台（Console）
3. 刷新页面，查看是否有红色错误信息
4. 如果有错误，记录完整的错误堆栈

### 已修复的问题
- ✅ `appStore.ts` 中 `updateDignityCoins` 函数签名已修正为 `(userId: string, amount: number)`

---

## 问题2: 签到按钮点击无反应

### 可能原因
1. 用户信息未正确加载
2. 签到逻辑执行失败
3. 按钮被禁用

### 调试步骤

#### 步骤1: 检查用户登录状态
1. 打开签到页面
2. 查看页面顶部是否显示红色警告"用户未登录，请返回首页"
3. 如果显示，说明用户信息未传递到签到页面

#### 步骤2: 查看控制台日志
打开控制台，点击签到按钮，应该看到以下日志：
```
[CheckIn] 点击签到按钮, user: {...}, isCheckedInToday: false
[CheckIn] 开始执行签到, userId: xxx
[CheckInStore][Info] 签到成功: {...}
[CheckIn] 签到成功
```

如果没有看到这些日志，说明：
- 按钮点击事件未触发
- 或者在某个检查点被拦截了

#### 步骤3: 检查签到状态
如果看到日志 `isCheckedInToday: true`，说明系统认为今天已经签到过了。

解决方法：
1. 清除小程序缓存：微信开发者工具 → 工具 → 清除缓存 → 清除全部缓存
2. 重新登录

#### 步骤4: 检查本地存储
在控制台执行以下命令查看签到记录：
```javascript
wx.getStorageSync('toxictask_checkins')
```

应该返回类似这样的结构：
```json
{
  "wx_xxx": [
    {
      "id": "xxx",
      "user_id": "wx_xxx",
      "check_in_date": "2026-04-04",
      "coins_earned": 5,
      "created_at": "2026-04-04T11:00:00.000Z"
    }
  ]
}
```

---

## 完整测试流程

### 1. 清除缓存并重新开始
```
微信开发者工具 → 工具 → 清除缓存 → 清除全部缓存
```

### 2. 重新登录
1. 打开小程序
2. 点击"微信登录"
3. 确认授权

### 3. 测试首页
1. 查看首页是否正常显示
2. 查看尊严币余额是否显示（应该是 100）
3. 尝试创建一个任务

### 4. 测试签到功能
1. 进入个人资料页面
2. 点击"每日签到"卡片
3. 进入签到页面
4. 查看是否显示"用户未登录"警告
5. 点击"立即签到"按钮
6. 查看控制台日志
7. 查看是否显示"签到成功！+5 尊严币"提示
8. 返回个人资料页面，查看尊严币是否增加到 105

### 5. 测试成就功能
1. 进入个人资料页面
2. 点击"成就系统"卡片
3. 查看成就列表是否正常显示
4. 查看未解锁成就的进度条

---

## 常见错误及解决方法

### 错误1: Cannot read property 'id' of null
**原因**: 用户信息为空  
**解决**: 确保已登录，检查 `authApi.getSession()` 是否正常工作

### 错误2: updateDignityCoins is not a function
**原因**: Store 函数签名不匹配  
**解决**: 已修复，重新编译即可

### 错误3: Unexpected token
**原因**: 语法错误  
**解决**: 已修复 `achievementStore.ts` 第173行的语法错误

### 错误4: 签到按钮点击无反应
**可能原因**:
1. 用户未登录 → 查看是否显示红色警告
2. 今天已签到 → 清除缓存重试
3. 按钮被禁用 → 检查 `isCheckedInToday` 和 `loading` 状态
4. 事件未绑定 → 检查 `onClick={handleCheckIn}` 是否正确

---

## 调试命令

在微信开发者工具控制台执行以下命令：

### 查看所有本地存储
```javascript
console.log('Token:', wx.getStorageSync('supabase_token'));
console.log('Profiles:', wx.getStorageSync('toxictask_profiles'));
console.log('Tasks:', wx.getStorageSync('toxictask_tasks'));
console.log('CheckIns:', wx.getStorageSync('toxictask_checkins'));
console.log('Transactions:', wx.getStorageSync('toxictask_transactions'));
console.log('Achievements:', wx.getStorageSync('toxictask_achievements'));
console.log('UserAchievements:', wx.getStorageSync('toxictask_user_achievements'));
```

### 清除特定数据
```javascript
// 清除签到记录
wx.removeStorageSync('toxictask_checkins');

// 清除交易记录
wx.removeStorageSync('toxictask_transactions');

// 清除用户成就
wx.removeStorageSync('toxictask_user_achievements');
```

### 手动触发签到（测试用）
```javascript
// 在签到页面的控制台执行
const { useCheckInStore } = require('../../lib/stores/checkinStore');
const store = useCheckInStore.getState();
store.performCheckIn('你的用户ID');
```

---

## 下一步

如果以上步骤都无法解决问题，请提供：
1. 控制台的完整错误信息（截图或复制文本）
2. 点击签到按钮时的控制台日志
3. 本地存储的数据（执行上面的调试命令）

这样我可以更准确地定位问题。
