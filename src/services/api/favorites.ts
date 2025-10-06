import { supabase } from '../../lib/supabase'

export interface FavoriteSong {
  id?: string
  user_id?: string
  song_id: string
  song_name: string
  artist: string
  album?: string
  duration?: number
  source: string
  cover_url?: string
  quality?: string
  created_at?: string
}

/**
 * 收藏歌曲服务
 */
export const favoritesAPI = {
  /**
   * 获取收藏歌曲列表
   */
  getFavorites: async (params?: {
    limit?: number
    offset?: number
    search?: string
    sortBy?: 'created_at' | 'song_name' | 'artist'
    sortOrder?: 'asc' | 'desc'
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const {
      limit = 50,
      offset = 0,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params || {}

    let query = supabase.from('favorite_songs').select('*').eq('user_id', user.id)

    if (search) {
      query = query.or(`song_name.ilike.%${search}%,artist.ilike.%${search}%`)
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    query = query.range(offset, offset + limit - 1)

    const { data, error} = await query

    if (error) throw error
    return data || []
  },

  /**
   * 获取收藏总数
   */
  getFavoritesCount: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
      .from('favorite_songs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) throw error
    return count || 0
  },

  /**
   * 检查歌曲是否已收藏
   */
  isFavorited: async (songId: string, source: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('favorite_songs')
      .select('id')
      .eq('user_id', user.id)
      .eq('song_id', songId)
      .eq('source', source)
      .maybeSingle()

    if (error) throw error
    return !!data
  },

  /**
   * 添加收藏
   */
  addFavorite: async (song: FavoriteSong) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('favorite_songs')
      .insert({
        ...song,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 批量添加收藏
   */
  addFavorites: async (songs: FavoriteSong[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const songsWithUserId = songs.map(song => ({
      ...song,
      user_id: user.id,
    }))

    const { data, error } = await supabase
      .from('favorite_songs')
      .insert(songsWithUserId)
      .select()

    if (error) throw error
    return data || []
  },

  /**
   * 移除收藏
   */
  removeFavorite: async (songId: string, source: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('favorite_songs')
      .delete()
      .eq('user_id', user.id)
      .eq('song_id', songId)
      .eq('source', source)

    if (error) throw error
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite: async (song: FavoriteSong) => {
    const isFavorited = await favoritesAPI.isFavorited(song.song_id, song.source)

    if (isFavorited) {
      await favoritesAPI.removeFavorite(song.song_id, song.source)
      return false
    } else {
      await favoritesAPI.addFavorite(song)
      return true
    }
  },

  /**
   * 清空收藏
   */
  clearFavorites: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('favorite_songs')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
  },
}
