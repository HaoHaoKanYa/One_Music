import { useDatabase } from '@nozbe/watermelondb/hooks'
import { Q } from '@nozbe/watermelondb'
import { useObservable } from '@nozbe/watermelondb/hooks'
import PlayStatistic from '../models/PlayStatistic'
import ArtistPlayStat from '../models/ArtistPlayStat'
import DailyPlayStat from '../models/DailyPlayStat'

// 播放统计相关Hooks
export const usePlayStatistics = (userId: string) => {
  const database = useDatabase()
  
  const statistics = useObservable(
    database.get('play_statistics')
      .query(Q.where('user_id', userId))
      .observe()
  )

  return statistics || []
}

export const useTopSongs = (userId: string, limit: number = 20) => {
  const database = useDatabase()
  
  const topSongs = useObservable(
    database.get('play_statistics')
      .query(Q.where('user_id', userId))
      .observe()
  )

  return topSongs
    ?.sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit) || []
}

export const useTopArtists = (userId: string, limit: number = 20) => {
  const database = useDatabase()
  
  const topArtists = useObservable(
    database.get('artist_play_stats')
      .query(Q.where('user_id', userId))
      .observe()
  )

  return topArtists
    ?.sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit) || []
}

export const useDailyStats = (userId: string, days: number = 30) => {
  const database = useDatabase()
  
  const dailyStats = useObservable(
    database.get('daily_play_stats')
      .query(Q.where('user_id', userId))
      .observe()
  )

  return dailyStats || []
}

// 更新播放统计
export const updatePlayStatistics = async (
  userId: string,
  songId: string,
  songName: string,
  artist?: string,
  source: string = 'local',
  duration: number = 0
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    // 查找现有统计记录
    const existingStats = await database
      .get('play_statistics')
      .query(
        Q.where('user_id', userId),
        Q.where('song_id', songId),
        Q.where('source', source)
      )
      .fetch()

    if (existingStats.length > 0) {
      // 更新现有记录
      const stat = existingStats[0]
      await stat.incrementPlayCount(duration)
    } else {
      // 创建新记录
      await database.get('play_statistics').create(stat => {
        stat.userId = userId
        stat.songId = songId
        stat.songName = songName
        stat.artist = artist
        stat.source = source
        stat.playCount = 1
        stat.totalDuration = duration
        stat.lastPlayedAt = new Date()
        stat.synced = false
      })
    }

    // 更新艺术家统计
    if (artist) {
      await updateArtistStats(userId, artist, duration)
    }

    // 更新每日统计
    await updateDailyStats(userId, duration)
  })
}

// 更新艺术家统计
export const updateArtistStats = async (
  userId: string,
  artist: string,
  duration: number = 0
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    // 查找现有艺术家统计
    const existingStats = await database
      .get('artist_play_stats')
      .query(
        Q.where('user_id', userId),
        Q.where('artist', artist)
      )
      .fetch()

    if (existingStats.length > 0) {
      // 更新现有记录
      const stat = existingStats[0]
      await stat.incrementPlay(duration)
    } else {
      // 创建新记录
      await database.get('artist_play_stats').create(stat => {
        stat.userId = userId
        stat.artist = artist
        stat.playCount = 1
        stat.totalDuration = duration
        stat.lastPlayedAt = new Date()
        stat.createdAt = new Date()
        stat.updatedAt = new Date()
        stat.synced = false
      })
    }
  })
}

// 更新每日统计
export const updateDailyStats = async (
  userId: string,
  duration: number = 0
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    const today = new Date().toISOString().split('T')[0]
    
    // 查找今日统计
    const existingStats = await database
      .get('daily_play_stats')
      .query(
        Q.where('user_id', userId),
        Q.where('date', today)
      )
      .fetch()

    if (existingStats.length > 0) {
      // 更新现有记录
      const stat = existingStats[0]
      await stat.incrementPlay(duration, true, true) // 假设每次都是新歌曲和新艺术家
    } else {
      // 创建新记录
      await database.get('daily_play_stats').create(stat => {
        stat.userId = userId
        stat.date = today
        stat.totalPlays = 1
        stat.totalDuration = duration
        stat.uniqueSongs = 1
        stat.uniqueArtists = 1
        stat.createdAt = new Date()
        stat.updatedAt = new Date()
        stat.synced = false
      })
    }
  })
}

// 获取总体统计
export const useOverallStats = (userId: string) => {
  const database = useDatabase()
  
  const playHistory = useObservable(
    database.get('play_history')
      .query(Q.where('user_id', userId))
      .observe()
  )

  const playStatistics = useObservable(
    database.get('play_statistics')
      .query(Q.where('user_id', userId))
      .observe()
  )

  const dailyStats = useObservable(
    database.get('daily_play_stats')
      .query(Q.where('user_id', userId))
      .observe()
  )

  if (!playHistory || !playStatistics || !dailyStats) {
    return {
      totalPlays: 0,
      totalDuration: 0,
      uniqueSongs: 0,
      uniqueArtists: 0,
      totalDays: 0,
      averagePlaysPerDay: 0
    }
  }

  const totalPlays = playHistory.length
  const totalDuration = playHistory.reduce((sum, record) => sum + (record.playDuration || 0), 0)
  const uniqueSongs = new Set(playHistory.map(r => r.songId)).size
  const uniqueArtists = new Set(playHistory.map(r => r.artist).filter(Boolean)).size
  const totalDays = dailyStats.length
  const averagePlaysPerDay = totalDays > 0 ? totalPlays / totalDays : 0

  return {
    totalPlays,
    totalDuration,
    uniqueSongs,
    uniqueArtists,
    totalDays,
    averagePlaysPerDay
  }
}
