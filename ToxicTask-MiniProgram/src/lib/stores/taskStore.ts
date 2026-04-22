import { create } from 'zustand';
import { Task } from '@/types';
import Taro from '@tarojs/taro';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (userId: string, skipSync?: boolean) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, status: 'pending' | 'completed' | 'failed') => Promise<void>;
  checkInTask: (taskId: string, date: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  clearError: () => void;

  // 好友监督相关
  acceptSupervision: (taskId: string, supervisorId: string) => Promise<void>;
  cancelSupervision: (taskId: string) => Promise<void>;
  submitEvidence: (taskId: string, evidenceImage?: string, evidenceText?: string) => Promise<void>;
  reviewEvidence: (taskId: string, approved: boolean, reviewerId: string) => Promise<void>;
  checkSupervisionTimeout: (userId: string) => Promise<void>;
}

// 本地存储的 key
const TASKS_STORAGE_KEY = 'toxictask_tasks';

// 生成唯一 ID
const generateId = () => {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

  fetchTasks: async (userId: string, skipSync = false) => {
    set({ loading: true, error: null });
    try {
      console.log('[TaskStore][Debug] 开始加载任务, userId:', userId, 'skipSync:', skipSync);
      const tasks = loadTasksFromStorage(userId);
      console.log('[TaskStore][Debug] 从本地加载任务数量:', tasks.length);

      // 为旧任务添加默认的 task_type 和监督相关字段
      const tasksWithType = tasks.map((task) => ({
        ...task,
        task_type: task.task_type || 'single',
        is_supervised: task.is_supervised ?? false,
        bounty_coins: task.bounty_coins ?? 0,
        supervision_status: task.supervision_status || 'none',
      }));

      console.log('[TaskStore][Debug] 任务类型处理完成');

      // 🔥 临时开关：跳过数据库同步（用于紧急调试）
      const SKIP_DB_SYNC = skipSync; // 🔥 支持外部控制是否跳过同步

      // 从数据库同步监督任务的状态更新
      if (!SKIP_DB_SYNC) {
      try {
        const { tasksApi } = await import('@/lib/api/tasks');
        const supervisedTasks = tasksWithType.filter(t => t.is_supervised);

        // 🔥 性能优化：只同步状态不是终态的任务
        const activeSupervisedTasks = supervisedTasks.filter(
          t => !['approved', 'rejected', 'completed', 'failed'].includes(t.supervision_status)
        );

        console.log('[TaskStore][Info] 需要同步的监督任务数量:', activeSupervisedTasks.length);

        // 🔥 性能优化：如果没有需要同步的任务，直接跳过
        if (activeSupervisedTasks.length === 0) {
          console.log('[TaskStore][Info] 无需同步监督任务，跳过数据库请求');
        } else {
          // 🔥 并行化：使用 Promise.all 替代串行循环
          try {
            const taskPromises = activeSupervisedTasks.map(t =>
              tasksApi.getTask(t.id).catch(err => {
                console.warn('[TaskStore][Warning] 同步任务失败:', t.id, err);
                return null; // 🔥 容错：单个任务失败不影响整体
              })
            );

            const remoteTasks = await Promise.all(taskPromises);

            // 🔥 统一处理返回结果
            remoteTasks.forEach((remoteTask, index) => {
              if (!remoteTask) return; // 跳过失败的任务

              const localTask = activeSupervisedTasks[index];
              if (
                remoteTask.supervision_status !== localTask.supervision_status ||
                remoteTask.status !== localTask.status
              ) {
                console.log('[TaskStore][Info] 同步任务状态:', localTask.id, {
                  supervision_status: `${localTask.supervision_status} -> ${remoteTask.supervision_status}`,
                  status: `${localTask.status} -> ${remoteTask.status}`,
                });

                // 更新本地任务状态
                const taskIndex = tasksWithType.findIndex(t => t.id === localTask.id);
                if (taskIndex !== -1) {
                  tasksWithType[taskIndex] = {
                    ...tasksWithType[taskIndex],
                    status: remoteTask.status,
                    supervision_status: remoteTask.supervision_status,
                    supervisor_id: remoteTask.supervisor_id,
                    updated_at: remoteTask.updated_at,
                  };
                }
              }
            });

            // 保存更新后的任务
            saveTasksToStorage(userId, tasksWithType);
          } catch (parallelError) {
            // 🔥 降级：如果并行失败，回退到串行模式
            console.warn('[TaskStore][Warning] 并行同步失败，回退到串行模式:', parallelError);
            for (const localTask of activeSupervisedTasks) {
              try {
                const remoteTask = await tasksApi.getTask(localTask.id);
                if (remoteTask && (
                  remoteTask.supervision_status !== localTask.supervision_status ||
                  remoteTask.status !== localTask.status
                )) {
                  const taskIndex = tasksWithType.findIndex(t => t.id === localTask.id);
                  if (taskIndex !== -1) {
                    tasksWithType[taskIndex] = {
                      ...tasksWithType[taskIndex],
                      status: remoteTask.status,
                      supervision_status: remoteTask.supervision_status,
                      supervisor_id: remoteTask.supervisor_id,
                      updated_at: remoteTask.updated_at,
                    };
                  }
                }
              } catch (taskError) {
                console.warn('[TaskStore][Warning] 同步单个任务失败:', localTask.id, taskError);
              }
            }
            saveTasksToStorage(userId, tasksWithType);
          }
        }
      } catch (error) {
        console.warn('[TaskStore][Warning] 同步任务状态失败:', error);
      }
      } else {
        console.log('[TaskStore][Info] 跳过数据库同步（调试模式）');
      }

      console.log('[TaskStore][Debug] 准备更新 state, 任务数量:', tasksWithType.length);
      set({ tasks: tasksWithType, loading: false });
      console.log('[TaskStore][Debug] fetchTasks 完成');
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
        visibility: task.visibility || 'friends', // 默认好友可见
      };

      const userId = task.user_id;
      const existingTasks = loadTasksFromStorage(userId);
      const updatedTasks = [newTask, ...existingTasks];

      saveTasksToStorage(userId, updatedTasks);

      set((state) => ({
        tasks: [newTask, ...state.tasks],
        loading: false,
      }));

      // 同步到 Supabase
      try {
        const { tasksApi } = await import('@/lib/api/tasks');
        await tasksApi.createTask(newTask);
        console.log('[TaskStore][Info] 任务已同步到数据库:', newTask.id);
      } catch (error) {
        console.warn('[TaskStore][Warning] 同步任务到数据库失败:', error);
        // 不影响本地创建流程
      }

      // 如果开启了监督，需要扣除本金和赏金
      if (newTask.is_supervised && newTask.bounty_coins > 0) {
        const { useCoinStore } = await import('./coinStore');
        const coinStore = useCoinStore.getState();

        // 🔥 批量扣币：先扣本金（跳过同步）
        await coinStore.addTransaction(
          userId,
          'task_bet',
          -task.bet_amount,
          newTask.id,
          `任务押注: ${task.title}`,
          true // 跳过数据库同步
        );

        // 🔥 再扣赏金（最后一次，执行同步）
        const finalBalance = await coinStore.addTransaction(
          userId,
          'bounty_freeze',
          -newTask.bounty_coins,
          newTask.id,
          `冻结监督赏金: ${task.title}`,
          false // 执行数据库同步
        );

        console.log('[TaskStore][Info] 批量扣币完成，最终余额:', finalBalance);
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
      // 直接从数据库加载任务（分享链接的任务不在本地）
      console.log('[TaskStore][Info] 从数据库加载任务:', taskId);
      const { tasksApi } = await import('@/lib/api/tasks');
      const task = await tasksApi.getTask(taskId);

      console.log('[TaskStore][Debug] 接受监督 - 参数检查:', {
        taskId,
        supervisorId,
        task_user_id: task?.user_id,
        task_supervisor_id: task?.supervisor_id,
        task_supervision_status: task?.supervision_status,
      });

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

      // 更新数据库
      await tasksApi.updateTask(taskId, {
        supervisor_id: supervisorId,
        supervision_status: 'invited',
      });
      console.log('[TaskStore][Info] 监督状态已同步到数据库, supervisor_id:', supervisorId);

      set({ loading: false });
      console.log('[TaskStore][Info] 接受监督成功:', taskId);
    } catch (error) {
      console.error('[TaskStore][Error] 接受监督失败:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // 取消监督并退币
  cancelSupervision: async (taskId: string) => {
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

      if (task.supervision_status !== 'waiting_invite') {
        throw new Error('只能取消等待邀请的监督');
      }

      // 动态导入 coinStore
      const { useCoinStore } = await import('./coinStore');
      const coinStore = useCoinStore.getState();

      // 退还本金和赏金
      const totalRefund = task.bet_amount + task.bounty_coins;
      await coinStore.addTransaction(
        task.user_id,
        'task_refund',
        totalRefund,
        taskId,
        `取消监督退款: ${task.title}`
      );

      // 从任务列表中删除该任务
      const updatedTasks = state.tasks.filter((t) => t.id !== taskId);

      const userId = task.user_id;
      saveTasksToStorage(userId, updatedTasks);
      set({ tasks: updatedTasks, loading: false });

      // 从数据库删除任务
      try {
        const { tasksApi } = await import('@/lib/api/tasks');
        await tasksApi.updateTask(taskId, {
          status: 'cancelled',
        });
        console.log('[TaskStore][Info] 任务已标记为取消');
      } catch (error) {
        console.warn('[TaskStore][Warning] 同步取消状态失败:', error);
      }

      console.log('[TaskStore][Info] 取消监督成功，已退款并删除任务:', totalRefund);
    } catch (error) {
      console.error('[TaskStore][Error] 取消监督失败:', error);
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

      // 同步到数据库（关键！）
      try {
        const { tasksApi } = await import('@/lib/api/tasks');
        await tasksApi.updateTask(taskId, {
          evidence_image: evidenceImage,
          evidence_text: evidenceText,
          supervision_status: 'evidence_submitted',
          evidence_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        console.log('[TaskStore][Info] 证据已同步到数据库');
      } catch (error) {
        console.warn('[TaskStore][Warning] 同步证据到数据库失败:', error);
      }

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
      // 从数据库加载任务（监督者本地没有这个任务）
      const { tasksApi } = await import('@/lib/api/tasks');
      const task = await tasksApi.getTask(taskId);

      console.log('[TaskStore][Debug] 审核证据 - 权限检查:', {
        taskId,
        reviewerId,
        task_supervisor_id: task?.supervisor_id,
        task_user_id: task?.user_id,
        match: task?.supervisor_id === reviewerId,
      });

      if (!task) {
        throw new Error('任务不存在');
      }

      if (task.supervisor_id !== reviewerId) {
        throw new Error(`只有监督者可以审核。当前用户: ${reviewerId}, 监督者: ${task.supervisor_id}`);
      }

      if (task.supervision_status !== 'evidence_submitted') {
        throw new Error('任务状态不正确');
      }

      // 动态导入 coinStore
      const { useCoinStore } = await import('./coinStore');
      const coinStore = useCoinStore.getState();

      if (approved) {
        // 通过：任务完成，返还本金，监督者获得赏金
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
        await appStore.createShameLog(
          taskId,
          task.user_id,
          task.title,
          task.bet_amount,
          task.visibility || 'friends',
          task.supervisor_comment || undefined
        );

        console.log('[TaskStore][Info] 证据被拒，任务失败');
      }

      // 同步到数据库（关键！）
      try {
        await tasksApi.updateTask(taskId, {
          status: approved ? 'completed' : 'failed',
          supervision_status: approved ? 'approved' : 'rejected',
          updated_at: new Date().toISOString(),
        });
        console.log('[TaskStore][Info] 审核结果已同步到数据库');
      } catch (error) {
        console.warn('[TaskStore][Warning] 同步审核结果到数据库失败:', error);
      }

      // 检查成就
      const { useAchievementStore } = await import('./achievementStore');
      await useAchievementStore.getState().checkAndUnlockAchievements(task.user_id);
      await useAchievementStore.getState().checkAndUnlockAchievements(reviewerId);

      // 🔥 关键修复：刷新两个用户的 profile，确保界面显示最新余额
      const { useAppStore } = await import('./appStore');
      const appStore = useAppStore.getState();
      appStore.initProfile(task.user_id); // 刷新任务发起人的余额
      appStore.initProfile(reviewerId); // 刷新监督者的余额
      console.log('[TaskStore][Info] 已刷新两个用户的 profile 余额');

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
