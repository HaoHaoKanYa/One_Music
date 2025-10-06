import { supabase } from '@/lib/supabase'

export interface DailyStats {
  date: string
  total_plays: number
  total_duration: number
  unique_songs: number
  unique_artists: number
}

export interface ArtistStats {
  artist: string
  play_count: number
  total_duration: number
  last_played_at: string
}

export interface SongStats {
  song_id: string
  song_name: string
  artist: string
  album?: string
  source: string
  play_count: number
  total_duration: number
  last_played_at: string
  cover_url?: string
}

export const statisticsAPI = {
  // 获取每日播放统计
  async getDailyStats(days = 30): Promise<DailyStats[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // 使用本地时间计算日期范围
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days + 1)
    
    // 转换为UTC时间字符串用于查询
    const startDateStr = startDate.toISOString()

    console.log(`[getDailyStats] 查询范围: ${startDateStr} 到现在，共 ${days} 天`)

    // 从播放历史表实时计算
    const { data, error } = await supabase
      .from('play_history')
      .select('played_at, song_id, artist, play_duration')
      .eq('user_id', user.id)
      .gte('played_at', startDateStr)
      .order('played_at', { ascending: true })

    if (error) {
      console.error('[getDailyStats] 查询错误:', error)
      throw error
    }
    
    console.log(`[getDailyStats] 查询到 ${data?.length || 0} 条播放记录`)
    
    if (!data || data.length === 0) {
      console.log('[getDailyStats] 没有数据，返回空数组')
      return []
    }

    // 按本地日期分组统计（转换UTC时间到本地日期）
    const dailyMap = new Map<string, DailyStats>()

    data.forEach(record => {
      // 将UTC时间转换为本地日期
      const utcDate = new Date(record.played_at)
      const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000 + 8 * 3600000) // UTC+8
      const year = localDate.getFullYear()
      const month = String(localDate.getMonth() + 1).padStart(2, '0')
      const day = String(localDate.getDate()).padStart(2, '0')
      const date = `${year}-${month}-${day}`

      if (dailyMap.has(date)) {
        const stats = dailyMap.get(date)!
        stats.total_plays += 1
        stats.total_duration += record.play_duration || 0
      } else {
        dailyMap.set(date, {
          date,
          total_plays: 1,
          total_duration: record.play_duration || 0,
          unique_songs: 0,
          unique_artists: 0,
        })
      }
    })

    // 计算每天的唯一歌曲和歌手数
    dailyMap.forEach((stats, date) => {
      const dayRecords = data.filter(r => {
        const utcDate = new Date(r.played_at)
        const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000 + 8 * 3600000)
        const year = localDate.getFullYear()
        const month = String(localDate.getMonth() + 1).padStart(2, '0')
        const day = String(localDate.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}` === date
      })
      stats.unique_songs = new Set(dayRecords.map(r => r.song_id)).size
      stats.unique_artists = new Set(dayRecords.map(r => r.artist)).size
    })

    const result = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
    console.log('[getDailyStats] 统计结果:', result.map(d => `${d.date}: ${d.total_plays}次`).join(', '))
    
    return result
  },

  // 获取歌手播放统计
  async getArtistStats(limit = 20): Promise<ArtistStats[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // 从播放历史表实时计算
    const { data, error } = await supabase
      .from('play_history')
      .select('artist, play_duration, played_at')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })

    if (error) throw error
    if (!data || data.length === 0) return []

    // 按歌手分组统计
    const artistMap = new Map<string, ArtistStats>()

    data.forEach(record => {
      const artist = record.artist || '未知歌手'

      if (artistMap.has(artist)) {
        const stats = artistMap.get(artist)!
        stats.play_count += 1
        stats.total_duration += record.play_duration || 0
        // 更新最后播放时间（取最新的）
        if (new Date(record.played_at) > new Date(stats.last_played_at)) {
          stats.last_played_at = record.played_at
        }
      } else {
        artistMap.set(artist, {
          artist,
          play_count: 1,
          total_duration: record.play_duration || 0,
          last_played_at: record.played_at,
        })
      }
    })

    // 转换为数组并按播放次数排序
    return Array.from(artistMap.values())
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, limit)
  },

  // 获取歌曲播放统计
  async getSongStats(limit = 50): Promise<SongStats[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // 从播放历史表聚合统计数据
    const { data, error } = await supabase
      .from('play_history')
      .select('song_id, song_name, artist, album, source, play_duration, played_at')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })

    if (error) throw error
    if (!data || data.length === 0) return []

    // 按歌曲ID和来源分组统计
    const songMap = new Map<string, SongStats>()

    data.forEach(record => {
      const key = `${record.song_id}_${record.source}`

      if (songMap.has(key)) {
        const stats = songMap.get(key)!
        stats.play_count += 1
        stats.total_duration += record.play_duration || 0
        // 更新最后播放时间（取最新的）
        if (new Date(record.played_at) > new Date(stats.last_played_at)) {
          stats.last_played_at = record.played_at
        }
      } else {
        songMap.set(key, {
          song_id: record.song_id,
          song_name: record.song_name,
          artist: record.artist || '未知歌手',
          album: record.album,
          source: record.source,
          play_count: 1,
          total_duration: record.play_duration || 0,
          last_played_at: record.played_at,
        })
      }
    })

    // 转换为数组并按播放次数排序
    const songStats = Array.from(songMap.values())
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, limit)

    return songStats
  },

  // 更新每日统计（从播放历史计算）
  async updateDailyStats(date?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const targetDate = date || new Date().toISOString().split('T')[0]

    // 从播放历史计算统计数据
    const { data: history, error: historyError } = await supabase
      .from('play_history')
      .select('song_id, artist, play_duration')
      .eq('user_id', user.id)
      .gte('played_at', `${targetDate}T00:00:00`)
      .lt('played_at', `${targetDate}T23:59:59`)

    if (historyError) throw historyError

    if (!history || history.length === 0) return

    const uniqueSongs = new Set(history.map(h => h.song_id)).size
    const uniqueArtists = new Set(history.map(h => h.artist)).size
    const totalPlays = history.length
    const totalDuration = history.reduce((sum, h) => sum + (h.play_duration || 0), 0)

    // 插入或更新统计数据
    const { error } = await supabase
      .from('daily_play_stats')
      .upsert({
        user_id: user.id,
        date: targetDate,
        total_plays: totalPlays,
        total_duration: totalDuration,
        unique_songs: uniqueSongs,
        unique_artists: uniqueArtists,
      })

    if (error) throw error
  },

  // 更新歌手统计
  async updateArtistStats(artist: string, duration: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('artist_play_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist', artist)
      .single()

    if (existing) {
      // 更新现有记录
      const { error } = await supabase
        .from('artist_play_stats')
        .update({
          play_count: existing.play_count + 1,
          total_duration: existing.total_duration + duration,
          last_played_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // 创建新记录
      const { error } = await supabase
        .from('artist_play_stats')
        .insert({
          user_id: user.id,
          artist,
          play_count: 1,
          total_duration: duration,
          last_played_at: new Date().toISOString(),
        })

      if (error) throw error
    }
  },

  // 获取总体统计
  async getOverallStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // 获取总播放次数和时长
    const { data: playStats } = await supabase
      .from('play_history')
      .select('play_duration')
      .eq('user_id', user.id)

    const totalPlays = playStats?.length || 0
    const totalDuration = playStats?.reduce((sum, p) => sum + (p.play_duration || 0), 0) || 0

    // 获取收藏数
    const { count: favCount } = await supabase
      .from('favorite_songs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 获取歌单数
    const { count: playlistCount } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    return {
      total_plays: totalPlays,
      total_duration: totalDuration,
      total_favorites: favCount || 0,
      total_playlists: playlistCount || 0,
    }
  },
}
