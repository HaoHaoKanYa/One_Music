import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class UserProfile extends Model {
  static table = 'user_profiles'

  @field('user_id') userId!: string
  @field('username') username!: string
  @field('display_name') displayName?: string
  @field('email') email!: string
  @field('avatar_url') avatarUrl?: string
  @field('bio') bio?: string
  @field('gender') gender?: string
  @date('birthday') birthday?: Date
  @field('location') location?: string
  @field('website') website?: string
  @field('total_play_time') totalPlayTime!: number
  @field('total_songs') totalSongs!: number
  @field('total_playlists') totalPlaylists!: number
  @field('following_count') followingCount!: number
  @field('followers_count') followersCount!: number
  @field('is_public') isPublic!: boolean
  @field('show_play_history') showPlayHistory!: boolean
  @field('show_playlists') showPlaylists!: boolean
  @field('vip_status') vipStatus!: string
  @date('vip_expire_at') vipExpireAt?: Date
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @field('synced') synced!: boolean

  // 更新资料
  async updateProfile(profile: Partial<{
    username: string
    displayName: string
    email: string
    avatarUrl: string
    bio: string
    gender: string
    birthday: Date
    location: string
    website: string
    isPublic: boolean
    showPlayHistory: boolean
    showPlaylists: boolean
  }>) {
    await this.update(f => {
      Object.entries(profile).forEach(([key, value]) => {
        if (value !== undefined) {
          (f as any)[key] = value
        }
      })
      f.updatedAt = new Date()
      f.synced = false
    })
  }

  // 更新统计数据
  async updateStats(stats: {
    totalPlayTime?: number
    totalSongs?: number
    totalPlaylists?: number
    followingCount?: number
    followersCount?: number
  }) {
    await this.update(f => {
      Object.entries(stats).forEach(([key, value]) => {
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
