import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  user_id: string
  type: 'follow' | 'comment' | 'like' | 'system' | 'vip_expire'
  title: string
  content: string
  data?: any
  is_read: boolean
  created_at: string
  read_at?: string
}

export const notificationsAPI = {
  // 获取通知列表
  async getNotifications(limit = 20, offset = 0): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  },

  // 获取未读通知数量
  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  },

  // 标记为已读
  async markAsRead(notificationId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // 标记全部为已读
  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error
  },

  // 删除通知
  async deleteNotification(notificationId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // 创建系统通知
  async createSystemNotification(title: string, content: string, data?: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'system',
        title,
        content,
        data,
      })

    if (error) throw error
  },

  // 订阅实时通知
  async subscribeToNotifications(callback: (notification: Notification) => void) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return () => {}

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  },
}
