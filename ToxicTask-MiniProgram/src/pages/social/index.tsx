import { useState, useEffect } from 'react';
import { View, Text, Button, Image, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/lib/stores/appStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { Task } from '@/types';
import './index.scss';

type TabType = 'review' | 'mycontracts';

export default function SocialDashboard() {
  const { user } = useAppStore();
  const { tasks, reviewEvidence } = useTaskStore();

  const [activeTab, setActiveTab] = useState<TabType>('review');
  const [reviewComment, setReviewComment] = useState('');
  const [currentReviewTask, setCurrentReviewTask] = useState<Task | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [loading, setLoading] = useState(false);

  // 待我裁决：我是监督者且状态为待审核的任务
  const tasksToReview = tasks.filter(
    (task) =>
      task.is_supervised &&
      task.supervisor_id === user?.id &&
      task.supervision_status === 'evidence_submitted'
  );

  // 我的契约：我发起的监督任务
  const myContracts = tasks.filter(
    (task) => task.is_supervised && task.user_id === user?.id
  );

  // 处理审核（带评论）
  const handleReviewWithComment = (task: Task, approved: boolean) => {
    setCurrentReviewTask(task);
    setReviewAction(approved ? 'approve' : 'reject');
    setReviewComment('');
    setShowCommentModal(true);
  };

  // 提交审核
  const handleSubmitReview = async () => {
    if (!currentReviewTask || !user) return;

    const approved = reviewAction === 'approve';

    try {
      setLoading(true);

      // 先更新任务的 supervisor_comment
      const taskIndex = tasks.findIndex((t) => t.id === currentReviewTask.id);
      if (taskIndex !== -1) {
        tasks[taskIndex].supervisor_comment = reviewComment.trim() || null;
      }

      // 执行审核
      await reviewEvidence(currentReviewTask.id, approved, user.id);

      Taro.showToast({
        title: approved ? '已通过' : '已拒绝',
        icon: 'success',
      });

      setShowCommentModal(false);
      setCurrentReviewTask(null);
      setReviewComment('');
    } catch (error) {
      console.error('[Social] 审核失败:', error);
      Taro.showToast({
        title: (error as Error).message || '操作失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取监督状态文本
  const getStatusText = (status: string): string => {
    const statusMap = {
      none: '无监督',
      waiting_invite: '等待接受',
      invited: '进行中',
      evidence_submitted: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    };
    return statusMap[status] || status;
  };

  // 获取状态颜色类
  const getStatusClass = (status: string): string => {
    if (status === 'approved') return 'status-success';
    if (status === 'rejected') return 'status-failed';
    if (status === 'evidence_submitted') return 'status-pending';
    return 'status-normal';
  };

  return (
    <View className='social-container'>
      {/* 顶部Tab切换 */}
      <View className='tab-bar'>
        <View
          className={`tab-item ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          <Text className='tab-text'>待我裁决</Text>
          {tasksToReview.length > 0 && (
            <View className='badge'>
              <Text className='badge-text'>{tasksToReview.length}</Text>
            </View>
          )}
        </View>
        <View
          className={`tab-item ${activeTab === 'mycontracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('mycontracts')}
        >
          <Text className='tab-text'>我的契约</Text>
        </View>
      </View>

      {/* 待我裁决 */}
      {activeTab === 'review' && (
        <View className='content-section'>
          {tasksToReview.length === 0 ? (
            <View className='empty-state'>
              <Text className='empty-text'>暂无待审核任务</Text>
              <Text className='empty-hint'>当好友提交证据后，会在这里显示</Text>
            </View>
          ) : (
            <View className='task-list'>
              {tasksToReview.map((task) => (
                <View key={task.id} className='review-card'>
                  <View className='card-header'>
                    <Text className='task-title'>{task.title}</Text>
                    <Text className='task-bet'>{task.bet_amount} 币</Text>
                  </View>

                  {/* 证据展示 */}
                  {task.evidence_image && (
                    <View className='evidence-section'>
                      <Text className='evidence-label'>证据图片：</Text>
                      <Image
                        src={task.evidence_image}
                        className='evidence-image'
                        mode='aspectFit'
                        onClick={() => {
                          Taro.previewImage({
                            urls: [task.evidence_image!],
                            current: task.evidence_image!,
                          });
                        }}
                      />
                    </View>
                  )}

                  {task.evidence_text && (
                    <View className='evidence-section'>
                      <Text className='evidence-label'>文字说明：</Text>
                      <Text className='evidence-text'>{task.evidence_text}</Text>
                    </View>
                  )}

                  {/* 审核按钮 */}
                  <View className='review-actions'>
                    <Button
                      className='reject-btn'
                      onClick={() => handleReviewWithComment(task, false)}
                    >
                      拒绝
                    </Button>
                    <Button
                      className='approve-btn'
                      onClick={() => handleReviewWithComment(task, true)}
                    >
                      通过
                    </Button>
                  </View>

                  {/* 奖励提示 */}
                  <View className='reward-hint'>
                    <Text className='hint-text'>
                      通过：获得 {task.bounty_coins} 币 | 拒绝：获得{' '}
                      {task.bounty_coins + Math.floor(task.bet_amount * 0.5)} 币
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 我的契约 */}
      {activeTab === 'mycontracts' && (
        <View className='content-section'>
          {myContracts.length === 0 ? (
            <View className='empty-state'>
              <Text className='empty-text'>暂无监督任务</Text>
              <Text className='empty-hint'>创建任务时开启"好友监督"</Text>
            </View>
          ) : (
            <View className='task-list'>
              {myContracts.map((task) => (
                <View
                  key={task.id}
                  className='contract-card'
                  onClick={() => {
                    Taro.navigateTo({
                      url: `/pages/tasks/detail?taskId=${task.id}`,
                    });
                  }}
                >
                  <View className='card-header'>
                    <Text className='task-title'>{task.title}</Text>
                    <View className={`status-badge ${getStatusClass(task.supervision_status)}`}>
                      <Text className='status-text'>{getStatusText(task.supervision_status)}</Text>
                    </View>
                  </View>

                  <View className='card-info'>
                    <Text className='info-item'>押注: {task.bet_amount} 币</Text>
                    <Text className='info-item'>赏金: {task.bounty_coins} 币</Text>
                  </View>

                  {task.supervisor_comment && (
                    <View className='supervisor-comment'>
                      <Text className='comment-label'>监督者评论：</Text>
                      <Text className='comment-text'>{task.supervisor_comment}</Text>
                    </View>
                  )}

                  <View className='card-footer'>
                    <Text className='footer-hint'>点击查看详情 →</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 评论弹窗 */}
      {showCommentModal && (
        <View className='modal-overlay' onClick={() => setShowCommentModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>
              {reviewAction === 'approve' ? '通过并留言' : '拒绝并嘲讽'}
            </Text>
            <Textarea
              className='comment-textarea'
              placeholder={
                reviewAction === 'approve'
                  ? '给好友一些鼓励吧...'
                  : '狠狠嘲讽TA吧（不带脏字）...'
              }
              value={reviewComment}
              onInput={(e) => setReviewComment(e.detail.value)}
              maxlength={100}
            />
            <View className='modal-actions'>
              <Button
                className='cancel-btn'
                onClick={() => setShowCommentModal(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                className='confirm-btn'
                onClick={handleSubmitReview}
                disabled={loading}
              >
                {loading ? '提交中...' : '确认'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
