/**
 * Supabase Edge Functions 客户端 SDK
 * 用于在 React Native 中调用 Supabase Edge Functions
 */

import { supabase } from '../lib/supabase'

const FUNCTIONS_URL = 'https://wzfgdzgskpbcogwfmuqf.supabase.co/functions/v1'

/**
 * 调用 Edge Function 的通用方法
 */
async function invokeFunction<T = any>(
  functionName: string,
  body?: any,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<T> {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  let url = `${FUNCTIONS_URL}/${functionName}`
  if (method === 'GET' && body) {
    const params = new URLSearchParams(body)
    url += `?${params.toString()}`
  }

  const response = await fetch(url, options)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || '请求失败')
  }

  return data.data
}

/**
 * 认证相关 API
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
    return invokeFunction('sign-up', params)
  },

  /**
   * 用户登录
   */
  signIn: async (params: { email: string; password: string }) => {
    return invokeFunction('sign-in', params)
  },
}

/**
 * 用户资料相关 API
 */
export const profileAPI = {
  /**
   * 获取当前用户资料
   */
  getProfile: async () => {
    return invokeFunction('get-profile', {}, 'GET')
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
  }) => {
    return invokeFunction('update-profile', updates)
  },
}

/**
 * 收藏歌曲相关 API
 */
export const favoritesAPI = {
  /**
   * 获取收藏列表
   */
  getFavorites: async (params?: {
    limit?: number
    offset?: number
    search?: string
  }) => {
    return invokeFunction('get-favorites', params, 'GET')
  },

  /**
   * 添加收藏
   */
  addFavorite: async (song: {
    song_id: string
    song_name: string
    artist: string
    album?: string
    duration?: number
    source: string
    cover_url?: string
  }) => {
    return invokeFunction('add-favorite', song)
  },

  /**
   * 移除收藏
   */
  removeFavorite: async (params: { song_id: string; source: string }) => {
    return invokeFunction('remove-favorite', params)
  },
}

/**
 * 统一导出
 */
export const supabaseAPI = {
  auth: authAPI,
  profile: profileAPI,
  favorites: favoritesAPI,
}
