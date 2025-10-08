import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { syncStatusManager } from '@/database/sync/syncStatus'
import { syncEngine } from '@/database/sync/syncEngine'

interface SyncStatusIndicatorProps {
  showDetails?: boolean
  onPress?: () => void
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  showDetails = false, 
  onPress 
}) => {
  const [syncStatus, setSyncStatus] = useState(syncStatusManager.getStatus())
  const [syncProgress, setSyncProgress] = useState({
    totalUnsynced: 0,
    totalSynced: 0,
    progressPercentage: 100
  })

  useEffect(() => {
    // 订阅同步状态变化
    const unsubscribe = syncStatusManager.subscribe((status) => {
      setSyncStatus(status)
    })

    // 获取同步进度
    const updateProgress = async () => {
      const progress = await syncStatusManager.getSyncProgress()
      setSyncProgress(progress)
    }

    updateProgress()

    return unsubscribe
  }, [])

  const handleSyncPress = async () => {
    if (onPress) {
      onPress()
    } else {
      await syncEngine.triggerManualSync()
    }
  }

  const getStatusColor = () => {
    if (syncStatus.isRunning) return '#007AFF'
    if (syncStatus.syncErrors.length > 0) return '#FF3B30'
    if (syncProgress.totalUnsynced > 0) return '#FF9500'
    return '#34C759'
  }

  const getStatusText = () => {
    if (syncStatus.isRunning) return `同步中... ${syncStatus.currentOperation}`
    if (syncStatus.syncErrors.length > 0) return `同步错误 (${syncStatus.syncErrors.length})`
    if (syncProgress.totalUnsynced > 0) return `待同步 ${syncProgress.totalUnsynced} 项`
    return '已同步'
  }

  const getStatusIcon = () => {
    if (syncStatus.isRunning) {
      return <ActivityIndicator size="small" color="#007AFF" />
    }
    return null
  }

  return (
    <TouchableOpacity 
      style={[styles.container, { borderLeftColor: getStatusColor() }]}
      onPress={handleSyncPress}
      disabled={syncStatus.isRunning}
    >
      <View style={styles.content}>
        <View style={styles.statusRow}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        {showDetails && (
          <View style={styles.details}>
            <Text style={styles.detailText}>
              已同步: {syncProgress.totalSynced} | 待同步: {syncProgress.totalUnsynced}
            </Text>
            <Text style={styles.detailText}>
              进度: {syncProgress.progressPercentage}%
            </Text>
            {syncStatus.lastSyncTime && (
              <Text style={styles.detailText}>
                上次同步: {syncStatus.lastSyncTime.toLocaleTimeString()}
              </Text>
            )}
            {syncStatus.syncErrors.length > 0 && (
              <Text style={[styles.detailText, styles.errorText]}>
                错误: {syncStatus.syncErrors[syncStatus.syncErrors.length - 1]}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    margin: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  content: {
    padding: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  details: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  errorText: {
    color: '#FF3B30',
  },
})

export default SyncStatusIndicator
