import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { Achievement, UserAchievement, STORAGE_KEYS } from '../../types';

interface AchievementState {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  loadAchievements: (userId: string) => void;
  checkAndUnlockAchievements: (userId: string) => Promise<void>;
  claimAchievementReward: (userId: string, achievementId: string) => Promise<void>;
  getAchievementProgress: (userId: string, achievementId: string) => number;
  isAchievementUnlocked: (userId: string, achievementId: string) => boolean;
  isAchievementClaimed: (userId: string, achievementId: string) => boolean;
}

// 生成唯一ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// 预设成就列表（根据配置清单）
const PRESET_ACHIEVEMENTS: Achievement[] = [
  // 1. 时间管理类
  {
    id: 'achievement_early_bird',
    type: 'early_bird',
    title: '早起的鸟',
    description: '早起的鸟儿有虫吃',
    icon: '🐦',
    coins_reward: 10,
    condition: { target: 1 },
  },
  {
    id: 'achievement_early_worm',
    type: 'early_worm',
    title: '早起的虫',
    description: '醒得早有什么用，还不是被鸟吃。',
    icon: '🐛',
    coins_reward: 5,
    condition: { target: 1 },
  },
  {
    id: 'achievement_midnight_warrior',
    type: 'midnight_warrior',
    title: '零点战神',
    description: '别人深夜emo，你深夜计划，赢了！',
    icon: '🌙',
    coins_reward: 15,
    condition: { target: 1 },
  },
  {
    id: 'achievement_deadline_jedi',
    type: 'deadline_jedi',
    title: 'DDL战神',
    description: '这不是拖延，是效率。',
    icon: '⚡',
    coins_reward: 20,
    condition: { target: 1 },
  },
  {
    id: 'achievement_gone_girl',
    type: 'gone_girl',
    title: '消失的爱人',
    description: '不敢面对失败的自己。',
    icon: '👻',
    coins_reward: 5,
    condition: { target: 1 },
  },

  // 2. 押注与资产类
  {
    id: 'achievement_philanthropist',
    type: 'philanthropist',
    title: '大慈善家',
    description: '致力于将尊严币重新分配给全宇宙。',
    icon: '💸',
    coins_reward: 10,
    condition: { target: 20 },
  },
  {
    id: 'achievement_wealth_dispenser',
    type: 'wealth_dispenser',
    title: '散财童子',
    description: '致力于撒币',
    icon: '💰',
    coins_reward: 15,
    condition: { target: 3 },
  },
  {
    id: 'achievement_penny_pincher',
    type: 'penny_pincher',
    title: '铁公鸡',
    description: '勤俭节约，传统美德',
    icon: '🐔',
    coins_reward: 20,
    condition: { target: 10 },
  },
  {
    id: 'achievement_all_in_master',
    type: 'all_in_master',
    title: '梭哈大师',
    description: '要么自律成神，要么穷得叮当响。',
    icon: '🎰',
    coins_reward: 30,
    condition: { target: 80 },
  },
  {
    id: 'achievement_wall_street_sheep',
    type: 'wall_street_sheep',
    title: '华尔街之羊',
    description: '辛苦攒币大半年，一朝回到解放前。',
    icon: '🐑',
    coins_reward: 10,
    condition: { target: 1 },
  },

  // 3. 状态与社交类
  {
    id: 'achievement_wall_resident',
    type: 'wall_resident',
    title: '耻辱墙钉子户',
    description: '墙上没你，大家都觉得这小程序出 Bug 了。',
    icon: '📌',
    coins_reward: 15,
    condition: { target: 5 },
  },
  {
    id: 'achievement_situp_champion',
    type: 'situp_champion',
    title: '仰卧起坐选手',
    description: '间歇性踌躇满志，持续性混吃等死。',
    icon: '🤸',
    coins_reward: 20,
    condition: { target: 1 },
  },
  {
    id: 'achievement_flag_collector',
    type: 'flag_collector',
    title: 'Flag 收藏家',
    description: '计划列得越多，看上去就越像个自律的人。',
    icon: '🚩',
    coins_reward: 10,
    condition: { target: 5 },
  },

  // 4. 好友监督类
  {
    id: 'achievement_righteous_betrayer',
    type: 'righteous_betrayer',
    title: '大义灭亲',
    description: '作为监督者，累计拒绝好友任务达到3次',
    icon: '⚔️',
    coins_reward: 20,
    condition: { target: 3 },
  },
  {
    id: 'achievement_cover_up_master',
    type: 'cover_up_master',
    title: '包庇狂魔',
    description: '作为监督者，连续通过好友任务5次',
    icon: '🤝',
    coins_reward: 10,
    condition: { target: 5 },
  },
  {
    id: 'achievement_bad_friend_picker',
    type: 'bad_friend_picker',
    title: '交友不慎',
    description: '作为发起者，因被好友拒绝而导致破产',
    icon: '💔',
    coins_reward: 15,
    condition: { target: 1 },
  },
];

// 初始化成就列表到本地存储
const initAchievements = () => {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEYS.ACHIEVEMENTS);
    if (!stored) {
      Taro.setStorageSync(STORAGE_KEYS.ACHIEVEMENTS, PRESET_ACHIEVEMENTS);
    }
  } catch (error) {
    console.error('[AchievementStore][Error] 初始化成就列表失败:', error);
  }
};

// 加载成就列表
const loadAchievementsFromStorage = (): Achievement[] => {
  try {
    return Taro.getStorageSync(STORAGE_KEYS.ACHIEVEMENTS) || PRESET_ACHIEVEMENTS;
  } catch (error) {
    console.error('[AchievementStore][Error] 加载成就列表失败:', error);
    return PRESET_ACHIEVEMENTS;
  }
};

// 加载用户成就
const loadUserAchievementsFromStorage = (userId: string): UserAchievement[] => {
  try {
    const allUserAchievements = Taro.getStorageSync(STORAGE_KEYS.USER_ACHIEVEMENTS) || {};
    return allUserAchievements[userId] || [];
  } catch (error) {
    console.error('[AchievementStore][Error] 加载用户成就失败:', error);
    return [];
  }
};

// 保存用户成就
const saveUserAchievementsToStorage = (userId: string, userAchievements: UserAchievement[]) => {
  try {
    const allUserAchievements = Taro.getStorageSync(STORAGE_KEYS.USER_ACHIEVEMENTS) || {};
    allUserAchievements[userId] = userAchievements;
    Taro.setStorageSync(STORAGE_KEYS.USER_ACHIEVEMENTS, allUserAchievements);
  } catch (error) {
    console.error('[AchievementStore][Error] 保存用户成就失败:', error);
    throw error;
  }
};

// 获取任务数据
const getTasksData = (userId: string) => {
  try {
    const allTasks = Taro.getStorageSync(STORAGE_KEYS.TASKS) || {};
    return allTasks[userId] || [];
  } catch (error) {
    console.error('[AchievementStore][Error] 获取任务数据失败:', error);
    return [];
  }
};

// 获取签到数据
const getCheckInsData = (userId: string) => {
  try {
    const allCheckIns = Taro.getStorageSync(STORAGE_KEYS.CHECKINS) || {};
    return allCheckIns[userId] || [];
  } catch (error) {
    console.error('[AchievementStore][Error] 获取签到数据失败:', error);
    return [];
  }
};

// 获取邀请数据
const getInvitesData = (userId: string) => {
  try {
    const allInvites = Taro.getStorageSync(STORAGE_KEYS.INVITES) || {};
    return allInvites[userId] || [];
  } catch (error) {
    console.error('[AchievementStore][Error] 获取邀请数据失败:', error);
    return [];
  }
};

export const useAchievementStore = create<AchievementState>((set, get) => {
  // 初始化成就列表
  initAchievements();

  return {
    achievements: PRESET_ACHIEVEMENTS,
    userAchievements: [],

    // 加载成就数据
    loadAchievements: (userId: string) => {
      const achievements = loadAchievementsFromStorage();
      const userAchievements = loadUserAchievementsFromStorage(userId);

      set({ achievements, userAchievements });

      console.log('[AchievementStore][Info] 成就数据已加载:', {
        total_achievements: achievements.length,
        unlocked_achievements: userAchievements.length,
        userAchievements: userAchievements,
      });
    },

    // 检查并解锁成就
    checkAndUnlockAchievements: async (userId: string) => {
      try {
        const { achievements, userAchievements } = get();
        const unlockedIds = userAchievements.map((ua) => ua.achievement_id);
        const newUnlocks: UserAchievement[] = [];

        console.log('[AchievementStore][Info] 开始检查成就:', {
          total: achievements.length,
          already_unlocked: unlockedIds.length,
        });

        for (const achievement of achievements) {
          // 跳过已解锁的成就
          if (unlockedIds.includes(achievement.id)) {
            console.log('[AchievementStore][Info] 成就已解锁，跳过:', achievement.title);
            continue;
          }

          // 检查成就条件
          const progress = calculateAchievementProgress(userId, achievement);
          const isUnlocked = progress >= achievement.condition.target;

          console.log('[AchievementStore][Info] 检查成就:', {
            title: achievement.title,
            progress: progress,
            target: achievement.condition.target,
            isUnlocked: isUnlocked,
          });

          if (isUnlocked) {
            const userAchievement: UserAchievement = {
              id: generateId(),
              user_id: userId,
              achievement_id: achievement.id,
              unlocked_at: new Date().toISOString(),
              coins_earned: achievement.coins_reward,
              claimed: false, // 默认未领取
            };

            newUnlocks.push(userAchievement);

            console.log('[AchievementStore][Info] 成就已解锁（待领取）:', {
              title: achievement.title,
              coins_reward: achievement.coins_reward,
            });

            // 显示成就解锁提示
            Taro.showToast({
              title: `🎉 解锁成就：${achievement.title}`,
              icon: 'success',
              duration: 2000,
            });
          }
        }

        // 保存新解锁的成就
        if (newUnlocks.length > 0) {
          const updatedUserAchievements = [...userAchievements, ...newUnlocks];
          saveUserAchievementsToStorage(userId, updatedUserAchievements);
          set({ userAchievements: updatedUserAchievements });

          console.log('[AchievementStore][Info] 成就已保存并更新状态:', {
            new_unlocks: newUnlocks.length,
            total_unlocked: updatedUserAchievements.length,
          });
        } else {
          console.log('[AchievementStore][Info] 没有新解锁的成就');
        }
      } catch (error) {
        console.error('[AchievementStore][Error] 检查成就失败:', error);
      }
    },

    // 获取成就进度
    getAchievementProgress: (userId: string, achievementId: string) => {
      const achievement = get().achievements.find((a) => a.id === achievementId);
      if (!achievement) return 0;

      const current = calculateAchievementProgress(userId, achievement);
      return Math.min((current / achievement.condition.target) * 100, 100);
    },

    // 检查成就是否已解锁
    isAchievementUnlocked: (userId: string, achievementId: string) => {
      const { userAchievements } = get();
      return userAchievements.some((ua) => ua.achievement_id === achievementId);
    },

    // 检查成就是否已领取
    isAchievementClaimed: (userId: string, achievementId: string) => {
      const { userAchievements } = get();
      const userAchievement = userAchievements.find((ua) => ua.achievement_id === achievementId);
      return userAchievement?.claimed || false;
    },

    // 领取成就奖励
    claimAchievementReward: async (userId: string, achievementId: string) => {
      try {
        const { achievements, userAchievements } = get();

        // 查找成就
        const achievement = achievements.find((a) => a.id === achievementId);
        if (!achievement) {
          throw new Error('成就不存在');
        }

        // 查找用户成就
        const userAchievement = userAchievements.find(
          (ua) => ua.achievement_id === achievementId
        );
        if (!userAchievement) {
          throw new Error('成就未解锁');
        }

        if (userAchievement.claimed) {
          throw new Error('奖励已领取');
        }

        // 发放奖励
        const { useCoinStore } = await import('./coinStore');
        await useCoinStore.getState().addTransaction(
          userId,
          'achievement',
          achievement.coins_reward,
          achievement.id,
          `领取成就奖励：${achievement.title}`
        );

        // 更新领取状态
        userAchievement.claimed = true;
        userAchievement.claimed_at = new Date().toISOString();

        // 保存到存储
        saveUserAchievementsToStorage(userId, userAchievements);

        // 更新状态
        set({ userAchievements: [...userAchievements] });

        const { useCoinStore: coinStore } = await import('./coinStore');
        console.log('[AchievementStore][Info] 成就奖励已领取:', {
          title: achievement.title,
          coins_reward: achievement.coins_reward,
          new_balance: coinStore.getState().getBalance(userId),
        });

        // 显示领取成功提示
        Taro.showToast({
          title: `领取成功！+${achievement.coins_reward}币`,
          icon: 'success',
          duration: 2000,
        });
      } catch (error) {
        console.error('[AchievementStore][Error] 领取奖励失败:', error);
        Taro.showToast({
          title: error.message || '领取失败',
          icon: 'none',
          duration: 2000,
        });
        throw error;
      }
    },
  };
});

// 检查成就条件是否满足
const checkAchievementCondition = async (
  userId: string,
  achievement: Achievement
): Promise<boolean> => {
  const current = calculateAchievementProgress(userId, achievement);
  return current >= achievement.condition.target;
};

// 计算成就进度
const calculateAchievementProgress = (userId: string, achievement: Achievement): number => {
  const tasks = getTasksData(userId);
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const failedTasks = tasks.filter((t) => t.status === 'failed');

  switch (achievement.type) {
    // 1. 时间管理类
    case 'early_bird':
      // 早起的鸟：制定计划时间早于08:00且任务完成
      return checkEarlyBirdSuccess(completedTasks) ? 1 : 0;

    case 'early_worm':
      // 早起的虫：制定计划时间早于08:00且任务失败
      return checkEarlyWorm(failedTasks) ? 1 : 0;

    case 'midnight_warrior':
      // 零点战神：制定计划时间在00:00-02:00之间
      return checkMidnightWarrior(tasks) ? 1 : 0;

    case 'deadline_jedi':
      // DDL战神：截止时间前5分钟内完成任务
      return checkDeadlineJedi(completedTasks) ? 1 : 0;

    case 'gone_girl':
      // 消失的爱人：任务失败后24小时没有进入小程序
      return checkGoneGirl(userId, failedTasks) ? 1 : 0;

    // 2. 押注与资产类
    case 'philanthropist':
      // 大慈善家：单次任务押注>20且失败
      return checkPhilanthropist(failedTasks, achievement.condition.target) ? achievement.condition.target : 0;

    case 'wealth_dispenser':
      // 散财童子：连续3次任务失败且押注都>20
      return checkWealthDispenser(failedTasks);

    case 'penny_pincher':
      // 铁公鸡：累计完成10个任务，每个押注都是1币
      return checkPennyPincher(completedTasks);

    case 'all_in_master':
      // 梭哈大师：单次押注占账户余额80%以上
      return checkAllInMaster(userId, tasks, achievement.condition.target) ? achievement.condition.target : 0;

    case 'wall_street_sheep':
      // 华尔街之羊：单次失败扣除所有剩余尊严币（破产）
      return checkWallStreetSheep(userId, failedTasks) ? 1 : 0;

    // 3. 状态与社交类
    case 'wall_resident':
      // 耻辱墙钉子户：自然周7天内有5天及以上有失败记录
      return checkWallResident(failedTasks);

    case 'situp_champion':
      // 仰卧起坐选手：连续3天完成后紧接着连续3天失败
      return checkSitupChampion(tasks) ? 1 : 0;

    case 'flag_collector':
      // Flag收藏家：同时存在5个及以上进行中的任务
      return checkFlagCollector(tasks);

    // 4. 好友监督类
    case 'righteous_betrayer':
      // 大义灭亲：作为监督者，累计拒绝好友任务达到3次
      return checkRighteousBetrayerProgress(userId, tasks);

    case 'cover_up_master':
      // 包庇狂魔：作为监督者，连续通过好友任务5次
      return checkCoverUpMasterProgress(userId, tasks);

    case 'bad_friend_picker':
      // 交友不慎：作为发起者，因被好友拒绝而导致破产
      return checkBadFriendPicker(userId, tasks) ? 1 : 0;

    default:
      return 0;
  }
};

// ==================== 时间管理类检测函数 ====================

// 早起的鸟：制定计划时间早于08:00且任务完成
const checkEarlyBirdSuccess = (completedTasks: any[]): boolean => {
  return completedTasks.some((task) => {
    const createdAt = new Date(task.created_at);
    const hour = createdAt.getHours();
    return hour < 8;
  });
};

// 早起的虫：制定计划时间早于08:00且任务失败
const checkEarlyWorm = (failedTasks: any[]): boolean => {
  return failedTasks.some((task) => {
    const createdAt = new Date(task.created_at);
    const hour = createdAt.getHours();
    return hour < 8;
  });
};

// 零点战神：制定计划时间在00:00-02:00之间
const checkMidnightWarrior = (tasks: any[]): boolean => {
  return tasks.some((task) => {
    const createdAt = new Date(task.created_at);
    const hour = createdAt.getHours();
    return hour >= 0 && hour < 2;
  });
};

// DDL战神：截止时间前5分钟内完成任务
const checkDeadlineJedi = (completedTasks: any[]): boolean => {
  return completedTasks.some((task) => {
    const completedAt = new Date(task.updated_at).getTime();
    const deadline = new Date(task.deadline).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    const timeDiff = deadline - completedAt;
    return timeDiff >= 0 && timeDiff <= fiveMinutes;
  });
};

// 消失的爱人：任务失败后24小时没有进入小程序
const checkGoneGirl = (userId: string, failedTasks: any[]): boolean => {
  if (failedTasks.length === 0) return false;

  try {
    // 获取最后一次失败任务的时间
    const lastFailedTask = failedTasks.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];
    const lastFailedTime = new Date(lastFailedTask.updated_at).getTime();

    // 获取用户最后活跃时间（从本地存储读取）
    const lastActiveKey = `last_active_${userId}`;
    const lastActiveTime = Taro.getStorageSync(lastActiveKey) || Date.now();

    const twentyFourHours = 24 * 60 * 60 * 1000;
    const timeSinceFailure = lastActiveTime - lastFailedTime;

    return timeSinceFailure >= twentyFourHours;
  } catch (error) {
    console.error('[Achievement][Error] 检查消失的爱人失败:', error);
    return false;
  }
};

// ==================== 押注与资产类检测函数 ====================

// 大慈善家：单次任务押注>20且失败
const checkPhilanthropist = (failedTasks: any[], minBet: number): boolean => {
  return failedTasks.some((task) => task.bet_amount > minBet);
};

// 散财童子：连续3次任务失败且押注都>20
const checkWealthDispenser = (failedTasks: any[]): number => {
  if (failedTasks.length < 3) return 0;

  // 按时间降序排序
  const sorted = [...failedTasks].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // 检查最近3次失败是否都>20
  const recentThree = sorted.slice(0, 3);
  const allHighBet = recentThree.every((task) => task.bet_amount > 20);

  return allHighBet ? 3 : 0;
};

// 铁公鸡：累计完成10个任务，每个押注都是1币
const checkPennyPincher = (completedTasks: any[]): number => {
  const lowBetTasks = completedTasks.filter((task) => task.bet_amount === 1);
  return lowBetTasks.length >= 10 ? 10 : lowBetTasks.length;
};

// 梭哈大师：单次押注占账户余额80%以上
const checkAllInMaster = (userId: string, tasks: any[], minPercentage: number): boolean => {
  try {
    // 获取交易记录来计算押注时的余额
    const transactions = Taro.getStorageSync(STORAGE_KEYS.TRANSACTIONS) || {};
    const userTransactions = transactions[userId] || [];

    return tasks.some((task) => {
      // 找到该任务创建时的余额
      const taskCreatedTime = new Date(task.created_at).getTime();

      // 计算任务创建前的余额
      let balanceBeforeTask = 100; // 初始余额
      for (const tx of userTransactions) {
        const txTime = new Date(tx.created_at).getTime();
        if (txTime < taskCreatedTime) {
          balanceBeforeTask += tx.amount;
        }
      }

      // 计算押注占比
      const percentage = (task.bet_amount / balanceBeforeTask) * 100;
      return percentage >= minPercentage;
    });
  } catch (error) {
    console.error('[Achievement][Error] 检查梭哈大师失败:', error);
    return false;
  }
};

// 华尔街之羊：单次失败扣除所有剩余尊严币（破产）
const checkWallStreetSheep = (userId: string, failedTasks: any[]): boolean => {
  try {
    const transactions = Taro.getStorageSync(STORAGE_KEYS.TRANSACTIONS) || {};
    const userTransactions = transactions[userId] || [];

    return failedTasks.some((task) => {
      const taskFailedTime = new Date(task.updated_at).getTime();

      // 计算任务失败前的余额
      let balanceBeforeFailure = 100;
      for (const tx of userTransactions) {
        const txTime = new Date(tx.created_at).getTime();
        if (txTime < taskFailedTime) {
          balanceBeforeFailure += tx.amount;
        }
      }

      // 检查是否破产（余额>0但失败后扣除了所有余额）
      return balanceBeforeFailure > 0 && task.bet_amount >= balanceBeforeFailure;
    });
  } catch (error) {
    console.error('[Achievement][Error] 检查华尔街之羊失败:', error);
    return false;
  }
};

// ==================== 状态与社交类检测函数 ====================

// 耻辱墙钉子户：自然周7天内有5天及以上有失败记录
const checkWallResident = (failedTasks: any[]): number => {
  if (failedTasks.length === 0) return 0;

  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay()); // 本周日
  currentWeekStart.setHours(0, 0, 0, 0);

  // 统计本周每天是否有失败记录
  const failedDays = new Set<string>();
  failedTasks.forEach((task) => {
    const failedDate = new Date(task.updated_at);
    if (failedDate >= currentWeekStart) {
      const dateStr = failedDate.toISOString().split('T')[0];
      failedDays.add(dateStr);
    }
  });

  return failedDays.size;
};

// 仰卧起坐选手：连续3天完成后紧接着连续3天失败
const checkSitupChampion = (tasks: any[]): boolean => {
  if (tasks.length < 6) return false;

  // 按时间排序
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  );

  // 按天分组
  const dayGroups = new Map<string, any[]>();
  sorted.forEach((task) => {
    const date = new Date(task.updated_at).toISOString().split('T')[0];
    if (!dayGroups.has(date)) {
      dayGroups.set(date, []);
    }
    dayGroups.get(date)!.push(task);
  });

  // 检查每天的主要状态
  const dailyStatus: string[] = [];
  dayGroups.forEach((tasks) => {
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    dailyStatus.push(completed > failed ? 'completed' : 'failed');
  });

  // 查找连续3天完成+连续3天失败的模式
  for (let i = 0; i <= dailyStatus.length - 6; i++) {
    const pattern = dailyStatus.slice(i, i + 6).join(',');
    if (pattern === 'completed,completed,completed,failed,failed,failed') {
      return true;
    }
  }

  return false;
};

// Flag收藏家：同时存在5个及以上进行中的任务
const checkFlagCollector = (tasks: any[]): number => {
  const pendingTasks = tasks.filter((task) => task.status === 'pending');
  return pendingTasks.length;
};

// ==================== 好友监督类检测函数 ====================

// 大义灭亲：作为监督者，累计拒绝好友任务达到3次
const checkRighteousBetrayerProgress = (userId: string, tasks: any[]): number => {
  const rejectedCount = tasks.filter(
    (task) =>
      task.supervisor_id === userId &&
      task.supervision_status === 'rejected'
  ).length;
  return rejectedCount;
};

// 包庇狂魔：作为监督者，连续通过好友任务5次
const checkCoverUpMasterProgress = (userId: string, tasks: any[]): number => {
  // 获取该用户作为监督者的所有已审核任务
  const supervisedTasks = tasks
    .filter((task) => task.supervisor_id === userId &&
            (task.supervision_status === 'approved' || task.supervision_status === 'rejected'))
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

  if (supervisedTasks.length < 5) return 0;

  // 查找连续5次通过的模式
  let maxConsecutive = 0;
  let currentConsecutive = 0;

  for (const task of supervisedTasks) {
    if (task.supervision_status === 'approved') {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }

  return maxConsecutive;
};

// 交友不慎：作为发起者，因被好友拒绝而导致破产
const checkBadFriendPicker = (userId: string, tasks: any[]): boolean => {
  // 查找被拒绝的监督任务
  const rejectedSupervisedTasks = tasks.filter(
    (task) =>
      task.user_id === userId &&
      task.is_supervised &&
      task.supervision_status === 'rejected'
  );

  if (rejectedSupervisedTasks.length === 0) return false;

  // 检查是否有任务被拒绝后导致破产（余额归零）
  try {
    const transactions = Taro.getStorageSync(STORAGE_KEYS.TRANSACTIONS) || {};
    const userTransactions = transactions[userId] || [];

    for (const task of rejectedSupervisedTasks) {
      // 查找该任务相关的交易记录
      const taskTransactions = userTransactions.filter(
        (t) => t.source_id === task.id
      );

      // 检查是否有交易后余额为0的情况
      if (taskTransactions.some((t) => t.balance_after === 0)) {
        return true;
      }
    }
  } catch (error) {
    console.error('[Achievement][Error] 检查交友不慎失败:', error);
  }

  return false;
};
