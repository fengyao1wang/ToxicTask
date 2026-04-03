import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { authApi } from '@/lib/supabase';
import { useAppStore } from '@/lib/stores/appStore';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const setProfile = useAppStore((state) => state.setProfile);

  const handleAuth = async () => {
    console.log('handleAuth called', { isLogin, email, password, username });

    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      Alert.alert('错误', '请填写邮箱和密码');
      return;
    }

    if (!isLogin && !username) {
      console.log('Validation failed: missing username');
      Alert.alert('错误', '请填写用户名');
      return;
    }

    setLoading(true);
    console.log('Starting auth process...');

    try {
      if (isLogin) {
        console.log('Attempting login...');
        // 登录
        const { user, profile } = await authApi.signIn(email, password);
        console.log('Login successful', { user, profile });
        setProfile(profile);
        Alert.alert('成功', '登录成功！');
        router.replace('/(tabs)');
      } else {
        console.log('Attempting signup...');
        // 注册
        const { user, profile } = await authApi.signUp(email, password, username);
        console.log('Signup successful', { user, profile });
        setProfile(profile);
        Alert.alert('成功', '注册成功！');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('错误', error.message || '操作失败');
    } finally {
      setLoading(false);
      console.log('Auth process completed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ToxicTask</Text>
      <Text style={styles.subtitle}>毒舌待办 · 反内耗神器</Text>

      <View style={styles.form}>
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="用户名"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="邮箱"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="密码"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff0055',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#ff0055',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
});
