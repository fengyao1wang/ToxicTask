export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  dignity_coins: number;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'completed' | 'failed';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  bet_amount: number;
  status: TaskStatus;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface ShameLog {
  id: string;
  task_id: string;
  user_id: string;
  task_title: string;
  bet_amount: number;
  ai_comment: string;
  created_at: string;
}

// ==================== 尊严币获取系统类型定义 ====================

// 1. 签到系统
export interface CheckInRecord {
  id: string;
  user_id: string;
  check_in_date: string; // YYYY-MM-DD 格式
  coins_earned: number; // 固定为 5
  created_at: string;
}

// 2. 成就系统
export type AchievementType =
  | 'consecutive_complete' // 连续完成任务
  | 'high_bet_complete'    // 完成高押注任务
  | 'total_complete'       // 累计完成任务数
  | 'perfect_week'         // 一周内全部完成
  | 'early_bird'           // 提前完成任务
  | 'consecutive_checkin'  // 连续签到
  | 'invite_friends';      // 邀请好友

export interface AchievementCondition {
  target: number; // 目标值（如连续3天、累计10个）
  current?: number; // 当前进度
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  coins_reward: number;
  condition: AchievementCondition;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  coins_earned: number;
  claimed: boolean; // 是否已领取奖励
  claimed_at?: string; // 领取时间
}

// 3. 邀请系统
export interface InviteRecord {
  id: string;
  inviter_id: string; // 邀请人
  invitee_id: string; // 被邀请人
  invitee_nickname: string;
  coins_earned: number; // 固定为 10
  created_at: string;
}

// 4. 广告系统
export type AdType = 'video' | 'banner';

export interface AdWatchRecord {
  id: string;
  user_id: string;
  ad_type: AdType;
  coins_earned: number; // 视频广告 3 币，横幅广告 1 币
  watch_date: string; // YYYY-MM-DD 格式
  created_at: string;
}

export interface AdDailyLimit {
  video_ads: number; // 每天最多观看 5 次视频广告
  banner_ads: number; // 每天最多观看 10 次横幅广告
}

// 5. 充值系统
export interface RechargePackage {
  id: string;
  name: string;
  coins: number;
  price: number; // 单位：元
  bonus_coins: number; // 额外赠送
  is_popular: boolean; // 是否为热门套餐
}

export type RechargeStatus = 'pending' | 'success' | 'failed';

export interface RechargeRecord {
  id: string;
  user_id: string;
  package_id: string;
  coins_purchased: number;
  bonus_coins: number;
  total_coins: number;
  amount_paid: number; // 实际支付金额
  payment_method: 'wechat_pay';
  transaction_id: string; // 微信支付订单号
  status: RechargeStatus;
  created_at: string;
  paid_at?: string;
}

// 6. 交易记录系统
export type TransactionType =
  | 'task_bet'        // 任务押注（支出）
  | 'task_refund'     // 任务完成退款（收入）
  | 'task_penalty'    // 任务失败扣款（支出）
  | 'check_in'        // 签到奖励（收入）
  | 'achievement'     // 成就奖励（收入）
  | 'invite'          // 邀请奖励（收入）
  | 'ad_watch'        // 观看广告（收入）
  | 'recharge';       // 充值（收入）

export interface CoinTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // 正数为收入，负数为支出
  balance_after: number; // 交易后余额
  source_id?: string; // 关联的任务ID、成就ID等
  description: string;
  created_at: string;
}

// 本地存储 Keys
export const STORAGE_KEYS = {
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
} as const;
