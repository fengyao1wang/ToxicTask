import { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { authApi } from '@/lib/auth';
import { useAppStore } from '@/lib/stores/appStore';
import './index.scss';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setUser, setProfile } = useAppStore();

  // 微信授权登录
  const handleWechatLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. 获取微信用户信息
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善用户资料',
      });

      const { nickName, avatarUrl } = userInfoRes.userInfo;

      // 2. 获取微信登录凭证
      const loginRes = await Taro.login();
      const code = loginRes.code;

      // 3. 使用微信 openid 作为唯一标识登录
      // 这里简化处理：使用 code 作为临时用户标识
      const mockUser = {
        id: `wx_${code.substring(0, 10)}`,
        email: `${code.substring(0, 10)}@wechat.user`,
        user_metadata: {
          nickname: nickName,
          avatar_url: avatarUrl,
        },
      };

      // 保存用户信息到本地
      const sessionData = {
        user: mockUser,
        access_token: `mock_token_${code}`,
      };

      Taro.setStorageSync('supabase_token', sessionData);
      setUser(mockUser);

      Taro.showToast({
        title: '登录成功',
        icon: 'success',
      });

      // 跳转到首页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (err: any) {
      console.error('[Auth] 微信登录失败:', err);
      if (err.errMsg && err.errMsg.includes('getUserProfile:fail auth deny')) {
        setError('您拒绝了授权，无法登录');
      } else {
        setError('登录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='auth-container'>
      <Text className='auth-title'>ToxicTask</Text>
      <Text className='auth-subtitle'>毒舌待办 - 用损失厌恶克服拖延症</Text>

      <View className='auth-form'>
        <View className='wechat-login-section'>
          <Text className='login-hint'>使用微信账号登录</Text>

          <Button
            className={`wechat-login-button ${loading ? 'disabled' : ''}`}
            onClick={handleWechatLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '微信授权登录'}
          </Button>

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
