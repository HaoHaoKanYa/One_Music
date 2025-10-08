import { useDatabase } from '@nozbe/watermelondb/hooks'
import { Q } from '@nozbe/watermelondb'
import { useObservable } from '@nozbe/watermelondb/hooks'
import PlayHistory from '../models/PlayHistory'

export const usePlayHistory = (userId: string, limit: number = 50) => {
  const database = useDatabase()
  
  const history = useObservable(
    database.get('play_history')
      .query(
        Q.where('user_id', userId)
      )
      .observe()
  )

  return history?.slice(0, limit) || []
}

export const useRecentPlays = (userId: string, limit: number = 20) => {
  const database = useDatabase()
  
  const recentPlays = useObservable(
    database.get('play_history')
      .query(
        Q.where('user_id', userId)
      )
      .observe()
  )

  return recentPlays?.slice(0, limit) || []
}

export const useTodayPlays = (userId: string) => {
  const database = useDatabase()
  
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const todayPlays = useObservable(
    database.get('play_history')
      .query(
        Q.where('user_id', userId),
        Q.where('played_at', Q.gte(startOfDay.getTime())),
        Q.where('played_at', Q.lt(endOfDay.getTime()))
      )
      .observe()
  )

  return todayPlays || []
}

// 添加播放记录
export const addPlayRecord = async (
  userId: string,
  songId: string,
  songName: string,
  artist?: string,
  album?: string,
  source: string = 'local',
  playDuration?: number,
  totalDuration?: number,
  completed: boolean = false
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    await database.get('play_history').create(record => {
      record.userId = userId
      record.songId = songId
      record.songName = songName
      record.artist = artist
      record.album = album
      record.source = source
      record.playDuration = playDuration
      record.totalDuration = totalDuration
      record.completed = completed
      record.playedAt = new Date()
      record.synced = false
    })
  })
}

// 清除播放历史
export const clearPlayHistory = async (userId: string) => {
  const database = useDatabase()
  
  await database.write(async () => {
    const history = await database
      .get('play_history')
      .query(Q.where('user_id', userId))
      .fetch()

    for (const record of history) {
      await record.destroyPermanently()
    }
  })
}

// 清除指定日期范围的播放历史
export const clearPlayHistoryByDateRange = async (
  userId: string,
  dateFrom: Date,
  dateTo: Date
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    const history = await database
      .get('play_history')
      .query(
        Q.where('user_id', userId),
        Q.where('played_at', Q.gte(dateFrom.getTime())),
        Q.where('played_at', Q.lte(dateTo.getTime()))
      )
      .fetch()

    for (const record of history) {
      await record.destroyPermanently()
    }
  })
}

// 获取播放统计
export const usePlayStats = (userId: string) => {
  const database = useDatabase()
  
  const stats = useObservable(
    database.get('play_history')
      .query(Q.where('user_id', userId))
      .observe()
  )

  if (!stats) return { totalPlays: 0, totalDuration: 0, uniqueSongs: 0, uniqueArtists: 0 }

  const totalPlays = stats.length
  const totalDuration = stats.reduce((sum, record) => sum + (record.playDuration || 0), 0)
  const uniqueSongs = new Set(stats.map(r => r.songId)).size
  const uniqueArtists = new Set(stats.map(r => r.artist).filter(Boolean)).size

  return {
    totalPlays,
    totalDuration,
    uniqueSongs,
    uniqueArtists
  }
}
