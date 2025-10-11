/**
 * Push Notification 初始化配置
 */
import PushNotification, { Importance } from 'react-native-push-notification'
import PushNotificationIOS from '@react-native-community/push-notification-ios'
import { Platform } from 'react-native'

/**
 * 初始化推送通知
 */
export const initPushNotification = () => {
  // 配置推送通知
  PushNotification.configure({
    // (optional) 当通知被点击或接收时调用
    onNotification: function (notification: any) {
      console.log('[PushNotification] 通知:', notification)

      // 处理通知点击事件
      if (notification.userInteraction) {
        // 用户点击了通知
        console.log('[PushNotification] 用户点击了通知')
      }

      // iOS 需要调用这个方法
      if (Platform.OS === 'ios') {
        notification.finish(PushNotificationIOS.FetchResult.NoData)
      }
    },

    // (optional) 当注册失败时调用
    onRegistrationError: function(err: any) {
      console.error('[PushNotification] 注册失败:', err.message, err)
    },

    // IOS ONLY (optional): 默认: 所有 - 权限检查
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // 是否在前台显示通知
    popInitialNotification: true,

    // (optional) 默认: true
    requestPermissions: Platform.OS === 'ios',
  })

  // 创建默认通知频道（Android）
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'default-channel',
        channelName: '默认通知',
        channelDescription: '应用默认通知频道',
        playSound: true,
        soundName: 'default',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created: boolean) => console.log(`[PushNotification] 默认频道创建: ${created}`)
    )

    // 创建下载通知频道
    PushNotification.createChannel(
      {
        channelId: 'download-channel',
        channelName: '下载通知',
        channelDescription: '显示歌曲下载进度',
        playSound: false,
        soundName: 'default',
        importance: Importance.HIGH,
        vibrate: false,
      },
      (created: boolean) => console.log(`[PushNotification] 下载频道创建: ${created}`)
    )
  }

  console.log('[PushNotification] 初始化完成')
}

/**
 * 请求通知权限（iOS）
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    try {
      const permissions = await PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      })
      return !!(permissions?.alert || permissions?.badge || permissions?.sound)
    } catch (error) {
      console.error('[PushNotification] 请求权限失败:', error)
      return false
    }
  }
  return true
}

/**
 * 检查通知权限
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    try {
      return new Promise((resolve) => {
        PushNotificationIOS.checkPermissions((permissions) => {
          resolve(!!(permissions?.alert || permissions?.badge || permissions?.sound))
        })
      })
    } catch (error) {
      console.error('[PushNotification] 检查权限失败:', error)
      return false
    }
  }
  return true
}
