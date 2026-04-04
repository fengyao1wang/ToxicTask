import { create } from 'zustand';
import { Task } from '@/types';
import Taro from '@tarojs/taro';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (userId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, status: 'pending' | 'completed' | 'failed') => Promise<void>;
  checkInTask: (taskId: string, date: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  clearError: () => void;
}

// 本地存储的 key
const TASKS_STORAGE_KEY = 'toxictask_tasks';

// 生成唯一 ID
const generateId = () => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 从本地存储加载任务
const loadTasksFromStorage = (userId: string): Task[] => {
  try {
    const allTasks = Taro.getStorageSync(TASKS_STORAGE_KEY) || {};
    return allTasks[userId] || [];
  } catch (error) {
    console.error('[TaskStore] 加载任务失败:', error);
    return [];
  }
};

// 保存任务到本地存储
const saveTasksToStorage = (userId: string, tasks: Task[]) => {
  try {
    const allTasks = Taro.getStorageSync(TASKS_STORAGE_KEY) || {};
    allTasks[userId] = tasks;
    Taro.setStorageSync(TASKS_STORAGE_KEY, allTasks);
  } catch (error) {
    console.error('[TaskStore] 保存任务失败:', error);
  }
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const tasks = loadTasksFromStorage(userId);
      // 为旧任务添加默认的 task_type
      const tasksWithType = tasks.map((task) => ({
        ...task,
        task_type: task.task_type || 'single',
      }));
      set({ tasks: tasksWithType, loading: false });
    } catch (error) {
      console.error('[TaskStore][Error] 获取任务失败:', error);
      set({ error: '获取任务失败', loading: false });
    }
  },

  createTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const newTask: Task = {
        ...task,
        id: generateId(),
        created_at: now,
        updated_at: now,
        task_type: task.task_type || 'single', // 默认为单次任务
      };

      const userId = task.user_id;
      const existingTasks = loadTasksFromStorage(userId);
      const updatedTasks = [newTask, ...existingTasks];

      saveTasksToStorage(userId, updatedTasks);

      set((state) => ({
        tasks: [newTask, ...state.tasks],
        loading: false,
      }));

      return newTask;
    } catch (error) {
      console.error('[TaskStore][Error] 创建任务失败:', error);
      set({ error: '创建任务失败', loading: false });
      return null;
    }
  },

  updateTaskStatus: async (taskId: string, status: 'pending' | 'completed' | 'failed') => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const updatedTasks = state.tasks.map((task) =>
        task.id === taskId ? { ...task, status, updated_at: new Date().toISOString() } : task
      );

      // 保存到本地存储
      if (updatedTasks.length > 0) {
        const userId = updatedTasks[0].user_id;
        saveTasksToStorage(userId, updatedTasks);

        // TODO: 如果任务完成，触发成就检查
        // 暂时注释掉，避免动态导入导致超时问题
        // if (status === 'completed') {
        //   import('./achievementStore').then(({ useAchievementStore }) => {
        //     useAchievementStore.getState().checkAndUnlockAchievements(userId);
        //   });
        // }
      }

      set({ tasks: updatedTasks, loading: false });
    } catch (error) {
      console.error('[TaskStore][Error] 更新任务状态失败:', error);
      set({ error: '更新任务状态失败', loading: false });
    }
  },

  checkInTask: async (taskId: string, date: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId && task.task_type === 'repeat' && task.check_ins) {
          const updatedCheckIns = task.check_ins.map((checkIn) =>
            checkIn.date === date
              ? { ...checkIn, checked: true, checked_at: new Date().toISOString() }
              : checkIn
          );
          return { ...task, check_ins: updatedCheckIns, updated_at: new Date().toISOString() };
        }
        return task;
      });

      // 保存到本地存储
      if (updatedTasks.length > 0) {
        const userId = updatedTasks[0].user_id;
        saveTasksToStorage(userId, updatedTasks);
      }

      set({ tasks: updatedTasks, loading: false });
    } catch (error) {
      console.error('[TaskStore][Error] 打卡失败:', error);
      set({ error: '打卡失败', loading: false });
    }
  },

  deleteTask: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const updatedTasks = state.tasks.filter((task) => task.id !== taskId);

      // 保存到本地存储
      if (state.tasks.length > 0) {
        const userId = state.tasks[0].user_id;
        saveTasksToStorage(userId, updatedTasks);
      }

      set({ tasks: updatedTasks, loading: false });
    } catch (error) {
      console.error('[TaskStore][Error] 删除任务失败:', error);
      set({ error: '删除任务失败', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
