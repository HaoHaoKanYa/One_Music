import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class DislikedSong extends Model {
  static table = 'disliked_songs'

  @field('user_id') userId!: string
  @field('song_id') songId!: string
  @field('song_name') songName!: string
  @field('artist') artist?: string
  @field('source') source!: string
  @field('reason') reason?: string
  @date('created_at') createdAt!: Date
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
