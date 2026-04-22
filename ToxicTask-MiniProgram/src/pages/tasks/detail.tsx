import { useEffect, useState } from 'react';
import { View, Text, Button, Image, Textarea } from '@tarojs/components';
import Taro, { useRouter, useShareAppMessage, useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { tasksApi } from '@/lib/api/tasks';
import { Task } from '@/types';
import './detail.scss';

export default function TaskDetail() {
  const router = useRouter();
  const { taskId } = router.params;
  const { user } = useAppStore();
  const { tasks, acceptSupervision, cancelSupervision, submitEvidence, reviewEvidence } = useTaskStore();

  const [task, setTask] = useState<Task | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceImage, setEvidenceImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTask, setLoadingTask] = useState(true);

  // 加载任务数据的函数
  const loadTask = async (preserveEvidence = false) => {
    if (!taskId) {
      setLoadingTask(false);
      return;
    }

    console.log('[TaskDetail] 开始加载任务:', taskId, '保留证据:', preserveEvidence);
    setLoadingTask(true);

    // 对于监督任务，优先从数据库加载最新状态
    try {
      const remoteTask = await tasksApi.getTask(taskId);
      if (remoteTask) {
        console.log('[TaskDetail] 从数据库加载任务成功:', remoteTask.supervision_status);
        setTask(remoteTask);

        // 只在不保留证据时才更新（避免覆盖用户正在输入的内容）
        if (!preserveEvidence) {
          setEvidenceText(remoteTask.evidence_text || '');
          setEvidenceImage(remoteTask.evidence_image || '');
        }

        setLoadingTask(false);
        return;
      }
    } catch (error) {
      console.error('[TaskDetail] 从数据库加载任务失败:', error);
    }

    // 数据库加载失败，尝试从本地查找
    const foundTask = tasks.find((t) => t.id === taskId);
    if (foundTask) {
      console.log('[TaskDetail] 从本地加载任务:', foundTask.supervision_status);
      setTask(foundTask);

      // 只在不保留证据时才更新
      if (!preserveEvidence) {
        setEvidenceText(foundTask.evidence_text || '');
        setEvidenceImage(foundTask.evidence_image || '');
      }
    }

    setLoadingTask(false);
  };

  // 初始加载
  useEffect(() => {
    loadTask(false); // 初始加载时不保留证据
  }, [taskId]);

  // 页面显示时刷新数据（关键！）
  useDidShow(() => {
    console.log('[TaskDetail] 页面显示，刷新任务数据');
    // 页面重新显示时保留用户已输入的证据（避免从相册返回时丢失）
    loadTask(true);
  });

  // 判断当前用户角色
  const isCreator = task && user && task.user_id === user.id;
  const isSupervisor = task && user && task.supervisor_id === user.id;

  console.log('[TaskDetail] 用户角色判断:', {
    hasTask: !!task,
    hasUser: !!user,
    taskUserId: task?.user_id,
    currentUserId: user?.id,
    supervisorId: task?.supervisor_id,
    isCreator,
    isSupervisor,
    supervisionStatus: task?.supervision_status,
  });

  console.log('[TaskDetail] UI 渲染条件:', {
    '等待邀请-创建者': isCreator && task?.supervision_status === 'waiting_invite',
    '等待邀请-访客': !isCreator && !isSupervisor && task?.supervision_status === 'waiting_invite',
    '已邀请-创建者': isCreator && task?.supervision_status === 'invited',
    '证据已提交-创建者': isCreator && task?.supervision_status === 'evidence_submitted',
    '证据已提交-监督者': isSupervisor && task?.supervision_status === 'evidence_submitted',
  });

  // 分享配置
  useShareAppMessage(() => {
    if (!task || !user) {
      return {
        title: '来ToxicTask一起自律打卡吧！',
        path: '/pages/index/index',
      };
    }

    // 🔥 新版挑衅文案
    const provocationTexts = [
      `敢不敢来打个赌？我要是完不成「${task.title}」，尊严币双手奉上！`,
      `听说你很严？来做我的无情监工吧！完不成「${task.title}」任你处置。`,
      `狠话已经放下了！今天必须拿下「${task.title}」，不信你点开看！`,
      `本鸽王又要立 Flag 了：「${task.title}」。如果我又咕了，请狠狠嘲笑我！`,
      `你的好友正在派发"尊严基金"！快来监督我「${task.title}」，失败了尊严币全归你！`,
      `救救孩子吧！我的拖延症晚期，只能靠你无情监督「${task.title}」来治了！`,
      `为了证明我不是三分钟热度，我押上了全部尊严发誓要「${task.title}」`,
    ];

    const randomText = provocationTexts[Math.floor(Math.random() * provocationTexts.length)];

    return {
      title: randomText,
      path: `/pages/tasks/detail?taskId=${task.id}&inviterId=${user.id}&action=supervise`,
      imageUrl: '', // 使用默认截屏
    };
  });

  // 接受监督
  const handleAcceptSupervision = async () => {
    if (!task || !user) return;

    try {
      setLoading(true);
      await acceptSupervision(task.id, user.id);

      Taro.showToast({
        title: '已接受监督',
        icon: 'success',
      });

      // 延迟返回
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (error) {
      console.error('[TaskDetail] 接受监督失败:', error);
      Taro.showToast({
        title: (error as Error).message || '操作失败',
        icon: 'none',
      });
      setLoading(false);
    }
  };

  // 取消监督
  const handleCancelSupervision = async () => {
    if (!task || !user) return;

    Taro.showModal({
      title: '确认取消监督',
      content: `取消后将退还押金 ${task.bet_amount} 币和赏金 ${task.bounty_coins} 币，任务将被删除`,
      success: async (res) => {
        if (res.confirm) {
          try {
            setLoading(true);
            await cancelSupervision(task.id);

            Taro.showToast({
              title: '已取消监督并退币',
              icon: 'success',
            });

            // 返回首页
            setTimeout(() => {
              Taro.switchTab({ url: '/pages/index/index' });
            }, 1500);
          } catch (error) {
            console.error('[TaskDetail] 取消监督失败:', error);
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

  // 选择图片
  const handleChooseImage = () => {
    console.log('[TaskDetail] 点击选择图片');
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        console.log('[TaskDetail] 图片选择成功:', tempFilePath);

        try {
          // 将临时文件转为 base64（持久化存储）
          const fs = Taro.getFileSystemManager();
          const base64 = await new Promise<string>((resolve, reject) => {
            fs.readFile({
              filePath: tempFilePath,
              encoding: 'base64',
              success: (res) => {
                resolve(`data:image/jpeg;base64,${res.data}`);
              },
              fail: reject,
            });
          });

          console.log('[TaskDetail] 图片转换为 base64 成功，长度:', base64.length);
          setEvidenceImage(base64);
        } catch (error) {
          console.error('[TaskDetail] 图片转换失败:', error);
          // 降级：直接使用临时路径
          setEvidenceImage(tempFilePath);
        }
      },
      fail: (err) => {
        console.error('[TaskDetail] 图片选择失败:', err);
        Taro.showToast({
          title: '选择图片失败',
          icon: 'none',
        });
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

      // 延迟返回首页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (error) {
      console.error('[TaskDetail] 提交证据失败:', error);
      Taro.showToast({
        title: (error as Error).message || '操作失败',
        icon: 'none',
      });
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

  if (loadingTask) {
    return (
      <View className='detail-container'>
        <Text className='loading-text'>加载中...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View className='detail-container'>
        <Text className='error-text'>任务不存在</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className='detail-container'>
        <Text className='error-text'>请先登录</Text>
        <Button
          className='primary-button'
          onClick={() => {
            // 保存当前页面完整路径（包含所有参数），登录后返回
            const params = new URLSearchParams();
            Object.keys(router.params).forEach(key => {
              params.append(key, router.params[key]);
            });
            const currentUrl = `/pages/tasks/detail?${params.toString()}`;
            Taro.redirectTo({
              url: `/pages/auth/index?redirect=${encodeURIComponent(currentUrl)}`
            });
          }}
        >
          去登录
        </Button>
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
          <Button className='primary-button' openType='share'>
            分享给好友
          </Button>
          <Button
            className='cancel-button'
            onClick={handleCancelSupervision}
            disabled={loading}
          >
            取消邀请并退币
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
              <Image
                src={
                  task.evidence_image.startsWith('data:image')
                    ? task.evidence_image
                    : `data:image/jpeg;base64,${task.evidence_image}`
                }
                className='preview-image'
                mode='aspectFit'
              />
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
              <Image
                src={
                  task.evidence_image.startsWith('data:image')
                    ? task.evidence_image
                    : `data:image/jpeg;base64,${task.evidence_image}`
                }
                className='preview-image'
                mode='aspectFit'
              />
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
