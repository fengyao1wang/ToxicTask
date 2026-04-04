import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { CheckInRecord, STORAGE_KEYS } from '../../types';
import { useCoinStore } from './coinStore';

interface CheckInState {
  checkInRecords: CheckInRecord[];
  isCheckedInToday: boolean;
  consecutiveDays: number;
  loadCheckIns: (userId: string) => void;
  performCheckIn: (userId: string) => Promise<void>;
  getCheckInHistory: (userId: string, days: number) => CheckInRecord[];
}

// 生成唯一ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// 获取今天的日期字符串 (YYYY-MM-DD)
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 从本地存储加载签到记录
const loadCheckInsFromStorage = (userId: string): CheckInRecord[] => {
  try {
    const allCheckIns = Taro.getStorageSync(STORAGE_KEYS.CHECKINS) || {};
    return allCheckIns[userId] || [];
  } catch (error) {
    console.error('[CheckInStore][Error] 加载签到记录失败:', error);
    return [];
  }
};

// 保存签到记录到本地存储
const saveCheckInsToStorage = (userId: string, checkIns: CheckInRecord[]) => {
  try {
    const allCheckIns = Taro.getStorageSync(STORAGE_KEYS.CHECKINS) || {};
    allCheckIns[userId] = checkIns;
    Taro.setStorageSync(STORAGE_KEYS.CHECKINS, allCheckIns);
  } catch (error) {
    console.error('[CheckInStore][Error] 保存签到记录失败:', error);
    throw error;
  }
};

// 检查今天是否已签到
const checkTodayCheckIn = (userId: string): boolean => {
  const today = getTodayDate();
  const records = loadCheckInsFromStorage(userId);
  return records.some((r) => r.check_in_date === today);
};

// 计算连续签到天数
const calculateConsecutiveDays = (userId: string): number => {
  const records = loadCheckInsFromStorage(userId);
  if (records.length === 0) return 0;

  // 按日期降序排序
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime()
  );

  let consecutiveDays = 0;
  let currentDate = new Date();

  for (const record of sortedRecords) {
    const recordDate = new Date(record.check_in_date);
    const diffDays = Math.floor(
      (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === consecutiveDays) {
      consecutiveDays++;
      currentDate = recordDate;
    } else {
      break;
    }
  }

  return consecutiveDays;
};

export const useCheckInStore = create<CheckInState>((set, get) => ({
  checkInRecords: [],
  isCheckedInToday: false,
  consecutiveDays: 0,

  // 加载签到记录
  loadCheckIns: (userId: string) => {
    const checkInRecords = loadCheckInsFromStorage(userId);
    const isCheckedInToday = checkTodayCheckIn(userId);
    const consecutiveDays = calculateConsecutiveDays(userId);

    set({
      checkInRecords,
      isCheckedInToday,
      consecutiveDays,
    });

    console.log('[CheckInStore][Info] 签到数据已加载:', {
      total_records: checkInRecords.length,
      is_checked_in_today: isCheckedInToday,
      consecutive_days: consecutiveDays,
    });
  },

  // 执行签到
  performCheckIn: async (userId: string) => {
    try {
      // 检查今天是否已签到
      if (checkTodayCheckIn(userId)) {
        throw new Error('今天已经签到过了');
      }

      // 创建签到记录
      const record: CheckInRecord = {
        id: generateId(),
        user_id: userId,
        check_in_date: getTodayDate(),
        coins_earned: 5,
        created_at: new Date().toISOString(),
      };

      // 保存签到记录
      const checkInRecords = loadCheckInsFromStorage(userId);
      checkInRecords.unshift(record); // 最新的记录放在前面
      saveCheckInsToStorage(userId, checkInRecords);

      // 增加尊严币（通过 coinStore）
      await useCoinStore.getState().addTransaction(
        userId,
        'check_in',
        5,
        record.id,
        '每日签到奖励'
      );

      // 重新计算连续签到天数
      const consecutiveDays = calculateConsecutiveDays(userId);

      // 更新状态
      set({
        checkInRecords,
        isCheckedInToday: true,
        consecutiveDays,
      });

      console.log('[CheckInStore][Info] 签到成功:', {
        date: record.check_in_date,
        coins_earned: record.coins_earned,
        consecutive_days: consecutiveDays,
      });

      // 显示成功提示
      Taro.showToast({
        title: `签到成功！+5 尊严币`,
        icon: 'success',
        duration: 2000,
      });

      // TODO: 触发成就检查
      // 暂时注释掉，避免动态导入导致超时问题
      // import('./achievementStore').then(({ useAchievementStore }) => {
      //   useAchievementStore.getState().checkAndUnlockAchievements(userId);
      // });

      // 如果连续签到达到特定天数，显示额外提示
      if (consecutiveDays === 7) {
        setTimeout(() => {
          Taro.showToast({
            title: '连续签到7天！',
            icon: 'success',
            duration: 2000,
          });
        }, 2000);
      }
    } catch (error) {
      console.error('[CheckInStore][Error] 签到失败:', error);
      Taro.showToast({
        title: error instanceof Error ? error.message : '签到失败',
        icon: 'none',
        duration: 2000,
      });
      throw error;
    }
  },

  // 获取签到历史（最近N天）
  getCheckInHistory: (userId: string, days: number) => {
    const records = loadCheckInsFromStorage(userId);
    const today = new Date();
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    return records.filter((record) => {
      const recordDate = new Date(record.check_in_date);
      return recordDate >= startDate;
    });
  },
}));
