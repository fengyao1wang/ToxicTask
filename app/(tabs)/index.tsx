import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import { taskApi, profileApi } from '@/lib/supabase';
import { Task } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTaskMonitor, completeTask } from '@/lib/hooks/useTaskMonitor';

export default function HomeScreen() {
  const { profile, tasks, setTasks, setProfile } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // 表单状态
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [betAmount, setBetAmount] = useState(10);

  useEffect(() => {
    if (profile) {
      loadTasks();
    }
  }, [profile]);

  // 启动任务监控
  useTaskMonitor(tasks);

  const loadTasks = async () => {
    if (!profile) return;
    setLoading(true);
    const userTasks = await taskApi.getUserTasks(profile.id);
    setTasks(userTasks);
    setLoading(false);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入任务名称');
      return;
    }

    if (!profile) {
      Alert.alert('错误', '请先登录');
      return;
    }

    const totalMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0');
    if (totalMinutes <= 0) {
      Alert.alert('错误', '请设置有效的倒计时');
      return;
    }

    if (betAmount > profile.dignity_coins) {
      Alert.alert('错误', '尊严币不足');
      return;
    }

    setCreating(true);
    try {
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + totalMinutes);

      const newTask = await taskApi.createTask({
        user_id: profile.id,
        title: title.trim(),
        bet_amount: betAmount,
        status: 'pending',
        deadline: deadline.toISOString(),
      });

      if (newTask) {
        // 扣除押金
        const success = await profileApi.updateDignityCoins(
          profile.id,
          profile.dignity_coins - betAmount
        );

        if (success) {
          setProfile({ ...profile, dignity_coins: profile.dignity_coins - betAmount });
        }

        // 重新加载任务列表
        await loadTasks();

        // 重置表单
        setTitle('');
        setHours('1');
        setMinutes('0');
        setBetAmount(10);
        setShowCreateModal(false);

        Alert.alert('成功', '任务创建成功！');
      }
    } catch (error) {
      console.error('[HomeScreen][Error] 创建任务失败:', error);
      Alert.alert('错误', '创建任务失败');
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    console.log('[HomeScreen][Info] 点击完成任务:', task.id, task.title);

    if (!profile) {
      console.error('[HomeScreen][Error] profile 不存在');
      Alert.alert('错误', '用户信息不存在');
      return;
    }

    Alert.alert(
      '完成任务',
      `确认完成任务「${task.title}」吗？\n将退还 ${task.bet_amount} 尊严币`,
      [
        { text: '取消', style: 'cancel', onPress: () => {
          console.log('[HomeScreen][Info] 用户取消完成任务');
        }},
        {
          text: '确认',
          onPress: async () => {
            console.log('[HomeScreen][Info] 用户确认完成任务');

            const success = await completeTask(
      task.id,
      task.bet_amount,
      profile.id,
      profile.dignity_coins
    );

    console.log('[HomeScreen][Info] 完成任务结果:', success);

    if (success) {
      // 更新本地 profile
      setProfile({
        ...profile,
        dignity_coins: profile.dignity_coins + task.bet_amount,
      });

      // 重新加载任务列表
      await loadTasks();

      Alert.alert('成功', '任务完成！押金已退还');
    } else {
      Alert.alert('错误', '完成任务失败');
    }
          },
        },
      ]
    );
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

        {item.status === 'pending' && !isOverdue && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteTask(item)}
          >
            <FontAwesome name="check" size={16} color="#fff" />
            <Text style={styles.completeButtonText}>完成任务</Text>
          </TouchableOpacity>
        )}
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 创建任务模态框 */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>创建新任务</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <FontAwesome name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* 任务名称 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>任务名称</Text>
              <TextInput
                style={styles.input}
                placeholder="输入任务名称..."
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
            </View>

            {/* 倒计时 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>倒计时</Text>
              <View style={styles.timeInputRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="小时"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  value={hours}
                  onChangeText={setHours}
                  maxLength={2}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="分钟"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  value={minutes}
                  onChangeText={setMinutes}
                  maxLength={2}
                />
              </View>
            </View>

            {/* 押注金额 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                押注金额: {betAmount} 尊严币
              </Text>
              <View style={styles.sliderRow}>
                <TouchableOpacity
                  onPress={() => setBetAmount(Math.max(1, betAmount - 1))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>

                <View style={styles.sliderTrack}>
                  <View
                    style={[styles.sliderFill, { width: `${(betAmount / 50) * 100}%` }]}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => setBetAmount(Math.min(50, betAmount + 1))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 创建按钮 */}
            <TouchableOpacity
              onPress={handleCreateTask}
              disabled={creating}
              style={[styles.createButton, creating && styles.createButtonDisabled]}
            >
              <Text style={styles.createButtonText}>
                {creating ? '创建中...' : '创建任务'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a0a',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInput: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sliderButton: {
    backgroundColor: '#0a0a0a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sliderButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#ff0055',
    borderRadius: 4,
  },
  createButton: {
    backgroundColor: '#ff0055',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#666',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
