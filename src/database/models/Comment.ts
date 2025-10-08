import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class Comment extends Model {
  static table = 'comments'

  @field('user_id') userId!: string
  @field('target_type') targetType!: string
  @field('target_id') targetId!: string
  @field('content') content!: string
  @field('parent_id') parentId?: string
  @field('like_count') likeCount!: number
  @field('reply_count') replyCount!: number
  @field('is_deleted') isDeleted!: boolean
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @field('synced') synced!: boolean

  // 增加点赞数
  async incrementLike() {
    await this.update(f => {
      f.likeCount += 1
      f.updatedAt = new Date()
      f.synced = false
    })
  }

  // 减少点赞数
  async decrementLike() {
    await this.update(f => {
      f.likeCount = Math.max(0, f.likeCount - 1)
      f.updatedAt = new Date()
      f.synced = false
    })
  }

  // 软删除
  async softDelete() {
    await this.update(f => {
      f.isDeleted = true
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
