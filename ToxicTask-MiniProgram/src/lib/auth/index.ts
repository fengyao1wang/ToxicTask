import Taro from '@tarojs/taro';

/**
 * 认证相关操作（本地存储版本）
 */
export const authApi = {
  // 用户登出
  async signOut() {
    try {
      Taro.removeStorageSync('supabase_token');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      throw error;
    }
  },

  // 获取当前会话
  async getSession() {
    try {
      const token = Taro.getStorageSync('supabase_token');
      return token || null;
    } catch (error) {
      console.error('[Auth] Get session error:', error);
      return null;
    }
  },

  // 获取当前用户
  async getCurrentUser() {
    try {
      const token = Taro.getStorageSync('supabase_token');
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
