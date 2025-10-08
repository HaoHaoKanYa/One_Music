import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { syncEngine } from '@/database/sync/syncEngine'
import { syncStatusManager } from '@/database/sync/syncStatus'
import SyncStatusIndicator from '@/components/SyncStatusIndicator'

export const SyncManagementScreen: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState(syncStatusManager.getStatus())
  const [syncProgress, setSyncProgress] = useState({
    totalUnsynced: 0,
    totalSynced: 0,
    progressPercentage: 100
  })
  const [unsyncedCounts, setUnsyncedCounts] = useState({
    favorites: 0,
    playlists: 0,
    playHistory: 0,
    playStatistics: 0,
    appSettings: 0,
    userProfiles: 0
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // 订阅同步状态变化
    const unsubscribe = syncStatusManager.subscribe((status) => {
      setSyncStatus(status)
    })

    // 获取同步进度和未同步数据统计
    updateSyncInfo()

    return unsubscribe
  }, [])

  const updateSyncInfo = async () => {
    try {
      const progress = await syncStatusManager.getSyncProgress()
      const counts = await syncStatusManager.getUnsyncedDataCount()
      
      setSyncProgress(progress)
      setUnsyncedCounts(counts)
    } catch (error) {
      console.error('获取同步信息失败:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await updateSyncInfo()
    setRefreshing(false)
  }

  const handleManualSync = async () => {
    try {
      await syncEngine.triggerManualSync()
      Alert.alert('成功', '手动同步已开始')
    } catch (error) {
      Alert.alert('错误', '手动同步失败')
    }
  }

  const handleForceSync = async () => {
    Alert.alert(
      '强制同步',
      '这将强制同步所有数据，可能会覆盖本地更改。确定继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await syncEngine.forceSyncAll()
              Alert.alert('成功', '强制同步已完成')
            } catch (error) {
              Alert.alert('错误', '强制同步失败')
            }
          }
        }
      ]
    )
  }

  const handleClearErrors = () => {
    syncStatusManager.clearSyncErrors()
  }

  const getSyncStatusColor = () => {
    if (syncStatus.isRunning) return '#007AFF'
    if (syncStatus.syncErrors.length > 0) return '#FF3B30'
    if (syncProgress.totalUnsynced > 0) return '#FF9500'
    return '#34C759'
  }

  const getSyncStatusText = () => {
    if (syncStatus.isRunning) return `同步中... ${syncStatus.currentOperation}`
    if (syncStatus.syncErrors.length > 0) return `同步错误 (${syncStatus.syncErrors.length})`
    if (syncProgress.totalUnsynced > 0) return `待同步 ${syncProgress.totalUnsynced} 项`
    return '已同步'
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>数据同步管理</Text>
        <Text style={styles.subtitle}>管理本地数据与服务器数据的同步</Text>
      </View>

      {/* 同步状态指示器 */}
      <SyncStatusIndicator showDetails={true} />

      {/* 同步进度 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>同步进度</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${syncProgress.progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {syncProgress.progressPercentage}% ({syncProgress.totalSynced}/{syncProgress.totalSynced + syncProgress.totalUnsynced})
          </Text>
        </View>
      </View>

      {/* 未同步数据详情 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>未同步数据详情</Text>
        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>收藏歌曲</Text>
            <Text style={[styles.dataValue, unsyncedCounts.favorites > 0 && styles.unsyncedValue]}>
              {unsyncedCounts.favorites}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>歌单</Text>
            <Text style={[styles.dataValue, unsyncedCounts.playlists > 0 && styles.unsyncedValue]}>
              {unsyncedCounts.playlists}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>播放历史</Text>
            <Text style={[styles.dataValue, unsyncedCounts.playHistory > 0 && styles.unsyncedValue]}>
              {unsyncedCounts.playHistory}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>播放统计</Text>
            <Text style={[styles.dataValue, unsyncedCounts.playStatistics > 0 && styles.unsyncedValue]}>
              {unsyncedCounts.playStatistics}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>应用设置</Text>
            <Text style={[styles.dataValue, unsyncedCounts.appSettings > 0 && styles.unsyncedValue]}>
              {unsyncedCounts.appSettings}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>用户资料</Text>
            <Text style={[styles.dataValue, unsyncedCounts.userProfiles > 0 && styles.unsyncedValue]}>
              {unsyncedCounts.userProfiles}
            </Text>
          </View>
        </View>
      </View>

      {/* 同步操作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>同步操作</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleManualSync}
            disabled={syncStatus.isRunning}
          >
            {syncStatus.isRunning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>手动同步</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handleForceSync}
            disabled={syncStatus.isRunning}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>强制同步</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 同步历史 */}
      {syncStatus.syncErrors.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>同步错误</Text>
            <TouchableOpacity onPress={handleClearErrors}>
              <Text style={styles.clearButton}>清除</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            {syncStatus.syncErrors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* 同步信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>同步信息</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            状态: {getSyncStatusText()}
          </Text>
          {syncStatus.lastSyncTime && (
            <Text style={styles.infoText}>
              上次同步: {syncStatus.lastSyncTime.toLocaleString()}
            </Text>
          )}
          <Text style={styles.infoText}>
            自动同步: 每5分钟
          </Text>
          <Text style={styles.infoText}>
            触发条件: 应用启动、前后台切换、用户操作
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dataLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  unsyncedValue: {
    color: '#FF9500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  clearButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 4,
  },
  infoContainer: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
})

export default SyncManagementScreen
