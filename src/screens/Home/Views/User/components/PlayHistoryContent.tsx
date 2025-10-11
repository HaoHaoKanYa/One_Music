import React, { useState } from 'react'
import { View, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'

const PlayHistoryContentComponent: React.FC<{ playHistory: any[] }> = ({ playHistory }) => {
  const theme = useTheme()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const stats = {
    total_plays: playHistory?.length || 0,
    total_duration: playHistory?.reduce((sum, record) => sum + (record.playDuration || 0), 0) || 0,
    completed_plays: playHistory?.filter(record => record.completed).length || 0,
    unique_songs: new Set(playHistory?.map(record => record.songId)).size || 0,
  }

  const handleClearHistory = () => {
    Alert.alert('确认', '确定要清空所有播放历史吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          try {
            await database.write(async () => {
              const allHistory = await database.get('play_history').query().fetch()
              for (const record of allHistory) {
                await record.destroyPermanently()
              }
            })
          } catch (error: any) {
            Alert.alert('错误', error.message || '清空历史失败')
          }
        },
      },
    ])
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.historyItem, { borderBottomColor: theme['c-border'] }]}>
      <View style={styles.songInfo}>
        <Text style={styles.songName} color={theme['c-font']} numberOfLines={1}>
          {item.songName}
        </Text>
        <Text style={styles.artist} color={theme['c-font-label']} numberOfLines={1}>
          {item.artist || '未知歌手'}
        </Text>
      </View>
      <View style={styles.playInfo}>
        <Text style={styles.playTime} color={theme['c-font-label']}>
          {formatDate(item.playedAt)}
        </Text>
        {item.playDuration && (
          <Text style={styles.duration} color={theme['c-font-label']}>
            {formatDuration(item.playDuration)}
          </Text>
        )}
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.statsContainer, { backgroundColor: theme['c-primary-light-100'] }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-font']}>
            {stats.total_plays}
          </Text>
          <Text style={styles.statLabel} color={theme['c-font-label']}>
            总播放
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-font']}>
            {stats.unique_songs}
          </Text>
          <Text style={styles.statLabel} color={theme['c-font-label']}>
            不同歌曲
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue} color={theme['c-font']}>
            {Math.floor(stats.total_duration / 60)}
          </Text>
          <Text style={styles.statLabel} color={theme['c-font-label']}>
            总时长(分)
          </Text>
        </View>
      </View>

      <View style={[styles.header, { borderBottomColor: theme['c-border'] }]}>
        <Text style={styles.count} color={theme['c-font-label']}>
          播放记录
        </Text>
        {playHistory.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearBtn} color={theme['c-danger']}>
              清空历史
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={playHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="music_time" size={48} color={theme['c-300']} />
            <Text style={styles.emptyText} color={theme['c-300']}>
              暂无播放记录
            </Text>
          </View>
        }
      />
    </View>
  )
}

const enhance = withObservables([], () => ({
  playHistory: database
    .get('play_history')
    .query(Q.sortBy('played_at', Q.desc))
    .observe(),
}))

export default enhance(PlayHistoryContentComponent)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  count: {
    fontSize: 14,
  },
  clearBtn: {
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 15,
    marginBottom: 4,
  },
  artist: {
    fontSize: 13,
  },
  playInfo: {
    alignItems: 'flex-end',
  },
  playTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  duration: {
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
})
