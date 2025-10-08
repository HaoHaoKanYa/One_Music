import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class PlayHistory extends Model {
  static table = 'play_history'

  @field('user_id') userId!: string
  @field('song_id') songId!: string
  @field('song_name') songName!: string
  @field('artist') artist?: string
  @field('album') album?: string
  @field('source') source!: string
  @field('play_duration') playDuration?: number
  @field('total_duration') totalDuration?: number
  @field('completed') completed!: boolean
  @date('played_at') playedAt!: Date
  @field('synced') synced!: boolean

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
