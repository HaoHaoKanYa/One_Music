import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native'
import { downloadManager } from '@/services/downloadManager'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'

interface DownloadItem {
  id: string
  songId: string
  songName: string
  artist: string
  downloadStatus: 'downloading' | 'completed' | 'failed' | 'paused'
  progress: number
  fileSize: number
  filePath: string
}

export default function DownloadsContent() {
  const theme = useTheme()
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'downloading' | 'completed'>('all')

  const loadDownloads = async () => {
    try {
      const allDownloads = await downloadManager.getAllDownloads()
      setDownloads(allDownloads as any)
    } catch (error) {
      console.error('[DownloadsContent] 加载下载列表失败:', error)
    }
  }

  useEffect(() => {
    loadDownloads()

    // 监听下载列表更新
    const handleUpdate = () => {
      loadDownloads()
    }

    global.app_event.downloadListUpdate = handleUpdate

    return () => {
      global.app_event.downloadListUpdate = undefined
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDownloads()
    setRefreshing(false)
  }

  const handleDelete = (item: DownloadItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除"${item.songName}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await downloadManager.deleteDownloadedSong(item.songId)
              await loadDownloads()
            } catch (error: any) {
              Alert.alert('错误', error.message || '删除失败')
            }
          },
        },
      ]
    )
  }

  const handlePause = async (item: DownloadItem) => {
    try {
      await downloadManager.pauseDownload(item.songId)
      await loadDownloads()
    } catch (error: any) {
      Alert.alert('错误', error.message || '暂停失败')
    }
  }

  const handleCancel = (item: DownloadItem) => {
    Alert.alert(
      '确认取消',
      `确定要取消下载"${item.songName}"吗？`,
      [
        { text: '否', style: 'cancel' },
        {
          text: '是',
          style: 'destructive',
          onPress: async () => {
            try {
              await downloadManager.cancelDownload(item.songId)
              await loadDownloads()
            } catch (error: any) {
              Alert.alert('错误', error.message || '取消失败')
            }
          },
        },
      ]
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'downloading':
        return '下载中'
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      case 'paused':
        return '已暂停'
      default:
        return '未知'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return '#4ECDC4'
      case 'completed':
        return '#4CAF50'
      case 'failed':
        return '#F44336'
      case 'paused':
        return '#FF9800'
      default:
        return '#999'
    }
  }

  const filteredDownloads = downloads.filter(item => {
    if (filter === 'all') return true
    if (filter === 'downloading') return item.downloadStatus === 'downloading'
    if (filter === 'completed') return item.downloadStatus === 'completed'
    return true
  })

  const renderDownloadItem = ({ item }: { item: DownloadItem }) => (
    <View style={[styles.downloadItem, { backgroundColor: '#FFFFFF' }]}>
      <View style={styles.itemInfo}>
        <Text style={styles.songName} numberOfLines={1}>
          {item.songName}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.artist}
        </Text>
        <View style={styles.statusRow}>
          <Text style={[styles.status, { color: getStatusColor(item.downloadStatus) }]}>
            {getStatusText(item.downloadStatus)}
          </Text>
          {item.downloadStatus === 'downloading' && (
            <Text style={styles.progress}>{item.progress}%</Text>
          )}
          {item.downloadStatus === 'completed' && (
            <Text style={styles.fileSize}>{formatFileSize(item.fileSize)}</Text>
          )}
        </View>
        {item.downloadStatus === 'downloading' && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.progress}%`, backgroundColor: '#4ECDC4' },
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {item.downloadStatus === 'downloading' && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePause(item)}
            >
              <Text style={{ color: '#FF9800', fontSize: 18 }}>⏸</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCancel(item)}
            >
              <Text style={{ color: '#F44336', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </>
        )}
        {item.downloadStatus === 'completed' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Text style={{ color: '#F44336', fontSize: 18 }}>🗑</Text>
          </TouchableOpacity>
        )}
        {item.downloadStatus === 'failed' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Text style={{ color: '#F44336', fontSize: 18 }}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* 筛选标签 */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && { backgroundColor: '#4ECDC4' },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && { color: '#FFF' },
            ]}
          >
            全部 ({downloads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'downloading' && { backgroundColor: '#4ECDC4' },
          ]}
          onPress={() => setFilter('downloading')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'downloading' && { color: '#FFF' },
            ]}
          >
            下载中 ({downloads.filter(d => d.downloadStatus === 'downloading').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'completed' && { backgroundColor: '#4ECDC4' },
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'completed' && { color: '#FFF' },
            ]}
          >
            已完成 ({downloads.filter(d => d.downloadStatus === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 下载列表 */}
      <FlatList
        data={filteredDownloads}
        renderItem={renderDownloadItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          filteredDownloads.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 64, color: '#CCC' }}>📥</Text>
            <Text style={styles.emptyText}>暂无下载</Text>
            <Text style={styles.emptyHint}>
              {filter === 'all'
                ? '开始下载你喜欢的音乐吧'
                : filter === 'downloading'
                ? '当前没有正在下载的歌曲'
                : '还没有完成的下载'}
            </Text>
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
    backgroundColor: '#FFFFFF',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#F5F5F5',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
  },
  downloadItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  songName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  artist: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  progress: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#BBB',
  },
})
