import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppStore } from '@/lib/stores/appStore';
import { authApi } from '@/lib/supabase';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { profile, setProfile } = useAppStore();

  const handleLogout = async () => {
    Alert.alert(
      '确认登出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await authApi.signOut();
            setProfile(null);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{profile.username}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.dignity_coins}</Text>
          <Text style={styles.statLabel}>尊严币</Text>
        </View>
      </View>

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

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
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
  statsContainer: {
    padding: 20,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
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
    margin: 20,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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
