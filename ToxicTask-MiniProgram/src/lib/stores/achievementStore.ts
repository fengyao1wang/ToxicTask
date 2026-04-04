import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { Achievement, UserAchievement, STORAGE_KEYS } from '../../types';
import { useCoinStore } from './coinStore';

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

// 预设成就列表
const PRESET_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'achievement_001',
    type: 'total_complete',
    title: '新手上路',
    description: '完成第一个任务',
    icon: '🎯',
    coins_reward: 10,
    condition: { target: 1 },
  },
  {
    id: 'achievement_002',
    type: 'consecutive_complete',
    title: '连胜三天',
    description: '连续3天完成任务',
    icon: '🔥',
    coins_reward: 20,
    condition: { target: 3 },
  },
  {
    id: 'achievement_003',
    type: 'consecutive_complete',
    title: '连胜一周',
    description: '连续7天完成任务',
    icon: '⚡',
    coins_reward: 50,
    condition: { target: 7 },
  },
  {
    id: 'achievement_004',
    type: 'high_bet_complete',
    title: '高风险玩家',
    description: '完成一个押注≥50币的任务',
    icon: '💎',
    coins_reward: 30,
    condition: { target: 50 },
  },
  {
    id: 'achievement_005',
    type: 'total_complete',
    title: '任务达人',
    description: '累计完成10个任务',
    icon: '🏆',
    coins_reward: 50,
    condition: { target: 10 },
  },
  {
    id: 'achievement_006',
    type: 'total_complete',
    title: '任务大师',
    description: '累计完成50个任务',
    icon: '👑',
    coins_reward: 100,
    condition: { target: 50 },
  },
  {
    id: 'achievement_007',
    type: 'perfect_week',
    title: '完美一周',
    description: '一周内所有任务全部完成',
    icon: '✨',
    coins_reward: 80,
    condition: { target: 1 },
  },
  {
    id: 'achievement_008',
    type: 'early_bird',
    title: '早起的鸟儿',
    description: '提前1小时完成任务',
    icon: '🐦',
    coins_reward: 15,
    condition: { target: 1 },
  },
  {
    id: 'achievement_009',
    type: 'consecutive_checkin',
    title: '签到达人',
    description: '连续签到7天',
    icon: '📅',
    coins_reward: 30,
    condition: { target: 7 },
  },
  {
    id: 'achievement_010',
    type: 'invite_friends',
    title: '邀请达人',
    description: '邀请5个好友',
    icon: '👥',
    coins_reward: 50,
    condition: { target: 5 },
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

        console.log('[AchievementStore][Info] 成就奖励已领取:', {
          title: achievement.title,
          coins_reward: achievement.coins_reward,
          new_balance: useCoinStore.getState().getBalance(userId),
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

  switch (achievement.type) {
    case 'total_complete':
      // 累计完成任务数
      return completedTasks.length;

    case 'consecutive_complete':
      // 连续完成任务天数
      return calculateConsecutiveCompleteDays(completedTasks);

    case 'high_bet_complete':
      // 完成高押注任务
      const highBetTasks = completedTasks.filter(
        (t) => t.bet_amount >= achievement.condition.target
      );
      return highBetTasks.length > 0 ? achievement.condition.target : 0;

    case 'perfect_week':
      // 一周内全部完成
      return checkPerfectWeek(tasks) ? 1 : 0;

    case 'early_bird':
      // 提前完成任务
      return checkEarlyBird(completedTasks) ? 1 : 0;

    case 'consecutive_checkin':
      // 连续签到天数
      const checkIns = getCheckInsData(userId);
      return calculateConsecutiveCheckInDays(checkIns);

    case 'invite_friends':
      // 邀请好友数
      const invites = getInvitesData(userId);
      return invites.length;

    default:
      return 0;
  }
};

// 计算连续完成任务天数
const calculateConsecutiveCompleteDays = (completedTasks: any[]): number => {
  if (completedTasks.length === 0) return 0;

  // 按完成时间降序排序
  const sorted = [...completedTasks].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  let consecutiveDays = 0;
  let currentDate = new Date();
  const checkedDates = new Set<string>();

  for (const task of sorted) {
    const taskDate = new Date(task.updated_at).toISOString().split('T')[0];

    if (checkedDates.has(taskDate)) continue;
    checkedDates.add(taskDate);

    const diffDays = Math.floor(
      (currentDate.getTime() - new Date(taskDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === consecutiveDays) {
      consecutiveDays++;
      currentDate = new Date(taskDate);
    } else {
      break;
    }
  }

  return consecutiveDays;
};

// 检查一周内是否全部完成
const checkPerfectWeek = (tasks: any[]): boolean => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekTasks = tasks.filter((t) => {
    const createdAt = new Date(t.created_at);
    return createdAt >= weekAgo && createdAt <= now;
  });

  if (weekTasks.length === 0) return false;

  return weekTasks.every((t) => t.status === 'completed');
};

// 检查是否提前完成任务
const checkEarlyBird = (completedTasks: any[]): boolean => {
  return completedTasks.some((task) => {
    const completedAt = new Date(task.updated_at).getTime();
    const deadline = new Date(task.deadline).getTime();
    const oneHour = 60 * 60 * 1000;

    return deadline - completedAt >= oneHour;
  });
};

// 计算连续签到天数
const calculateConsecutiveCheckInDays = (checkIns: any[]): number => {
  if (checkIns.length === 0) return 0;

  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime()
  );

  let consecutiveDays = 0;
  let currentDate = new Date();

  for (const checkIn of sorted) {
    const checkInDate = new Date(checkIn.check_in_date);
    const diffDays = Math.floor(
      (currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === consecutiveDays) {
      consecutiveDays++;
      currentDate = checkInDate;
    } else {
      break;
    }
  }

  return consecutiveDays;
};
