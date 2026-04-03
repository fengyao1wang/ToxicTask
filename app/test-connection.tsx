import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { testSupabaseConnection } from '@/lib/supabase';

export default function TestConnection() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult('Testing...');

    try {
      const success = await testSupabaseConnection();
      setResult(success ? '✅ 连接成功！' : '❌ 连接失败');
    } catch (error: any) {
      setResult(`❌ 错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase 连接测试</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleTest}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '测试中...' : '测试连接'}
        </Text>
      </TouchableOpacity>

      {result ? (
        <Text style={styles.result}>{result}</Text>
      ) : null}

      <Text style={styles.hint}>
        提示：如果连接失败，请确保：{'\n'}
        1. 已在 Supabase Dashboard 执行 SQL 脚本{'\n'}
        2. .env 文件配置正确{'\n'}
        3. 重启了 Expo 开发服务器
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff0055',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
