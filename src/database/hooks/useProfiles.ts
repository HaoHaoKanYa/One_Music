import { useDatabase } from '@nozbe/watermelondb/hooks'
import { Q } from '@nozbe/watermelondb'
import { useObservable } from '@nozbe/watermelondb/hooks'
import UserProfile from '../models/UserProfile'

export const useUserProfile = (userId: string) => {
  const database = useDatabase()
  
  const profile = useObservable(
    database.get('user_profiles')
      .query(Q.where('user_id', userId))
      .observe()
  )

  return profile?.[0] || null
}

// 更新用户资料
export const updateUserProfile = async (
  userId: string,
  profile: Partial<{
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
  }>
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    // 查找现有资料
    const existingProfiles = await database
      .get('user_profiles')
      .query(Q.where('user_id', userId))
      .fetch()

    if (existingProfiles.length > 0) {
      // 更新现有资料
      const userProfile = existingProfiles[0]
      await userProfile.updateProfile(profile)
    } else {
      // 创建新资料
      await database.get('user_profiles').create(userProfile => {
        userProfile.userId = userId
        userProfile.username = profile.username || ''
        userProfile.displayName = profile.displayName
        userProfile.email = profile.email || ''
        userProfile.avatarUrl = profile.avatarUrl
        userProfile.bio = profile.bio
        userProfile.gender = profile.gender
        userProfile.birthday = profile.birthday
        userProfile.location = profile.location
        userProfile.website = profile.website
        userProfile.totalPlayTime = 0
        userProfile.totalSongs = 0
        userProfile.totalPlaylists = 0
        userProfile.followingCount = 0
        userProfile.followersCount = 0
        userProfile.isPublic = profile.isPublic !== undefined ? profile.isPublic : true
        userProfile.showPlayHistory = profile.showPlayHistory !== undefined ? profile.showPlayHistory : true
        userProfile.showPlaylists = profile.showPlaylists !== undefined ? profile.showPlaylists : true
        userProfile.vipStatus = 'free'
        userProfile.createdAt = new Date()
        userProfile.updatedAt = new Date()
        userProfile.synced = false
      })
    }
  })
}

// 更新用户统计数据
export const updateUserStats = async (
  userId: string,
  stats: {
    totalPlayTime?: number
    totalSongs?: number
    totalPlaylists?: number
    followingCount?: number
    followersCount?: number
  }
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    // 查找现有资料
    const existingProfiles = await database
      .get('user_profiles')
      .query(Q.where('user_id', userId))
      .fetch()

    if (existingProfiles.length > 0) {
      // 更新统计数据
      const userProfile = existingProfiles[0]
      await userProfile.updateStats(stats)
    }
  })
}

// 检查用户名是否可用
export const isUsernameAvailable = async (username: string, excludeUserId?: string): Promise<boolean> => {
  const database = useDatabase()
  
  const existingProfiles = await database
    .get('user_profiles')
    .query(Q.where('username', username))
    .fetch()

  if (excludeUserId) {
    return existingProfiles.length === 0 || existingProfiles.every(p => p.userId !== excludeUserId)
  }

  return existingProfiles.length === 0
}
