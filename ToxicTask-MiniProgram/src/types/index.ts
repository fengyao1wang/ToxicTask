export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  dignity_coins: number;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'completed' | 'failed';
export type TaskType = 'single' | 'repeat'; // 单次任务 | 重复任务

// 好友监督状态
export type SupervisionStatus =
  | 'none'                // 未开启监督
  | 'waiting_invite'      // 等待邀请好友
  | 'invited'             // 已邀请好友
  | 'evidence_submitted'  // 已提交证据
  | 'approved'            // 证据通过
  | 'rejected';           // 证据被拒绝

export interface Task {
  id: string;
  user_id: string;
  title: string;
  bet_amount: number;
  status: TaskStatus;
  deadline: string;
  created_at: string;
  updated_at: string;

  // 重复任务相关字段
  task_type: TaskType; // 任务类型（默认为 'single'）
  repeat_days?: number; // 重复天数（如7天）
  check_ins?: CheckIn[]; // 打卡记录

  // 好友监督相关字段
  is_supervised: boolean; // 是否开启好友监督
  supervisor_id?: string | null; // 监督者的 User ID
  bounty_coins: number; // 监督赏金（默认为0）
  evidence_image?: string | null; // 证据图片的 URL
  evidence_text?: string | null; // 证据文字描述
  supervision_status: SupervisionStatus; // 监督状态
  evidence_submitted_at?: string; // 证据提交时间（用于超时判断）
}

// 打卡记录
export interface CheckIn {
  date: string; // YYYY-MM-DD 格式
  checked: boolean; // 是否已打卡
  checked_at?: string; // 打卡时间
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
  // 时间管理类
  | 'early_bird'           // 早起的鸟：制定计划早于08:00且完成
  | 'early_worm'           // 早起的虫：制定计划早于08:00且失败
  | 'midnight_warrior'     // 零点战神：制定计划在00:00-02:00
  | 'deadline_jedi'        // DDL战神：截止前5分钟内完成
  | 'gone_girl'            // 消失的爱人：失败后24小时未进入
  // 押注与资产类
  | 'philanthropist'       // 大慈善家：单次押注>20且失败
  | 'wealth_dispenser'     // 散财童子：连续3次失败且押注>20
  | 'penny_pincher'        // 铁公鸡：累计完成10个任务押注都是1
  | 'all_in_master'        // 梭哈大师：单次押注占余额80%以上
  | 'wall_street_sheep'    // 华尔街之羊：单次失败破产
  // 状态与社交类
  | 'wall_resident'        // 耻辱墙钉子户：自然周7天内5天有失败
  | 'situp_champion'       // 仰卧起坐选手：连续3天完成+连续3天失败
  | 'flag_collector'       // Flag收藏家：同时5个进行中任务
  // 好友监督类
  | 'righteous_betrayer'   // 大义灭亲：作为监督者，累计拒绝好友任务达到3次
  | 'cover_up_master'      // 包庇狂魔：作为监督者，连续通过好友任务5次
  | 'bad_friend_picker';   // 交友不慎：作为发起者，因被好友拒绝而导致破产

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
  | 'recharge'        // 充值（收入）
  | 'bounty_freeze'   // 冻结赏金（支出）
  | 'bounty_reward'   // 监督者获得赏金+分红（收入）
  | 'bounty_refund';  // 监督者超时退回赏金（收入）

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
