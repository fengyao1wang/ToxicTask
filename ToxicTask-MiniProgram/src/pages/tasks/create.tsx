import { useState } from 'react';
import { View, Text, Input, Button, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import './create.scss';

export default function CreateTask() {
  const { user } = useAppStore();
  const { createTask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);

  const betOptions = [5, 10, 20, 30, 50, 100];
  const hourOptions = [1, 2, 3, 6, 12, 24, 48, 72];

  const handleCreate = async () => {
    if (!title.trim()) {
      Taro.showToast({
        title: '请输入任务标题',
        icon: 'none',
      });
      return;
    }

    if (!user) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    setLoading(true);

    try {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + hours);

      const newTask = await createTask({
        user_id: user.id,
        title: title.trim(),
        bet_amount: betAmount,
        status: 'pending',
        deadline: deadline.toISOString(),
      });

      if (newTask) {
        Taro.showToast({
          title: '任务创建成功',
          icon: 'success',
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 1000);
      } else {
        throw new Error('创建失败');
      }
    } catch (error) {
      console.error('[CreateTask] Error:', error);
      Taro.showToast({
        title: '创建失败，请重试',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='create-container'>
      <View className='form-section'>
        <Text className='section-title'>任务标题</Text>
        <Input
          className='task-input'
          type='text'
          placeholder='输入你要完成的任务'
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
          maxlength={50}
        />
      </View>

      <View className='form-section'>
        <Text className='section-title'>押注金额（尊严币）</Text>
        <View className='bet-options'>
          {betOptions.map((amount) => (
            <View
              key={amount}
              className={`bet-option ${betAmount === amount ? 'active' : ''}`}
              onClick={() => setBetAmount(amount)}
            >
              <Text className='bet-text'>{amount}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='form-section'>
        <Text className='section-title'>完成时限（小时）</Text>
        <View className='hour-options'>
          {hourOptions.map((hour) => (
            <View
              key={hour}
              className={`hour-option ${hours === hour ? 'active' : ''}`}
              onClick={() => setHours(hour)}
            >
              <Text className='hour-text'>{hour}h</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='warning-box'>
        <Text className='warning-text'>⚠️ 警告</Text>
        <Text className='warning-desc'>
          任务超时未完成将扣除 {betAmount} 尊严币，并触发 AI 毒舌嘲讽，记录将公开至耻辱墙！
        </Text>
      </View>

      <Button
        className={`submit-button ${loading ? 'disabled' : ''}`}
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? '创建中...' : '创建任务'}
      </Button>
    </View>
  );
}
