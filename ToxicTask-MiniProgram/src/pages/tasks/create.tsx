import { useState } from 'react';
import { View, Text, Input, Button, Slider, PickerView, PickerViewColumn, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import './create.scss';

export default function CreateTask() {
  const { user, profile, updateDignityCoins } = useAppStore();
  const { createTask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState<'single' | 'repeat'>('single');
  const [repeatDays, setRepeatDays] = useState(7);
  const [customDaysInput, setCustomDaysInput] = useState('7');

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
    if (taskType === 'single' && totalMinutes === 0) {
      Taro.showToast({
        title: '请设置任务时限',
        icon: 'none',
      });
      return;
    }

    if (taskType === 'repeat' && repeatDays < 1) {
      Taro.showToast({
        title: '重复天数至少为1天',
        icon: 'none',
      });
      return;
    }

    if (!user || !profile) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    // 检查余额是否足够
    if (profile.dignity_coins < betAmount) {
      Taro.showToast({
        title: '尊严币余额不足',
        icon: 'none',
      });
      return;
    }

    // 跳转到社交契约设置页
    Taro.navigateTo({
      url: `/pages/tasks/contract?title=${encodeURIComponent(title)}&betAmount=${betAmount}&taskType=${taskType}&repeatDays=${repeatDays}&hours=${hours}&minutes=${minutes}`,
    });
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
        <Text className='section-title'>任务类型</Text>
        <View className='task-type-options'>
          <View
            className={`type-option ${taskType === 'single' ? 'active' : ''}`}
            onClick={() => setTaskType('single')}
          >
            <Text className='type-text'>单次任务</Text>
          </View>
          <View
            className={`type-option ${taskType === 'repeat' ? 'active' : ''}`}
            onClick={() => setTaskType('repeat')}
          >
            <Text className='type-text'>重复任务</Text>
          </View>
        </View>
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

      {taskType === 'single' ? (
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
      ) : (
        <View className='form-section'>
          <Text className='section-title'>重复天数</Text>
          <View className='repeat-days-options'>
            {[3, 7, 14, 21, 30].map((days) => (
              <View
                key={days}
                className={`repeat-option ${repeatDays === days ? 'active' : ''}`}
                onClick={() => {
                  setRepeatDays(days);
                  setCustomDaysInput(days.toString());
                }}
              >
                <Text className='repeat-text'>{days}天</Text>
              </View>
            ))}
          </View>
          <View className='custom-days-input'>
            <Text className='input-label'>自定义天数：</Text>
            <Input
              className='days-input'
              type='number'
              placeholder='输入天数'
              value={customDaysInput}
              onInput={(e) => {
                const value = e.detail.value;
                setCustomDaysInput(value);
                if (value === '') {
                  setRepeatDays(1);
                } else {
                  const numValue = parseInt(value) || 1;
                  setRepeatDays(Math.max(1, Math.min(365, numValue)));
                }
              }}
              onBlur={() => {
                if (customDaysInput === '') {
                  setCustomDaysInput('1');
                  setRepeatDays(1);
                }
              }}
            />
            <Text className='input-unit'>天</Text>
          </View>
          <View className='repeat-hint'>
            <Text className='hint-text'>需要连续{repeatDays}天打卡，任意一天未打卡即失败</Text>
          </View>
        </View>
      )}

      {/* 警告提示 */}
      <View className='warning-box'>
        <Text className='warning-text'>⚠️ 注意</Text>
        <Text className='warning-desc'>
          {taskType === 'single'
            ? `任务超时未完成将扣除 ${betAmount} 尊严币，记录将公开至耻辱墙！`
            : `任意一天未打卡将扣除 ${betAmount} 尊严币，记录将公开至耻辱墙！`
          }
        </Text>
      </View>

      <Button
        className={`submit-button ${loading || !betAmount ? 'disabled' : ''}`}
        onClick={handleCreate}
        disabled={loading || !betAmount}
      >
        {loading ? '处理中...' : '下一步：设置契约'}
      </Button>
    </View>
  );
}
