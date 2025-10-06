import { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { favoritesAPI } from '@/services/api/favorites'
import { playHistoryAPI } from '@/services/api/playHistory'
import { playlistsAPI } from '@/services/api/playlists'

export default () => {
  const theme = useTheme()
  const [stats, setStats] = useState({
    favorites: 0,
    playlists: 0,
    history: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [favCount, playlistsData, historyStats] = await Promise.all([
        favoritesAPI.getFavoritesCount().catch(() => 0),
        playlistsAPI.getMyPlaylists().catch(() => []),
        playHistoryAPI.getPlayStats().catch(() => ({ total_plays: 0 })),
      ])

      setStats({
        favorites: favCount,
        playlists: playlistsData.length,
        history: (historyStats as any).total_plays || 0,
      })
    } catch (error) {
      console.log('加载统计失败:', error)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} color={theme['c-font']}>📊 我的数据</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-primary-font']}>{stats.favorites}</Text>
          <Text style={styles.statLabel} color={theme['c-350']}>收藏歌曲</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-primary-font']}>{stats.playlists}</Text>
          <Text style={styles.statLabel} color={theme['c-350']}>创建歌单</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-primary-font']}>{stats.history}</Text>
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
    backgroundColor: '#F8F9FA',
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
