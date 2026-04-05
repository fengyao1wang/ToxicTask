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

  // 好友监督相关
  acceptSupervision: (taskId: string, supervisorId: string) => Promise<void>;
  submitEvidence: (taskId: string, evidenceImage?: string, evidenceText?: string) => Promise<void>;
  reviewEvidence: (taskId: string, approved: boolean, reviewerId: string) => Promise<void>;
  checkSupervisionTimeout: (userId: string) => Promise<void>;
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
      // 为旧任务添加默认的 task_type 和监督相关字段
      const tasksWithType = tasks.map((task) => ({
        ...task,
        task_type: task.task_type || 'single',
        is_supervised: task.is_supervised ?? false,
        bounty_coins: task.bounty_coins ?? 0,
        supervision_status: task.supervision_status || 'none',
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
        is_supervised: task.is_supervised ?? false,
        bounty_coins: task.bounty_coins ?? 0,
        supervision_status: task.is_supervised ? 'waiting_invite' : 'none',
      };

      const userId = task.user_id;
      const existingTasks = loadTasksFromStorage(userId);
      const updatedTasks = [newTask, ...existingTasks];

      saveTasksToStorage(userId, updatedTasks);

      set((state) => ({
        tasks: [newTask, ...state.tasks],
        loading: false,
      }));

      // 如果开启了监督，需要扣除本金和赏金
      if (newTask.is_supervised && newTask.bounty_coins > 0) {
        const { useCoinStore } = await import('./coinStore');
        const coinStore = useCoinStore.getState();

        // 扣除本金
        await coinStore.addTransaction(
          userId,
          'task_bet',
          -task.bet_amount,
          newTask.id,
          `任务押注: ${task.title}`
        );

        // 冻结赏金
        await coinStore.addTransaction(
          userId,
          'bounty_freeze',
          -newTask.bounty_coins,
          newTask.id,
          `冻结监督赏金: ${task.title}`
        );
      } else {
        // 普通任务只扣除本金
        const { useCoinStore } = await import('./coinStore');
        const coinStore = useCoinStore.getState();

        await coinStore.addTransaction(
          userId,
          'task_bet',
          -task.bet_amount,
          newTask.id,
          `任务押注: ${task.title}`
        );
      }

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

  // 接受监督
  acceptSupervision: async (taskId: string, supervisorId: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const task = state.tasks.find((t) => t.id === taskId);

      if (!task) {
        throw new Error('任务不存在');
      }

      if (!task.is_supervised) {
        throw new Error('该任务未开启监督');
      }

      if (task.user_id === supervisorId) {
        throw new Error('不能监督自己的任务');
      }

      if (task.supervision_status !== 'waiting_invite') {
        throw new Error('任务状态不正确');
      }

      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              supervisor_id: supervisorId,
              supervision_status: 'invited' as const,
              updated_at: new Date().toISOString(),
            }
          : t
      );

      const userId = task.user_id;
      saveTasksToStorage(userId, updatedTasks);
      set({ tasks: updatedTasks, loading: false });

      console.log('[TaskStore][Info] 接受监督成功:', taskId);
    } catch (error) {
      console.error('[TaskStore][Error] 接受监督失败:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // 提交证据
  submitEvidence: async (taskId: string, evidenceImage?: string, evidenceText?: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const task = state.tasks.find((t) => t.id === taskId);

      if (!task) {
        throw new Error('任务不存在');
      }

      if (!task.is_supervised) {
        throw new Error('该任务未开启监督');
      }

      if (task.supervision_status !== 'invited') {
        throw new Error('任务状态不正确');
      }

      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              evidence_image: evidenceImage,
              evidence_text: evidenceText,
              supervision_status: 'evidence_submitted' as const,
              evidence_submitted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : t
      );

      const userId = task.user_id;
      saveTasksToStorage(userId, updatedTasks);
      set({ tasks: updatedTasks, loading: false });

      console.log('[TaskStore][Info] 提交证据成功:', taskId);
    } catch (error) {
      console.error('[TaskStore][Error] 提交证据失败:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // 审核证据
  reviewEvidence: async (taskId: string, approved: boolean, reviewerId: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const task = state.tasks.find((t) => t.id === taskId);

      if (!task) {
        throw new Error('任务不存在');
      }

      if (task.supervisor_id !== reviewerId) {
        throw new Error('只有监督者可以审核');
      }

      if (task.supervision_status !== 'evidence_submitted') {
        throw new Error('任务状态不正确');
      }

      // 动态导入 coinStore
      const { useCoinStore } = await import('./coinStore');
      const coinStore = useCoinStore.getState();

      if (approved) {
        // 通过：任务完成，返还本金，监督者获得赏金
        const updatedTasks = state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'completed' as const,
                supervision_status: 'approved' as const,
                updated_at: new Date().toISOString(),
              }
            : t
        );

        saveTasksToStorage(task.user_id, updatedTasks);
        set({ tasks: updatedTasks });

        // 返还本金给发起人
        await coinStore.addTransaction(
          task.user_id,
          'task_refund',
          task.bet_amount,
          taskId,
          `任务完成退款: ${task.title}`
        );

        // 监督者获得赏金
        await coinStore.addTransaction(
          reviewerId,
          'bounty_reward',
          task.bounty_coins,
          taskId,
          `监督奖励: ${task.title}`
        );

        console.log('[TaskStore][Info] 证据通过，任务完成');
      } else {
        // 拒绝：任务失败，本金没收，监督者获得赏金+50%本金分红
        const updatedTasks = state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'failed' as const,
                supervision_status: 'rejected' as const,
                updated_at: new Date().toISOString(),
              }
            : t
        );

        saveTasksToStorage(task.user_id, updatedTasks);
        set({ tasks: updatedTasks });

        // 监督者获得赏金 + 50%本金分红
        const totalReward = task.bounty_coins + Math.floor(task.bet_amount * 0.5);
        await coinStore.addTransaction(
          reviewerId,
          'bounty_reward',
          totalReward,
          taskId,
          `监督奖励(含分红): ${task.title}`
        );

        // 创建耻辱记录
        const { useAppStore } = await import('./appStore');
        const appStore = useAppStore.getState();
        await appStore.createShameLog(taskId, task.user_id, task.title, task.bet_amount);

        console.log('[TaskStore][Info] 证据被拒，任务失败');
      }

      // 检查成就
      const { useAchievementStore } = await import('./achievementStore');
      await useAchievementStore.getState().checkAndUnlockAchievements(task.user_id);
      await useAchievementStore.getState().checkAndUnlockAchievements(reviewerId);

      set({ loading: false });
    } catch (error) {
      console.error('[TaskStore][Error] 审核证据失败:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // 检查监督超时
  checkSupervisionTimeout: async (userId: string) => {
    try {
      const state = get();
      const now = Date.now();
      const TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24小时

      let hasChanges = false;

      const updatedTasks = await Promise.all(
        state.tasks.map(async (task) => {
          if (
            task.supervision_status === 'evidence_submitted' &&
            task.evidence_submitted_at
          ) {
            const submittedTime = new Date(task.evidence_submitted_at).getTime();
            if (now - submittedTime > TIMEOUT_MS) {
              hasChanges = true;

              // 超时自动判定任务成功
              const { useCoinStore } = await import('./coinStore');
              const coinStore = useCoinStore.getState();

              // 返还本金
              await coinStore.addTransaction(
                task.user_id,
                'task_refund',
                task.bet_amount,
                task.id,
                `任务完成退款(超时自动通过): ${task.title}`
              );

              // 退回赏金
              await coinStore.addTransaction(
                task.user_id,
                'bounty_refund',
                task.bounty_coins,
                task.id,
                `赏金退回(监督超时): ${task.title}`
              );

              console.log('[TaskStore][Info] 监督超时，任务自动完成:', task.id);

              return {
                ...task,
                status: 'completed' as const,
                supervision_status: 'approved' as const,
                updated_at: new Date().toISOString(),
              };
            }
          }
          return task;
        })
      );

      if (hasChanges) {
        saveTasksToStorage(userId, updatedTasks);
        set({ tasks: updatedTasks });
      }
    } catch (error) {
      console.error('[TaskStore][Error] 检查监督超时失败:', error);
    }
  },
}));
