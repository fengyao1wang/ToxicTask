import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { useAchievementStore } from '@/lib/stores/achievementStore';
import { tasksApi } from '@/lib/api/tasks';
import { authApi } from '@/lib/auth';
import { ShameLog } from '@/types';
import './index.scss';

// 随机耻辱文案（使用任务ID作为种子，确保不同任务有不同文案）
const getRandomShameComment = (taskId: string): string => {
  const comments = [
    '只要我放弃得够快，失败就追不上我。',
    '气氛都烘托到这了，不失败一次确实很难收场。',
    '尊严币 -10，脸皮厚度 +100。这波啊，这波是不亏。',
    '事实证明，有些人的承诺就像易碎品，一碰就稀碎。',
    '咕咕咕？本世纪最大鸽王已诞生，路过的朋友请尽情嘲笑！',
  ];

  // 🔥 使用任务ID的哈希值作为种子，确保同一任务总是得到相同文案，不同任务得到不同文案
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = ((hash << 5) - hash) + taskId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % comments.length;
  return comments[index];
};

export default function Index() {
  const { user, profile, setUser, initProfile, updateDignityCoins } = useAppStore();
  const { tasks, loading, fetchTasks, updateTaskStatus, checkInTask, checkSupervisionTimeout } = useTaskStore();
  const { checkAndUnlockAchievements } = useAchievementStore();
  const [checking, setChecking] = useState(true);
  const [pendingReviewCount, setPendingReviewCount] = useState(0); // 待裁决任务数量

  useEffect(() => {
    checkAuth();
    // 记录用户活跃时间（用于"消失的爱人"成就检测）
    if (user) {
      const lastActiveKey = `last_active_${user.id}`;
      Taro.setStorageSync(lastActiveKey, Date.now());
    }
  }, []);

  // 加载待裁决任务数量
  const loadPendingReviewCount = async () => {
    if (!user) return;

    try {
      const supervisorTasks = await tasksApi.getTasksAsSupervisor(user.id);
      const pendingCount = supervisorTasks.filter(
        (task) => task.supervision_status === 'evidence_submitted'
      ).length;
      setPendingReviewCount(pendingCount);
      console.log('[Index] 待裁决任务数量:', pendingCount);
    } catch (error) {
      console.error('[Index] 加载待裁决任务失败:', error);
    }
  };

  // 页面显示时刷新待裁决数量
  useDidShow(() => {
    // 🔥 性能优化：只在从其他页面返回时刷新，避免首次加载重复请求
    if (user && !loading && !checking) {
      console.log('[Index] 页面显示，刷新数据');
      // 🔥 并行执行两个请求，减少等待时间
      Promise.all([
        loadPendingReviewCount(),
        fetchTasks(user.id)
      ]).catch(err => {
        console.error('[Index] 刷新数据失败:', err);
      });
    }
  });

  // 🔥 删除重复的初始加载：checkAuth 中已经调用了 fetchTasks
  // useEffect(() => {
  //   if (user) {
  //     loadPendingReviewCount();
  //   }
  // }, [user]);

  // 🔥 删除定时器：不再每 5 秒刷新 profile
  // 改为依赖用户操作（下拉刷新、切换页面）触发更新

  // 定时检查过期任务
  useEffect(() => {
    if (!user || !profile) return; // 确保 profile 已加载

    const checkExpiredTasks = async () => {
      // 🔥 关键修复：从 store 实时获取最新任务，而不是依赖 useEffect 的 tasks 依赖
      const currentTasks = useTaskStore.getState().tasks;

      console.log('[Index][Debug] 检查过期任务, 总任务数:', currentTasks.length);

      // 使用当前时间
      const currentTime = new Date().getTime();
      const today = new Date().toISOString().split('T')[0];
      let hasChanges = false;

      for (const task of currentTasks) {
        if (task.status === 'pending') {
          const deadline = new Date(task.deadline).getTime();

          console.log('[Index][Debug] 检查任务:', {
            id: task.id,
            title: task.title,
            deadline: task.deadline,
            currentTime: new Date(currentTime).toISOString(),
            isExpired: currentTime > deadline,
            task_type: task.task_type,
          });

          if (task.task_type === 'repeat' && task.check_ins) {
            // 重复任务：检查是否有未打卡的过期日期
            const hasMissedCheckIn = task.check_ins.some((checkIn) => {
              return checkIn.date < today && !checkIn.checked;
            });

            if (hasMissedCheckIn || currentTime > deadline) {
              console.log('[Index][Info] 重复任务过期，创建耻辱记录:', task.id);
              // 任务失败（押金已在创建时扣除，这里只标记失败状态）
              await updateTaskStatus(task.id, 'failed');

              // 创建耻辱记录
              const shameLog: ShameLog = {
                id: `shame_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                task_id: task.id,
                user_id: user.id,
                task_title: task.title,
                bet_amount: task.bet_amount,
                ai_comment: getRandomShameComment(task.id), // 🔥 传入任务ID作为种子
                created_at: new Date().toISOString(),
                visibility: task.visibility || 'friends',
                supervisor_comment: null,
              };

              console.log('[Index] 创建耻辱记录:', shameLog);

              const shameLogs = Taro.getStorageSync('toxictask_shame_logs') || [];
              shameLogs.unshift(shameLog);
              Taro.setStorageSync('toxictask_shame_logs', shameLogs);

              console.log('[Index] 耻辱记录已保存，总数:', shameLogs.length);

              hasChanges = true;
            }
          } else if (task.task_type === 'single' && currentTime > deadline) {
            console.log('[Index][Info] 单次任务过期，创建耻辱记录:', task.id);
            // 单次任务过期（押金已在创建时扣除，这里只标记失败状态）
            await updateTaskStatus(task.id, 'failed');

            // 创建耻辱记录
            const shameLog: ShameLog = {
              id: `shame_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              task_id: task.id,
              user_id: user.id,
              task_title: task.title,
              bet_amount: task.bet_amount,
              ai_comment: getRandomShameComment(task.id), // 🔥 传入任务ID作为种子
              created_at: new Date().toISOString(),
              visibility: task.visibility || 'friends',
              supervisor_comment: null,
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

      // 🔥 关键修复：不再调用 fetchTasks，避免无限循环
      // updateTaskStatus 已经更新了本地状态，不需要重新加载
    };

    // 检查监督超时
    const checkSupervisionTimeouts = async () => {
      if (!user) return;
      await checkSupervisionTimeout(user.id);
    };

    // 立即检查一次
    checkExpiredTasks();
    checkSupervisionTimeouts();

    // 每10秒检查一次
    const timer = setInterval(() => {
      checkExpiredTasks();
      checkSupervisionTimeouts();
    }, 10000);

    return () => clearInterval(timer);
  }, [user, profile]); // 🔥 移除 tasks 依赖，避免无限循环

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
        // 🔥 性能优化：并行执行初始化操作
        await Promise.all([
          // 初始化 profile（本地存储，快速）
          Promise.resolve(initProfile(currentUser.id)),
          // 🔥 首次加载跳过数据库同步，直接读取本地缓存（极速）
          fetchTasks(currentUser.id, true),
          // 加载待裁决任务数量（数据库请求）
          loadPendingReviewCount()
        ]);
        console.log('[Index] 初始化完成');

        // 🔥 后台异步同步监督任务状态（不阻塞界面显示）
        setTimeout(() => {
          fetchTasks(currentUser.id, false).catch(err => {
            console.warn('[Index] 后台同步任务失败:', err);
          });
        }, 500);
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

        // 返还押金 - 确保 profile 存在
        if (!profile || profile.dignity_coins === undefined) {
          console.error('[Index] Profile 未加载，无法返还押金');
          return;
        }
        const newCoins = profile.dignity_coins + betAmount;
        updateDignityCoins(user.id, newCoins);

        // 创建交易记录
        const transaction = {
          id: `trans_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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

    const today = new Date().toISOString().split('T')[0];

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

      {/* 待我裁决入口 - 常驻显示 */}
      <View
        className={`review-entry ${pendingReviewCount > 0 ? 'has-pending' : 'no-pending'}`}
        onClick={() => {
          console.log('[Index] 点击待我裁决入口，跳转到社交互动页');
          Taro.navigateTo({ url: '/pages/social/index' });
        }}
      >
        <View className='review-entry-content'>
          <Text className='review-entry-icon'>⚖️</Text>
          <View className='review-entry-text'>
            <Text className='review-entry-title'>待我裁决</Text>
            <Text className='review-entry-desc'>
              {pendingReviewCount > 0 ? '有好友提交了完成证据' : '暂无需要裁决的任务'}
            </Text>
          </View>
        </View>
        {pendingReviewCount > 0 && (
          <View className='review-badge'>
            <Text className='review-badge-text'>{pendingReviewCount}</Text>
          </View>
        )}
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
          const today = new Date().toISOString().split('T')[0];
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

              {/* 监督状态显示 */}
              {task.is_supervised && (
                <View className='supervision-info'>
                  <Text className='supervision-label'>🔍 好友监督</Text>
                  <Text className='supervision-status'>
                    {task.supervision_status === 'waiting_invite' && '等待邀请'}
                    {task.supervision_status === 'invited' && '已邀请'}
                    {task.supervision_status === 'evidence_submitted' && '待审核'}
                    {task.supervision_status === 'approved' && '已通过'}
                    {task.supervision_status === 'rejected' && '已拒绝'}
                  </Text>
                </View>
              )}

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
                    task.is_supervised ? (
                      // 开启监督的任务，跳转到详情页
                      <Button
                        className='complete-task-button supervised'
                        size='mini'
                        onClick={() => {
                          Taro.navigateTo({
                            url: `/pages/tasks/detail?taskId=${task.id}`,
                          });
                        }}
                      >
                        查看详情
                      </Button>
                    ) : (
                      // 普通任务，直接完成
                      <Button
                        className='complete-task-button'
                        size='mini'
                        onClick={() => handleCompleteTask(task.id, task.bet_amount)}
                      >
                        完成任务
                      </Button>
                    )
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
