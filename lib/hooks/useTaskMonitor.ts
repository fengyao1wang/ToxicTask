import { useEffect, useRef } from 'react';
import { Task } from '@/types';
import { taskApi, profileApi, shameLogApi } from '@/lib/supabase';
import { useAppStore } from '@/lib/stores/appStore';
import { generateRoast } from '@/lib/services/aiService';

/**
 * 任务倒计时监控 Hook
 * 自动检测任务是否超时，超时则标记为失败
 */
export function useTaskMonitor(tasks: Task[]) {
  const { profile, setProfile, setTasks } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tasksRef = useRef<Task[]>(tasks);
  const profileRef = useRef(profile);
  const processingRef = useRef<Set<string>>(new Set()); // 正在处理的任务 ID

  // 更新 refs
  useEffect(() => {
    tasksRef.current = tasks;
    profileRef.current = profile;
  }, [tasks, profile]);

  useEffect(() => {
    if (!profile) return;

    console.log('[TaskMonitor][Info] 启动任务监控');

    // 每秒检查一次任务状态
    intervalRef.current = setInterval(async () => {
      const currentTasks = tasksRef.current;
      const currentProfile = profileRef.current;

      if (!currentProfile || currentTasks.length === 0) return;

      const now = new Date().getTime();
      let hasChanges = false;

      console.log('[TaskMonitor][Debug] 检查任务，当前时间:', new Date(now).toLocaleString());

      for (const task of currentTasks) {
        if (task.status !== 'pending') continue;

        const deadline = new Date(task.deadline).getTime();
        const timeLeft = deadline - now;

        console.log('[TaskMonitor][Debug] 任务:', task.title, '剩余时间(秒):', Math.floor(timeLeft / 1000));

        // 任务超时且未在处理中
        if (now > deadline && !processingRef.current.has(task.id)) {
          console.log('[TaskMonitor][Info] 任务超时:', task.id, task.title);

          // 标记为处理中
          processingRef.current.add(task.id);

          try {
            // 立即更新本地状态，避免重复处理
            tasksRef.current = currentTasks.map(t =>
              t.id === task.id ? { ...t, status: 'failed' as const } : t
            );

            // 标记为失败
            const success = await taskApi.updateTaskStatus(task.id, 'failed');

            if (success) {
              // 生成 AI 毒舌评论
              const aiComment = await generateRoast({
                taskTitle: task.title,
                betAmount: task.bet_amount,
                deadline: task.deadline,
              });

              console.log('[TaskMonitor][Info] AI 评论:', aiComment);

              // 创建耻辱记录
              await shameLogApi.createShameLog({
                task_id: task.id,
                user_id: task.user_id,
                ai_comment: aiComment,
              });

              hasChanges = true;
            }
          } catch (error) {
            console.error('[TaskMonitor][Error] 处理超时任务失败:', error);
          } finally {
            // 处理完成后移除标记
            processingRef.current.delete(task.id);
          }
        }
      }

      // 如果有变化，重新加载任务列表
      if (hasChanges && currentProfile) {
        console.log('[TaskMonitor][Info] 重新加载任务列表');
        const updatedTasks = await taskApi.getUserTasks(currentProfile.id);
        setTasks(updatedTasks);
      }
    }, 1000);

    return () => {
      console.log('[TaskMonitor][Info] 停止任务监控');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [profile?.id]); // 只依赖 profile.id
}

/**
 * 完成任务并退还押金
 */
export async function completeTask(
  taskId: string,
  betAmount: number,
  userId: string,
  currentCoins: number
): Promise<boolean> {
  console.log('[TaskMonitor][Info] 开始完成任务:', taskId, '押金:', betAmount);

  try {
    // 更新任务状态
    const success = await taskApi.updateTaskStatus(taskId, 'completed');
    console.log('[TaskMonitor][Info] 更新任务状态结果:', success);

    if (success) {
      // 退还押金
      const newCoins = currentCoins + betAmount;
      const updateSuccess = await profileApi.updateDignityCoins(userId, newCoins);
      console.log('[TaskMonitor][Info] 更新尊严币结果:', updateSuccess, '新余额:', newCoins);

      if (updateSuccess) {
        console.log('[TaskMonitor][Info] 任务完成，押金已退还:', betAmount);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[TaskMonitor][Error] 完成任务失败:', error);
    return false;
  }
}
