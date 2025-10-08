import { View, StyleSheet } from 'react-native'
import { useState, useEffect } from 'react'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { supabase } from '@/lib/supabase'

const UserStatsComponent = ({ favorites, playlists, playHistory }: any) => {
  const theme = useTheme()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    checkAuth()
    
    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsLoggedIn(true)
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    } catch (error) {
      setIsLoggedIn(false)
    }
  }

  // 如果未登录，显示 0
  const displayValue = (value: number) => isLoggedIn ? value : 0

  return (
    <View style={styles.container}>
      <Text style={styles.title} color={theme['c-font']}>📊 我的数据</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-primary-font']}>
            {displayValue(favorites?.length || 0)}
          </Text>
          <Text style={styles.statLabel} color={theme['c-350']}>收藏歌曲</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-primary-font']}>
            {displayValue(playlists?.length || 0)}
          </Text>
          <Text style={styles.statLabel} color={theme['c-350']}>创建歌单</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-primary-font']}>
            {displayValue(playHistory?.length || 0)}
          </Text>
          <Text style={styles.statLabel} color={theme['c-350']}>播放历史</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 12,
    backgroundColor: 'rgba(248, 249, 250, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(232, 232, 232, 0.5)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
})

// 使用withObservables包装组件，实现响应式数据
const UserStats = withObservables([], () => ({
  favorites: database.get('favorites')
    .query()
    .observe(),
  playlists: database.get('playlists')
    .query(Q.where('is_deleted', false))
    .observe(),
  playHistory: database.get('play_history')
    .query()
    .observe()
}))(UserStatsComponent)

export default UserStats
