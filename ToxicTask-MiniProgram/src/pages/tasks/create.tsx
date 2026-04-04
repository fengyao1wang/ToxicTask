import { useState } from 'react';
import { View, Text, Input, Button, Slider, PickerView, PickerViewColumn } from '@tarojs/components';
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
  const [minutes, setMinutes] = useState(0);
  const [loading, setLoading] = useState(false);

  const betOptions = [5, 10, 20, 30, 50];

  // 生成小时和分钟的选项
  const hoursRange = Array.from({ length: 72 }, (_, i) => i);
  const minutesRange = Array.from({ length: 60 }, (_, i) => i);

  const handlePickerChange = (e) => {
    const [hourIndex, minuteIndex] = e.detail.value;
    setHours(hoursRange[hourIndex]);
    setMinutes(minutesRange[minuteIndex]);
  };

  const getTotalMinutes = () => {
    return hours * 60 + minutes;
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Taro.showToast({
        title: '请输入任务标题',
        icon: 'none',
      });
      return;
    }

    const totalMinutes = getTotalMinutes();
    if (totalMinutes === 0) {
      Taro.showToast({
        title: '请设置任务时限',
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
      deadline.setMinutes(deadline.getMinutes() + totalMinutes);

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

        <View className='slider-section'>
          <View className='slider-header'>
            <Text className='slider-label'>滑动调整押注</Text>
            <Text className='slider-value'>{betAmount} 币</Text>
          </View>
          <Slider
            className='custom-slider'
            min={1}
            max={100}
            step={1}
            value={betAmount}
            activeColor='#ff3b30'
            backgroundColor='#333'
            blockColor='#ff3b30'
            blockSize={20}
            onChange={(e) => setBetAmount(e.detail.value)}
            onChanging={(e) => setBetAmount(e.detail.value)}
          />
        </View>
      </View>

      <View className='form-section'>
        <Text className='section-title'>完成时限</Text>

        <View className='time-display'>
          <Text className='time-value'>{hours} 小时 {minutes} 分钟</Text>
        </View>

        <View className='picker-container'>
          <PickerView
            indicatorStyle='height: 40px;'
            className='time-picker'
            value={[hours, minutes]}
            onChange={handlePickerChange}
          >
            <PickerViewColumn>
              {hoursRange.map((h) => (
                <View key={h} className='picker-item'>
                  <Text>{h} 小时</Text>
                </View>
              ))}
            </PickerViewColumn>
            <PickerViewColumn>
              {minutesRange.map((m) => (
                <View key={m} className='picker-item'>
                  <Text>{m} 分钟</Text>
                </View>
              ))}
            </PickerViewColumn>
          </PickerView>
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
