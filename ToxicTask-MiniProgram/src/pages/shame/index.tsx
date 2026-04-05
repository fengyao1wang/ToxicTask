import { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { ShameLog } from '@/types';
import { useAppStore } from '@/lib/stores/appStore';
import './index.scss';

type TabType = 'friends' | 'public';

export default function Shame() {
  const { getShameLogsByVisibility } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [shameLogs, setShameLogs] = useState<ShameLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShameLogs();
  }, [activeTab]);

  const fetchShameLogs = async () => {
    setLoading(true);
    try {
      // 根据当前Tab获取对应可见度的耻辱记录
      const logs = getShameLogsByVisibility(activeTab);
      console.log(`[Shame] 加载${activeTab === 'friends' ? '好友圈' : '全服'}耻辱记录，总数:`, logs.length);
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

      {/* Tab切换 */}
      <View className='tab-bar'>
        <View
          className={`tab-item ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <Text className='tab-text'>好友圈</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'public' ? 'active' : ''}`}
          onClick={() => setActiveTab('public')}
        >
          <Text className='tab-text'>全服围观</Text>
        </View>
      </View>

      {loading && <Text className='loading-text'>加载中...</Text>}

      {!loading && shameLogs.length === 0 && (
        <View className='empty-state'>
          <Text className='empty-text'>暂无耻辱记录</Text>
          <Text className='empty-hint'>
            {activeTab === 'friends' ? '好友们都很努力呢' : '还没有人公开失败记录'}
          </Text>
        </View>
      )}

      {!loading && shameLogs.map((log) => (
        <View key={log.id} className='shame-card'>
          <View className='shame-header'>
            <Text className='shame-task-title'>{log.task_title || '未知任务'}</Text>
            <Text className='shame-date'>
              {new Date(log.created_at).toLocaleDateString('zh-CN')}
            </Text>
          </View>
          <View className='shame-comment'>
            <Text className='comment-icon'>💀</Text>
            <Text className='comment-text'>{log.ai_comment}</Text>
          </View>
          {log.supervisor_comment && (
            <View className='supervisor-comment'>
              <Text className='supervisor-label'>监督者评论：</Text>
              <Text className='supervisor-text'>{log.supervisor_comment}</Text>
            </View>
          )}
          <Text className='shame-bet'>损失: {log.bet_amount} 尊严币</Text>
        </View>
      ))}
    </View>
  );
}
