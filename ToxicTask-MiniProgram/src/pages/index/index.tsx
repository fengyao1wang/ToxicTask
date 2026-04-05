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
  const { tasks, loading, fetchTasks, updateTaskStatus, checkInTask } = useTaskStore();
  const { checkAndUnlockAchievements } = useAchievementStore();
  const [checking, setChecking] = useState(true);
  const [debugDate, setDebugDate] = useState<string | null>(null); // 调试用的模拟日期

  useEffect(() => {
    checkAuth();
    // 记录用户活跃时间（用于"消失的爱人"成就检测）
    if (user) {
      const lastActiveKey = `last_active_${user.id}`;
      Taro.setStorageSync(lastActiveKey, Date.now());
    }
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
      // 使用调试日期或当前时间
      const currentTime = debugDate
        ? new Date(debugDate + 'T23:59:59').getTime()
        : new Date().getTime();
      const today = debugDate || new Date().toISOString().split('T')[0];
      let hasChanges = false;

      for (const task of tasks) {
        if (task.status === 'pending') {
          const deadline = new Date(task.deadline).getTime();

          if (task.task_type === 'repeat' && task.check_ins) {
            // 重复任务：检查是否有未打卡的过期日期
            const hasMissedCheckIn = task.check_ins.some((checkIn) => {
              return checkIn.date < today && !checkIn.checked;
            });

            if (hasMissedCheckIn || currentTime > deadline) {
              // 任务失败
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
                ai_comment: '重复任务未能坚持打卡，意志力太薄弱了！',
                created_at: new Date().toISOString(),
              };

              console.log('[Index] 创建耻辱记录:', shameLog);

              const shameLogs = Taro.getStorageSync('toxictask_shame_logs') || [];
              shameLogs.unshift(shameLog);
              Taro.setStorageSync('toxictask_shame_logs', shameLogs);

              console.log('[Index] 耻辱记录已保存，总数:', shameLogs.length);

              hasChanges = true;
            }
          } else if (task.task_type === 'single' && currentTime > deadline) {
            // 单次任务过期
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

      // 如果有任务状态变化，触发成就检测
      if (hasChanges) {
        await checkAndUnlockAchievements(user.id);
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
  }, [user, tasks, profile, debugDate]);

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

  const handleCompleteTask = async (taskId: string, betAmount: number, skipConfirm = false) => {
    if (!user || !profile) return;

    const completeTask = async () => {
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
    };

    if (skipConfirm) {
      // 重复任务自动完成，不需要确认
      await completeTask();
    } else {
      // 单次任务需要用户确认
      Taro.showModal({
        title: '完成任务',
        content: '确认已完成此任务？将返还押金。',
        success: async (res) => {
          if (res.confirm) {
            await completeTask();
          }
        },
      });
    }
  };

  const handleCheckIn = async (taskId: string) => {
    if (!user) return;

    const today = debugDate || new Date().toISOString().split('T')[0];

    try {
      await checkInTask(taskId, today);

      Taro.showToast({
        title: '打卡成功！',
        icon: 'success',
      });

      // 刷新任务列表
      await fetchTasks(user.id);

      // 检查并解锁成就
      await checkAndUnlockAchievements(user.id);

      // 检查任务是否全部完成
      const updatedTasks = await new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve(useTaskStore.getState().tasks);
        }, 100);
      });

      const task = updatedTasks.find((t) => t.id === taskId);
      if (task && task.check_ins) {
        const allChecked = task.check_ins.every((checkIn) => checkIn.checked);
        if (allChecked) {
          // 所有打卡完成，任务自动完成（不需要确认）
          setTimeout(() => {
            handleCompleteTask(taskId, task.bet_amount, true);
          }, 500);
        }
      }
    } catch (error) {
      console.error('[Index] 打卡失败:', error);
      Taro.showToast({
        title: '打卡失败',
        icon: 'none',
      });
    }
  };

  // 调试功能：推进一天
  const handleDebugNextDay = () => {
    const currentDate = debugDate ? new Date(debugDate) : new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = currentDate.toISOString().split('T')[0];
    setDebugDate(newDate);

    Taro.showToast({
      title: `时间推进到 ${newDate}`,
      icon: 'none',
    });
  };

  // 调试功能：重置日期
  const handleDebugResetDate = () => {
    setDebugDate(null);
    Taro.showToast({
      title: '已重置为真实日期',
      icon: 'success',
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

      {/* 调试工具 */}
      <View className='debug-panel'>
        <Text className='debug-title'>
          🛠️ 测试工具 - 当前日期: {debugDate || new Date().toISOString().split('T')[0]}
        </Text>
        <View className='debug-buttons'>
          <Button className='debug-button' size='mini' onClick={handleDebugNextDay}>
            推进一天 ⏭️
          </Button>
          <Button className='debug-button reset' size='mini' onClick={handleDebugResetDate}>
            重置日期 🔄
          </Button>
        </View>
      </View>

      <View className='task-list'>
        {loading && <Text className='loading-text'>加载中...</Text>}

        {!loading && tasks.length === 0 && (
          <View className='empty-state'>
            <Text className='empty-text'>还没有任务</Text>
            <Text className='empty-hint'>点击下方按钮创建第一个任务</Text>
          </View>
        )}

        {!loading && tasks.map((task) => {
          const today = debugDate || new Date().toISOString().split('T')[0];
          const todayCheckIn = task.check_ins?.find((c) => c.date === today);
          const canCheckInToday = task.task_type === 'repeat' && todayCheckIn && !todayCheckIn.checked;

          return (
            <View key={task.id} className={`task-card task-${task.status}`}>
              <View className='task-header'>
                <Text className='task-title'>{task.title}</Text>
                <Text className='task-type-badge'>
                  {task.task_type === 'single' ? '单次' : '重复'}
                </Text>
              </View>
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

              {/* 重复任务显示打卡进度 */}
              {task.task_type === 'repeat' && task.check_ins && (
                <View className='check-in-progress'>
                  <View className='check-in-dots'>
                    {task.check_ins.map((checkIn, index) => (
                      <View
                        key={index}
                        className={`check-dot ${checkIn.checked ? 'checked' : ''} ${
                          checkIn.date === today ? 'today' : ''
                        }`}
                      >
                        <Text className='dot-text'>{index + 1}</Text>
                      </View>
                    ))}
                  </View>
                  <Text className='progress-text'>
                    已打卡 {task.check_ins.filter((c) => c.checked).length}/{task.check_ins.length} 天
                  </Text>
                </View>
              )}

              {task.status === 'pending' && (
                <>
                  {task.task_type === 'single' ? (
                    <Button
                      className='complete-task-button'
                      size='mini'
                      onClick={() => handleCompleteTask(task.id, task.bet_amount)}
                    >
                      完成任务
                    </Button>
                  ) : canCheckInToday ? (
                    <Button
                      className='checkin-button'
                      size='mini'
                      onClick={() => handleCheckIn(task.id)}
                    >
                      今日打卡
                    </Button>
                  ) : todayCheckIn?.checked ? (
                    <View className='checked-badge'>
                      <Text className='checked-text'>✓ 今日已打卡</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          );
        })}
      </View>

      <Button className='create-button' onClick={handleCreateTask}>
        创建新任务
      </Button>
    </View>
  );
}
