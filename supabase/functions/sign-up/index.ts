import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, username, displayName } = await req.json()

    // 创建 Supabase 客户端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. 注册用户
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || username,
        },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('注册失败')

    // 2. 创建用户资料
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        username,
        display_name: displayName || username,
        email,
        is_public: true,
        show_play_history: true,
        show_playlists: true,
        vip_status: 'free',
      })

    if (profileError) throw profileError

    // 3. 创建默认设置
    const { error: settingsError } = await supabaseClient
      .from('app_settings')
      .insert({ user_id: authData.user.id })

    if (settingsError) throw settingsError

    return new Response(
      JSON.stringify({
        success: true,
        data: authData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
