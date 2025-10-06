import { supabase } from '../../lib/supabase'

export interface Playlist {
  id?: string
  user_id?: string
  name: string
  description?: string
  cover_url?: string
  is_public?: boolean
  is_deleted?: boolean
  song_count?: number
  play_count?: number
  like_count?: number
  comment_count?: number
  created_at?: string
  updated_at?: string
}

export interface PlaylistSong {
  id?: string
  playlist_id?: string
  song_id: string
  song_name: string
  artist: string
  album?: string
  duration?: number
  source: string
  cover_url?: string
  sort_order?: number
  added_at?: string
}

/**
 * 歌单服务
 */
export const playlistsAPI = {
  /**
   * 获取用户歌单列表
   */
  getPlaylists: async (params?: {
    userId?: string
    isPublic?: boolean
    limit?: number
    offset?: number
    search?: string
  }) => {
    const { userId, isPublic, limit = 50, offset = 0, search } = params || {}

    let query = supabase
      .from('playlists')
      .select('*')
      .eq('is_deleted', false)

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * 获取当前用户的歌单
   */
  getMyPlaylists: async () => {
    return playlistsAPI.getPlaylists({})
  },

  /**
   * 获取公开歌单
   */
  getPublicPlaylists: async (limit: number = 20) => {
    return playlistsAPI.getPlaylists({
      isPublic: true,
      limit,
    })
  },

  /**
   * 获取歌单详情
   */
  getPlaylist: async (playlistId: string) => {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .eq('is_deleted', false)
      .single()

    if (error) throw error
    return data
  },

  /**
   * 创建歌单
   */
  createPlaylist: async (playlist: Playlist) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('playlists')
      .insert({
        ...playlist,
        user_id: user.id,
        is_public: playlist.is_public || false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 更新歌单
   */
  updatePlaylist: async (playlistId: string, updates: Partial<Playlist>) => {
    const { data, error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', playlistId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 删除歌单（软删除）
   */
  deletePlaylist: async (playlistId: string) => {
    const { error } = await supabase
      .from('playlists')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', playlistId)

    if (error) throw error
  },

  /**
   * 获取歌单中的歌曲
   */
  getPlaylistSongs: async (playlistId: string) => {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * 添加歌曲到歌单
   */
  addSongToPlaylist: async (playlistId: string, song: PlaylistSong) => {
    // 获取当前最大排序号
    const { data: songs } = await supabase
      .from('playlist_songs')
      .select('sort_order')
      .eq('playlist_id', playlistId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxOrder = songs && songs.length > 0 ? songs[0].sort_order : 0

    const { data, error } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id: playlistId,
        ...song,
        sort_order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 批量添加歌曲到歌单
   */
  addSongsToPlaylist: async (playlistId: string, songs: PlaylistSong[]) => {
    const { data: existingSongs } = await supabase
      .from('playlist_songs')
      .select('sort_order')
      .eq('playlist_id', playlistId)
      .order('sort_order', { ascending: false })
      .limit(1)

    let maxOrder = existingSongs && existingSongs.length > 0 ? existingSongs[0].sort_order : 0

    const songsWithOrder = songs.map((song) => ({
      playlist_id: playlistId,
      ...song,
      sort_order: ++maxOrder,
    }))

    const { data, error } = await supabase
      .from('playlist_songs')
      .insert(songsWithOrder)
      .select()

    if (error) throw error
    return data || []
  },

  /**
   * 从歌单移除歌曲
   */
  removeSongFromPlaylist: async (playlistId: string, songId: string, source: string) => {
    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId)
      .eq('source', source)

    if (error) throw error
  },

  /**
   * 更新歌曲排序
   */
  updateSongOrder: async (
    playlistId: string,
    songOrders: { id: string; sort_order: number }[]
  ) => {
    const promises = songOrders.map((item) =>
      supabase
        .from('playlist_songs')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('playlist_id', playlistId)
    )

    const results = await Promise.all(promises)
    const errors = results.filter((r) => r.error)

    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} songs`)
    }
  },
}
