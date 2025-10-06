import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-url-polyfill/auto'

// Supabase 配置
const supabaseUrl = 'https://wzfgdzgskpbcogwfmuqf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Zmdkemdza3BiY29nd2ZtdXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTQxMTAsImV4cCI6MjA3NTIzMDExMH0.H_TcDZrhTt3aCjepfUztLWheaLvKJzwMjUpP7dsChnc'

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})

// 测试连接函数
export const testSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1)

        if (error) {
            console.log('❌ Supabase 连接失败:', error.message)
            return false
        }

        console.log('✅ Supabase 连接成功！')
        return true
    } catch (error) {
        console.error('❌ Supabase 连接错误:', error)
        return false
    }
}
