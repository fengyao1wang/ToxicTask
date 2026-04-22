import Taro from '@tarojs/taro';

// 使用编译时注入的常量
// @ts-ignore
const SUPABASE_URL = typeof TARO_APP_SUPABASE_URL !== 'undefined' ? TARO_APP_SUPABASE_URL : '';
// @ts-ignore
const SUPABASE_ANON_KEY = typeof TARO_APP_SUPABASE_ANON_KEY !== 'undefined' ? TARO_APP_SUPABASE_ANON_KEY : '';

// 检查是否配置了 Supabase
const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

interface ProfileUpdate {
  dignity_coins?: number;
  username?: string;
  avatar_url?: string;
  updated_at?: string;
}

export const profilesApi = {
  // 更新用户资料
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('[ProfilesAPI] Supabase 未配置，无法更新资料');
      return false;
    }

    try {
      console.log('[ProfilesAPI] 更新用户资料:', userId, updates);

      const response = await Taro.request({
        url: `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        method: 'PATCH',
        data: updates,
        timeout: 10000,
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.statusCode === 204 || response.statusCode === 200) {
        console.log('[ProfilesAPI] 用户资料更新成功');
        return true;
      }

      console.error('[ProfilesAPI] 更新失败，状态码:', response.statusCode);
      return false;
    } catch (error) {
      console.error('[ProfilesAPI] 更新用户资料失败:', error);
      return false;
    }
  },
};
