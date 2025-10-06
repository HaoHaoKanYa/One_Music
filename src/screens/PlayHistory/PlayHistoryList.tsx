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
import { playHistoryAPI } from '@/services/api'
import type { PlayRecord } from '@/services/api/playHistory'

interface PlayHistoryListProps {
  onSongPress?: (record: PlayRecord) => void
}

export const PlayHistoryListScreen: React.FC<PlayHistoryListProps> = ({
  onSongPress,
}) => {
  const [history, setHistory] = useState<PlayRecord[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      const [historyData, statsData] = await Promise.all([
        playHistoryAPI.getPlayHistory({ limit: 100 }),
        playHistoryAPI.getPlayStats(),
      ])
      setHistory(historyData)
      setStats(statsData)
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载播放历史失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleRefresh = () => {
    setRefreshing(true)
    loadHistory()
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
              await playHistoryAPI.clearPlayHistory()
              setHistory([])
              setStats(null)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const renderHistoryItem = ({ item }: { item: PlayRecord }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => onSongPress?.(item)}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songName} numberOfLines={1}>
          {item.song_name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={styles.playTime}>
          {formatDate(item.played_at)} · {formatDuration(item.play_duration || 0)}
        </Text>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    )
  }

  return (
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

        {history.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
          >
            <Text style={styles.clearButtonText}>清空历史</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={history.length === 0 ? styles.emptyContainer : undefined}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#282828',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B3B3B3',
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 4,
  },
  playTime: {
    fontSize: 12,
    color: '#666666',
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
    color: '#B3B3B3',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#666666',
  },
})
