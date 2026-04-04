import { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { shameLogApi } from '@/lib/supabase/api';
import { ShameLog } from '@/types';
import './index.scss';

export default function Shame() {
  const [shameLogs, setShameLogs] = useState<ShameLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShameLogs();
  }, []);

  const fetchShameLogs = async () => {
    setLoading(true);
    try {
      const logs = await shameLogApi.getAllShameLogs();
      setShameLogs(logs);
    } catch (error) {
      console.error('[Shame] Error fetching logs:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='shame-container'>
      <View className='header'>
        <Text className='header-title'>耻辱墙</Text>
        <Text className='header-subtitle'>失败者的公开处刑</Text>
      </View>

      {loading && <Text className='loading-text'>加载中...</Text>}

      {!loading && shameLogs.length === 0 && (
        <View className='empty-state'>
          <Text className='empty-text'>暂无耻辱记录</Text>
          <Text className='empty-hint'>看来大家都很努力呢</Text>
        </View>
      )}

      {!loading && shameLogs.map((log) => (
        <View key={log.id} className='shame-card'>
          <View className='shame-header'>
            <Text className='shame-task-title'>{log.task?.title || '未知任务'}</Text>
            <Text className='shame-date'>
              {new Date(log.created_at).toLocaleDateString('zh-CN')}
            </Text>
          </View>
          <View className='shame-comment'>
            <Text className='comment-icon'>💀</Text>
            <Text className='comment-text'>{log.ai_comment}</Text>
          </View>
          {log.task && (
            <Text className='shame-bet'>损失: {log.task.bet_amount} 尊严币</Text>
          )}
        </View>
      ))}
    </View>
  );
}
