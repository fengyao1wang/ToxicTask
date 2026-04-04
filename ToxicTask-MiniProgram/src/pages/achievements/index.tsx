import { View, Text, Button } from '@tarojs/components';
import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useAchievementStore } from '../../lib/stores/achievementStore';
import { useAppStore } from '../../lib/stores/appStore';
import './index.scss';

export default function Achievements() {
  const { user } = useAppStore();
  const {
    achievements,
    userAchievements,
    loadAchievements,
    getAchievementProgress,
    isAchievementUnlocked,
    isAchievementClaimed,
    claimAchievementReward,
  } = useAchievementStore();

  // 页面加载时加载成就
  useEffect(() => {
    if (user) {
      console.log('[Achievements] 页面加载，开始加载成就数据');
      loadAchievements(user.id);
    }
  }, [user]);

  // 页面显示时重新加载成就（确保数据最新）
  useEffect(() => {
    const handleRouterChange = (options) => {
      if (options.toLocation?.path?.includes('/pages/achievements/index') && user) {
        console.log('[Achievements] 页面显示，重新加载成就数据');
        loadAchievements(user.id);
      }
    };

    Taro.eventCenter.on('__taroRouterChange', handleRouterChange);

    return () => {
      Taro.eventCenter.off('__taroRouterChange', handleRouterChange);
    };
  }, [user, loadAchievements]);

  // 监听成就状态变化
  useEffect(() => {
    console.log('[Achievements] 成就状态更新:', {
      total: achievements.length,
      unlocked: userAchievements.length,
      userAchievements: userAchievements,
    });
  }, [achievements, userAchievements]);

  const unlockedAchievements = achievements.filter((a) =>
    isAchievementUnlocked(user?.id || '', a.id)
  );

  const lockedAchievements = achievements.filter(
    (a) => !isAchievementUnlocked(user?.id || '', a.id)
  );

  console.log('[Achievements] 渲染状态:', {
    unlockedCount: unlockedAchievements.length,
    lockedCount: lockedAchievements.length,
  });

  // 领取奖励
  const handleClaimReward = async (achievementId: string) => {
    if (!user) return;

    try {
      await claimAchievementReward(user.id, achievementId);
      // 重新加载成就数据
      loadAchievements(user.id);
    } catch (error) {
      console.error('[Achievements] 领取奖励失败:', error);
    }
  };

  return (
    <View className="achievements-container">
      {/* 顶部统计 */}
      <View className="achievements-header">
        <View className="achievements-title">成就系统</View>
        <View className="achievements-stats">
          <Text className="stats-unlocked">{unlockedAchievements.length}</Text>
          <Text className="stats-separator">/</Text>
          <Text className="stats-total">{achievements.length}</Text>
        </View>
        <View className="achievements-subtitle">已解锁成就</View>
      </View>

      {/* 已解锁成就 */}
      {unlockedAchievements.length > 0 && (
        <View className="achievements-section">
          <View className="section-title">🏆 已解锁</View>
          <View className="achievements-list">
            {unlockedAchievements.map((achievement) => {
              const userAchievement = userAchievements.find(
                (ua) => ua.achievement_id === achievement.id
              );
              const isClaimed = isAchievementClaimed(user?.id || '', achievement.id);

              return (
                <View key={achievement.id} className="achievement-card unlocked">
                  <View className="achievement-icon">{achievement.icon}</View>
                  <View className="achievement-content">
                    <View className="achievement-title">{achievement.title}</View>
                    <View className="achievement-description">
                      {achievement.description}
                    </View>
                    <View className="achievement-reward">
                      +{achievement.coins_reward} 尊严币
                    </View>
                    {userAchievement && (
                      <View className="achievement-date">
                        解锁于 {new Date(userAchievement.unlocked_at).toLocaleDateString(
                          'zh-CN'
                        )}
                      </View>
                    )}
                    {isClaimed && userAchievement?.claimed_at && (
                      <View className="achievement-claimed-date">
                        已领取于 {new Date(userAchievement.claimed_at).toLocaleDateString(
                          'zh-CN'
                        )}
                      </View>
                    )}
                  </View>
                  {isClaimed ? (
                    <View className="achievement-badge claimed">✓</View>
                  ) : (
                    <Button
                      className="claim-button"
                      size="mini"
                      onClick={() => handleClaimReward(achievement.id)}
                    >
                      领取
                    </Button>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 未解锁成就 */}
      {lockedAchievements.length > 0 && (
        <View className="achievements-section">
          <View className="section-title">🔒 未解锁</View>
          <View className="achievements-list">
            {lockedAchievements.map((achievement) => {
              const progress = getAchievementProgress(user?.id || '', achievement.id);
              return (
                <View key={achievement.id} className="achievement-card locked">
                  <View className="achievement-icon locked-icon">
                    {achievement.icon}
                  </View>
                  <View className="achievement-content">
                    <View className="achievement-title">{achievement.title}</View>
                    <View className="achievement-description">
                      {achievement.description}
                    </View>
                    <View className="achievement-reward">
                      +{achievement.coins_reward} 尊严币
                    </View>
                    {/* 进度条 */}
                    <View className="progress-bar">
                      <View
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </View>
                    <View className="progress-text">{Math.round(progress)}%</View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 空状态 */}
      {achievements.length === 0 && (
        <View className="empty-state">
          <Text className="empty-text">暂无成就</Text>
        </View>
      )}
    </View>
  );
}
