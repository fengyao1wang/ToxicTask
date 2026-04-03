import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { shameLogApi } from '@/lib/supabase';
import { ShameLog } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ShameWallScreen() {
  const [shameLogs, setShameLogs] = useState<ShameLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShameLogs();
  }, []);

  // 页面获得焦点时自动刷新
  useFocusEffect(
    useCallback(() => {
      console.log('[ShameWall][Info] 页面获得焦点，刷新数据');
      loadShameLogs();
    }, [])
  );

  const loadShameLogs = async () => {
    console.log('[ShameWall][Info] 开始加载耻辱记录');
    setLoading(true);
    const logs = await shameLogApi.getAllShameLogs();
    console.log('[ShameWall][Info] 加载到', logs.length, '条记录');
    setShameLogs(logs);
    setLoading(false);
  };

  const renderShameItem = ({ item }: { item: ShameLog }) => (
    <View style={styles.shameCard}>
      <View style={styles.shameHeader}>
        <Text style={styles.taskTitle}>{item.task?.title || '未知任务'}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleDateString('zh-CN')}
        </Text>
      </View>
      <Text style={styles.aiComment}>{item.ai_comment}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff0055" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔥 耻辱墙</Text>
          <Text style={styles.subtitle}>失败者的公开处刑</Text>
        </View>
        <TouchableOpacity onPress={loadShameLogs} style={styles.refreshButton}>
          <FontAwesome name="refresh" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {shameLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无耻辱记录</Text>
          <Text style={styles.emptyHint}>完成任务，避免上墙！</Text>
        </View>
      ) : (
        <FlatList
          data={shameLogs}
          renderItem={renderShameItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  refreshButton: {
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff0055',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 15,
  },
  shameCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  shameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  aiComment: {
    fontSize: 14,
    color: '#ff0055',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptyHint: {
    fontSize: 14,
    color: '#444',
  },
});
