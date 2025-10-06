import { supabase } from '../../lib/supabase'

/**
 * 认证服务
 */
export const authAPI = {
  /**
   * 用户注册
   */
  signUp: async (params: {
    email: string
    password: string
    username: string
    displayName?: string
  }) => {
    const { email, password, username, displayName } = params

    // 1. 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: displayName || username },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('注册失败')

    // 2. 创建用户资料
    const { error: profileError } = await supabase.from('user_profiles').insert({
      user_id: authData.user.id,
      username,
      display_name: displayName || username,
      email,
    })

    if (profileError) throw profileError

    // 3. 创建默认设置
    const { error: settingsError } = await supabase
      .from('app_settings')
      .insert({ user_id: authData.user.id })

    if (settingsError) throw settingsError

    return authData
  },

  /**
   * 用户登录
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  /**
   * 退出登录
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * 获取当前用户
   */
  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error
    return user
  },

  /**
   * 获取当前会话
   */
  getCurrentSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) throw error
    return session
  },

  /**
   * 重置密码
   */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'com.onemusic://auth/reset-password',
    })

    if (error) throw error
  },

  /**
   * 更新密码
   */
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  },
}
