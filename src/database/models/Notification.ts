import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class Notification extends Model {
  static table = 'notifications'

  @field('user_id') userId!: string
  @field('type') type!: string
  @field('title') title!: string
  @field('content') content!: string
  @field('data') data?: string
  @field('is_read') isRead!: boolean
  @date('created_at') createdAt!: Date
  @date('read_at') readAt?: Date
  @field('synced') synced!: boolean

  // 标记为已读
  async markAsRead() {
    await this.update(f => {
      f.isRead = true
      f.readAt = new Date()
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
