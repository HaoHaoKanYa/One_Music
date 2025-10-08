import { database } from '../index'
import { Q } from '@nozbe/watermelondb'

export interface SyncStatus {
  isRunning: boolean
  lastSyncTime: Date | null
  pendingUploads: number
  pendingDownloads: number
  syncErrors: string[]
  currentOperation: string | null
}

export class SyncStatusManager {
  private status: SyncStatus = {
    isRunning: false,
    lastSyncTime: null,
    pendingUploads: 0,
    pendingDownloads: 0,
    syncErrors: [],
    currentOperation: null
  }

  private listeners: ((status: SyncStatus) => void)[] = []

  // 获取当前同步状态
  getStatus(): SyncStatus {
    return { ...this.status }
  }

  // 订阅状态变化
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // 更新状态并通知监听器
  private updateStatus(updates: Partial<SyncStatus>) {
    this.status = { ...this.status, ...updates }
    this.listeners.forEach(listener => listener(this.status))
  }

  // 开始同步
  startSync(operation: string) {
    this.updateStatus({
      isRunning: true,
      currentOperation: operation,
      syncErrors: []
    })
  }

  // 结束同步
  endSync() {
    this.updateStatus({
      isRunning: false,
      currentOperation: null,
      lastSyncTime: new Date()
    })
  }

  // 更新待上传数量
  updatePendingUploads(count: number) {
    this.updateStatus({ pendingUploads: count })
  }

  // 更新待下载数量
  updatePendingDownloads(count: number) {
    this.updateStatus({ pendingDownloads: count })
  }

  // 添加同步错误
  addSyncError(error: string) {
    this.status.syncErrors.push(error)
    this.updateStatus({ syncErrors: [...this.status.syncErrors] })
  }

  // 清除同步错误
  clearSyncErrors() {
    this.updateStatus({ syncErrors: [] })
  }

  // 获取未同步数据统计
  async getUnsyncedDataCount(): Promise<{
    favorites: number
    playlists: number
    playHistory: number
    playStatistics: number
    appSettings: number
    userProfiles: number
  }> {
    try {
      const [
        favorites,
        playlists,
        playHistory,
        playStatistics,
        appSettings,
        userProfiles
      ] = await Promise.all([
        database.get('favorites').query(Q.where('synced', false)).fetchCount(),
        database.get('playlists').query(Q.where('synced', false)).fetchCount(),
        database.get('play_history').query(Q.where('synced', false)).fetchCount(),
        database.get('play_statistics').query(Q.where('synced', false)).fetchCount(),
        database.get('app_settings').query(Q.where('synced', false)).fetchCount(),
        database.get('user_profiles').query(Q.where('synced', false)).fetchCount()
      ])

      return {
        favorites,
        playlists,
        playHistory,
        playStatistics,
        appSettings,
        userProfiles
      }
    } catch (error) {
      console.error('[SyncStatusManager] 获取未同步数据统计失败:', error)
      return {
        favorites: 0,
        playlists: 0,
        playHistory: 0,
        playStatistics: 0,
        appSettings: 0,
        userProfiles: 0
      }
    }
  }

  // 获取同步进度
  async getSyncProgress(): Promise<{
    totalUnsynced: number
    totalSynced: number
    progressPercentage: number
  }> {
    try {
      const unsyncedCounts = await this.getUnsyncedDataCount()
      const totalUnsynced = Object.values(unsyncedCounts).reduce((sum, count) => sum + count, 0)

      // 获取总数据量
      const [
        totalFavorites,
        totalPlaylists,
        totalPlayHistory,
        totalPlayStatistics,
        totalAppSettings,
        totalUserProfiles
      ] = await Promise.all([
        database.get('favorites').query().fetchCount(),
        database.get('playlists').query().fetchCount(),
        database.get('play_history').query().fetchCount(),
        database.get('play_statistics').query().fetchCount(),
        database.get('app_settings').query().fetchCount(),
        database.get('user_profiles').query().fetchCount()
      ])

      const totalData = totalFavorites + totalPlaylists + totalPlayHistory + 
                       totalPlayStatistics + totalAppSettings + totalUserProfiles
      
      const totalSynced = totalData - totalUnsynced
      const progressPercentage = totalData > 0 ? Math.round((totalSynced / totalData) * 100) : 100

      return {
        totalUnsynced,
        totalSynced,
        progressPercentage
      }
    } catch (error) {
      console.error('[SyncStatusManager] 获取同步进度失败:', error)
      return {
        totalUnsynced: 0,
        totalSynced: 0,
        progressPercentage: 100
      }
    }
  }

  // 检查是否有未同步数据
  async hasUnsyncedData(): Promise<boolean> {
    const counts = await this.getUnsyncedDataCount()
    return Object.values(counts).some(count => count > 0)
  }

  // 获取同步历史
  getSyncHistory(): string[] {
    // 这里可以扩展为从本地存储中读取同步历史
    return this.status.syncErrors
  }

  // 重置同步状态
  reset() {
    this.updateStatus({
      isRunning: false,
      lastSyncTime: null,
      pendingUploads: 0,
      pendingDownloads: 0,
      syncErrors: [],
      currentOperation: null
    })
  }
}

// 创建全局同步状态管理器实例
export const syncStatusManager = new SyncStatusManager()
