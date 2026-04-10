import Taro from '@tarojs/taro';
import { STORAGE_KEYS } from '@/types';

interface LegacyUser {
  id: string;
}

const USER_SCOPED_KEYS = [
  STORAGE_KEYS.PROFILES,
  STORAGE_KEYS.TASKS,
  STORAGE_KEYS.CHECKINS,
  STORAGE_KEYS.USER_ACHIEVEMENTS,
  STORAGE_KEYS.INVITES,
  STORAGE_KEYS.AD_WATCHES,
  STORAGE_KEYS.RECHARGES,
  STORAGE_KEYS.TRANSACTIONS,
] as const;

const moveBucket = (storageKey: string, fromUserId: string, toUserId: string) => {
  const allData = Taro.getStorageSync(storageKey) || {};
  const fromData = allData[fromUserId];
  const hasTarget = allData[toUserId];

  if (!fromData || hasTarget) {
    return;
  }

  allData[toUserId] = fromData;
  delete allData[fromUserId];
  Taro.setStorageSync(storageKey, allData);
};

const migrateShameLogs = (fromUserId: string, toUserId: string) => {
  const logs = Taro.getStorageSync(STORAGE_KEYS.SHAME_LOGS) || [];
  if (!Array.isArray(logs) || logs.length === 0) return;

  let changed = false;
  const nextLogs = logs.map((log) => {
    if (log?.user_id === fromUserId) {
      changed = true;
      return { ...log, user_id: toUserId };
    }
    return log;
  });

  if (changed) {
    Taro.setStorageSync(STORAGE_KEYS.SHAME_LOGS, nextLogs);
  }
};

export const migrateLegacyLocalData = (newUserId: string) => {
  try {
    const session = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
    const legacyUser = session?.user as LegacyUser | undefined;
    const legacyUserId = legacyUser?.id;

    if (!legacyUserId || legacyUserId === newUserId || !legacyUserId.startsWith('wx_')) {
      return;
    }

    USER_SCOPED_KEYS.forEach((storageKey) => {
      moveBucket(storageKey, legacyUserId, newUserId);
    });

    const legacyLastActiveKey = `last_active_${legacyUserId}`;
    const nextLastActiveKey = `last_active_${newUserId}`;
    const legacyLastActive = Taro.getStorageSync(legacyLastActiveKey);
    const nextLastActive = Taro.getStorageSync(nextLastActiveKey);
    if (legacyLastActive && !nextLastActive) {
      Taro.setStorageSync(nextLastActiveKey, legacyLastActive);
      Taro.removeStorageSync(legacyLastActiveKey);
    }

    migrateShameLogs(legacyUserId, newUserId);

    console.log('[Auth][Info] 本地数据迁移完成:', {
      from: legacyUserId,
      to: newUserId,
    });
  } catch (error) {
    console.error('[Auth][Error] 本地数据迁移失败:', error);
  }
};
