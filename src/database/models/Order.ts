import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class Order extends Model {
  static table = 'orders'

  @field('user_id') userId!: string
  @field('order_no') orderNo!: string
  @field('plan_id') planId?: string
  @field('plan_name') planName!: string
  @field('plan_type') planType!: string
  @field('duration_days') durationDays!: number
  @field('amount') amount!: number
  @field('status') status!: string
  @field('payment_method') paymentMethod?: string
  @date('payment_time') paymentTime?: Date
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @field('synced') synced!: boolean

  // 更新订单状态
  async updateStatus(status: string, paymentMethod?: string) {
    await this.update(f => {
      f.status = status
      if (paymentMethod) f.paymentMethod = paymentMethod
      if (status === 'paid') f.paymentTime = new Date()
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
