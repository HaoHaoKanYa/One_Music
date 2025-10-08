import { useDatabase } from '@nozbe/watermelondb/hooks'
import { Q } from '@nozbe/watermelondb'
import { useObservable } from '@nozbe/watermelondb/hooks'
import AppSetting from '../models/AppSetting'

export const useAppSettings = (userId: string) => {
  const database = useDatabase()
  
  const settings = useObservable(
    database.get('app_settings')
      .query(Q.where('user_id', userId))
      .observe()
  )

  return settings?.[0] || null
}

// 更新应用设置
export const updateAppSettings = async (
  userId: string,
  settings: Partial<{
    audioQuality: string
    downloadQuality: string
    autoPlay: boolean
    shuffleMode: boolean
    repeatMode: string
    wifiOnlyDownload: boolean
    wifiOnlyStream: boolean
    enableNotifications: boolean
    notifyNewFollower: boolean
    notifyNewComment: boolean
    notifyNewLike: boolean
    notifyVipExpire: boolean
    showOnlineStatus: boolean
    showListening: boolean
    theme: string
    language: string
  }>
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    // 查找现有设置
    const existingSettings = await database
      .get('app_settings')
      .query(Q.where('user_id', userId))
      .fetch()

    if (existingSettings.length > 0) {
      // 更新现有设置
      const setting = existingSettings[0]
      await setting.updateSettings(settings)
    } else {
      // 创建新设置
      await database.get('app_settings').create(setting => {
        setting.userId = userId
        setting.audioQuality = settings.audioQuality || 'standard'
        setting.downloadQuality = settings.downloadQuality || 'standard'
        setting.autoPlay = settings.autoPlay !== undefined ? settings.autoPlay : true
        setting.shuffleMode = settings.shuffleMode !== undefined ? settings.shuffleMode : false
        setting.repeatMode = settings.repeatMode || 'off'
        setting.wifiOnlyDownload = settings.wifiOnlyDownload !== undefined ? settings.wifiOnlyDownload : true
        setting.wifiOnlyStream = settings.wifiOnlyStream !== undefined ? settings.wifiOnlyStream : false
        setting.enableNotifications = settings.enableNotifications !== undefined ? settings.enableNotifications : true
        setting.notifyNewFollower = settings.notifyNewFollower !== undefined ? settings.notifyNewFollower : true
        setting.notifyNewComment = settings.notifyNewComment !== undefined ? settings.notifyNewComment : true
        setting.notifyNewLike = settings.notifyNewLike !== undefined ? settings.notifyNewLike : true
        setting.notifyVipExpire = settings.notifyVipExpire !== undefined ? settings.notifyVipExpire : true
        setting.showOnlineStatus = settings.showOnlineStatus !== undefined ? settings.showOnlineStatus : true
        setting.showListening = settings.showListening !== undefined ? settings.showListening : true
        setting.theme = settings.theme || 'auto'
        setting.language = settings.language || 'zh-CN'
        setting.createdAt = new Date()
        setting.updatedAt = new Date()
        setting.synced = false
      })
    }
  })
}

// 获取默认设置
export const getDefaultSettings = () => ({
  audioQuality: 'standard',
  downloadQuality: 'standard',
  autoPlay: true,
  shuffleMode: false,
  repeatMode: 'off',
  wifiOnlyDownload: true,
  wifiOnlyStream: false,
  enableNotifications: true,
  notifyNewFollower: true,
  notifyNewComment: true,
  notifyNewLike: true,
  notifyVipExpire: true,
  showOnlineStatus: true,
  showListening: true,
  theme: 'auto',
  language: 'zh-CN'
})
