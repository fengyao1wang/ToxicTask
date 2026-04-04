import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import { authApi, taskApi } from '@/lib/supabase';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface TaskStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  completionRate: number;
}

export default function ProfileScreen() {
  const { profile, setProfile, setUser, tasks } = useAppStore();
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    completionRate: 0,
  });

  useEffect(() => {
    if (profile) {
      loadStats();
    }
  }, [profile, tasks]);

  const loadStats = async () => {
    if (!profile) return;

    const userTasks = await taskApi.getUserTasks(profile.id);
    const completed = userTasks.filter(t => t.status === 'completed').length;
    const failed = userTasks.filter(t => t.status === 'failed').length;
    const pending = userTasks.filter(t => t.status === 'pending').length;
    const total = userTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({
      total,
      completed,
      failed,
      pending,
      completionRate,
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await authApi.signOut();
            setProfile(null);
            setUser(null);
            router.replace('/auth');
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>未找到用户信息</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{profile.username}</Text>
      </View>

      {/* 尊严币余额 */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceCard}>
          <FontAwesome name="coins" size={32} color="#00ff88" />
          <Text style={styles.balanceValue}>{profile.dignity_coins}</Text>
          <Text style={styles.balanceLabel}>尊严币余额</Text>
        </View>
      </View>

      {/* 统计数据 */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 数据统计</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>总任务</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={[styles.statValue, styles.successText]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>已完成</Text>
          </View>
          <View style={[styles.statCard, styles.failCard]}>
            <Text style={[styles.statValue, styles.failText]}>{stats.failed}</Text>
            <Text style={styles.statLabel}>已失败</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>完成率</Text>
          </View>
        </View>
      </View>

      {/* 成就徽章 */}
      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>🏆 成就徽章</Text>
        <View style={styles.achievementsGrid}>
          {stats.completed >= 1 && (
            <View style={styles.achievementBadge}>
              <FontAwesome name="check-circle" size={32} color="#00ff88" />
              <Text style={styles.achievementText}>首次完成</Text>
            </View>
          )}
          {stats.completed >= 5 && (
            <View style={styles.achievementBadge}>
              <FontAwesome name="star" size={32} color="#ffd700" />
              <Text style={styles.achievementText}>连续完成 5 次</Text>
            </View>
          )}
          {stats.failed >= 3 && (
            <View style={styles.achievementBadge}>
              <FontAwesome name="fire" size={32} color="#ff0055" />
              <Text style={styles.achievementText}>拖延大师</Text>
            </View>
          )}
          {stats.completionRate >= 80 && stats.total >= 10 && (
            <View style={styles.achievementBadge}>
              <FontAwesome name="trophy" size={32} color="#ffd700" />
              <Text style={styles.achievementText}>执行力王者</Text>
            </View>
          )}
        </View>
      </View>

      {/* 账户信息 */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>账户信息</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>用户名</Text>
          <Text style={styles.infoValue}>{profile.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>注册时间</Text>
          <Text style={styles.infoValue}>
            {new Date(profile.created_at).toLocaleDateString('zh-CN')}
          </Text>
        </View>
      </View>

      {/* 退出登录 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={18} color="#ff0055" />
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff0055',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceSection: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#00ff88',
    marginVertical: 10,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  successCard: {
    borderColor: '#00ff88',
  },
  failCard: {
    borderColor: '#ff0055',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  successText: {
    color: '#00ff88',
  },
  failText: {
    color: '#ff0055',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  achievementsSection: {
    padding: 20,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  achievementBadge: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    minWidth: 100,
  },
  achievementText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    margin: 20,
    marginBottom: 40,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
  },
  logoutText: {
    color: '#ff0055',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});
