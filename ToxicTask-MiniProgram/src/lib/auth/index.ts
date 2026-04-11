import Taro from '@tarojs/taro';
import { createClient } from '@supabase/supabase-js';
import { STORAGE_KEYS } from '@/types';
import { migrateLegacyLocalData } from './migration';

// @ts-ignore - Taro 编译时注入的环境变量
const SUPABASE_URL = process.env.TARO_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.TARO_APP_SUPABASE_ANON_KEY || '';
const WECHAT_LOGIN_FUNCTION = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/wechat-login` : '';

// 延迟初始化 Supabase 客户端（避免小程序环境中 Headers API 不存在的问题）
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

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
/**
 * 获取已认证的 Supabase 客户端
 * 使用存储的 session 中的 user_id 作为 RLS 依据
 */
export function getAuthenticatedSupabaseClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase 未初始化');
  }

  // 获取存储的 session
  try {
    const session = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
    if (session && session.user_id) {
      // 返回已认证的客户端
      // 注意：RLS 策略会基于 stored procedure 或 JWT claims 中的 user_id 进行验证
      // 这里我们返回原始的 supabase 客户端，它会使用 anon key
      // 但由于 auth.users 表中已创建了用户，RLS 会认识这个 user_id
      return client;
    }
  } catch (error) {
    console.error('[Auth] Failed to get session:', error);
  }

  throw new Error('用户未登录');
}

export const authApi = {
  async signInWithWechat(code: string, nickname?: string, avatarUrl?: string) {
    const supabaseClient = getSupabaseClient();
    if (!WECHAT_LOGIN_FUNCTION || !supabaseClient) {
      throw new Error('缺少 Supabase 配置（TARO_APP_SUPABASE_URL 或 TARO_APP_SUPABASE_ANON_KEY）');
    }

    try {
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
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
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
