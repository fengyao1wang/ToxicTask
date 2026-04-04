import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { useAchievementStore } from '@/lib/stores/achievementStore';
import { authApi } from '@/lib/auth';
import './index.scss';

export default function Index() {
  const { user, profile, setUser, initProfile, updateDignityCoins } = useAppStore();
  const { tasks, loading, fetchTasks, updateTaskStatus } = useTaskStore();
  const { checkAndUnlockAchievements } = useAchievementStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // 定时刷新 profile（确保余额最新）
  useEffect(() => {
    if (!user) return;

    const refreshProfile = () => {
      initProfile(user.id);
    };

    // 每5秒刷新一次 profile
    const profileTimer = setInterval(refreshProfile, 5000);

    return () => clearInterval(profileTimer);
  }, [user, initProfile]);

  // 定时检查过期任务
  useEffect(() => {
    if (!user) return;

    const checkExpiredTasks = async () => {
      const now = new Date().getTime();
      let hasChanges = false;

      for (const task of tasks) {
        if (task.status === 'pending') {
          const deadline = new Date(task.deadline).getTime();
          if (now > deadline) {
            // 任务过期，标记为失败
            await updateTaskStatus(task.id, 'failed');

            // 扣除尊严币
            const newCoins = Math.max(0, (profile?.dignity_coins || 0) - task.bet_amount);
            updateDignityCoins(user.id, newCoins);

            // 创建耻辱记录
            const shameLog = {
              id: `shame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              task_id: task.id,
              user_id: user.id,
              task_title: task.title,
              bet_amount: task.bet_amount,
              ai_comment: '任务超时未完成，真是令人失望！',
              created_at: new Date().toISOString(),
            };

            console.log('[Index] 创建耻辱记录:', shameLog);

            const shameLogs = Taro.getStorageSync('toxictask_shame_logs') || [];
            shameLogs.unshift(shameLog);
            Taro.setStorageSync('toxictask_shame_logs', shameLogs);

            console.log('[Index] 耻辱记录已保存，总数:', shameLogs.length);

            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        // 刷新任务列表
        await fetchTasks(user.id);
      }
    };

    // 立即检查一次
    checkExpiredTasks();

    // 每10秒检查一次
    const timer = setInterval(checkExpiredTasks, 10000);

    return () => clearInterval(timer);
  }, [user, tasks, profile]);

  const checkAuth = async () => {
    try {
      const session = await authApi.getSession();
      if (!session) {
        // 未登录，跳转到登录页
        Taro.redirectTo({ url: '/pages/auth/index' });
        return;
      }

      const currentUser = await authApi.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // 初始化 profile（本地存储）
        initProfile(currentUser.id);
        // 获取任务列表（本地存储）
        await fetchTasks(currentUser.id);
      }
    } catch (error) {
      console.error('[Index] Auth check error:', error);
      Taro.redirectTo({ url: '/pages/auth/index' });
    } finally {
      setChecking(false);
    }
  };

  const handleCreateTask = () => {
    Taro.navigateTo({ url: '/pages/tasks/create' });
  };

  const handleCompleteTask = async (taskId: string, betAmount: number) => {
    if (!user || !profile) return;

    Taro.showModal({
      title: '完成任务',
      content: '确认已完成此任务？将返还押金。',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 更新任务状态为已完成
            await updateTaskStatus(taskId, 'completed');

            // 返还押金
            const newCoins = (profile.dignity_coins || 0) + betAmount;
            updateDignityCoins(user.id, newCoins);

            // 创建交易记录
            const transaction = {
              id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: user.id,
              type: 'task_refund',
              amount: betAmount,
              balance_after: newCoins,
              source_id: taskId,
              description: '任务完成退款',
              created_at: new Date().toISOString(),
            };

            const allTransactions = Taro.getStorageSync('toxictask_transactions') || {};
            const userTransactions = allTransactions[user.id] || [];
            userTransactions.unshift(transaction);
            allTransactions[user.id] = userTransactions;
            Taro.setStorageSync('toxictask_transactions', allTransactions);

            Taro.showToast({
              title: `任务完成！+${betAmount} 币`,
              icon: 'success',
            });

            // 刷新任务列表
            await fetchTasks(user.id);

            // 检查并解锁成就
            await checkAndUnlockAchievements(user.id);

            // 重新加载 profile 以更新余额显示
            initProfile(user.id);
          } catch (error) {
            console.error('[Index] 完成任务失败:', error);
            Taro.showToast({
              title: '操作失败',
              icon: 'none',
            });
          }
        }
      },
    });
  };

  if (checking) {
    return (
      <View className='index-container'>
        <Text className='loading-text'>加载中...</Text>
      </View>
    );
  }

  return (
    <View className='index-container'>
      <View className='header'>
        <Text className='header-title'>打卡首页</Text>
        <Text className='header-subtitle'>尊严币: {profile?.dignity_coins || 0}</Text>
      </View>

      <View className='task-list'>
        {loading && <Text className='loading-text'>加载中...</Text>}

        {!loading && tasks.length === 0 && (
          <View className='empty-state'>
            <Text className='empty-text'>还没有任务</Text>
            <Text className='empty-hint'>点击下方按钮创建第一个任务</Text>
          </View>
        )}

        {!loading && tasks.map((task) => (
          <View key={task.id} className={`task-card task-${task.status}`}>
            <Text className='task-title'>{task.title}</Text>
            <View className='task-info'>
              <Text className='task-bet'>押注: {task.bet_amount} 币</Text>
              <Text className='task-status'>
                {task.status === 'pending' ? '进行中' :
                 task.status === 'completed' ? '已完成' : '已失败'}
              </Text>
            </View>
            <Text className='task-deadline'>
              截止: {new Date(task.deadline).toLocaleString('zh-CN')}
            </Text>
            {task.status === 'pending' && (
              <Button
                className='complete-task-button'
                size='mini'
                onClick={() => handleCompleteTask(task.id, task.bet_amount)}
              >
                完成任务
              </Button>
            )}
          </View>
        ))}
      </View>

      <Button className='create-button' onClick={handleCreateTask}>
        创建新任务
      </Button>
    </View>
  );
}
