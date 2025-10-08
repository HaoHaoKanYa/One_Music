import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class DailyPlayStat extends Model {
  static table = 'daily_play_stats'

  @field('user_id') userId!: string
  @field('date') date!: string
  @field('total_plays') totalPlays!: number
  @field('total_duration') totalDuration!: number
  @field('unique_songs') uniqueSongs!: number
  @field('unique_artists') uniqueArtists!: number
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @field('synced') synced!: boolean

  // 增加播放统计
  async incrementPlay(duration: number = 0, uniqueSong: boolean = false, uniqueArtist: boolean = false) {
    await this.update(f => {
      f.totalPlays += 1
      f.totalDuration += duration
      if (uniqueSong) f.uniqueSongs += 1
      if (uniqueArtist) f.uniqueArtists += 1
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
