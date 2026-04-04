import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { authApi } from '@/lib/supabase/auth';
import { profileApi } from '@/lib/supabase/api';
import './index.scss';

export default function Profile() {
  const { user, profile, setUser, setProfile } = useAppStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentProfile = await profileApi.getCurrentProfile();
      if (currentProfile) {
        setProfile(currentProfile);
      }
    } catch (error) {
      console.error('[Profile] Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          setLoading(true);
          try {
            await authApi.signOut();
            setUser(null);
            setProfile(null);

            Taro.showToast({
              title: '已退出登录',
              icon: 'success',
            });

            setTimeout(() => {
              Taro.redirectTo({ url: '/pages/auth/index' });
            }, 1000);
          } catch (error) {
            console.error('[Profile] Logout error:', error);
            Taro.showToast({
              title: '退出失败',
              icon: 'none',
            });
          } finally {
            setLoading(false);
          }
        }
      },
    });
  };

  return (
    <View className='profile-container'>
      <View className='profile-header'>
        <View className='avatar'>
          <Text className='avatar-text'>
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text className='username'>{profile?.username || '未知用户'}</Text>
      </View>

      <View className='coins-section'>
        <Text className='coins-label'>尊严币余额</Text>
        <Text className='coins-value'>{profile?.dignity_coins || 0}</Text>
        <Text className='coins-hint'>完成任务可获得押金返还</Text>
      </View>

      <View className='stats-section'>
        <View className='stat-card'>
          <Text className='stat-value'>0</Text>
          <Text className='stat-label'>已完成</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-value'>0</Text>
          <Text className='stat-label'>进行中</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-value'>0</Text>
          <Text className='stat-label'>已失败</Text>
        </View>
      </View>

      <View className='info-section'>
        <View className='info-item'>
          <Text className='info-label'>用户 ID</Text>
          <Text className='info-value'>{user?.id?.slice(0, 8) || '-'}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>注册时间</Text>
          <Text className='info-value'>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('zh-CN')
              : '-'}
          </Text>
        </View>
      </View>

      <Button
        className={`logout-button ${loading ? 'disabled' : ''}`}
        onClick={handleLogout}
        disabled={loading}
      >
        {loading ? '退出中...' : '退出登录'}
      </Button>
    </View>
  );
}
