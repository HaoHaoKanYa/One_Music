import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class UserFollow extends Model {
  static table = 'user_follows'

  @field('follower_id') followerId!: string
  @field('following_id') followingId!: string
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
