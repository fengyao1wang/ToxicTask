import Taro from '@tarojs/taro';

/**
 * 音效管理工具
 */
class SoundManager {
  private audioContext: Taro.InnerAudioContext | null = null;

  /**
   * 播放成就领取音效
   */
  playAchievementClaim() {
    try {
      // 创建音频上下文
      this.audioContext = Taro.createInnerAudioContext();

      // 设置音频源（需要准备音效文件）
      // 这里使用一个占位路径，你需要替换成实际的音效文件
      this.audioContext.src = '/assets/sounds/achievement.mp3';

      // 设置音量
      this.audioContext.volume = 0.5;

      // 播放
      this.audioContext.play();

      // 播放完成后销毁
      this.audioContext.onEnded(() => {
        this.destroy();
      });

      // 错误处理
      this.audioContext.onError((error) => {
        console.error('[SoundManager] 音效播放失败:', error);
        this.destroy();
      });
    } catch (error) {
      console.error('[SoundManager] 创建音频上下文失败:', error);
    }
  }

  /**
   * 播放像素风音效（使用 Web Audio API 生成）
   * 适合没有音效文件的情况
   */
  playPixelSound() {
    try {
      // 使用振动反馈作为替代（小程序支持）
      Taro.vibrateShort({
        type: 'heavy',
      });

      // 显示成功提示音
      Taro.showToast({
        title: '🎉 领取成功',
        icon: 'success',
        duration: 1500,
      });
    } catch (error) {
      console.error('[SoundManager] 播放像素音效失败:', error);
    }
  }

  /**
   * 销毁音频上下文
   */
  destroy() {
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
  }
}

export const soundManager = new SoundManager();
