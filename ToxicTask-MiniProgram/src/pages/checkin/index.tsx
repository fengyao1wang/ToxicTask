import { View, Text, Button } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { useCheckInStore } from '../../lib/stores/checkinStore';
import { useAppStore } from '../../lib/stores/appStore';
import './index.scss';

export default function CheckIn() {
  const { user } = useAppStore();
  const {
    isCheckedInToday,
    consecutiveDays,
    checkInRecords,
    loadCheckIns,
    performCheckIn,
  } = useCheckInStore();

  const [loading, setLoading] = useState(false);
  const [calendarDays, setCalendarDays] = useState<Array<{
    date: string;
    isCheckedIn: boolean;
    isToday: boolean;
  }>>([]);

  useEffect(() => {
    if (user) {
      console.log('[CheckIn] 加载签到数据, userId:', user.id);
      loadCheckIns(user.id);
    } else {
      console.log('[CheckIn] 用户未登录');
    }
  }, [user]);

  useEffect(() => {
    // 生成最近30天的日历数据
    generateCalendar();
  }, [checkInRecords]);

  const generateCalendar = () => {
    const days: Array<{
      date: string;
      isCheckedIn: boolean;
      isToday: boolean;
    }> = [];
    const today = new Date();
    const todayStr = formatDate(today);

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = formatDate(date);
      const isCheckedIn = checkInRecords.some((r) => r.check_in_date === dateStr);
      const isToday = dateStr === todayStr;

      days.push({
        date: dateStr,
        isCheckedIn,
        isToday,
      });
    }

    setCalendarDays(days);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCheckIn = async () => {
    console.log('[CheckIn] 点击签到按钮, user:', user, 'isCheckedInToday:', isCheckedInToday);

    if (!user) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    if (isCheckedInToday) {
      Taro.showToast({
        title: '今天已经签到过了',
        icon: 'none',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('[CheckIn] 开始执行签到, userId:', user.id);
      await performCheckIn(user.id);
      console.log('[CheckIn] 签到成功');
    } catch (error) {
      console.error('[CheckIn][Error] 签到失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="checkin-container">
      {/* 调试信息 */}
      {!user && (
        <View style={{ padding: '20px', background: '#ff4444', color: '#fff' }}>
          <Text>用户未登录，请返回首页</Text>
        </View>
      )}

      {/* 顶部卡片 */}
      <View className="checkin-header">
        <View className="checkin-title">每日签到</View>
        <View className="checkin-subtitle">每天签到可获得 5 尊严币</View>
      </View>

      {/* 连续签到天数 */}
      <View className="consecutive-card">
        <View className="consecutive-label">连续签到</View>
        <View className="consecutive-days">
          <Text className="consecutive-number">{consecutiveDays}</Text>
          <Text className="consecutive-unit">天</Text>
        </View>
        {consecutiveDays >= 7 && (
          <View className="consecutive-badge">🔥 坚持就是胜利</View>
        )}
      </View>

      {/* 签到按钮 */}
      <View className="checkin-button-wrapper">
        <Button
          className={`checkin-button ${isCheckedInToday ? 'checked-in' : ''}`}
          onClick={handleCheckIn}
          disabled={isCheckedInToday || loading}
        >
          {loading ? '签到中...' : isCheckedInToday ? '今日已签到 ✓' : '立即签到'}
        </Button>
      </View>

      {/* 签到日历 */}
      <View className="calendar-section">
        <View className="calendar-title">签到日历（最近30天）</View>
        <View className="calendar-grid">
          {calendarDays.map((day) => (
            <View
              key={day.date}
              className={`calendar-day ${day.isCheckedIn ? 'checked' : ''} ${
                day.isToday ? 'today' : ''
              }`}
            >
              <Text className="calendar-day-number">
                {new Date(day.date).getDate()}
              </Text>
              {day.isCheckedIn && <View className="calendar-check-mark">✓</View>}
            </View>
          ))}
        </View>
      </View>

      {/* 签到记录 */}
      <View className="history-section">
        <View className="history-title">签到记录</View>
        {checkInRecords.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-text">还没有签到记录</Text>
            <Text className="empty-hint">点击上方按钮开始签到吧</Text>
          </View>
        ) : (
          <View className="history-list">
            {checkInRecords.slice(0, 10).map((record) => (
              <View key={record.id} className="history-item">
                <View className="history-date">
                  {new Date(record.check_in_date).toLocaleDateString('zh-CN', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </View>
                <View className="history-coins">+{record.coins_earned} 币</View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
