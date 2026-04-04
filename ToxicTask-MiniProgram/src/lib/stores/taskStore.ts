import { create } from 'zustand';
import { Task } from '@/types';
import { taskApi } from '@/lib/supabase/api';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (userId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, status: 'pending' | 'completed' | 'failed') => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskApi.getUserTasks(userId);
      set({ tasks, loading: false });
    } catch (error) {
      console.error('[TaskStore][Error] 获取任务失败:', error);
      set({ error: '获取任务失败', loading: false });
    }
  },

  createTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const newTask = await taskApi.createTask(task);
      if (newTask) {
        set((state) => ({
          tasks: [newTask, ...state.tasks],
          loading: false,
        }));
        return newTask;
      }
      throw new Error('创建任务失败');
    } catch (error) {
      console.error('[TaskStore][Error] 创建任务失败:', error);
      set({ error: '创建任务失败', loading: false });
      return null;
    }
  },

  updateTaskStatus: async (taskId: string, status: 'pending' | 'completed' | 'failed') => {
    set({ loading: true, error: null });
    try {
      const success = await taskApi.updateTaskStatus(taskId, status);
      if (success) {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, status } : task
          ),
          loading: false,
        }));
      } else {
        throw new Error('更新任务状态失败');
      }
    } catch (error) {
      console.error('[TaskStore][Error] 更新任务状态失败:', error);
      set({ error: '更新任务状态失败', loading: false });
    }
  },

  deleteTask: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const success = await taskApi.deleteTask(taskId);
      if (success) {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          loading: false,
        }));
      } else {
        throw new Error('删除任务失败');
      }
    } catch (error) {
      console.error('[TaskStore][Error] 删除任务失败:', error);
      set({ error: '删除任务失败', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
