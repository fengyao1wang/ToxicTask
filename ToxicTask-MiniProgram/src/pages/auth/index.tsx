import { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { authApi } from '@/lib/supabase/auth';
import { useAppStore } from '@/lib/stores/appStore';
import './index.scss';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setUser, setProfile } = useAppStore();

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !username)) {
      setError('请填写所有字段');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // 登录
        const { user, profile } = await authApi.signIn(email, password);
        setUser(user);
        setProfile(profile);

        Taro.showToast({
          title: '登录成功',
          icon: 'success',
        });

        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' });
        }, 1000);
      } else {
        // 注册
        const { user, profile } = await authApi.signUp(email, password, username);
        setUser(user);
        setProfile(profile);

        Taro.showToast({
          title: '注册成功',
          icon: 'success',
        });

        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' });
        }, 1000);
      }
    } catch (err: any) {
      console.error('[Auth] Error:', err);
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='auth-container'>
      <Text className='auth-title'>ToxicTask</Text>
      <Text className='auth-subtitle'>毒舌待办 - 用损失厌恶克服拖延症</Text>

      <View className='auth-form'>
        {!isLogin && (
          <View className='form-group'>
            <Text className='form-label'>用户名</Text>
            <Input
              className='form-input'
              type='text'
              placeholder='请输入用户名'
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
            />
          </View>
        )}

        <View className='form-group'>
          <Text className='form-label'>邮箱</Text>
          <Input
            className='form-input'
            type='text'
            placeholder='请输入邮箱'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>

        <View className='form-group'>
          <Text className='form-label'>密码</Text>
          <Input
            className='form-input'
            type='password'
            placeholder='请输入密码'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        {error && <Text className='error-message'>{error}</Text>}

        <Button
          className={`submit-button ${loading ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </Button>

        <View className='switch-mode'>
          <Text>{isLogin ? '没有账号？' : '已有账号？'}</Text>
          <Text className='switch-link' onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '去注册' : '去登录'}
          </Text>
        </View>
      </View>
    </View>
  );
}
