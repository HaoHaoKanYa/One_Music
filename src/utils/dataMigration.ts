import AsyncStorage from '@react-native-async-storage/async-storage'
import { favoritesAPI, playHistoryAPI, playlistsAPI } from '@/services/api'

interface LocalSong {
  id: string
  name: string
  artist: string
  source?: string
  [key: string]: any
}

interface LocalPlayRecord {
  songId: string
  songName: string
  artist: string
  playedAt: string
  duration?: number
  [key: string]: any
}

interface LocalPlaylist {
  id: string
  name: string
  description?: string
  songs: LocalSong[]
  [key: string]: any
}

interface MigrationResult {
  success: boolean
  favorites: { total: number; migrated: number; failed: number }
  playHistory: { total: number; migrated: number; failed: number }
  playlists: { total: number; migrated: number; failed: number }
  errors: string[]
}

export class DataMigration {
  private errors: string[] = []

  async migrateFavorites(): Promise<{ total: number; migrated: number; failed: number }> {
    try {
      const favoritesJson = await AsyncStorage.getItem('favorites')
      if (!favoritesJson) {
        return { total: 0, migrated: 0, failed: 0 }
      }

      const localFavorites: LocalSong[] = JSON.parse(favoritesJson)
      const total = localFavorites.length
      let migrated = 0
      let failed = 0

      for (const song of localFavorites) {
        try {
          await favoritesAPI.addFavorite({
            song_id: song.id,
            song_name: song.name,
            artist: song.artist,
            source: song.source || 'local',
          })
          migrated++
        } catch (error: any) {
          failed++
          this.errors.push(`收藏迁移失败: ${song.name} - ${error.message}`)
        }
      }

      return { total, migrated, failed }
    } catch (error: any) {
      this.errors.push(`读取本地收藏失败: ${error.message}`)
      return { total: 0, migrated: 0, failed: 0 }
    }
  }

  async migratePlayHistory(): Promise<{ total: number; migrated: number; failed: number }> {
    try {
      const historyJson = await AsyncStorage.getItem('playHistory')
      if (!historyJson) {
        return { total: 0, migrated: 0, failed: 0 }
      }

      const localHistory: LocalPlayRecord[] = JSON.parse(historyJson)
      const total = localHistory.length
      let migrated = 0
      let failed = 0

      const records = localHistory.map(record => ({
        song_id: record.songId,
        song_name: record.songName,
        artist: record.artist,
        source: 'local',
        play_duration: record.duration || 0,
        played_at: record.playedAt,
      }))

      try {
        await playHistoryAPI.addPlayRecords(records)
        migrated = total
      } catch (error: any) {
        failed = total
        this.errors.push(`批量迁移播放历史失败: ${error.message}`)
      }

      return { total, migrated, failed }
    } catch (error: any) {
      this.errors.push(`读取本地播放历史失败: ${error.message}`)
      return { total: 0, migrated: 0, failed: 0 }
    }
  }

  async migratePlaylists(): Promise<{ total: number; migrated: number; failed: number }> {
    try {
      const playlistsJson = await AsyncStorage.getItem('playlists')
      if (!playlistsJson) {
        return { total: 0, migrated: 0, failed: 0 }
      }

      const localPlaylists: LocalPlaylist[] = JSON.parse(playlistsJson)
      const total = localPlaylists.length
      let migrated = 0
      let failed = 0

      for (const playlist of localPlaylists) {
        try {
          const newPlaylist = await playlistsAPI.createPlaylist({
            name: playlist.name,
            description: playlist.description,
          })

          if (playlist.songs && playlist.songs.length > 0) {
            const songs = playlist.songs.map(song => ({
              song_id: song.id,
              song_name: song.name,
              artist: song.artist,
              source: song.source || 'local',
            }))
            await playlistsAPI.addSongsToPlaylist(newPlaylist.id, songs)
          }

          migrated++
        } catch (error: any) {
          failed++
          this.errors.push(`歌单迁移失败: ${playlist.name} - ${error.message}`)
        }
      }

      return { total, migrated, failed }
    } catch (error: any) {
      this.errors.push(`读取本地歌单失败: ${error.message}`)
      return { total: 0, migrated: 0, failed: 0 }
    }
  }

  async migrateAll(): Promise<MigrationResult> {
    this.errors = []

    const [favorites, playHistory, playlists] = await Promise.all([
      this.migrateFavorites(),
      this.migratePlayHistory(),
      this.migratePlaylists(),
    ])

    const success = 
      favorites.failed === 0 && 
      playHistory.failed === 0 && 
      playlists.failed === 0

    return {
      success,
      favorites,
      playHistory,
      playlists,
      errors: this.errors,
    }
  }

  async clearLocalData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem('favorites'),
      AsyncStorage.removeItem('playHistory'),
      AsyncStorage.removeItem('playlists'),
    ])
  }
}

export const dataMigration = new DataMigration()
