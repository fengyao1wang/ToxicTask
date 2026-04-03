import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import { taskApi } from '@/lib/supabase';
import { Task } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function HomeScreen() {
  const { profile, tasks, setTasks } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadTasks();
    }
  }, [profile]);

  const loadTasks = async () => {
    if (!profile) return;
    setLoading(true);
    const userTasks = await taskApi.getUserTasks(profile.id);
    setTasks(userTasks);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00ff88';
      case 'failed':
        return '#ff0055';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'failed':
        return '已失败';
      default:
        return '进行中';
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const deadline = new Date(item.deadline);
    const now = new Date();
    const isOverdue = deadline < now && item.status === 'pending';

    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.taskInfo}>
          <View style={styles.infoRow}>
            <FontAwesome name="coins" size={14} color="#00ff88" />
            <Text style={styles.infoText}>{item.bet_amount} 尊严币</Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="clock-o" size={14} color={isOverdue ? '#ff0055' : '#666'} />
            <Text style={[styles.infoText, isOverdue && styles.overdueText]}>
              {deadline.toLocaleString('zh-CN')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
          <Text style={styles.greeting}>你好，{profile?.username}</Text>
          <Text style={styles.subtitle}>尊严币余额: {profile?.dignity_coins}</Text>
        </View>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="check-square-o" size={64} color="#2a2a2a" />
          <Text style={styles.emptyText}>暂无任务</Text>
          <Text style={styles.emptyHint}>点击下方按钮创建你的第一个任务</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#00ff88',
    marginTop: 5,
  },
  listContent: {
    padding: 15,
  },
  taskCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  taskInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  overdueText: {
    color: '#ff0055',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  emptyHint: {
    fontSize: 14,
    color: '#444',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff0055',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#ff0055',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
