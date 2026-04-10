import Taro from '@tarojs/taro';
import { STORAGE_KEYS } from '@/types';
import { migrateLegacyLocalData } from './migration';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const WECHAT_LOGIN_FUNCTION = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/wechat-login`
  : '';

interface WechatLoginUser {
  id: string;
  email: string;
  user_metadata?: {
    nickname?: string;
    avatar_url?: string;
    openid?: string;
  };
}

/**
 * 认证相关操作（微信登录 + 本地 session）
 */
export const authApi = {
  async signInWithWechat(code: string, nickname?: string, avatarUrl?: string) {
    if (!WECHAT_LOGIN_FUNCTION) {
      throw new Error('缺少 EXPO_PUBLIC_SUPABASE_URL 配置');
    }

    try {
      const response = await Taro.request<{ user: WechatLoginUser; access_token: string }>({
        url: WECHAT_LOGIN_FUNCTION,
        method: 'POST',
        data: {
          code,
          nickname,
          avatar_url: avatarUrl,
        },
        header: {
          'Content-Type': 'application/json',
        },
      });

      if (response.statusCode < 200 || response.statusCode >= 300 || !response.data?.user) {
        const errorMessage = (response.data as { error?: string } | undefined)?.error || '登录失败';
        throw new Error(errorMessage);
      }

      migrateLegacyLocalData(response.data.user.id);

      const sessionData = {
        user: response.data.user,
        access_token: response.data.access_token,
      };

      Taro.setStorageSync(STORAGE_KEYS.TOKEN, sessionData);
      return response.data.user;
    } catch (error) {
      console.error('[Auth] WeChat login error:', error);
      throw error;
    }
  },

  // 用户登出
  async signOut() {
    try {
      Taro.removeStorageSync(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      throw error;
    }
  },

  // 获取当前会话
  async getSession() {
    try {
      const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
      return token || null;
    } catch (error) {
      console.error('[Auth] Get session error:', error);
      return null;
    }
  },

  // 获取当前用户
  async getCurrentUser() {
    try {
      const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
      if (token && token.user) {
        return token.user;
      }
      return null;
    } catch (error) {
      console.error('[Auth] Get user error:', error);
      return null;
    }
  },
};
