import Taro from '@tarojs/taro';
import { STORAGE_KEYS } from '@/types';
import { migrateLegacyLocalData } from './migration';

// @ts-ignore - Taro 编译时注入的环境变量
const SUPABASE_URL = process.env.TARO_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.TARO_APP_SUPABASE_ANON_KEY || '';
const WECHAT_LOGIN_FUNCTION = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/wechat-login` : '';

interface WechatLoginUser {
  id: string;
  email: string;
  user_metadata?: {
    nickname?: string;
    avatar_url?: string;
    openid?: string;
  };
}


export const authApi = {
  async signInWithWechat(code: string, nickname?: string, avatarUrl?: string) {
    if (!WECHAT_LOGIN_FUNCTION || !SUPABASE_ANON_KEY) {
      throw new Error('缺少 Supabase 配置（TARO_APP_SUPABASE_URL 或 TARO_APP_SUPABASE_ANON_KEY）');
    }

    try {
      console.log('[Auth][Debug] 发送微信登录请求:', {
        url: WECHAT_LOGIN_FUNCTION,
        code: code?.substring(0, 10) + '...' || 'null',
        nickname,
        avatar_url: avatarUrl,
      });

      const response = await Taro.request<{ user: WechatLoginUser; session_key: string }>({
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

      console.log('[Auth][Debug] 微信登录响应:', {
        statusCode: response.statusCode,
        data: response.data,
      });

      if (response.statusCode < 200 || response.statusCode >= 300 || !response.data?.user) {
        const errorMessage = (response.data as { error?: string } | undefined)?.error || '登录失败';
        throw new Error(errorMessage);
      }

      const { user, session_key } = response.data;
      migrateLegacyLocalData(user.id);

      // 保存 Supabase session（包含用户 ID 和 anon key）
      // RLS 策略会基于 user id 进行访问控制
      const sessionData = {
        user: user,
        user_id: user.id,
        session_key: session_key,
        supabase_url: SUPABASE_URL,
        supabase_anon_key: SUPABASE_ANON_KEY,
      };

      Taro.setStorageSync(STORAGE_KEYS.TOKEN, sessionData);
      return user;
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
      if (token && token.user_id) {
        // 验证会话是否有效（可选：检查 WeChat session_key 是否过期）
        return token;
      }
      return null;
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
