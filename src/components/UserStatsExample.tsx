import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { withObservables } from '@nozbe/watermelondb/hooks'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'

interface UserStatsProps {
  userId: string
}

const UserStatsComponent = ({ favorites, playlists, playHistory }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 我的数据</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favorites?.length || 0}</Text>
          <Text style={styles.statLabel}>收藏歌曲</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{playlists?.length || 0}</Text>
          <Text style={styles.statLabel}>创建歌单</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{playHistory?.length || 0}</Text>
          <Text style={styles.statLabel}>播放历史</Text>
        </View>
      </View>
    </View>
  )
}

// 使用withObservables包装组件，实现响应式数据
const UserStats = withObservables(['userId'], ({ userId }: UserStatsProps) => ({
  favorites: database.get('favorites')
    .query(Q.where('user_id', userId))
    .observe(),
  playlists: database.get('playlists')
    .query(
      Q.where('user_id', userId),
      Q.where('is_deleted', false)
    )
    .observe(),
  playHistory: database.get('play_history')
    .query(Q.where('user_id', userId))
    .observe()
}))(UserStatsComponent)

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
})

export default UserStats
