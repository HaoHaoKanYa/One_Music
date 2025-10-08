import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class PlayStatistic extends Model {
  static table = 'play_statistics'

  @field('user_id') userId!: string
  @field('song_id') songId!: string
  @field('song_name') songName!: string
  @field('artist') artist?: string
  @field('source') source!: string
  @field('play_count') playCount!: number
  @field('total_duration') totalDuration!: number
  @date('last_played_at') lastPlayedAt?: Date
  @field('synced') synced!: boolean

  // 增加播放次数
  async incrementPlayCount(duration: number = 0) {
    await this.update(f => {
      f.playCount += 1
      f.totalDuration += duration
      f.lastPlayedAt = new Date()
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
