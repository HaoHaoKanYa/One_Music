import { supabase } from '../../lib/supabase'

/**
 * 用户资料服务
 */
export const profileAPI = {
  /**
   * 获取当前用户资料
   */
  getCurrentProfile: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * 根据用户ID获取资料
   */
  getProfileById: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * 根据用户名获取资料
   */
  getProfileByUsername: async (username: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error) throw error
    return data
  },

  /**
   * 更新用户资料
   */
  updateProfile: async (updates: {
    display_name?: string
    bio?: string
    avatar_url?: string
    location?: string
    website?: string
    gender?: string
    birthday?: string
  }) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 上传头像
   */
  uploadAvatar: async (uri: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const fileExt = uri.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const response = await fetch(uri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(fileName)

    await profileAPI.updateProfile({ avatar_url: publicUrl })

    return publicUrl
  },

  /**
   * 搜索用户
   */
  searchUsers: async (query: string, limit: number = 20) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .eq('is_public', true)
      .order('followers_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },
}
