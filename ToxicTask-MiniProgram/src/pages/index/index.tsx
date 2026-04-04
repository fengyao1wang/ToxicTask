import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { authApi } from '@/lib/supabase/auth';
import './index.scss';

export default function Index() {
  const { user, profile, setUser, setProfile } = useAppStore();
  const { tasks, loading, fetchTasks } = useTaskStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

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
        // 获取任务列表
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
          </View>
        ))}
      </View>

      <Button className='create-button' onClick={handleCreateTask}>
        创建新任务
      </Button>
    </View>
  );
}
