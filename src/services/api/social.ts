import { supabase } from '@/lib/supabase'

// ========================================
// 关注系统 API
// ========================================

export const followAPI = {
  // 关注用户
  async followUser(userId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: userId,
      })

    if (error) throw error
  },

  // 取消关注
  async unfollowUser(userId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId)

    if (error) throw error
  },

  // 检查是否关注
  async isFollowing(userId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single()

    return !!data && !error
  },

  // 获取关注列表
  async getFollowing(userId?: string, limit = 50, offset = 0) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('未登录')

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following_id,
        created_at,
        user_profiles!user_follows_following_id_fkey(*)
      `)
      .eq('follower_id', targetUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  // 获取粉丝列表
  async getFollowers(userId?: string, limit = 50, offset = 0) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('未登录')

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower_id,
        created_at,
        user_profiles!user_follows_follower_id_fkey(*)
      `)
      .eq('following_id', targetUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },
}

// ========================================
// 评论系统 API
// ========================================

export const commentAPI = {
  // 发表评论
  async createComment(targetType: string, targetId: string, content: string, parentId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        content,
        parent_id: parentId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 获取评论列表
  async getComments(targetType: string, targetId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user_profiles(user_id, username, display_name, avatar_url)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .is('parent_id', null)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  // 获取回复列表
  async getReplies(commentId: string, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user_profiles(user_id, username, display_name, avatar_url)
      `)
      .eq('parent_id', commentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  // 删除评论
  async deleteComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)
      .eq('user_id', user.id)

    if (error) throw error
  },
}

// ========================================
// 点赞系统 API
// ========================================

export const likeAPI = {
  // 点赞
  async like(targetType: string, targetId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
      })

    if (error) throw error
  },

  // 取消点赞
  async unlike(targetType: string, targetId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)

    if (error) throw error
  },

  // 检查是否已点赞
  async isLiked(targetType: string, targetId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .single()

    return !!data && !error
  },

  // 获取点赞数
  async getLikeCount(targetType: string, targetId: string): Promise<number> {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId)

    if (error) throw error
    return count || 0
  },
}
