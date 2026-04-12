import { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { authApi } from '@/lib/auth';
import { useAppStore } from '@/lib/stores/appStore';
import './index.scss';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setUser, initProfile } = useAppStore();

  // 微信授权登录
  const handleWechatLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const loginRes = await Taro.login();
      const code = loginRes.code;

      if (!code) {
        throw new Error('获取微信登录凭证失败，请重试');
      }

      let nickName = '微信用户';
      let avatarUrl = '';

      try {
        const userInfoRes = await Taro.getUserProfile({
          desc: '用于完善用户资料',
        });
        nickName = userInfoRes.userInfo.nickName;
        avatarUrl = userInfoRes.userInfo.avatarUrl;
      } catch (profileError) {
        console.warn('[Auth][Warn] 获取微信资料失败，使用默认资料:', profileError);
      }

      const user = await authApi.signInWithWechat(code, nickName, avatarUrl);
      setUser(user);
      initProfile(user.id);

      Taro.showToast({
        title: '登录成功',
        icon: 'success',
      });

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (err: any) {
      console.error('[Auth] 微信登录失败:', err);
      setError(err?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='auth-container'>
      <Text className='auth-title'>今天又鸽了</Text>
      <Text className='auth-subtitle'>Flaked Again</Text>

      <View className='auth-form'>
        <View className='wechat-login-section'>
          <Text className='login-hint'>使用微信账号登录</Text>

          <View
            className={`wechat-login-button ${loading ? 'disabled' : ''}`}
            onClick={handleWechatLogin}
          >
            {loading ? '登录中...' : '微信授权登录'}
          </View>

          {error && <Text className='error-message'>{error}</Text>}
        </View>

        <View className='login-tips'>
          <Text className='tip-text'>• 首次登录将自动创建账号</Text>
          <Text className='tip-text'>• 初始尊严币：100</Text>
          <Text className='tip-text'>• 任务失败将扣除押注的尊严币</Text>
        </View>
      </View>
    </View>
  );
}
