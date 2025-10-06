import { supabase } from '@/lib/supabase'

export interface VipPlan {
  id: string
  name: string
  type: 'vip' | 'svip'
  duration_days: number
  price: number
  original_price?: number
  features: any
  is_active: boolean
  sort_order: number
}

export interface Order {
  id: string
  user_id: string
  order_no: string
  plan_id?: string
  plan_name: string
  plan_type: string
  duration_days: number
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  payment_method?: string
  payment_time?: string
  created_at: string
}

export const vipAPI = {
  // 获取会员套餐列表
  async getPlans(): Promise<VipPlan[]> {
    const { data, error } = await supabase
      .from('vip_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return data || []
  },

  // 创建订单
  async createOrder(planId: string): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // 获取套餐信息
    const { data: plan, error: planError } = await supabase
      .from('vip_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) throw planError

    // 生成订单号
    const orderNo = `OM${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_no: orderNo,
        plan_id: planId,
        plan_name: plan.name,
        plan_type: plan.type,
        duration_days: plan.duration_days,
        amount: plan.price,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 获取订单列表
  async getOrders(limit = 20, offset = 0): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  },

  // 获取订单详情
  async getOrder(orderId: string): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return data
  },

  // 取消订单
  async cancelOrder(orderId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (error) throw error
  },

  // 模拟支付（实际项目中需要对接支付网关）
  async mockPayment(orderId: string, paymentMethod: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // 获取订单信息
    const order = await this.getOrder(orderId)

    // 更新订单状态
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_method: paymentMethod,
        payment_time: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (orderError) throw orderError

    // 更新用户会员状态
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + order.duration_days)

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        vip_status: order.plan_type,
        vip_expire_at: expireDate.toISOString(),
      })
      .eq('user_id', user.id)

    if (profileError) throw profileError
  },
}
