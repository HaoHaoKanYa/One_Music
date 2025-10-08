import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class VipPlan extends Model {
  static table = 'vip_plans'

  @field('name') name!: string
  @field('type') type!: string
  @field('duration_days') durationDays!: number
  @field('price') price!: number
  @field('original_price') originalPrice?: number
  @field('features') features!: string
  @field('is_active') isActive!: boolean
  @field('sort_order') sortOrder!: number
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @field('synced') synced!: boolean

  // 更新套餐信息
  async updatePlan(plan: Partial<{
    name: string
    type: string
    durationDays: number
    price: number
    originalPrice: number
    features: string
    isActive: boolean
    sortOrder: number
  }>) {
    await this.update(f => {
      Object.entries(plan).forEach(([key, value]) => {
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
