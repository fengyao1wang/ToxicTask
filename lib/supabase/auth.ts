import { supabase } from './client';
import { profileApi } from './api';

/**
 * 认证相关操作
 */
export const authApi = {
  // 用户注册
  async signUp(email: string, password: string, username: string) {
    try {
      // 注册用户，将 username 放入 user_metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 获取自动创建的 profile（内置重试机制）
      const profile = await profileApi.getCurrentProfile();

      if (!profile) throw new Error('Profile creation failed');

      return { user: authData.user, profile };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  // 用户登录
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 获取 profile
      const profile = await profileApi.getCurrentProfile();

      return { user: data.user, session: data.session, profile };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // 用户登出
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // 获取当前会话
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  // 获取当前用户
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
