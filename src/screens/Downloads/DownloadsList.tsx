import React, { useState } from 'react'
import { View, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { authAPI } from '@/services/api/auth'
import { RequireAuth } from '@/components/common/RequireAuth'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { downloadManager } from '@/services/downloadManager'
import { Icon } from '@/components/common/Icon'

interface DownloadsListProps {
  componentId: string
  downloads: any[]
}

const DownloadsListComponent: React.FC<DownloadsListProps> = ({ componentId, downloads }) => {
  const theme = useTheme()
  const t = useI18n()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleDelete = (item: any) => {
    Alert.alert(
      t('download_delete'),
      `确定要删除「${item.songName}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await downloadManager.deleteDownloadedSong(item.songId)
            } catch (error: any) {
              Alert.alert('错误', error.message || '删除失败')
            }
          },
        },
      ]
    )
  }

  const handlePause = async (item: any) => {
    try {
      await downloadManager.pauseDownload(item.songId)
    } catch (error: any) {
      Alert.alert('错误', error.message || '暂停失败')
    }
  }

  const handleCancel = (item: any) => {
    Alert.alert(
      t('download_cancel'),
      `确定要取消下载「${item.songName}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await downloadManager.cancelDownload(item.songId)
            } catch (error: any) {
              Alert.alert('错误', error.message || '取消失败')
            }
          },
        },
      ]
    )
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'downloading': return t('download_downloading')
      case 'completed': return t('download_completed')
      case 'failed': return t('download_failed')
      case 'paused': return t('download_paused')
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading': return theme['c-primary']
      case 'completed': return '#4CAF50'
      case 'failed': return '#F44336'
      case 'paused': return theme['c-font-label']
      default: return theme['c-font']
    }
  }

  const renderDownloadItem = ({ item, index }: { item: any; index: number }) => {
    const isDownloading = item.downloadStatus === 'downloading'
    const isCompleted = item.downloadStatus === 'completed'
    const isFailed = item.downloadStatus === 'failed'

    return (
      <View style={[styles.downloadItem, { borderBottomColor: theme['c-border-background'] }]}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemIndex} color={theme['c-font-label']}>{index + 1}</Text>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1} color={theme['c-font']}>
              {item.songName}
            </Text>
            <Text style={styles.itemArtist} numberOfLines={1} color={theme['c-font-label']}>
              {item.artist}
            </Text>
          </View>
        </View>

        <View style={styles.itemRight}>
          {isDownloading && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText} color={theme['c-primary']}>
                {item.progress}%
              </Text>
            </View>
          )}
          
          <Text style={styles.statusText} color={getStatusColor(item.downloadStatus)}>
            {getStatusText(item.downloadStatus)}
          </Text>

          <View style={styles.actions}>
            {isDownloading && (
              <>
                <TouchableOpacity onPress={() => handlePause(item)} style={styles.actionBtn}>
                  <Icon name="pause" size={16} color={theme['c-font-label']} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCancel(item)} style={styles.actionBtn}>
                  <Icon name="close" size={16} color={theme['c-font-label']} />
                </TouchableOpacity>
              </>
            )}
            {(isCompleted || isFailed) && (
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                <Icon name="delete" size={16} color={theme['c-font-label']} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <RequireAuth componentId={componentId}>
      <View style={[styles.container, { backgroundColor: theme['c-primary-background'] }]}>
        <View style={styles.header}>
          <Text style={styles.title} size={20} color={theme['c-font']}>
            {t('download_list')}
          </Text>
          <Text style={styles.count} color={theme['c-font-label']}>
            {downloads.length} 首
          </Text>
        </View>

        <FlatList
          data={downloads}
          renderItem={renderDownloadItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={downloads.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="download-2" size={64} color={theme['c-font-label']} />
              <Text style={styles.emptyText} color={theme['c-font-label']}>
                {t('download_empty')}
              </Text>
              <Text style={styles.emptyHint} color={theme['c-font-label']}>
                {t('download_empty_tip')}
              </Text>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  count: {
    fontSize: 14,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIndex: {
    width: 28,
    fontSize: 14,
    fontWeight: '600',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  itemName: {
    fontSize: 15,
    marginBottom: 4,
  },
  itemArtist: {
    fontSize: 13,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  progressContainer: {
    marginRight: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
  },
})

// 使用withObservables包装组件，实现响应式数据
export const DownloadsListScreen = withObservables([], () => ({
  downloads: database.get('downloaded_songs')
    .query(Q.sortBy('created_at', Q.desc))
    .observe()
}))(DownloadsListComponent)
