import Taro from '@tarojs/taro';
import { Task } from '@/types';

// 使用编译时注入的常量
// @ts-ignore
const SUPABASE_URL = typeof TARO_APP_SUPABASE_URL !== 'undefined' ? TARO_APP_SUPABASE_URL : '';
// @ts-ignore
const SUPABASE_ANON_KEY = typeof TARO_APP_SUPABASE_ANON_KEY !== 'undefined' ? TARO_APP_SUPABASE_ANON_KEY : '';

// 检查是否配置了 Supabase
const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

export const tasksApi = {
  // 获取单个任务（用于分享链接）
  async getTask(taskId: string): Promise<Task | null> {
    if (!isSupabaseConfigured()) {
      console.warn('[TasksAPI] Supabase 未配置，无法获取任务');
      return null;
    }

    try {
      console.log('[TasksAPI] 开始获取任务:', taskId);
      console.log('[TasksAPI] SUPABASE_URL:', SUPABASE_URL);
      console.log('[TasksAPI] SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined');

      const response = await Taro.request<Task[]>({
        url: `${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}`,
        method: 'GET',
        timeout: 10000, // 10秒超时
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[TasksAPI] 获取任务响应:', {
        statusCode: response.statusCode,
        dataLength: response.data?.length,
      });

      if (response.statusCode === 200 && response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('[TasksAPI] 任务加载成功');
        return response.data[0];
      }

      console.log('[TasksAPI] 任务不存在或响应格式错误');
      return null;
    } catch (error) {
      console.error('[TasksAPI] 获取任务失败:', error);
      return null;
    }
  },

  // 获取我作为监督者的任务
  async getTasksAsSupervisor(supervisorId: string): Promise<Task[]> {
    if (!isSupabaseConfigured()) {
      console.warn('[TasksAPI] Supabase 未配置，无法获取监督任务');
      return [];
    }

    try {
      console.log('[TasksAPI] 获取监督任务:', supervisorId);

      const response = await Taro.request<Task[]>({
        url: `${SUPABASE_URL}/rest/v1/tasks?supervisor_id=eq.${supervisorId}`,
        method: 'GET',
        timeout: 10000,
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (response.statusCode === 200 && response.data && Array.isArray(response.data)) {
        console.log('[TasksAPI] 监督任务加载成功，数量:', response.data.length);
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('[TasksAPI] 获取监督任务失败:', error);
      return [];
    }
  },

  // 创建任务
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    if (!isSupabaseConfigured()) {
      console.warn('[TasksAPI] Supabase 未配置，无法创建任务');
      return null;
    }

    try {
      const response = await Taro.request<Task[]>({
        url: `${SUPABASE_URL}/rest/v1/tasks`,
        method: 'POST',
        data: task,
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      });

      if (response.statusCode === 201 && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }

      return null;
    } catch (error) {
      console.error('[TasksAPI] 创建任务失败:', error);
      return null;
    }
  },

  // 更新任务
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    if (!isSupabaseConfigured()) {
      console.warn('[TasksAPI] Supabase 未配置，无法更新任务');
      return null;
    }

    try {
      const response = await Taro.request<Task[]>({
        url: `${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}`,
        method: 'PATCH',
        data: updates,
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      });

      if (response.statusCode === 200 && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }

      return null;
    } catch (error) {
      console.error('[TasksAPI] 更新任务失败:', error);
      return null;
    }
  },
};
