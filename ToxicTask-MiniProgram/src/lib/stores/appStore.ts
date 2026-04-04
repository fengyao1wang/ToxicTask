import { create } from 'zustand';
import { Profile } from '@/types';
import Taro from '@tarojs/taro';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    nickname?: string;
    avatar_url?: string;
  };
}

interface AppState {
  user: User | null;
  profile: Profile | null;

  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;

  // 初始化用户 profile（本地存储版本）
  initProfile: (userId: string) => void;

  // 更新尊严币
  updateDignityCoins: (userId: string, amount: number) => void;
}

const PROFILE_STORAGE_KEY = 'toxictask_profiles';

// 从本地存储加载 profile
const loadProfileFromStorage = (userId: string): Profile | null => {
  try {
    const allProfiles = Taro.getStorageSync(PROFILE_STORAGE_KEY) || {};
    return allProfiles[userId] || null;
  } catch (error) {
    console.error('[AppStore] 加载 profile 失败:', error);
    return null;
  }
};

// 保存 profile 到本地存储
const saveProfileToStorage = (userId: string, profile: Profile) => {
  try {
    const allProfiles = Taro.getStorageSync(PROFILE_STORAGE_KEY) || {};
    allProfiles[userId] = profile;
    Taro.setStorageSync(PROFILE_STORAGE_KEY, allProfiles);
  } catch (error) {
    console.error('[AppStore] 保存 profile 失败:', error);
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  profile: null,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  initProfile: (userId: string) => {
    let profile = loadProfileFromStorage(userId);

    if (!profile) {
      // 创建新的 profile
      const user = get().user;
      profile = {
        id: userId,
        username: user?.user_metadata?.nickname || '微信用户',
        avatar_url: user?.user_metadata?.avatar_url || '',
        dignity_coins: 100, // 初始尊严币
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      saveProfileToStorage(userId, profile);
    }

    set({ profile });
  },

  updateDignityCoins: (userId: string, amount: number) => {
    const state = get();
    if (state.profile) {
      const updatedProfile = {
        ...state.profile,
        dignity_coins: amount,
        updated_at: new Date().toISOString(),
      };

      saveProfileToStorage(userId, updatedProfile);
      set({ profile: updatedProfile });
    }
  },
}));
