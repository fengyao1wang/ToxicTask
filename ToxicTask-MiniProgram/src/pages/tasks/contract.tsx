import { useState, useEffect } from 'react';
import { View, Text, Button, Slider, Switch } from '@tarojs/components';
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import './contract.scss';

export default function SocialContractSetup() {
  const router = useRouter();
  const { user, profile, updateDignityCoins } = useAppStore();
  const { createTask } = useTaskStore();

  // 从路由参数获取任务信息
  const [title, setTitle] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [taskType, setTaskType] = useState<'single' | 'repeat'>('single');
  const [repeatDays, setRepeatDays] = useState(7);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);

  // 监督相关状态
  const [isSupervised, setIsSupervised] = useState(false);
  const [bountyCoins, setBountyCoins] = useState(10);
  const [visibility, setVisibility] = useState<'friends' | 'public'>('friends');
  const [loading, setLoading] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string>('');

  useEffect(() => {
    const params = router.params;
    if (params.title) setTitle(decodeURIComponent(params.title));
    if (params.betAmount) setBetAmount(parseInt(params.betAmount));
    if (params.taskType) setTaskType(params.taskType as 'single' | 'repeat');
    if (params.repeatDays) setRepeatDays(parseInt(params.repeatDays));
    if (params.hours) setHours(parseInt(params.hours));
    if (params.minutes) setMinutes(parseInt(params.minutes));
  }, [router.params]);

  // 分享配置
  useShareAppMessage(() => {
    if (!createdTaskId || !user) {
      return {
        title: '来ToxicTask一起自律打卡吧！',
        path: '/pages/index/index',
      };
    }

    // 动态生成挑衅文案
    const provocationTexts = [
      `我不信我做不到"${title}"，敢不敢来拿走我的${bountyCoins}个尊严币？`,
      `${bountyCoins}币赏金等你来拿！我就不信完不成"${title}"`,
      `敢来监督我吗？完不成"${title}"就给你${bountyCoins}币！`,
      `${title} - 我押${betAmount}币，你敢来当监督吗？`,
      `挑战"${title}"，失败了${bountyCoins}币归你！`,
    ];

    const randomText = provocationTexts[Math.floor(Math.random() * provocationTexts.length)];

    return {
      title: randomText,
      path: `/pages/tasks/detail?taskId=${createdTaskId}&inviterId=${user.id}&action=supervise`,
      imageUrl: '', // 使用默认截屏
    };
  });

  const bountyOptions = [5, 10, 20, 30, 50];

  // 创建任务（单机模式）
  const handleCreateDirect = async () => {
    if (!user || !profile) return;

    setLoading(true);

    try {
      let deadline: Date;
      let checkIns: any[] | undefined;

      if (taskType === 'single') {
        deadline = new Date();
        const totalMinutes = hours * 60 + minutes;
        deadline.setMinutes(deadline.getMinutes() + totalMinutes);
      } else {
        deadline = new Date();
        deadline.setDate(deadline.getDate() + repeatDays);
        deadline.setHours(23, 59, 59, 999);

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
        is_supervised: false,
        bounty_coins: 0,
        supervision_status: 'none',
        visibility: 'friends',
      });

      if (newTask) {
        updateDignityCoins(user.id, profile.dignity_coins - betAmount);

        const { useAchievementStore } = await import('@/lib/stores/achievementStore');
        await useAchievementStore.getState().checkAndUnlockAchievements(user.id);

        Taro.showToast({
          title: '任务创建成功',
          icon: 'success',
        });

        setTimeout(() => {
          Taro.navigateBack({ delta: 2 });
        }, 1000);
      }
    } catch (error) {
      console.error('[Contract] 创建失败:', error);
      Taro.showToast({
        title: '创建失败，请重试',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 创建监督任务并分享
  const handleCreateSupervised = async () => {
    if (!user || !profile) return;

    const totalCost = betAmount + bountyCoins;
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
        deadline = new Date();
        const totalMinutes = hours * 60 + minutes;
        deadline.setMinutes(deadline.getMinutes() + totalMinutes);
      } else {
        deadline = new Date();
        deadline.setDate(deadline.getDate() + repeatDays);
        deadline.setHours(23, 59, 59, 999);

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
        is_supervised: true,
        bounty_coins: bountyCoins,
        supervision_status: 'waiting_invite',
        visibility: visibility,
      });

      if (newTask) {
        updateDignityCoins(user.id, profile.dignity_coins - totalCost);

        // 保存任务ID用于分享
        setCreatedTaskId(newTask.id);

        const { useAchievementStore } = await import('@/lib/stores/achievementStore');
        await useAchievementStore.getState().checkAndUnlockAchievements(user.id);

        Taro.showToast({
          title: '任务创建成功，请分享给好友',
          icon: 'success',
          duration: 2000,
        });

        // 不再自动返回，等待用户点击分享按钮
      }
    } catch (error) {
      console.error('[Contract] 创建失败:', error);
      Taro.showToast({
        title: '创建失败，请重试',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='contract-container'>
      {/* 任务信息回顾 */}
      <View className='task-summary'>
        <Text className='summary-title'>任务信息</Text>
        <View className='summary-item'>
          <Text className='item-label'>标题：</Text>
          <Text className='item-value'>{title}</Text>
        </View>
        <View className='summary-item'>
          <Text className='item-label'>押注：</Text>
          <Text className='item-value'>{betAmount} 币</Text>
        </View>
      </View>

      {/* 监督开关 */}
      <View className='supervision-toggle'>
        <View className='toggle-header'>
          <Text className='toggle-title'>开启好友监督</Text>
          <Switch
            checked={isSupervised}
            onChange={(e) => setIsSupervised(e.detail.value)}
            color='#ff3b30'
          />
        </View>
        <Text className='toggle-desc'>邀请好友监督，增加完成动力</Text>
      </View>

      {isSupervised && (
        <>
          {/* 红黑警示区 */}
          <View className='danger-zone'>
            <Text className='danger-title'>⚠️ Flaked Again Warning</Text>
            <Text className='danger-text'>
              开启监督后，需提交证据由好友审核。若被拒绝，你的全部本金和赏金将扣除，好友还将获得你的 {Math.floor(betAmount * 0.5)} 币分红！
            </Text>
          </View>

          {/* 赏金设置 */}
          <View className='bounty-section'>
            <Text className='section-title'>监督赏金</Text>
            <View className='bounty-options'>
              {bountyOptions.map((amount) => {
                const totalCost = betAmount + amount;
                const isDisabled = (profile?.dignity_coins || 0) < totalCost;
                return (
                  <View
                    key={amount}
                    className={`bounty-option ${bountyCoins === amount ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => !isDisabled && setBountyCoins(amount)}
                  >
                    <Text className='bounty-text'>{amount}</Text>
                  </View>
                );
              })}
            </View>
            <Slider
              className='bounty-slider'
              min={5}
              max={Math.min(50, Math.max(5, (profile?.dignity_coins || 0) - betAmount))}
              step={5}
              value={bountyCoins}
              activeColor='#ffffff'
              backgroundColor='#333'
              blockColor='#ffffff'
              blockSize={20}
              onChange={(e) => setBountyCoins(e.detail.value)}
            />
            <Text className='bounty-value'>{bountyCoins} 币</Text>
          </View>

          {/* 可见度设置 */}
          <View className='visibility-section'>
            <Text className='section-title'>失败后可见度</Text>
            <View className='visibility-options'>
              <View
                className={`visibility-option ${visibility === 'friends' ? 'active' : ''}`}
                onClick={() => setVisibility('friends')}
              >
                <Text className='option-text'>好友圈</Text>
              </View>
              <View
                className={`visibility-option ${visibility === 'public' ? 'active' : ''}`}
                onClick={() => setVisibility('public')}
              >
                <Text className='option-text'>全服围观 +1币</Text>
              </View>
            </View>
            <Text className='visibility-hint'>
              {visibility === 'public' ? '失败后公开到全服耻辱墙，但成功额外奖励1币' : '失败记录仅好友可见'}
            </Text>
          </View>

          {/* 总花费 */}
          <View className='total-cost'>
            <Text className='cost-label'>总花费：</Text>
            <Text className='cost-value'>{betAmount + bountyCoins} 币</Text>
            <Text className='cost-detail'>（本金 {betAmount} + 赏金 {bountyCoins}）</Text>
          </View>

          {/* 邀请按钮 */}
          {!createdTaskId ? (
            <Button
              className='invite-button'
              onClick={handleCreateSupervised}
              disabled={loading}
            >
              {loading ? '创建中...' : '创建任务'}
            </Button>
          ) : (
            <>
              <Button
                className='invite-button'
                openType='share'
                disabled={loading}
              >
                邀请微信好友监督
              </Button>
              <Button
                className='back-button'
                onClick={() => Taro.navigateBack({ delta: 2 })}
              >
                返回首页
              </Button>
            </>
          )}
        </>
      )}

      {/* 单机模式按钮 */}
      {!createdTaskId && (
        <Button
          className='direct-button'
          onClick={handleCreateDirect}
          disabled={loading}
        >
          {loading ? '创建中...' : isSupervised ? '不找监督，直接创建' : '创建任务'}
        </Button>
      )}
    </View>
  );
}
