import Taro from '@tarojs/taro';
import { STORAGE_KEYS } from '@/types';
import { migrateLegacyLocalData } from './migration';

// 使用编译时注入的常量（通过 defineConstants）
declare const TARO_APP_SUPABASE_URL: string;
declare const TARO_APP_SUPABASE_ANON_KEY: string;

const SUPABASE_URL = TARO_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = TARO_APP_SUPABASE_ANON_KEY;
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
    // 如果没有配置 Supabase，使用本地模拟登录
    if (!WECHAT_LOGIN_FUNCTION || !SUPABASE_ANON_KEY) {
      console.warn('[Auth] 未配置 Supabase，使用本地模拟登录');

      // 检查是否已有本地用户
      const existingSession = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
      if (existingSession && existingSession.user_id && existingSession.user_id.startsWith('local_')) {
        console.log('[Auth][Debug] 使用已存在的本地用户:', existingSession.user_id);
        return existingSession.user;
      }

      // 生成固定的本地用户ID（基于设备或使用固定值）
      const localUserId = 'local_user_default';
      console.log('[Auth][Debug] 创建新的本地用户:', localUserId);

      const localUser: WechatLoginUser = {
        id: localUserId,
        email: `${localUserId}@local.toxictask`,
        user_metadata: {
          nickname: nickname || '微信用户',
          avatar_url: avatarUrl || '',
          openid: code,
        },
      };

      migrateLegacyLocalData(localUser.id);

      // 保存本地 session
      const sessionData = {
        user: localUser,
        user_id: localUser.id,
        session_key: 'local_session',
        supabase_url: '',
        supabase_anon_key: '',
      };

      Taro.setStorageSync(STORAGE_KEYS.TOKEN, sessionData);
      return localUser;
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
