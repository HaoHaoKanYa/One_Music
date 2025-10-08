import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class AppSetting extends Model {
  static table = 'app_settings'

  @field('user_id') userId!: string
  @field('audio_quality') audioQuality!: string
  @field('download_quality') downloadQuality!: string
  @field('auto_play') autoPlay!: boolean
  @field('shuffle_mode') shuffleMode!: boolean
  @field('repeat_mode') repeatMode!: string
  @field('wifi_only_download') wifiOnlyDownload!: boolean
  @field('wifi_only_stream') wifiOnlyStream!: boolean
  @field('enable_notifications') enableNotifications!: boolean
  @field('notify_new_follower') notifyNewFollower!: boolean
  @field('notify_new_comment') notifyNewComment!: boolean
  @field('notify_new_like') notifyNewLike!: boolean
  @field('notify_vip_expire') notifyVipExpire!: boolean
  @field('show_online_status') showOnlineStatus!: boolean
  @field('show_listening') showListening!: boolean
  @field('theme') theme!: string
  @field('language') language!: string
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @field('synced') synced!: boolean

  // 更新设置
  async updateSettings(settings: Partial<{
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
  }>) {
    await this.update(f => {
      Object.entries(settings).forEach(([key, value]) => {
        if (value !== undefined) {
          (f as any)[key] = value
        }
      })
      f.updatedAt = new Date()
      f.synced = false
    })
  }

  // 标记为已同步
  async markAsSynced() {
    await this.update(f => {
      f.synced = true
    })
  }

  // 标记为未同步
  async markAsUnsynced() {
    await this.update(f => {
      f.synced = false
    })
  }
}
