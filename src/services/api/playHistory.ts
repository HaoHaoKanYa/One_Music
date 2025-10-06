import { supabase } from '../../lib/supabase'

export interface PlayRecord {
  id?: string
  user_id?: string
  song_id: string
  song_name: string
  artist: string
  album?: string
  source: string
  play_duration: number
  total_duration?: number
  completed?: boolean
  played_at?: string
  device_type?: string
  device_id?: string
}

/**
 * 播放历史服务
 */
export const playHistoryAPI = {
  /**
   * 添加播放记录
   */
  addPlayRecord: async (record: PlayRecord) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('play_history')
      .insert({
        ...record,
        user_id: user.id,
        completed: record.completed || false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 批量添加播放记录
   */
  addPlayRecords: async (records: PlayRecord[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const recordsWithUserId = records.map(record => ({
      ...record,
      user_id: user.id,
    }))

    const { data, error } = await supabase
      .from('play_history')
      .insert(recordsWithUserId)
      .select()

    if (error) throw error
    return data || []
  },

  /**
   * 获取播放历史
   */
  getPlayHistory: async (params?: {
    limit?: number
    offset?: number
    dateFrom?: string
    dateTo?: string
    search?: string
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { limit = 50, offset = 0, dateFrom, dateTo, search } = params || {}

    let query = supabase
      .from('play_history')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })

    if (dateFrom) {
      query = query.gte('played_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('played_at', dateTo)
    }
    if (search) {
      query = query.or(`song_name.ilike.%${search}%,artist.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * 获取最近播放
   */
  getRecentPlays: async (limit: number = 50) => {
    return playHistoryAPI.getPlayHistory({ limit })
  },

  /**
   * 获取今日播放
   */
  getTodayPlays: async () => {
    const today = new Date().toISOString().split('T')[0]
    return playHistoryAPI.getPlayHistory({
      dateFrom: today,
      dateTo: today,
    })
  },

  /**
   * 清除播放历史
   */
  clearPlayHistory: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('play_history')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
  },

  /**
   * 清除指定日期范围的播放历史
   */
  clearPlayHistoryByDateRange: async (dateFrom: string, dateTo: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('play_history')
      .delete()
      .eq('user_id', user.id)
      .gte('played_at', dateFrom)
      .lte('played_at', dateTo)

    if (error) throw error
  },

  /**
   * 获取播放统计
   */
  getPlayStats: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('play_history')
      .select('play_duration')
      .eq('user_id', user.id)

    if (error) throw error

    const totalPlayTime = data?.reduce((sum, record) => sum + record.play_duration, 0) || 0
    const totalPlayCount = data?.length || 0

    return {
      totalPlayTime,
      totalPlayCount,
    }
  },
}
