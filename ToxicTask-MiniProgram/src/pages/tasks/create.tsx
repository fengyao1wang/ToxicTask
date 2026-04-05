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
  const [isSupervised, setIsSupervised] = useState(false);
  const [bountyCoins, setBountyCoins] = useState(10);

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
    const totalCost = isSupervised ? betAmount + bountyCoins : betAmount;
    if (profile.dignity_coins < totalCost) {
      Taro.showToast({
        title: '尊严币余额不足',
        icon: 'none',
      });
      return;
    }

    setLoading(true);

    try {
      let deadline: Date;
      let checkIns: any[] | undefined;

      if (taskType === 'single') {
        // 单次任务：从现在开始计算截止时间
        deadline = new Date();
        deadline.setMinutes(deadline.getMinutes() + totalMinutes);
      } else {
        // 重复任务：截止时间为从今天开始的第N天的23:59:59
        deadline = new Date();
        deadline.setDate(deadline.getDate() + repeatDays);
        deadline.setHours(23, 59, 59, 999);

        // 初始化打卡记录
        checkIns = [];
        const today = new Date();
        for (let i = 0; i < repeatDays; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          checkIns.push({
            date: checkDate.toISOString().split('T')[0],
            checked: false,
          });
        }
      }

      const newTask = await createTask({
        user_id: user.id,
        title: title.trim(),
        bet_amount: betAmount,
        status: 'pending',
        deadline: deadline.toISOString(),
        task_type: taskType,
        repeat_days: taskType === 'repeat' ? repeatDays : undefined,
        check_ins: checkIns,
        is_supervised: isSupervised,
        bounty_coins: isSupervised ? bountyCoins : 0,
        supervision_status: isSupervised ? 'waiting_invite' : 'none',
      });

      if (newTask) {
        // 注意：押金和赏金的扣除已经在 createTask 中通过 coinStore 处理
        // 这里只需要更新本地的 profile 显示
        const totalCost = isSupervised ? betAmount + bountyCoins : betAmount;
        const newCoins = profile.dignity_coins - totalCost;
        updateDignityCoins(user.id, newCoins);

        console.log('[CreateTask] 任务创建成功，总花费:', totalCost, '剩余:', newCoins);

        // 触发成就检测（创建任务时检测）
        const { useAchievementStore } = await import('@/lib/stores/achievementStore');
        await useAchievementStore.getState().checkAndUnlockAchievements(user.id);

        Taro.showToast({
          title: '任务创建成功',
          icon: 'success',
        });

        // 如果开启了监督，提示用户分享
        if (isSupervised) {
          setTimeout(() => {
            Taro.showModal({
              title: '邀请好友监督',
              content: '任务已创建！请分享给好友，邀请TA来监督你完成任务。',
              confirmText: '去分享',
              cancelText: '稍后',
              success: (res) => {
                if (res.confirm) {
                  // 触发分享
                  Taro.showShareMenu({
                    withShareTicket: true,
                  });
                }
                Taro.navigateBack();
              },
            });
          }, 1000);
        } else {
          setTimeout(() => {
            Taro.navigateBack();
          }, 1000);
        }
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

      {/* 好友监督开关 */}
      <View className='form-section'>
        <View className='supervision-header'>
          <Text className='section-title'>好友监督</Text>
          <Switch
            checked={isSupervised}
            onChange={(e) => setIsSupervised(e.detail.value)}
            color='#ff3b30'
          />
        </View>
        {isSupervised && (
          <View className='supervision-content'>
            <Text className='supervision-desc'>
              开启后，需要邀请好友监督你完成任务。完成时需提交证据，由好友审核。
            </Text>
            <View className='bounty-section'>
              <Text className='bounty-label'>监督赏金</Text>
              <View className='bounty-options'>
                {[5, 10, 20, 30].map((amount) => (
                  <View
                    key={amount}
                    className={`bounty-option ${bountyCoins === amount ? 'active' : ''}`}
                    onClick={() => setBountyCoins(amount)}
                  >
                    <Text className='bounty-text'>{amount}</Text>
                  </View>
                ))}
              </View>
              <Slider
                className='bounty-slider'
                min={5}
                max={50}
                step={5}
                value={bountyCoins}
                activeColor='#ff3b30'
                backgroundColor='#333'
                blockColor='#ff3b30'
                blockSize={20}
                onChange={(e) => setBountyCoins(e.detail.value)}
                onChanging={(e) => setBountyCoins(e.detail.value)}
              />
              <Text className='bounty-value'>{bountyCoins} 币</Text>
            </View>
            <View className='supervision-rules'>
              <Text className='rules-title'>规则说明：</Text>
              <Text className='rules-item'>• 通过：返还本金，好友获得赏金</Text>
              <Text className='rules-item'>• 拒绝：本金没收，好友获得赏金+50%本金</Text>
              <Text className='rules-item'>• 超时：24小时未审核自动通过，赏金退回</Text>
            </View>
            <View className='total-cost'>
              <Text className='cost-label'>总花费：</Text>
              <Text className='cost-value'>{betAmount + bountyCoins} 币</Text>
              <Text className='cost-detail'>（本金{betAmount} + 赏金{bountyCoins}）</Text>
            </View>
          </View>
        )}
      </View>

      <View className='warning-box'>
        <Text className='warning-text'>⚠️ 警告</Text>
        <Text className='warning-desc'>
          {isSupervised
            ? `开启监督后，完成任务需提交证据并由好友审核。若被拒绝，将扣除 ${betAmount} 尊严币，好友还将获得 ${Math.floor(betAmount * 0.5)} 币分红！`
            : taskType === 'single'
            ? `任务超时未完成将扣除 ${betAmount} 尊严币，并触发 AI 毒舌嘲讽，记录将公开至耻辱墙！`
            : `任意一天未打卡将扣除 ${betAmount} 尊严币，并触发 AI 毒舌嘲讽，记录将公开至耻辱墙！`
          }
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
