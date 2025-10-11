/**
 * 下载通知服务
 * 负责显示下载进度通知
 * 注意：需要安装 react-native-push-notification 才能使用完整功能
 */

class DownloadNotificationService {
  private channelId = 'download-channel'
  private notificationId = 1000
  private notificationsEnabled = false

  constructor() {
    this.initNotifications()
  }

  /**
   * 初始化通知
   */
  private async initNotifications() {
    try {
      // 尝试导入 push notification 库
      const PushNotification = require('react-native-push-notification')
      
      // 创建通知频道
      PushNotification.createChannel(
        {
          channelId: this.channelId,
          channelName: '下载通知',
          channelDescription: '显示歌曲下载进度',
          playSound: false,
          soundName: 'default',
          importance: 4,
          vibrate: false,
        },
        (created: boolean) => {
          console.log(`[DownloadNotification] 通知频道创建: ${created}`)
          this.notificationsEnabled = true
        }
      )
    } catch (error) {
      console.log('[DownloadNotification] Push notification 未安装，通知功能已禁用')
      this.notificationsEnabled = false
    }
  }

  /**
   * 显示下载开始通知
   */
  showDownloadStarted(songName: string, songId: string) {
    if (!this.notificationsEnabled) return

    try {
      const PushNotification = require('react-native-push-notification')
      PushNotification.localNotification({
        channelId: this.channelId,
        id: this.getNotificationId(songId),
        title: '开始下载',
        message: songName,
        playSound: false,
        vibrate: false,
        ongoing: true,
        autoCancel: false,
        progress: {
          max: 100,
          current: 0,
          indeterminate: false,
        },
      })
    } catch (error) {
      console.error('[DownloadNotification] 显示通知失败:', error)
    }
  }

  /**
   * 更新下载进度
   */
  updateDownloadProgress(songName: string, songId: string, progress: number) {
    if (!this.notificationsEnabled) return

    try {
      const PushNotification = require('react-native-push-notification')
      PushNotification.localNotification({
        channelId: this.channelId,
        id: this.getNotificationId(songId),
        title: `下载中 (${progress}%)`,
        message: songName,
        playSound: false,
        vibrate: false,
        ongoing: true,
        autoCancel: false,
        progress: {
          max: 100,
          current: progress,
          indeterminate: false,
        },
      })
    } catch (error) {
      console.error('[DownloadNotification] 更新进度失败:', error)
    }
  }

  /**
   * 显示下载完成通知
   */
  showDownloadCompleted(songName: string, songId: string) {
    if (!this.notificationsEnabled) return

    try {
      const PushNotification = require('react-native-push-notification')
      PushNotification.localNotification({
        channelId: this.channelId,
        id: this.getNotificationId(songId),
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
    if (!this.notificationsEnabled) return

    try {
      const PushNotification = require('react-native-push-notification')
      PushNotification.localNotification({
        channelId: this.channelId,
        id: this.getNotificationId(songId),
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
    if (!this.notificationsEnabled) return

    try {
      const PushNotification = require('react-native-push-notification')
      PushNotification.cancelLocalNotification(this.getNotificationId(songId))
    } catch (error) {
      console.error('[DownloadNotification] 取消通知失败:', error)
    }
  }

  /**
   * 取消所有下载通知
   */
  cancelAllNotifications() {
    if (!this.notificationsEnabled) return

    try {
      const PushNotification = require('react-native-push-notification')
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
