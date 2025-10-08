import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class ArtistPlayStat extends Model {
  static table = 'artist_play_stats'

  @field('user_id') userId!: string
  @field('artist') artist!: string
  @field('play_count') playCount!: number
  @field('total_duration') totalDuration!: number
  @date('last_played_at') lastPlayedAt?: Date
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @field('synced') synced!: boolean

  // 增加播放统计
  async incrementPlay(duration: number = 0) {
    await this.update(f => {
      f.playCount += 1
      f.totalDuration += duration
      f.lastPlayedAt = new Date()
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
