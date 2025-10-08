import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { RequireAuth } from '@/components/common/RequireAuth'

interface DataMigrationScreenProps {
  componentId: string
}

const DataMigrationScreenComponent: React.FC<DataMigrationScreenProps & {
  favorites: any[]
  playlists: any[]
  playHistory: any[]
  userProfiles: any[]
}> = ({ componentId, favorites, playlists, playHistory, userProfiles }) => {
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMigrate = async () => {
    Alert.alert(
      '确认同步',
      '这将把本地数据同步到云端。同步过程可能需要几分钟，请确保网络连接稳定。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '开始同步',
          onPress: async () => {
            setMigrating(true)
            setResult(null)

            try {
              // 导入同步引擎
              const { syncEngine } = require('@/database/sync/syncEngine')
              
              // 统计本地未同步数据
              const unsyncedFavorites = await database.get('favorites')
                .query(Q.where('synced', false))
                .fetch()
              const unsyncedPlaylists = await database.get('playlists')
                .query(Q.where('synced', false))
                .fetch()
              const unsyncedHistory = await database.get('play_history')
                .query(Q.where('synced', false))
                .fetch()

              const stats = {
                favorites: unsyncedFavorites.length,
                playlists: unsyncedPlaylists.length,
                playHistory: unsyncedHistory.length,
                userProfiles: userProfiles.length
              }

              console.log('[DataMigration] 开始同步，未同步数据:', stats)

              // 执行同步
              await syncEngine.performSync()

              // 再次统计未同步数据，确认同步结果
              const remainingFavorites = await database.get('favorites')
                .query(Q.where('synced', false))
                .fetch()
              const remainingPlaylists = await database.get('playlists')
                .query(Q.where('synced', false))
                .fetch()
              const remainingHistory = await database.get('play_history')
                .query(Q.where('synced', false))
                .fetch()

              const migrationResult = {
                success: remainingFavorites.length === 0 && 
                         remainingPlaylists.length === 0 && 
                         remainingHistory.length === 0,
                message: '数据同步完成',
                stats: stats,
                migrated: {
                  favorites: stats.favorites - remainingFavorites.length,
                  playlists: stats.playlists - remainingPlaylists.length,
                  playHistory: stats.playHistory - remainingHistory.length,
                  userProfiles: stats.userProfiles
                },
                failed: {
                  favorites: remainingFavorites.length,
                  playlists: remainingPlaylists.length,
                  playHistory: remainingHistory.length
                }
              }

              setResult(migrationResult)

              if (migrationResult.success) {
                Alert.alert('同步成功', '所有数据已成功同步到云端！')
                // 触发UI刷新
                global.app_event.favoritesUpdated()
                global.app_event.playlistsUpdated()
                global.app_event.playHistoryUpdated()
              } else {
                Alert.alert(
                  '同步完成',
                  `部分数据同步失败：\n收藏: ${migrationResult.failed.favorites} 条\n歌单: ${migrationResult.failed.playlists} 个\n播放历史: ${migrationResult.failed.playHistory} 条`,
                  [{ text: '确定' }]
                )
              }
            } catch (error: any) {
              console.error('[DataMigration] 同步失败:', error)
              Alert.alert('错误', error.message || '同步失败')
            } finally {
              setMigrating(false)
            }
          },
        },
      ]
    )
  }

  return (
    <RequireAuth componentId={componentId}>
      <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>数据同步</Text>
        <Text style={styles.description}>
          将本地存储的收藏、播放历史和歌单同步到云端，实现多设备数据同步。
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>同步内容：</Text>
          <Text style={styles.infoItem}>• 收藏的歌曲</Text>
          <Text style={styles.infoItem}>• 播放历史记录</Text>
          <Text style={styles.infoItem}>• 创建的歌单</Text>
          <Text style={styles.infoItem}>• 播放统计数据</Text>
          <Text style={styles.infoItem}>• 应用设置</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ 注意事项</Text>
          <Text style={styles.warningText}>
            • 同步过程需要稳定的网络连接{'\n'}
            • 数据量大时可能需要几分钟{'\n'}
            • 应用会自动定时同步（每5分钟）{'\n'}
            • 应用进入后台或退出时会自动同步{'\n'}
            • 冲突数据会按照时间戳自动合并
          </Text>
        </View>

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>
              {result.success ? '✅ 迁移成功' : '⚠️ 迁移完成（部分失败）'}
            </Text>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>收藏歌曲：</Text>
              <Text style={styles.resultValue}>
                {result.favorites.migrated}/{result.favorites.total} 成功
                {result.favorites.failed > 0 && ` (${result.favorites.failed} 失败)`}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>播放历史：</Text>
              <Text style={styles.resultValue}>
                {result.playHistory.migrated}/{result.playHistory.total} 成功
                {result.playHistory.failed > 0 && ` (${result.playHistory.failed} 失败)`}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>歌单：</Text>
              <Text style={styles.resultValue}>
                {result.playlists.migrated}/{result.playlists.total} 成功
                {result.playlists.failed > 0 && ` (${result.playlists.failed} 失败)`}
              </Text>
            </View>

            {result.errors.length > 0 && (
              <View style={styles.errorsBox}>
                <Text style={styles.errorsTitle}>错误详情：</Text>
                {result.errors.map((error: string, index: number) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.migrateButton, migrating && styles.migrateButtonDisabled]}
          onPress={handleMigrate}
          disabled={migrating}
        >
          {migrating ? (
            <>
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.migrateButtonText}>同步中...</Text>
            </>
          ) : (
            <Text style={styles.migrateButtonText}>立即同步</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#B3B3B3',
    marginBottom: 24,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 6,
  },
  warningBox: {
    backgroundColor: '#3A2A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#FFD580',
    lineHeight: 20,
  },
  resultBox: {
    backgroundColor: '#1A2A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  resultValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorsBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 4,
  },
  migrateButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  migrateButtonDisabled: {
    backgroundColor: '#404040',
  },
  migrateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
})

// 使用withObservables包装组件，实现响应式数据
const DataMigrationScreen = withObservables([], () => ({
  favorites: database.get('favorites')
    .query()
    .observe(),
  playlists: database.get('playlists')
    .query()
    .observe(),
  playHistory: database.get('play_history')
    .query()
    .observe(),
  userProfiles: database.get('user_profiles')
    .query()
    .observe()
}))(DataMigrationScreenComponent)

export { DataMigrationScreen }
