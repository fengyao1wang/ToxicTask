# 尊严币获取系统设计文档

## 1. 系统概述

本文档定义了 ToxicTask 小程序中尊严币的5种获取渠道及其技术实现方案。

## 2. 数据结构设计

### 2.1 签到记录 (CheckInRecord)
```typescript
interface CheckInRecord {
  id: string;
  user_id: string;
  check_in_date: string; // YYYY-MM-DD 格式
  coins_earned: number; // 固定为 5
  created_at: string;
}

// 本地存储 Key: 'toxictask_checkins'
// 结构: { [userId: string]: CheckInRecord[] }
```

### 2.2 成就系统 (Achievement)
```typescript
interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  coins_reward: number;
  condition: AchievementCondition;
}

type AchievementType = 
  | 'consecutive_complete' // 连续完成任务
  | 'high_bet_complete'    // 完成高押注任务
  | 'total_complete'       // 累计完成任务数
  | 'perfect_week'         // 一周内全部完成
  | 'early_bird';          // 提前完成任务

interface AchievementCondition {
  target: number; // 目标值（如连续3天、累计10个）
  current?: number; // 当前进度
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  coins_earned: number;
}

// 本地存储 Key: 'toxictask_achievements' (预设成就列表)
// 本地存储 Key: 'toxictask_user_achievements'
// 结构: { [userId: string]: UserAchievement[] }
```

### 2.3 邀请记录 (InviteRecord)
```typescript
interface InviteRecord {
  id: string;
  inviter_id: string; // 邀请人
  invitee_id: string; // 被邀请人
  invitee_nickname: string;
  coins_earned: number; // 固定为 10
  created_at: string;
}

// 本地存储 Key: 'toxictask_invites'
// 结构: { [userId: string]: InviteRecord[] }
```

### 2.4 广告观看记录 (AdWatchRecord)
```typescript
interface AdWatchRecord {
  id: string;
  user_id: string;
  ad_type: 'video' | 'banner'; // 视频广告或横幅广告
  coins_earned: number; // 视频广告 3 币，横幅广告 1 币
  watch_date: string; // YYYY-MM-DD 格式
  created_at: string;
}

// 本地存储 Key: 'toxictask_ad_watches'
// 结构: { [userId: string]: AdWatchRecord[] }

// 每日限制
interface AdDailyLimit {
  video_ads: number; // 每天最多观看 5 次视频广告
  banner_ads: number; // 每天最多观看 10 次横幅广告
}
```

### 2.5 充值记录 (RechargeRecord)
```typescript
interface RechargePackage {
  id: string;
  name: string;
  coins: number;
  price: number; // 单位：元
  bonus_coins: number; // 额外赠送
  is_popular: boolean; // 是否为热门套餐
}

interface RechargeRecord {
  id: string;
  user_id: string;
  package_id: string;
  coins_purchased: number;
  bonus_coins: number;
  total_coins: number;
  amount_paid: number; // 实际支付金额
  payment_method: 'wechat_pay';
  transaction_id: string; // 微信支付订单号
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  paid_at?: string;
}

// 本地存储 Key: 'toxictask_recharges'
// 结构: { [userId: string]: RechargeRecord[] }
```

### 2.6 尊严币交易记录 (CoinTransaction)
```typescript
interface CoinTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // 正数为收入，负数为支出
  balance_after: number; // 交易后余额
  source_id?: string; // 关联的任务ID、成就ID等
  description: string;
  created_at: string;
}

type TransactionType = 
  | 'task_bet'        // 任务押注（支出）
  | 'task_refund'     // 任务完成退款（收入）
  | 'task_penalty'    // 任务失败扣款（支出）
  | 'check_in'        // 签到奖励（收入）
  | 'achievement'     // 成就奖励（收入）
  | 'invite'          // 邀请奖励（收入）
  | 'ad_watch'        // 观看广告（收入）
  | 'recharge';       // 充值（收入）

// 本地存储 Key: 'toxictask_transactions'
// 结构: { [userId: string]: CoinTransaction[] }
```

## 3. 功能实现方案

### 3.1 签到打卡系统

**规则**:
- 每天可签到一次，获得 5 尊严币
- 连续签到有额外奖励（通过成就系统实现）
- 签到时间：每天 00:00 重置

**实现逻辑**:
```typescript
// 检查今天是否已签到
const checkTodayCheckIn = (userId: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  const records = getCheckInRecords(userId);
  return records.some(r => r.check_in_date === today);
};

// 执行签到
const performCheckIn = async (userId: string): Promise<void> => {
  if (checkTodayCheckIn(userId)) {
    throw new Error('今天已经签到过了');
  }
  
  const record: CheckInRecord = {
    id: generateId(),
    user_id: userId,
    check_in_date: new Date().toISOString().split('T')[0],
    coins_earned: 5,
    created_at: new Date().toISOString(),
  };
  
  // 保存签到记录
  saveCheckInRecord(userId, record);
  
  // 增加尊严币
  addCoins(userId, 5, 'check_in', record.id, '每日签到');
  
  // 检查连续签到成就
  checkConsecutiveCheckInAchievement(userId);
};
```

### 3.2 成就系统

**预设成就列表**:
1. **新手上路** - 完成第一个任务 (奖励: 10 币)
2. **连胜三天** - 连续3天完成任务 (奖励: 20 币)
3. **连胜一周** - 连续7天完成任务 (奖励: 50 币)
4. **高风险玩家** - 完成一个押注 ≥50 币的任务 (奖励: 30 币)
5. **任务达人** - 累计完成 10 个任务 (奖励: 50 币)
6. **任务大师** - 累计完成 50 个任务 (奖励: 100 币)
7. **完美一周** - 一周内所有任务全部完成 (奖励: 80 币)
8. **早起的鸟儿** - 提前 1 小时完成任务 (奖励: 15 币)
9. **签到达人** - 连续签到 7 天 (奖励: 30 币)
10. **邀请达人** - 邀请 5 个好友 (奖励: 50 币)

**实现逻辑**:
```typescript
// 检查并解锁成就
const checkAchievements = async (userId: string, trigger: string): Promise<void> => {
  const allAchievements = getAchievements();
  const userAchievements = getUserAchievements(userId);
  const unlockedIds = userAchievements.map(ua => ua.achievement_id);
  
  for (const achievement of allAchievements) {
    if (unlockedIds.includes(achievement.id)) continue;
    
    const isUnlocked = await checkAchievementCondition(userId, achievement);
    if (isUnlocked) {
      unlockAchievement(userId, achievement);
    }
  }
};
```

### 3.3 邀请奖励系统

**规则**:
- 生成专属邀请码（基于用户ID）
- 新用户注册时输入邀请码
- 邀请人获得 10 尊严币
- 被邀请人获得 5 尊严币（新手礼包）

**实现逻辑**:
```typescript
// 生成邀请码
const generateInviteCode = (userId: string): string => {
  return `TX${userId.substring(0, 8).toUpperCase()}`;
};

// 处理邀请关系
const handleInvite = async (inviterId: string, inviteeId: string): Promise<void> => {
  const record: InviteRecord = {
    id: generateId(),
    inviter_id: inviterId,
    invitee_id: inviteeId,
    invitee_nickname: getUsername(inviteeId),
    coins_earned: 10,
    created_at: new Date().toISOString(),
  };
  
  // 保存邀请记录
  saveInviteRecord(inviterId, record);
  
  // 邀请人获得 10 币
  addCoins(inviterId, 10, 'invite', record.id, '邀请好友奖励');
  
  // 被邀请人获得 5 币
  addCoins(inviteeId, 5, 'invite', record.id, '新手礼包');
};
```

### 3.4 广告奖励系统

**规则**:
- 视频广告：观看完整视频获得 3 币，每天最多 5 次
- 横幅广告：点击广告获得 1 币，每天最多 10 次
- 使用微信小程序广告组件

**实现逻辑**:
```typescript
// 检查今日广告观看次数
const checkAdLimit = (userId: string, adType: 'video' | 'banner'): boolean => {
  const today = new Date().toISOString().split('T')[0];
  const records = getAdWatchRecords(userId);
  const todayRecords = records.filter(r => r.watch_date === today && r.ad_type === adType);
  
  const limit = adType === 'video' ? 5 : 10;
  return todayRecords.length < limit;
};

// 观看广告奖励
const rewardAdWatch = async (userId: string, adType: 'video' | 'banner'): Promise<void> => {
  if (!checkAdLimit(userId, adType)) {
    throw new Error('今日观看次数已达上限');
  }
  
  const coins = adType === 'video' ? 3 : 1;
  const record: AdWatchRecord = {
    id: generateId(),
    user_id: userId,
    ad_type: adType,
    coins_earned: coins,
    watch_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };
  
  saveAdWatchRecord(userId, record);
  addCoins(userId, coins, 'ad_watch', record.id, `观看${adType === 'video' ? '视频' : '横幅'}广告`);
};
```

### 3.5 充值系统

**充值套餐**:
1. **小试牛刀** - 100 币 / ¥1 (无赠送)
2. **小有所成** - 500 币 / ¥5 (赠送 50 币)
3. **游刃有余** - 1000 币 / ¥10 (赠送 150 币) ⭐ 热门
4. **财大气粗** - 3000 币 / ¥30 (赠送 500 币)
5. **富可敌国** - 10000 币 / ¥100 (赠送 2000 币)

**实现逻辑**:
```typescript
// 发起充值
const initiateRecharge = async (userId: string, packageId: string): Promise<string> => {
  const pkg = getRechargePackage(packageId);
  
  const record: RechargeRecord = {
    id: generateId(),
    user_id: userId,
    package_id: packageId,
    coins_purchased: pkg.coins,
    bonus_coins: pkg.bonus_coins,
    total_coins: pkg.coins + pkg.bonus_coins,
    amount_paid: pkg.price,
    payment_method: 'wechat_pay',
    transaction_id: '',
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  
  // 调用微信支付
  const paymentResult = await Taro.requestPayment({
    timeStamp: '',
    nonceStr: '',
    package: '',
    signType: 'MD5',
    paySign: '',
  });
  
  // 支付成功后处理
  record.status = 'success';
  record.transaction_id = paymentResult.transactionId;
  record.paid_at = new Date().toISOString();
  
  saveRechargeRecord(userId, record);
  addCoins(userId, record.total_coins, 'recharge', record.id, `充值 ${pkg.name}`);
  
  return record.id;
};
```

## 4. UI 页面设计

### 4.1 签到页面 (`pages/checkin/index.tsx`)
- 显示连续签到天数
- 签到日历（标记已签到日期）
- 签到按钮（今日已签到则置灰）
- 签到奖励历史

### 4.2 成就页面 (`pages/achievements/index.tsx`)
- 已解锁成就列表（带动画效果）
- 未解锁成就列表（显示进度条）
- 成就详情弹窗

### 4.3 邀请页面 (`pages/invite/index.tsx`)
- 显示专属邀请码
- 分享按钮（生成海报）
- 邀请记录列表
- 邀请奖励统计

### 4.4 广告页面（集成在首页或任务页）
- 视频广告按钮（显示剩余次数）
- 横幅广告位（底部固定）

### 4.5 充值页面 (`pages/recharge/index.tsx`)
- 充值套餐列表（卡片式布局）
- 标记热门套餐
- 充值记录
- 微信支付集成

### 4.6 尊严币明细页面 (`pages/coin-history/index.tsx`)
- 收支记录列表
- 按类型筛选
- 显示余额变化

## 5. 本地存储 Keys 汇总

```typescript
const STORAGE_KEYS = {
  CHECKINS: 'toxictask_checkins',
  ACHIEVEMENTS: 'toxictask_achievements',
  USER_ACHIEVEMENTS: 'toxictask_user_achievements',
  INVITES: 'toxictask_invites',
  AD_WATCHES: 'toxictask_ad_watches',
  RECHARGES: 'toxictask_recharges',
  TRANSACTIONS: 'toxictask_transactions',
};
```

## 6. 开发优先级

### Phase 1 (MVP)
1. ✅ 签到打卡系统
2. ✅ 基础成就系统（3-5个成就）
3. ✅ 尊严币交易记录

### Phase 2
4. ⏳ 邀请奖励系统
5. ⏳ 广告奖励系统

### Phase 3
6. ⏳ 充值系统（需要后端支持）
7. ⏳ 完整成就系统（10+成就）

## 7. 技术注意事项

### 7.1 时区处理
- 所有日期比较使用本地时区
- 签到重置时间：每天 00:00

### 7.2 数据一致性
- 所有尊严币变动必须记录交易日志
- 使用事务性操作（先扣币再创建记录，失败则回滚）

### 7.3 防刷机制
- 广告观看次数限制
- 签到时间校验（防止修改系统时间）
- 邀请关系校验（防止自己邀请自己）

### 7.4 性能优化
- 成就检查使用防抖（避免频繁计算）
- 交易记录分页加载
- 缓存用户成就进度

---

**文档版本**: v1.0  
**创建日期**: 2026-04-04  
**最后更新**: 2026-04-04
