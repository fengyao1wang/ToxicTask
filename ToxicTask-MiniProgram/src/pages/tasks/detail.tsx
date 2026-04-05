import { useEffect, useState } from 'react';
import { View, Text, Button, Image, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { Task } from '@/types';
import './detail.scss';

export default function TaskDetail() {
  const router = useRouter();
  const { taskId } = router.params;
  const { user } = useAppStore();
  const { tasks, acceptSupervision, submitEvidence, reviewEvidence } = useTaskStore();

  const [task, setTask] = useState<Task | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceImage, setEvidenceImage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskId) {
      const foundTask = tasks.find((t) => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
        setEvidenceText(foundTask.evidence_text || '');
        setEvidenceImage(foundTask.evidence_image || '');
      }
    }
  }, [taskId, tasks]);

  // 判断当前用户角色
  const isCreator = task && user && task.user_id === user.id;
  const isSupervisor = task && user && task.supervisor_id === user.id;

  // 接受监督
  const handleAcceptSupervision = async () => {
    if (!task || !user) return;

    try {
      setLoading(true);
      await acceptSupervision(task.id, user.id);

      Taro.showToast({
        title: '接受监督成功',
        icon: 'success',
      });

      // 刷新任务
      const updatedTask = tasks.find((t) => t.id === task.id);
      if (updatedTask) {
        setTask(updatedTask);
      }
    } catch (error) {
      console.error('[TaskDetail] 接受监督失败:', error);
      Taro.showToast({
        title: (error as Error).message || '操作失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 选择图片
  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        setEvidenceImage(tempFilePath);
      },
    });
  };

  // 提交证据
  const handleSubmitEvidence = async () => {
    if (!task || !user) return;

    if (!evidenceImage && !evidenceText) {
      Taro.showToast({
        title: '请上传图片或填写文字说明',
        icon: 'none',
      });
      return;
    }

    try {
      setLoading(true);
      await submitEvidence(task.id, evidenceImage, evidenceText);

      Taro.showToast({
        title: '证据提交成功',
        icon: 'success',
      });

      // 刷新任务
      const updatedTask = tasks.find((t) => t.id === task.id);
      if (updatedTask) {
        setTask(updatedTask);
      }
    } catch (error) {
      console.error('[TaskDetail] 提交证据失败:', error);
      Taro.showToast({
        title: (error as Error).message || '操作失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 审核证据
  const handleReviewEvidence = async (approved: boolean) => {
    if (!task || !user) return;

    const action = approved ? '通过' : '拒绝';

    Taro.showModal({
      title: `确认${action}`,
      content: approved
        ? '通过后，发起人将获得本金退款，你将获得赏金。'
        : `拒绝后，发起人本金没收，你将获得赏金 + ${Math.floor(task.bet_amount * 0.5)} 币分红。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            setLoading(true);
            await reviewEvidence(task.id, approved, user.id);

            Taro.showToast({
              title: `${action}成功`,
              icon: 'success',
            });

            setTimeout(() => {
              Taro.navigateBack();
            }, 1500);
          } catch (error) {
            console.error('[TaskDetail] 审核失败:', error);
            Taro.showToast({
              title: (error as Error).message || '操作失败',
              icon: 'none',
            });
          } finally {
            setLoading(false);
          }
        }
      },
    });
  };

  // 分享任务
  const handleShareTask = () => {
    // 在开发工具中，showShareMenu 会报错，所以只显示提示
    const env = Taro.getEnv();
    if (env === Taro.ENV_TYPE.WEAPP) {
      // 真机环境，显示分享菜单
      Taro.showShareMenu({
        withShareTicket: true,
      }).catch((err) => {
        console.warn('[TaskDetail] showShareMenu 失败:', err);
        Taro.showToast({
          title: '请点击右上角分享',
          icon: 'none',
        });
      });
    } else {
      // 开发工具环境，只显示提示
      Taro.showToast({
        title: '请在真机上测试分享功能',
        icon: 'none',
        duration: 2000,
      });
    }
  };

  if (!task) {
    return (
      <View className='detail-container'>
        <Text className='error-text'>任务不存在</Text>
      </View>
    );
  }

  return (
    <View className='detail-container'>
      {/* 任务基本信息 */}
      <View className='task-info-card'>
        <Text className='task-title'>{task.title}</Text>
        <View className='task-meta'>
          <Text className='meta-item'>押注: {task.bet_amount} 币</Text>
          {task.is_supervised && (
            <Text className='meta-item'>赏金: {task.bounty_coins} 币</Text>
          )}
        </View>
        <View className='task-status'>
          <Text className='status-label'>状态: </Text>
          <Text className={`status-value status-${task.supervision_status}`}>
            {getStatusText(task.supervision_status)}
          </Text>
        </View>
      </View>

      {/* 等待邀请状态 - 创建者视角 */}
      {isCreator && task.supervision_status === 'waiting_invite' && (
        <View className='action-card'>
          <Text className='card-title'>等待好友接受监督</Text>
          <Text className='card-desc'>请分享任务给好友，邀请TA来监督你</Text>
          <Button className='primary-button' onClick={handleShareTask}>
            分享给好友
          </Button>
        </View>
      )}

      {/* 等待邀请状态 - 访客视角 */}
      {!isCreator && !isSupervisor && task.supervision_status === 'waiting_invite' && (
        <View className='action-card'>
          <Text className='card-title'>接受监督邀请</Text>
          <Text className='card-desc'>
            接受后，你将成为该任务的监督者，负责审核完成证据
          </Text>
          <Button
            className='primary-button'
            onClick={handleAcceptSupervision}
            disabled={loading}
          >
            {loading ? '处理中...' : '接受监督'}
          </Button>
        </View>
      )}

      {/* 已邀请状态 - 创建者视角 */}
      {isCreator && task.supervision_status === 'invited' && (
        <View className='action-card'>
          <Text className='card-title'>提交完成证据</Text>
          <Text className='card-desc'>上传图片或填写文字说明，证明你已完成任务</Text>

          <View className='evidence-form'>
            <View className='form-item'>
              <Text className='form-label'>证据图片</Text>
              {evidenceImage ? (
                <View className='image-preview'>
                  <Image src={evidenceImage} className='preview-image' mode='aspectFit' />
                  <Button className='change-image-btn' onClick={handleChooseImage}>
                    更换图片
                  </Button>
                </View>
              ) : (
                <Button className='upload-button' onClick={handleChooseImage}>
                  上传图片
                </Button>
              )}
            </View>

            <View className='form-item'>
              <Text className='form-label'>文字说明（可选）</Text>
              <Textarea
                className='evidence-textarea'
                placeholder='描述你是如何完成任务的...'
                value={evidenceText}
                onInput={(e) => setEvidenceText(e.detail.value)}
                maxlength={200}
              />
            </View>

            <Button
              className='primary-button'
              onClick={handleSubmitEvidence}
              disabled={loading}
            >
              {loading ? '提交中...' : '提交证据'}
            </Button>
          </View>
        </View>
      )}

      {/* 证据已提交状态 - 创建者视角 */}
      {isCreator && task.supervision_status === 'evidence_submitted' && (
        <View className='action-card'>
          <Text className='card-title'>等待好友审核</Text>
          <Text className='card-desc'>你的证据已提交，等待监督者审核</Text>

          {task.evidence_image && (
            <View className='evidence-preview'>
              <Text className='preview-label'>证据图片：</Text>
              <Image src={task.evidence_image} className='preview-image' mode='aspectFit' />
            </View>
          )}

          {task.evidence_text && (
            <View className='evidence-preview'>
              <Text className='preview-label'>文字说明：</Text>
              <Text className='preview-text'>{task.evidence_text}</Text>
            </View>
          )}
        </View>
      )}

      {/* 证据已提交状态 - 监督者视角 */}
      {isSupervisor && task.supervision_status === 'evidence_submitted' && (
        <View className='action-card'>
          <Text className='card-title'>审核完成证据</Text>
          <Text className='card-desc'>请仔细查看证据，决定是否通过</Text>

          {task.evidence_image && (
            <View className='evidence-preview'>
              <Text className='preview-label'>证据图片：</Text>
              <Image src={task.evidence_image} className='preview-image' mode='aspectFit' />
            </View>
          )}

          {task.evidence_text && (
            <View className='evidence-preview'>
              <Text className='preview-label'>文字说明：</Text>
              <Text className='preview-text'>{task.evidence_text}</Text>
            </View>
          )}

          <View className='review-buttons'>
            <Button
              className='reject-button'
              onClick={() => handleReviewEvidence(false)}
              disabled={loading}
            >
              拒绝
            </Button>
            <Button
              className='approve-button'
              onClick={() => handleReviewEvidence(true)}
              disabled={loading}
            >
              通过
            </Button>
          </View>

          <View className='review-hint'>
            <Text className='hint-text'>• 通过：发起人获得本金，你获得 {task.bounty_coins} 币</Text>
            <Text className='hint-text'>
              • 拒绝：发起人本金没收，你获得 {task.bounty_coins + Math.floor(task.bet_amount * 0.5)} 币
            </Text>
          </View>
        </View>
      )}

      {/* 已完成/已拒绝状态 */}
      {(task.supervision_status === 'approved' || task.supervision_status === 'rejected') && (
        <View className='action-card'>
          <Text className='card-title'>
            {task.supervision_status === 'approved' ? '✅ 审核通过' : '❌ 审核被拒'}
          </Text>
          <Text className='card-desc'>
            {task.supervision_status === 'approved'
              ? '恭喜！任务已完成，押金已返还'
              : '很遗憾，证据未通过审核，押金已扣除'}
          </Text>
        </View>
      )}
    </View>
  );
}

// 获取状态文本
function getStatusText(status: string): string {
  const statusMap = {
    none: '无监督',
    waiting_invite: '等待邀请',
    invited: '已邀请',
    evidence_submitted: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return statusMap[status] || status;
}
