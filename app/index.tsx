import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ToxicTask</Text>
      <Text style={styles.subtitle}>毒舌待办 · 反内耗神器</Text>

      <Link href="/auth" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>开始使用</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/test-connection" asChild>
        <TouchableOpacity style={styles.testButton}>
          <Text style={styles.testButtonText}>测试连接</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff0055',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#ff0055',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
