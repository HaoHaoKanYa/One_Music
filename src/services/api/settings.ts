import { supabase } from '@/lib/supabase'

export interface AppSettings {
  user_id: string
  audio_quality: 'low' | 'standard' | 'high' | 'lossless'
  download_quality: 'low' | 'standard' | 'high' | 'lossless'
  auto_play: boolean
  shuffle_mode: boolean
  repeat_mode: 'off' | 'one' | 'all'
  wifi_only_download: boolean
  wifi_only_stream: boolean
  enable_notifications: boolean
  notify_new_follower: boolean
  notify_new_comment: boolean
  notify_new_like: boolean
  notify_vip_expire: boolean
  show_online_status: boolean
  show_listening: boolean
  theme: 'auto' | 'light' | 'dark'
  language: string
  created_at: string
  updated_at: string
}

export const settingsAPI = {
  // 获取当前用户设置
  async getSettings(): Promise<AppSettings> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // 如果设置不存在，创建默认设置
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('app_settings')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (createError) throw createError
        return newSettings
      }
      throw error
    }

    return data
  },

  // 更新单个设置项
  async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<AppSettings> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('app_settings')
      .update({ [key]: value })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 批量更新设置
  async updateSettings(updates: Partial<Omit<AppSettings, 'user_id' | 'created_at' | 'updated_at'>>): Promise<AppSettings> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('app_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 重置为默认设置
  async resetSettings(): Promise<AppSettings> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const defaultSettings = {
      audio_quality: 'standard' as const,
      download_quality: 'standard' as const,
      auto_play: true,
      shuffle_mode: false,
      repeat_mode: 'off' as const,
      wifi_only_download: true,
      wifi_only_stream: false,
      enable_notifications: true,
      notify_new_follower: true,
      notify_new_comment: true,
      notify_new_like: true,
      notify_vip_expire: true,
      show_online_status: true,
      show_listening: true,
      theme: 'auto' as const,
      language: 'zh-CN',
    }

    const { data, error } = await supabase
      .from('app_settings')
      .update(defaultSettings)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
