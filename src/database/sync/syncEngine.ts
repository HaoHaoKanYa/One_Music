import { database } from '../index'
import { supabase } from '@/lib/supabase'
import { AppState, AppStateStatus } from 'react-native'
import { conflictResolver } from './conflictResolver'
import { syncStatusManager } from './syncStatus'
import { Q } from '@nozbe/watermelondb'

export class SyncEngine {
  private isRunning = false
  private syncInterval: NodeJS.Timeout | null = null
  private appStateListener: any = null

  constructor() {
    this.setupAppStateListener()
  }

  // 启动同步引擎
  start() {
    if (this.isRunning) return

    this.isRunning = true
    console.log('[SyncEngine] 启动同步引擎')

    // 立即执行一次同步
    this.performSync()

    // 设置定时同步（每5分钟）
    this.syncInterval = setInterval(() => {
      this.performSync()
    }, 5 * 60 * 1000)
  }

  // 停止同步引擎
  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    console.log('[SyncEngine] 停止同步引擎')

    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    if (this.appStateListener) {
      this.appStateListener.remove()
      this.appStateListener = null
    }
  }

  // 设置应用状态监听
  private setupAppStateListener() {
    this.appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // 应用进入后台时，执行同步
        this.performSync()
      } else if (nextAppState === 'active') {
        // 应用回到前台时，执行同步
        this.performSync()
      }
    })
  }

  // 执行同步
  async performSync() {
    if (!this.isRunning) return

    try {
      console.log('[SyncEngine] 开始执行同步')
      syncStatusManager.startSync('应用启动同步')

      // 检查用户登录状态
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('[SyncEngine] 用户未登录，跳过同步')
        syncStatusManager.endSync()
        return
      }

      // 更新待同步数据统计
      await this.updateSyncStatus()

      // 并行执行上传和下载
      await Promise.all([
        this.uploadUnsyncedData(),
        this.downloadServerData()
      ])

      console.log('[SyncEngine] 同步完成')
      syncStatusManager.endSync()
    } catch (error) {
      console.error('[SyncEngine] 同步失败:', error)
      syncStatusManager.addSyncError(`同步失败: ${(error as Error).message}`)
      syncStatusManager.endSync()
    }
  }

  // 用户操作触发的同步（用户操作优先）
  async performUserActionSync() {
    if (!this.isRunning) return

    try {
      console.log('[SyncEngine] 开始执行用户操作同步')
      syncStatusManager.startSync('用户操作同步')

      // 检查用户登录状态
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('[SyncEngine] 用户未登录，跳过同步')
        syncStatusManager.endSync()
        return
      }

      // 更新待同步数据统计
      await this.updateSyncStatus()

      // 先上传本地数据，再下载服务器数据（用户操作优先）
      await this.uploadUnsyncedData()
      await this.downloadServerDataWithUserPriority()

      console.log('[SyncEngine] 用户操作同步完成')
      syncStatusManager.endSync()
    } catch (error) {
      console.error('[SyncEngine] 用户操作同步失败:', error)
      syncStatusManager.addSyncError(`用户操作同步失败: ${(error as Error).message}`)
      syncStatusManager.endSync()
    }
  }

  // 上传未同步的数据
  private async uploadUnsyncedData() {
    try {
      console.log('[SyncEngine] 开始上传未同步数据')

      // 上传收藏
      await this.uploadFavorites()
      
      // 上传歌单
      await this.uploadPlaylists()
      
      // 上传播放历史
      await this.uploadPlayHistory()
      
      // 上传播放统计
      await this.uploadPlayStatistics()
      
      // 上传用户设置
      await this.uploadAppSettings()
      
      // 上传用户资料
      await this.uploadUserProfiles()

      console.log('[SyncEngine] 上传完成')
    } catch (error) {
      console.error('[SyncEngine] 上传失败:', error)
    }
  }

  // 下载服务器数据
  private async downloadServerData() {
    try {
      console.log('[SyncEngine] 开始下载服务器数据（启动时服务器优先）')

      // 下载收藏（带冲突解决）
      await this.downloadFavoritesWithConflictResolution()
      
      // 下载歌单（带冲突解决）
      await this.downloadPlaylistsWithConflictResolution()
      
      // 下载播放历史（带冲突解决）
      await this.downloadPlayHistoryWithConflictResolution()
      
      // 下载播放统计（带冲突解决）
      await this.downloadPlayStatisticsWithConflictResolution()
      
      // 下载用户设置（带冲突解决）
      await this.downloadAppSettingsWithConflictResolution()
      
      // 下载用户资料（带冲突解决）
      await this.downloadUserProfilesWithConflictResolution()

      console.log('[SyncEngine] 下载完成')
    } catch (error) {
      console.error('[SyncEngine] 下载失败:', error)
    }
  }

  // 下载服务器数据（用户操作优先）
  private async downloadServerDataWithUserPriority() {
    try {
      console.log('[SyncEngine] 开始下载服务器数据（用户操作优先）')

      // 下载收藏（用户操作优先的冲突解决）
      await this.downloadFavoritesWithUserPriority()
      
      // 下载歌单（用户操作优先的冲突解决）
      await this.downloadPlaylistsWithUserPriority()
      
      // 下载播放历史（用户操作优先的冲突解决）
      await this.downloadPlayHistoryWithUserPriority()
      
      // 下载播放统计（用户操作优先的冲突解决）
      await this.downloadPlayStatisticsWithUserPriority()
      
      // 下载用户设置（用户操作优先的冲突解决）
      await this.downloadAppSettingsWithUserPriority()
      
      // 下载用户资料（用户操作优先的冲突解决）
      await this.downloadUserProfilesWithUserPriority()

      console.log('[SyncEngine] 用户操作优先下载完成')
    } catch (error) {
      console.error('[SyncEngine] 用户操作优先下载失败:', error)
    }
  }

  // 上传收藏
  private async uploadFavorites() {
    const unsyncedFavorites = await database
      .get('favorites')
      .query(Q.where('synced', false))
      .fetch()

    if (unsyncedFavorites.length === 0) return

    const favoritesData = unsyncedFavorites.map(fav => ({
      song_id: (fav as any).songId,
      song_name: (fav as any).songName,
      artist: (fav as any).artist,
      album: (fav as any).album,
      source: (fav as any).source,
      cover_url: (fav as any).coverUrl,
      created_at: (fav as any).createdAt.toISOString(),
    }))

    const { error } = await supabase
      .from('favorite_songs')
      .upsert(favoritesData)

    if (error) throw error

    // 标记为已同步
    await database.write(async () => {
      for (const fav of unsyncedFavorites) {
        await (fav as any).markAsSynced()
      }
    })
  }

  // 上传歌单
  private async uploadPlaylists() {
    const unsyncedPlaylists = await database
      .get('playlists')
      .query(Q.where('synced', false))
      .fetch()

    if (unsyncedPlaylists.length === 0) return

    const playlistsData = unsyncedPlaylists.map(playlist => ({
      name: (playlist as any).name,
      description: (playlist as any).description,
      cover_url: (playlist as any).coverUrl,
      is_public: (playlist as any).isPublic,
      is_deleted: (playlist as any).isDeleted,
      song_count: (playlist as any).songCount,
      play_count: (playlist as any).playCount,
      like_count: (playlist as any).likeCount,
      comment_count: (playlist as any).commentCount,
      created_at: (playlist as any).createdAt.toISOString(),
      updated_at: (playlist as any).updatedAt.toISOString(),
      deleted_at: (playlist as any).deletedAt?.toISOString(),
    }))

    const { error } = await supabase
      .from('playlists')
      .upsert(playlistsData)

    if (error) throw error

    // 标记为已同步
    await database.write(async () => {
      for (const playlist of unsyncedPlaylists) {
        await (playlist as any).markAsSynced()
      }
    })
  }

  // 上传播放历史
  private async uploadPlayHistory() {
    const unsyncedHistory = await database
      .get('play_history')
      .query(Q.where('synced', false))
      .fetch()

    if (unsyncedHistory.length === 0) return

    const historyData = unsyncedHistory.map(record => ({
      song_id: (record as any).songId,
      song_name: (record as any).songName,
      artist: (record as any).artist,
      album: (record as any).album,
      source: (record as any).source,
      play_duration: (record as any).playDuration,
      total_duration: (record as any).totalDuration,
      completed: (record as any).completed,
      played_at: (record as any).playedAt.toISOString(),
    }))

    const { error } = await supabase
      .from('play_history')
      .insert(historyData)

    if (error) throw error

    // 标记为已同步
    await database.write(async () => {
      for (const record of unsyncedHistory) {
        await (record as any).markAsSynced()
      }
    })
  }

  // 上传播放统计
  private async uploadPlayStatistics() {
    const unsyncedStats = await database
      .get('play_statistics')
      .query(Q.where('synced', false))
      .fetch()

    if (unsyncedStats.length === 0) return

    const statsData = unsyncedStats.map(stat => ({
      song_id: (stat as any).songId,
      song_name: (stat as any).songName,
      artist: (stat as any).artist,
      source: (stat as any).source,
      play_count: (stat as any).playCount,
      total_duration: (stat as any).totalDuration,
      last_played_at: (stat as any).lastPlayedAt?.toISOString(),
    }))

    const { error } = await supabase
      .from('play_statistics')
      .upsert(statsData)

    if (error) throw error

    // 标记为已同步
    await database.write(async () => {
      for (const stat of unsyncedStats) {
        await (stat as any).markAsSynced()
      }
    })
  }

  // 上传应用设置
  private async uploadAppSettings() {
    const unsyncedSettings = await database
      .get('app_settings')
      .query(Q.where('synced', false))
      .fetch()

    if (unsyncedSettings.length === 0) return

    const settingsData = unsyncedSettings.map(setting => ({
      audio_quality: (setting as any).audioQuality,
      download_quality: (setting as any).downloadQuality,
      auto_play: (setting as any).autoPlay,
      shuffle_mode: (setting as any).shuffleMode,
      repeat_mode: (setting as any).repeatMode,
      wifi_only_download: (setting as any).wifiOnlyDownload,
      wifi_only_stream: (setting as any).wifiOnlyStream,
      enable_notifications: (setting as any).enableNotifications,
      notify_new_follower: (setting as any).notifyNewFollower,
      notify_new_comment: (setting as any).notifyNewComment,
      notify_new_like: (setting as any).notifyNewLike,
      notify_vip_expire: (setting as any).notifyVipExpire,
      show_online_status: (setting as any).showOnlineStatus,
      show_listening: (setting as any).showListening,
      theme: (setting as any).theme,
      language: (setting as any).language,
      updated_at: (setting as any).updatedAt.toISOString(),
    }))

    const { error } = await supabase
      .from('app_settings')
      .upsert(settingsData)

    if (error) throw error

    // 标记为已同步
    await database.write(async () => {
      for (const setting of unsyncedSettings) {
        await (setting as any).markAsSynced()
      }
    })
  }

  // 上传用户资料
  private async uploadUserProfiles() {
    const unsyncedProfiles = await database
      .get('user_profiles')
      .query(Q.where('synced', false))
      .fetch()

    if (unsyncedProfiles.length === 0) return

    const profilesData = unsyncedProfiles.map(profile => ({
      username: (profile as any).username,
      display_name: (profile as any).displayName,
      email: (profile as any).email,
      avatar_url: (profile as any).avatarUrl,
      bio: (profile as any).bio,
      gender: (profile as any).gender,
      birthday: (profile as any).birthday?.toISOString().split('T')[0],
      location: (profile as any).location,
      website: (profile as any).website,
      total_play_time: (profile as any).totalPlayTime,
      total_songs: (profile as any).totalSongs,
      total_playlists: (profile as any).totalPlaylists,
      following_count: (profile as any).followingCount,
      followers_count: (profile as any).followersCount,
      is_public: (profile as any).isPublic,
      show_play_history: (profile as any).showPlayHistory,
      show_playlists: (profile as any).showPlaylists,
      vip_status: (profile as any).vipStatus,
      vip_expire_at: (profile as any).vipExpireAt?.toISOString(),
      updated_at: (profile as any).updatedAt.toISOString(),
    }))

    const { error } = await supabase
      .from('user_profiles')
      .upsert(profilesData)

    if (error) throw error

    // 标记为已同步
    await database.write(async () => {
      for (const profile of unsyncedProfiles) {
        await (profile as any).markAsSynced()
      }
    })
  }

  // 下载收藏
  private async downloadFavorites() {
    const { data, error } = await supabase
      .from('favorite_songs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        await database.get('favorites').create((favorite: any) => {
          ;(favorite as any).userId = item.user_id
          ;(favorite as any).songId = item.song_id
          ;(favorite as any).songName = item.song_name
          ;(favorite as any).artist = item.artist
          ;(favorite as any).album = item.album
          ;(favorite as any).source = item.source
          ;(favorite as any).coverUrl = item.cover_url
          ;(favorite as any).createdAt = new Date(item.created_at)
          ;(favorite as any).synced = true
        })
      }
    })
  }

  // 下载歌单
  private async downloadPlaylists() {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        await database.get('playlists').create((playlist: any) => {
          ;(playlist as any).userId = item.user_id
          ;(playlist as any).name = item.name
          ;(playlist as any).description = item.description
          ;(playlist as any).coverUrl = item.cover_url
          ;(playlist as any).isPublic = item.is_public
          ;(playlist as any).isDeleted = item.is_deleted
          ;(playlist as any).songCount = item.song_count
          ;(playlist as any).playCount = item.play_count
          ;(playlist as any).likeCount = item.like_count
          ;(playlist as any).commentCount = item.comment_count
          ;(playlist as any).createdAt = new Date(item.created_at)
          ;(playlist as any).updatedAt = new Date(item.updated_at)
          ;(playlist as any).deletedAt = item.deleted_at ? new Date(item.deleted_at) : undefined
          ;(playlist as any).synced = true
        })
      }
    })
  }

  // 下载播放历史
  private async downloadPlayHistory() {
    const { data, error } = await supabase
      .from('play_history')
      .select('*')
      .order('played_at', { ascending: false })
      .limit(1000) // 限制数量避免数据过多

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        await database.get('play_history').create((record: any) => {
          ;(record as any).userId = item.user_id
          ;(record as any).songId = item.song_id
          ;(record as any).songName = item.song_name
          ;(record as any).artist = item.artist
          ;(record as any).album = item.album
          ;(record as any).source = item.source
          ;(record as any).playDuration = item.play_duration
          ;(record as any).totalDuration = item.total_duration
          ;(record as any).completed = item.completed
          ;(record as any).playedAt = new Date(item.played_at)
          ;(record as any).synced = true
        })
      }
    })
  }

  // 下载播放统计
  private async downloadPlayStatistics() {
    const { data, error } = await supabase
      .from('play_statistics')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        await database.get('play_statistics').create((stat: any) => {
          ;(stat as any).userId = item.user_id
          ;(stat as any).songId = item.song_id
          ;(stat as any).songName = item.song_name
          ;(stat as any).artist = item.artist
          ;(stat as any).source = item.source
          ;(stat as any).playCount = item.play_count
          ;(stat as any).totalDuration = item.total_duration
          ;(stat as any).lastPlayedAt = item.last_played_at ? new Date(item.last_played_at) : undefined
          ;(stat as any).synced = true
        })
      }
    })
  }

  // 下载应用设置
  private async downloadAppSettings() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        await database.get('app_settings').create((setting: any) => {
          ;(setting as any).userId = item.user_id
          ;(setting as any).audioQuality = item.audio_quality
          ;(setting as any).downloadQuality = item.download_quality
          ;(setting as any).autoPlay = item.auto_play
          ;(setting as any).shuffleMode = item.shuffle_mode
          ;(setting as any).repeatMode = item.repeat_mode
          ;(setting as any).wifiOnlyDownload = item.wifi_only_download
          ;(setting as any).wifiOnlyStream = item.wifi_only_stream
          ;(setting as any).enableNotifications = item.enable_notifications
          ;(setting as any).notifyNewFollower = item.notify_new_follower
          ;(setting as any).notifyNewComment = item.notify_new_comment
          ;(setting as any).notifyNewLike = item.notify_new_like
          ;(setting as any).notifyVipExpire = item.notify_vip_expire
          ;(setting as any).showOnlineStatus = item.show_online_status
          ;(setting as any).showListening = item.show_listening
          ;(setting as any).theme = item.theme
          ;(setting as any).language = item.language
          ;(setting as any).createdAt = new Date(item.created_at)
          ;(setting as any).updatedAt = new Date(item.updated_at)
          ;(setting as any).synced = true
        })
      }
    })
  }

  // 下载用户资料
  private async downloadUserProfiles() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        await database.get('user_profiles').create((profile: any) => {
          ;(profile as any).userId = item.user_id
          ;(profile as any).username = item.username
          ;(profile as any).displayName = item.display_name
          ;(profile as any).email = item.email
          ;(profile as any).avatarUrl = item.avatar_url
          ;(profile as any).bio = item.bio
          ;(profile as any).gender = item.gender
          ;(profile as any).birthday = item.birthday ? new Date(item.birthday) : undefined
          ;(profile as any).location = item.location
          ;(profile as any).website = item.website
          ;(profile as any).totalPlayTime = item.total_play_time
          ;(profile as any).totalSongs = item.total_songs
          ;(profile as any).totalPlaylists = item.total_playlists
          ;(profile as any).followingCount = item.following_count
          ;(profile as any).followersCount = item.followers_count
          ;(profile as any).isPublic = item.is_public
          ;(profile as any).showPlayHistory = item.show_play_history
          ;(profile as any).showPlaylists = item.show_playlists
          ;(profile as any).vipStatus = item.vip_status
          ;(profile as any).vipExpireAt = item.vip_expire_at ? new Date(item.vip_expire_at) : undefined
          ;(profile as any).createdAt = new Date(item.created_at)
          ;(profile as any).updatedAt = new Date(item.updated_at)
          ;(profile as any).synced = true
        })
      }
    })
  }

  // ==================== 带冲突解决的下载方法 ====================

  // 下载收藏（带冲突解决）
  private async downloadFavoritesWithConflictResolution() {
    const { data, error } = await supabase
      .from('favorite_songs')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingFavorites = await database
          .get('favorites')
          .query(
            Q.where('user_id', item.user_id),
            Q.where('song_id', item.song_id)
          )
          .fetch()

        if (existingFavorites.length > 0) {
          // 存在冲突，使用冲突解决器
          const localData = existingFavorites[0]
          const serverData = {
            songName: item.song_name,
            artist: item.artist,
            album: item.album,
            source: item.source,
            coverUrl: item.cover_url,
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'startup'
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.songName = resolvedData.songName || record.songName
            record.artist = resolvedData.artist || record.artist
            record.album = resolvedData.album || record.album
            record.source = resolvedData.source || record.source
            record.coverUrl = resolvedData.coverUrl || record.coverUrl
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('favorites').create((favorite: any) => {
            favorite.userId = item.user_id
            favorite.songId = item.song_id
            favorite.songName = item.song_name
            favorite.artist = item.artist
            favorite.album = item.album
            favorite.source = item.source
            favorite.coverUrl = item.cover_url
            favorite.createdAt = new Date(item.created_at)
            favorite.updatedAt = new Date(item.updated_at)
            favorite.synced = true
          })
        }
      }
    })
  }

  // 下载歌单（带冲突解决）
  private async downloadPlaylistsWithConflictResolution() {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('is_deleted', false)

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingPlaylists = await database
          .get('playlists')
          .query(
            Q.where('user_id', item.user_id),
            Q.where('name', item.name)
          )
          .fetch()

        if (existingPlaylists.length > 0) {
          // 存在冲突，使用冲突解决器
          const localData = existingPlaylists[0]
          const serverData = {
            description: item.description,
            isPublic: item.is_public,
            songCount: item.song_count,
            playCount: item.play_count,
            likeCount: item.like_count,
            commentCount: item.comment_count,
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'startup'
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.description = resolvedData.description || record.description
            record.isPublic = resolvedData.isPublic !== undefined ? resolvedData.isPublic : record.isPublic
            record.songCount = resolvedData.songCount || record.songCount
            record.playCount = resolvedData.playCount || record.playCount
            record.likeCount = resolvedData.likeCount || record.likeCount
            record.commentCount = resolvedData.commentCount || record.commentCount
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('playlists').create((playlist: any) => {
            playlist.userId = item.user_id
            playlist.name = item.name
            playlist.description = item.description
            playlist.isPublic = item.is_public
            playlist.songCount = item.song_count
            playlist.playCount = item.play_count
            playlist.likeCount = item.like_count
            playlist.commentCount = item.comment_count
            playlist.isDeleted = item.is_deleted
            playlist.createdAt = new Date(item.created_at)
            playlist.updatedAt = new Date(item.updated_at)
            playlist.synced = true
          })
        }
      }
    })
  }

  // 下载播放历史（带冲突解决）
  private async downloadPlayHistoryWithConflictResolution() {
    const { data, error } = await supabase
      .from('play_history')
      .select('*')
      .order('played_at', { ascending: false })
      .limit(1000) // 限制数量避免数据过多

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录（基于用户ID、歌曲ID和播放时间）
        const existingHistory = await database
          .get('play_history')
          .query(
            Q.where('user_id', item.user_id),
            Q.where('song_id', item.song_id),
            Q.where('played_at', Q.gte(new Date(item.played_at).getTime() - 60000)), // 1分钟内
            Q.where('played_at', Q.lte(new Date(item.played_at).getTime() + 60000))
          )
          .fetch()

        if (existingHistory.length === 0) {
          // 不存在相同记录，直接创建
          await database.get('play_history').create((record: any) => {
            record.userId = item.user_id
            record.songId = item.song_id
            record.songName = item.song_name
            record.artist = item.artist
            record.album = item.album
            record.source = item.source
            record.playDuration = item.play_duration
            record.totalDuration = item.total_duration
            record.completed = item.completed
            record.playedAt = new Date(item.played_at)
            record.synced = true
          })
        }
      }
    })
  }

  // 下载播放统计（带冲突解决）
  private async downloadPlayStatisticsWithConflictResolution() {
    const { data, error } = await supabase
      .from('play_statistics')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingStats = await database
          .get('play_statistics')
          .query(
            Q.where('user_id', item.user_id),
            Q.where('song_id', item.song_id)
          )
          .fetch()

        if (existingStats.length > 0) {
          // 存在冲突，使用冲突解决器
          const localData = existingStats[0]
          const serverData = {
            playCount: item.play_count,
            totalDuration: item.total_duration,
            lastPlayedAt: new Date(item.last_played_at),
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'startup'
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.playCount = resolvedData.playCount || record.playCount
            record.totalDuration = resolvedData.totalDuration || record.totalDuration
            record.lastPlayedAt = resolvedData.lastPlayedAt || record.lastPlayedAt
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('play_statistics').create((stat: any) => {
            stat.userId = item.user_id
            stat.songId = item.song_id
            stat.songName = item.song_name
            stat.artist = item.artist
            stat.playCount = item.play_count
            stat.totalDuration = item.total_duration
            stat.lastPlayedAt = new Date(item.last_played_at)
            stat.createdAt = new Date(item.created_at)
            stat.updatedAt = new Date(item.updated_at)
            stat.synced = true
          })
        }
      }
    })
  }

  // 下载应用设置（带冲突解决）
  private async downloadAppSettingsWithConflictResolution() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingSettings = await database
          .get('app_settings')
          .query(Q.where('user_id', item.user_id))
          .fetch()

        if (existingSettings.length > 0) {
          // 存在冲突，使用冲突解决器
          const localData = existingSettings[0]
          const serverData = {
            audioQuality: item.audio_quality,
            downloadQuality: item.download_quality,
            autoPlay: item.auto_play,
            shuffleMode: item.shuffle_mode,
            repeatMode: item.repeat_mode,
            wifiOnlyDownload: item.wifi_only_download,
            wifiOnlyStream: item.wifi_only_stream,
            enableNotifications: item.enable_notifications,
            notifyNewFollower: item.notify_new_follower,
            notifyNewComment: item.notify_new_comment,
            notifyNewLike: item.notify_new_like,
            notifyVipExpire: item.notify_vip_expire,
            showOnlineStatus: item.show_online_status,
            showListening: item.show_listening,
            theme: item.theme,
            language: item.language,
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'startup'
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.audioQuality = resolvedData.audioQuality || record.audioQuality
            record.downloadQuality = resolvedData.downloadQuality || record.downloadQuality
            record.autoPlay = resolvedData.autoPlay !== undefined ? resolvedData.autoPlay : record.autoPlay
            record.shuffleMode = resolvedData.shuffleMode !== undefined ? resolvedData.shuffleMode : record.shuffleMode
            record.repeatMode = resolvedData.repeatMode || record.repeatMode
            record.wifiOnlyDownload = resolvedData.wifiOnlyDownload !== undefined ? resolvedData.wifiOnlyDownload : record.wifiOnlyDownload
            record.wifiOnlyStream = resolvedData.wifiOnlyStream !== undefined ? resolvedData.wifiOnlyStream : record.wifiOnlyStream
            record.enableNotifications = resolvedData.enableNotifications !== undefined ? resolvedData.enableNotifications : record.enableNotifications
            record.notifyNewFollower = resolvedData.notifyNewFollower !== undefined ? resolvedData.notifyNewFollower : record.notifyNewFollower
            record.notifyNewComment = resolvedData.notifyNewComment !== undefined ? resolvedData.notifyNewComment : record.notifyNewComment
            record.notifyNewLike = resolvedData.notifyNewLike !== undefined ? resolvedData.notifyNewLike : record.notifyNewLike
            record.notifyVipExpire = resolvedData.notifyVipExpire !== undefined ? resolvedData.notifyVipExpire : record.notifyVipExpire
            record.showOnlineStatus = resolvedData.showOnlineStatus !== undefined ? resolvedData.showOnlineStatus : record.showOnlineStatus
            record.showListening = resolvedData.showListening !== undefined ? resolvedData.showListening : record.showListening
            record.theme = resolvedData.theme || record.theme
            record.language = resolvedData.language || record.language
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('app_settings').create((setting: any) => {
            setting.userId = item.user_id
            setting.audioQuality = item.audio_quality
            setting.downloadQuality = item.download_quality
            setting.autoPlay = item.auto_play
            setting.shuffleMode = item.shuffle_mode
            setting.repeatMode = item.repeat_mode
            setting.wifiOnlyDownload = item.wifi_only_download
            setting.wifiOnlyStream = item.wifi_only_stream
            setting.enableNotifications = item.enable_notifications
            setting.notifyNewFollower = item.notify_new_follower
            setting.notifyNewComment = item.notify_new_comment
            setting.notifyNewLike = item.notify_new_like
            setting.notifyVipExpire = item.notify_vip_expire
            setting.showOnlineStatus = item.show_online_status
            setting.showListening = item.show_listening
            setting.theme = item.theme
            setting.language = item.language
            setting.createdAt = new Date(item.created_at)
            setting.updatedAt = new Date(item.updated_at)
            setting.synced = true
          })
        }
      }
    })
  }

  // 下载用户资料（带冲突解决）
  private async downloadUserProfilesWithConflictResolution() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingProfiles = await database
          .get('user_profiles')
          .query(Q.where('user_id', item.user_id))
          .fetch()

        if (existingProfiles.length > 0) {
          // 存在冲突，使用冲突解决器
          const localData = existingProfiles[0]
          const serverData = {
            username: item.username,
            displayName: item.display_name,
            email: item.email,
            avatarUrl: item.avatar_url,
            bio: item.bio,
            gender: item.gender,
            birthday: item.birthday ? new Date(item.birthday) : undefined,
            location: item.location,
            website: item.website,
            totalPlayTime: item.total_play_time,
            totalSongs: item.total_songs,
            totalPlaylists: item.total_playlists,
            followingCount: item.following_count,
            followersCount: item.followers_count,
            isPublic: item.is_public,
            showPlayHistory: item.show_play_history,
            showPlaylists: item.show_playlists,
            vipStatus: item.vip_status,
            vipExpireAt: item.vip_expire_at ? new Date(item.vip_expire_at) : undefined,
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'startup'
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.username = resolvedData.username || record.username
            record.displayName = resolvedData.displayName || record.displayName
            record.email = resolvedData.email || record.email
            record.avatarUrl = resolvedData.avatarUrl || record.avatarUrl
            record.bio = resolvedData.bio || record.bio
            record.gender = resolvedData.gender || record.gender
            record.birthday = resolvedData.birthday || record.birthday
            record.location = resolvedData.location || record.location
            record.website = resolvedData.website || record.website
            record.totalPlayTime = resolvedData.totalPlayTime || record.totalPlayTime
            record.totalSongs = resolvedData.totalSongs || record.totalSongs
            record.totalPlaylists = resolvedData.totalPlaylists || record.totalPlaylists
            record.followingCount = resolvedData.followingCount || record.followingCount
            record.followersCount = resolvedData.followersCount || record.followersCount
            record.isPublic = resolvedData.isPublic !== undefined ? resolvedData.isPublic : record.isPublic
            record.showPlayHistory = resolvedData.showPlayHistory !== undefined ? resolvedData.showPlayHistory : record.showPlayHistory
            record.showPlaylists = resolvedData.showPlaylists !== undefined ? resolvedData.showPlaylists : record.showPlaylists
            record.vipStatus = resolvedData.vipStatus || record.vipStatus
            record.vipExpireAt = resolvedData.vipExpireAt || record.vipExpireAt
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('user_profiles').create((profile: any) => {
            profile.userId = item.user_id
            profile.username = item.username
            profile.displayName = item.display_name
            profile.email = item.email
            profile.avatarUrl = item.avatar_url
            profile.bio = item.bio
            profile.gender = item.gender
            profile.birthday = item.birthday ? new Date(item.birthday) : undefined
            profile.location = item.location
            profile.website = item.website
            profile.totalPlayTime = item.total_play_time
            profile.totalSongs = item.total_songs
            profile.totalPlaylists = item.total_playlists
            profile.followingCount = item.following_count
            profile.followersCount = item.followers_count
            profile.isPublic = item.is_public
            profile.showPlayHistory = item.show_play_history
            profile.showPlaylists = item.show_playlists
            profile.vipStatus = item.vip_status
            profile.vipExpireAt = item.vip_expire_at ? new Date(item.vip_expire_at) : undefined
            profile.createdAt = new Date(item.created_at)
            profile.updatedAt = new Date(item.updated_at)
            profile.synced = true
          })
        }
      }
    })
  }

  // ==================== 用户操作优先的下载方法 ====================

  // 下载收藏（用户操作优先）
  private async downloadFavoritesWithUserPriority() {
    const { data, error } = await supabase
      .from('favorite_songs')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingFavorites = await database
          .get('favorites')
          .query(
            Q.where('user_id', item.user_id),
            Q.where('song_id', item.song_id)
          )
          .fetch()

        if (existingFavorites.length > 0) {
          // 存在冲突，使用用户操作优先的冲突解决器
          const localData = existingFavorites[0]
          const serverData = {
            songName: item.song_name,
            artist: item.artist,
            album: item.album,
            source: item.source,
            coverUrl: item.cover_url,
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'user_action' // 用户操作优先
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.songName = resolvedData.songName || record.songName
            record.artist = resolvedData.artist || record.artist
            record.album = resolvedData.album || record.album
            record.source = resolvedData.source || record.source
            record.coverUrl = resolvedData.coverUrl || record.coverUrl
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = resolvedData.synced !== undefined ? resolvedData.synced : true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('favorites').create((favorite: any) => {
            favorite.userId = item.user_id
            favorite.songId = item.song_id
            favorite.songName = item.song_name
            favorite.artist = item.artist
            favorite.album = item.album
            favorite.source = item.source
            favorite.coverUrl = item.cover_url
            favorite.createdAt = new Date(item.created_at)
            favorite.updatedAt = new Date(item.updated_at)
            favorite.synced = true
          })
        }
      }
    })
  }

  // 下载歌单（用户操作优先）
  private async downloadPlaylistsWithUserPriority() {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('is_deleted', false)

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingPlaylists = await database
          .get('playlists')
          .query(
            Q.where('user_id', item.user_id),
            Q.where('name', item.name)
          )
          .fetch()

        if (existingPlaylists.length > 0) {
          // 存在冲突，使用用户操作优先的冲突解决器
          const localData = existingPlaylists[0]
          const serverData = {
            description: item.description,
            isPublic: item.is_public,
            songCount: item.song_count,
            playCount: item.play_count,
            likeCount: item.like_count,
            commentCount: item.comment_count,
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'user_action' // 用户操作优先
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.description = resolvedData.description || record.description
            record.isPublic = resolvedData.isPublic !== undefined ? resolvedData.isPublic : record.isPublic
            record.songCount = resolvedData.songCount || record.songCount
            record.playCount = resolvedData.playCount || record.playCount
            record.likeCount = resolvedData.likeCount || record.likeCount
            record.commentCount = resolvedData.commentCount || record.commentCount
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = resolvedData.synced !== undefined ? resolvedData.synced : true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('playlists').create((playlist: any) => {
            playlist.userId = item.user_id
            playlist.name = item.name
            playlist.description = item.description
            playlist.isPublic = item.is_public
            playlist.songCount = item.song_count
            playlist.playCount = item.play_count
            playlist.likeCount = item.like_count
            playlist.commentCount = item.comment_count
            playlist.isDeleted = item.is_deleted
            playlist.createdAt = new Date(item.created_at)
            playlist.updatedAt = new Date(item.updated_at)
            playlist.synced = true
          })
        }
      }
    })
  }

  // 下载播放历史（用户操作优先）
  private async downloadPlayHistoryWithUserPriority() {
    const { data, error } = await supabase
      .from('play_history')
      .select('*')
      .order('played_at', { ascending: false })
      .limit(1000)

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录（基于用户ID、歌曲ID和播放时间）
        const existingHistory = await database
          .get('play_history')
          .query(
            Q.where('user_id', item.user_id),
            Q.where('song_id', item.song_id),
            Q.where('played_at', Q.gte(new Date(item.played_at).getTime() - 60000)), // 1分钟内
            Q.where('played_at', Q.lte(new Date(item.played_at).getTime() + 60000))
          )
          .fetch()

        if (existingHistory.length === 0) {
          // 不存在相同记录，直接创建
          await database.get('play_history').create((record: any) => {
            record.userId = item.user_id
            record.songId = item.song_id
            record.songName = item.song_name
            record.artist = item.artist
            record.album = item.album
            record.source = item.source
            record.playDuration = item.play_duration
            record.totalDuration = item.total_duration
            record.completed = item.completed
            record.playedAt = new Date(item.played_at)
            record.synced = true
          })
        }
      }
    })
  }

  // 下载播放统计（用户操作优先）
  private async downloadPlayStatisticsWithUserPriority() {
    const { data, error } = await supabase
      .from('play_statistics')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingStats = await database
          .get('play_statistics')
          .query(
            Q.where('user_id', item.user_id),
            Q.where('song_id', item.song_id)
          )
          .fetch()

        if (existingStats.length > 0) {
          // 存在冲突，使用用户操作优先的冲突解决器
          const localData = existingStats[0]
          const serverData = {
            playCount: item.play_count,
            totalDuration: item.total_duration,
            lastPlayedAt: new Date(item.last_played_at),
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'user_action' // 用户操作优先
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.playCount = resolvedData.playCount || record.playCount
            record.totalDuration = resolvedData.totalDuration || record.totalDuration
            record.lastPlayedAt = resolvedData.lastPlayedAt || record.lastPlayedAt
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = resolvedData.synced !== undefined ? resolvedData.synced : true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('play_statistics').create((stat: any) => {
            stat.userId = item.user_id
            stat.songId = item.song_id
            stat.songName = item.song_name
            stat.artist = item.artist
            stat.playCount = item.play_count
            stat.totalDuration = item.total_duration
            stat.lastPlayedAt = new Date(item.last_played_at)
            stat.createdAt = new Date(item.created_at)
            stat.updatedAt = new Date(item.updated_at)
            stat.synced = true
          })
        }
      }
    })
  }

  // 下载应用设置（用户操作优先）
  private async downloadAppSettingsWithUserPriority() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingSettings = await database
          .get('app_settings')
          .query(Q.where('user_id', item.user_id))
          .fetch()

        if (existingSettings.length > 0) {
          // 存在冲突，使用用户操作优先的冲突解决器
          const localData = existingSettings[0]
          const serverData = {
            audioQuality: item.audio_quality,
            downloadQuality: item.download_quality,
            autoPlay: item.auto_play,
            shuffleMode: item.shuffle_mode,
            repeatMode: item.repeat_mode,
            wifiOnlyDownload: item.wifi_only_download,
            wifiOnlyStream: item.wifi_only_stream,
            enableNotifications: item.enable_notifications,
            notifyNewFollower: item.notify_new_follower,
            notifyNewComment: item.notify_new_comment,
            notifyNewLike: item.notify_new_like,
            notifyVipExpire: item.notify_vip_expire,
            showOnlineStatus: item.show_online_status,
            showListening: item.show_listening,
            theme: item.theme,
            language: item.language,
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'user_action' // 用户操作优先
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.audioQuality = resolvedData.audioQuality || record.audioQuality
            record.downloadQuality = resolvedData.downloadQuality || record.downloadQuality
            record.autoPlay = resolvedData.autoPlay !== undefined ? resolvedData.autoPlay : record.autoPlay
            record.shuffleMode = resolvedData.shuffleMode !== undefined ? resolvedData.shuffleMode : record.shuffleMode
            record.repeatMode = resolvedData.repeatMode || record.repeatMode
            record.wifiOnlyDownload = resolvedData.wifiOnlyDownload !== undefined ? resolvedData.wifiOnlyDownload : record.wifiOnlyDownload
            record.wifiOnlyStream = resolvedData.wifiOnlyStream !== undefined ? resolvedData.wifiOnlyStream : record.wifiOnlyStream
            record.enableNotifications = resolvedData.enableNotifications !== undefined ? resolvedData.enableNotifications : record.enableNotifications
            record.notifyNewFollower = resolvedData.notifyNewFollower !== undefined ? resolvedData.notifyNewFollower : record.notifyNewFollower
            record.notifyNewComment = resolvedData.notifyNewComment !== undefined ? resolvedData.notifyNewComment : record.notifyNewComment
            record.notifyNewLike = resolvedData.notifyNewLike !== undefined ? resolvedData.notifyNewLike : record.notifyNewLike
            record.notifyVipExpire = resolvedData.notifyVipExpire !== undefined ? resolvedData.notifyVipExpire : record.notifyVipExpire
            record.showOnlineStatus = resolvedData.showOnlineStatus !== undefined ? resolvedData.showOnlineStatus : record.showOnlineStatus
            record.showListening = resolvedData.showListening !== undefined ? resolvedData.showListening : record.showListening
            record.theme = resolvedData.theme || record.theme
            record.language = resolvedData.language || record.language
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = resolvedData.synced !== undefined ? resolvedData.synced : true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('app_settings').create((setting: any) => {
            setting.userId = item.user_id
            setting.audioQuality = item.audio_quality
            setting.downloadQuality = item.download_quality
            setting.autoPlay = item.auto_play
            setting.shuffleMode = item.shuffle_mode
            setting.repeatMode = item.repeat_mode
            setting.wifiOnlyDownload = item.wifi_only_download
            setting.wifiOnlyStream = item.wifi_only_stream
            setting.enableNotifications = item.enable_notifications
            setting.notifyNewFollower = item.notify_new_follower
            setting.notifyNewComment = item.notify_new_comment
            setting.notifyNewLike = item.notify_new_like
            setting.notifyVipExpire = item.notify_vip_expire
            setting.showOnlineStatus = item.show_online_status
            setting.showListening = item.show_listening
            setting.theme = item.theme
            setting.language = item.language
            setting.createdAt = new Date(item.created_at)
            setting.updatedAt = new Date(item.updated_at)
            setting.synced = true
          })
        }
      }
    })
  }

  // 下载用户资料（用户操作优先）
  private async downloadUserProfilesWithUserPriority() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) return

    await database.write(async () => {
      for (const item of data) {
        // 查找本地是否存在相同记录
        const existingProfiles = await database
          .get('user_profiles')
          .query(Q.where('user_id', item.user_id))
          .fetch()

        if (existingProfiles.length > 0) {
          // 存在冲突，使用用户操作优先的冲突解决器
          const localData = existingProfiles[0]
          const serverData = {
            username: item.username,
            displayName: item.display_name,
            email: item.email,
            avatarUrl: item.avatar_url,
            bio: item.bio,
            gender: item.gender,
            birthday: item.birthday ? new Date(item.birthday) : undefined,
            location: item.location,
            website: item.website,
            totalPlayTime: item.total_play_time,
            totalSongs: item.total_songs,
            totalPlaylists: item.total_playlists,
            followingCount: item.following_count,
            followersCount: item.followers_count,
            isPublic: item.is_public,
            showPlayHistory: item.show_play_history,
            showPlaylists: item.show_playlists,
            vipStatus: item.vip_status,
            vipExpireAt: item.vip_expire_at ? new Date(item.vip_expire_at) : undefined,
            updatedAt: new Date(item.updated_at),
            createdAt: new Date(item.created_at)
          }

          const resolvedData = await conflictResolver.resolveConflict(
            localData,
            serverData,
            'user_action' // 用户操作优先
          )

          // 更新本地数据
          await (localData as any).update((record: any) => {
            record.username = resolvedData.username || record.username
            record.displayName = resolvedData.displayName || record.displayName
            record.email = resolvedData.email || record.email
            record.avatarUrl = resolvedData.avatarUrl || record.avatarUrl
            record.bio = resolvedData.bio || record.bio
            record.gender = resolvedData.gender || record.gender
            record.birthday = resolvedData.birthday || record.birthday
            record.location = resolvedData.location || record.location
            record.website = resolvedData.website || record.website
            record.totalPlayTime = resolvedData.totalPlayTime || record.totalPlayTime
            record.totalSongs = resolvedData.totalSongs || record.totalSongs
            record.totalPlaylists = resolvedData.totalPlaylists || record.totalPlaylists
            record.followingCount = resolvedData.followingCount || record.followingCount
            record.followersCount = resolvedData.followersCount || record.followersCount
            record.isPublic = resolvedData.isPublic !== undefined ? resolvedData.isPublic : record.isPublic
            record.showPlayHistory = resolvedData.showPlayHistory !== undefined ? resolvedData.showPlayHistory : record.showPlayHistory
            record.showPlaylists = resolvedData.showPlaylists !== undefined ? resolvedData.showPlaylists : record.showPlaylists
            record.vipStatus = resolvedData.vipStatus || record.vipStatus
            record.vipExpireAt = resolvedData.vipExpireAt || record.vipExpireAt
            record.updatedAt = resolvedData.updatedAt || record.updatedAt
            record.synced = resolvedData.synced !== undefined ? resolvedData.synced : true
          })
        } else {
          // 不存在冲突，直接创建
          await database.get('user_profiles').create((profile: any) => {
            profile.userId = item.user_id
            profile.username = item.username
            profile.displayName = item.display_name
            profile.email = item.email
            profile.avatarUrl = item.avatar_url
            profile.bio = item.bio
            profile.gender = item.gender
            profile.birthday = item.birthday ? new Date(item.birthday) : undefined
            profile.location = item.location
            profile.website = item.website
            profile.totalPlayTime = item.total_play_time
            profile.totalSongs = item.total_songs
            profile.totalPlaylists = item.total_playlists
            profile.followingCount = item.following_count
            profile.followersCount = item.followers_count
            profile.isPublic = item.is_public
            profile.showPlayHistory = item.show_play_history
            profile.showPlaylists = item.show_playlists
            profile.vipStatus = item.vip_status
            profile.vipExpireAt = item.vip_expire_at ? new Date(item.vip_expire_at) : undefined
            profile.createdAt = new Date(item.created_at)
            profile.updatedAt = new Date(item.updated_at)
            profile.synced = true
          })
        }
      }
    })
  }

  // 更新同步状态
  private async updateSyncStatus() {
    try {
      const unsyncedCounts = await syncStatusManager.getUnsyncedDataCount()
      const totalUnsynced = Object.values(unsyncedCounts).reduce((sum, count) => sum + count, 0)
      
      syncStatusManager.updatePendingUploads(totalUnsynced)
      syncStatusManager.updatePendingDownloads(0) // 下载数量在下载过程中更新
    } catch (error) {
      console.error('[SyncEngine] 更新同步状态失败:', error)
    }
  }

  // 获取同步状态
  getSyncStatus() {
    return syncStatusManager.getStatus()
  }

  // 订阅同步状态变化
  subscribeToSyncStatus(listener: (status: any) => void) {
    return syncStatusManager.subscribe(listener)
  }

  // 手动触发同步
  async triggerManualSync() {
    console.log('[SyncEngine] 手动触发同步')
    await this.performUserActionSync()
  }

  // 强制同步所有数据
  async forceSyncAll() {
    console.log('[SyncEngine] 强制同步所有数据')
    syncStatusManager.startSync('强制同步')
    
    try {
      // 检查用户登录状态
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('[SyncEngine] 用户未登录，跳过强制同步')
        syncStatusManager.endSync()
        return
      }

      // 先上传所有本地数据
      await this.uploadUnsyncedData()
      
      // 再下载所有服务器数据
      await this.downloadServerData()

      console.log('[SyncEngine] 强制同步完成')
      syncStatusManager.endSync()
    } catch (error) {
      console.error('[SyncEngine] 强制同步失败:', error)
      syncStatusManager.addSyncError(`强制同步失败: ${(error as Error).message}`)
      syncStatusManager.endSync()
    }
  }
}

// 创建全局同步引擎实例
export const syncEngine = new SyncEngine()
