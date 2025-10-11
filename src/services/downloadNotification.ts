/**
 * 下载通知服务
 * 负责显示下载进度通知
 */
import PushNotification from 'react-native-push-notification'

class DownloadNotificationService {
  private channelId = 'download-channel'
  private notificationId = 1000

  constructor() {
    // 通知频道在 pushNotificationInit.ts 中已创建
    console.log('[DownloadNotification] 下载通知服务已初始化')
  }

  /**
   * 显示下载开始通知
   */
  showDownloadStarted(songName: string, songId: string) {
    try {
      PushNotification.localNotification({
        channelId: this.channelId,
        id: String(this.getNotificationId(songId)),
        title: '开始下载',
        message: songName,
        playSound: false,
        vibrate: false,
        ongoing: true,
        autoCancel: false,
      } as any)
    } catch (error) {
      console.error('[DownloadNotification] 显示通知失败:', error)
    }
  }

  /**
   * 更新下载进度
   */
  updateDownloadProgress(songName: string, songId: string, progress: number) {
    try {
      PushNotification.localNotification({
        channelId: this.channelId,
        id: String(this.getNotificationId(songId)),
        title: `下载中 (${progress}%)`,
        message: songName,
        playSound: false,
        vibrate: false,
        ongoing: true,
        autoCancel: false,
      } as any)
    } catch (error) {
      console.error('[DownloadNotification] 更新进度失败:', error)
    }
  }

  /**
   * 显示下载完成通知
   */
  showDownloadCompleted(songName: string, songId: string) {
    try {
      PushNotification.localNotification({
        channelId: this.channelId,
        id: String(this.getNotificationId(songId)),
        title: '下载完成',
        message: songName,
        playSound: true,
        vibrate: true,
        ongoing: false,
        autoCancel: true,
      })
    } catch (error) {
      console.error('[DownloadNotification] 显示通知失败:', error)
    }
  }

  /**
   * 显示下载失败通知
   */
  showDownloadFailed(songName: string, songId: string, error: string) {
    try {
      PushNotification.localNotification({
        channelId: this.channelId,
        id: String(this.getNotificationId(songId)),
        title: '下载失败',
        message: `${songName}: ${error}`,
        playSound: true,
        vibrate: true,
        ongoing: false,
        autoCancel: true,
      })
    } catch (error) {
      console.error('[DownloadNotification] 显示通知失败:', error)
    }
  }

  /**
   * 取消通知
   */
  cancelNotification(songId: string) {
    try {
      PushNotification.cancelLocalNotification(String(this.getNotificationId(songId)))
    } catch (error) {
      console.error('[DownloadNotification] 取消通知失败:', error)
    }
  }

  /**
   * 取消所有下载通知
   */
  cancelAllNotifications() {
    try {
      PushNotification.cancelAllLocalNotifications()
    } catch (error) {
      console.error('[DownloadNotification] 取消通知失败:', error)
    }
  }

  /**
   * 获取通知ID
   */
  private getNotificationId(songId: string): number {
    // 使用歌曲ID的哈希值作为通知ID
    let hash = 0
    for (let i = 0; i < songId.length; i++) {
      const char = songId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash) % 10000 + this.notificationId
  }
}

// 导出单例
export const downloadNotificationService = new DownloadNotificationService()
export default downloadNotificationService
