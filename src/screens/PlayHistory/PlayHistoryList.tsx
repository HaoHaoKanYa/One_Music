import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { RequireAuth } from '@/components/common/RequireAuth'

interface PlayRecord {
  id: string
  songId: string
  songName: string
  artist?: string
  playedAt: Date
  playDuration?: number
  totalDuration?: number
  completed: boolean
}

interface PlayHistoryListProps {
  componentId: string
  onSongPress?: (record: any) => void
}

const PlayHistoryListScreenComponent: React.FC<PlayHistoryListProps & {
  playHistory: any[]
}> = ({ componentId, onSongPress, playHistory }) => {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    // 本地数据库数据是实时的，不需要重新加载
    setTimeout(() => setRefreshing(false), 500)
  }

  // 计算统计数据
  const stats = {
    total_plays: playHistory?.length || 0,
    total_duration: playHistory?.reduce((sum, record) => sum + (record.playDuration || 0), 0) || 0,
    completed_plays: playHistory?.filter(record => record.completed).length || 0,
    unique_songs: new Set(playHistory?.map(record => record.songId)).size || 0
  }

  const handleClearHistory = () => {
    Alert.alert(
      '确认',
      '确定要清空所有播放历史吗？此操作不可恢复。',
      [
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
      ]
    )
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
    return date.toLocaleDateString('zh-CN')
  }

  const handlePlayAll = async () => {
    if (playHistory.length === 0) {
      Alert.alert('提示', '播放历史为空')
      return
    }
    // TODO: 实现播放全部功能
    Alert.alert('提示', '播放全部功能开发中')
  }

  const renderHistoryItem = ({ item, index }: { item: PlayRecord; index: number }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => onSongPress?.(item)}
      activeOpacity={0.6}
    >
      <Text style={styles.historyIndex}>{index + 1}</Text>
      <Text style={styles.songName} numberOfLines={1}>
        {item.songName}
      </Text>
      <Text style={styles.artistName} numberOfLines={1}>
        {item.artist || '未知'}
      </Text>
      <Text style={styles.playTime} numberOfLines={1}>
        {formatDate(item.playedAt)}
      </Text>
    </TouchableOpacity>
  )

  return (
    <RequireAuth componentId={componentId}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>播放历史</Text>
        
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_plays}</Text>
              <Text style={styles.statLabel}>总播放</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.unique_songs}</Text>
              <Text style={styles.statLabel}>不同歌曲</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.floor((stats.total_duration || 0) / 60)}
              </Text>
              <Text style={styles.statLabel}>总时长(分钟)</Text>
            </View>
          </View>
        )}

        {playHistory.length > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearHistory}
            >
              <Text style={styles.clearButtonText}>清空历史</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.playAllButton}
              onPress={handlePlayAll}
            >
              <Text style={styles.playAllText}>▶ 播放全部</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={playHistory}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={playHistory.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>还没有播放记录</Text>
            <Text style={styles.emptyHint}>开始播放音乐吧</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
      </View>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  playAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  historyIndex: {
    width: 28,
    fontSize: 15,
    color: '#999',
    fontWeight: '600',
    textAlign: 'left',
  },
  songName: {
    flex: 2,
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
    marginRight: 12,
  },
  artistName: {
    flex: 1.5,
    fontSize: 13,
    color: '#999',
    marginRight: 12,
  },
  playTime: {
    flex: 1,
    fontSize: 13,
    color: '#999',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#BBB',
  },
})

// 使用withObservables包装组件，实现响应式数据
const PlayHistoryListScreen = withObservables([], () => ({
  playHistory: database.get('play_history')
    .query()
    .observe()
}))(PlayHistoryListScreenComponent)

export { PlayHistoryListScreen }
