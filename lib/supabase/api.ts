import { supabase } from './client';
import { Profile, Task, ShameLog } from '@/types';

/**
 * Profile 相关操作
 */
export const profileApi = {
  // 获取当前用户的 profile
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 重试机制：触发器可能需要一点时间
    let retries = 3;
    while (retries > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) return data;

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }

      // 如果没找到，等待后重试
      await new Promise(resolve => setTimeout(resolve, 500));
      retries--;
    }

    console.error('Profile not found after retries');
    return null;
  },

  // 创建或更新 profile
  async upsertProfile(profile: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      return null;
    }

    return data;
  },

  // 更新尊严币
  async updateDignityCoins(userId: string, amount: number): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ dignity_coins: amount })
      .eq('id', userId);

    if (error) {
      console.error('Error updating dignity coins:', error);
      return false;
    }

    return true;
  },
};

/**
 * Task 相关操作
 */
export const taskApi = {
  // 获取用户的所有任务
  async getUserTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data || [];
  },

  // 创建新任务
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return data;
  },

  // 更新任务状态
  async updateTaskStatus(taskId: string, status: 'pending' | 'completed' | 'failed'): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      return false;
    }

    return true;
  },

  // 删除任务
  async deleteTask(taskId: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  },
};

/**
 * ShameLog 相关操作
 */
export const shameLogApi = {
  // 获取所有耻辱记录（公开）
  async getAllShameLogs(): Promise<ShameLog[]> {
    const { data, error } = await supabase
      .from('shame_logs')
      .select(`
        *,
        task:tasks(*)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching shame logs:', error);
      return [];
    }

    return data || [];
  },

  // 创建耻辱记录
  async createShameLog(shameLog: Omit<ShameLog, 'id' | 'created_at'>): Promise<ShameLog | null> {
    const { data, error } = await supabase
      .from('shame_logs')
      .insert(shameLog)
      .select()
      .single();

    if (error) {
      console.error('Error creating shame log:', error);
      return null;
    }

    return data;
  },

  // 获取用户的耻辱记录
  async getUserShameLogs(userId: string): Promise<ShameLog[]> {
    const { data, error } = await supabase
      .from('shame_logs')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user shame logs:', error);
      return [];
    }

    return data || [];
  },
};
