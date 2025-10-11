/**
 * 下载管理器
 * 负责管理歌曲下载任务
 */
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { downloadFile, stopDownload } from '@/utils/fs'
import { authAPI } from '@/services/api/auth'
import RNFS from 'react-native-fs'
import { toast } from '@/utils/tools'
import { downloadNotificationService } from './downloadNotification'

interface DownloadTask {
  songId: string
  jobId: number
  promise: Promise<void>
}

class DownloadManager {
  private downloadQueue: Map<string, DownloadTask> = new Map()
  private pendingQueue: Array<{ musicInfo: LX.Music.MusicInfo; quality: string }> = []
  private maxConcurrentDownloads = 3
  private downloadPath: string = ''
  private isWifiOnly = false
  private autoCleanupEnabled = false

  constructor() {
    // 设置默认下载路径 - 优先使用外部存储的 Download 目录
    const externalDownload = RNFS.ExternalStorageDirectoryPath + '/Download/OneMusic'
    this.downloadPath = externalDownload
    console.log('[DownloadManager] 默认下载路径:', this.downloadPath)
    this.initDownloadPath()
    this.loadSettings()
  }

  /**
   * 加载设置
   */
  private loadSettings() {
    // 从设置中加载配置
    try {
      const settings = (global.lx as any).config?.download || {}
      this.maxConcurrentDownloads = settings.maxConcurrent || 3
      this.isWifiOnly = settings.wifiOnly || false
      this.autoCleanupEnabled = settings.autoCleanup || false
    } catch (error) {
      console.log('[DownloadManager] 加载设置失败，使用默认值')
    }
  }

  /**
   * 更新设置
   */
  updateSettings(settings: {
    maxConcurrent?: number
    wifiOnly?: boolean
    autoCleanup?: boolean
  }) {
    if (settings.maxConcurrent !== undefined) {
      this.maxConcurrentDownloads = settings.maxConcurrent
    }
    if (settings.wifiOnly !== undefined) {
      this.isWifiOnly = settings.wifiOnly
    }
    if (settings.autoCleanup !== undefined) {
      this.autoCleanupEnabled = settings.autoCleanup
    }
  }

  /**
   * 初始化下载目录
   */
  private async initDownloadPath() {
    try {
      console.log('[DownloadManager] 初始化下载路径:', this.downloadPath)
      
      const exists = await RNFS.exists(this.downloadPath)
      if (exists) {
        console.log('[DownloadManager] 下载目录已存在')
        return
      }

      // 下载目录不存在，尝试创建
      console.log('[DownloadManager] 下载目录不存在，开始创建...')
      await RNFS.mkdir(this.downloadPath)
      console.log('[DownloadManager] 下载目录创建成功')
    } catch (error: any) {
      console.error('[DownloadManager] 创建下载目录失败:', error)
      console.log('[DownloadManager] 尝试使用备用路径...')
      
      // 如果创建失败，使用应用私有目录
      try {
        this.downloadPath = RNFS.DocumentDirectoryPath + '/OneMusic'
        console.log('[DownloadManager] 备用路径:', this.downloadPath)
        
        const backupExists = await RNFS.exists(this.downloadPath)
        if (!backupExists) {
          await RNFS.mkdir(this.downloadPath)
          console.log('[DownloadManager] 备用目录创建成功')
        }
      } catch (backupError) {
        console.error('[DownloadManager] 创建备用目录也失败:', backupError)
        // 最后尝试使用缓存目录
        this.downloadPath = RNFS.CachesDirectoryPath + '/OneMusic'
        console.log('[DownloadManager] 使用缓存目录:', this.downloadPath)
        try {
          const cacheExists = await RNFS.exists(this.downloadPath)
          if (!cacheExists) {
            await RNFS.mkdir(this.downloadPath)
          }
        } catch (cacheError) {
          console.error('[DownloadManager] 所有路径都失败了:', cacheError)
        }
      }
    }
  }

  /**
   * 下载歌曲
   */
  async downloadSong(musicInfo: LX.Music.MusicInfo, quality: string = 'standard') {
    try {
      const user = await authAPI.getCurrentUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      // 检查是否已经在下载队列中
      if (this.downloadQueue.has(musicInfo.id)) {
        console.log('[DownloadManager] 歌曲已在下载队列中:', musicInfo.name)
        return
      }

      // 检查是否已经下载
      const existing = await database.get('downloaded_songs')
        .query(
          Q.where('user_id', user.id),
          Q.where('song_id', musicInfo.id),
          Q.where('download_status', 'completed')
        )
        .fetch()

      if (existing.length > 0) {
        toast('歌曲已下载')
        return
      }

      console.log('[DownloadManager] 开始下载:', musicInfo.name)

      // 确保下载目录存在
      await this.initDownloadPath()
      
      // 再次确认目录存在
      const dirExists = await RNFS.exists(this.downloadPath)
      if (!dirExists) {
        throw new Error(`下载目录不存在: ${this.downloadPath}`)
      }

      // 获取歌曲URL
      const musicUrl = await this.getMusicUrl(musicInfo, quality)
      if (!musicUrl) {
        throw new Error('无法获取歌曲下载链接')
      }

      // 生成文件名和路径
      const fileName = this.generateFileName(musicInfo)
      const filePath = `${this.downloadPath}/${fileName}`
      
      console.log('[DownloadManager] 下载路径:', filePath)

      // 创建数据库记录
      let dbRecord: any
      await database.write(async () => {
        dbRecord = await database.get('downloaded_songs').create((record: any) => {
          record.userId = user.id
          record.songId = musicInfo.id
          record.songName = musicInfo.name
          record.artist = musicInfo.singer
          record.album = (musicInfo as any).meta?.albumName || ''
          record.source = musicInfo.source
          record.filePath = filePath
          record.fileSize = 0
          record.quality = quality
          record.duration = musicInfo.interval || 0
          record.coverUrl = (musicInfo as any).img || ''
          record.downloadStatus = 'downloading'
          record.progress = 0
          record.createdAt = new Date()
          record.downloadedAt = new Date()
          record.synced = false
        })
      })

      // 开始下载
      const downloadPromise = this.performDownload(
        musicUrl,
        filePath,
        dbRecord,
        musicInfo
      )

      // 添加到下载队列
      this.downloadQueue.set(musicInfo.id, {
        songId: musicInfo.id,
        jobId: 0, // 将在performDownload中设置
        promise: downloadPromise,
      })

      // 触发下载列表更新事件
      global.app_event.downloadListUpdate?.()

      // 显示下载开始通知
      downloadNotificationService.showDownloadStarted(musicInfo.name, musicInfo.id)

      toast('开始下载: ' + musicInfo.name)

      await downloadPromise
    } catch (error: any) {
      console.error('[DownloadManager] 下载失败:', error)
      toast(error.message || '下载失败')
      throw error
    }
  }

  /**
   * 执行下载
   */
  private async performDownload(
    url: string,
    filePath: string,
    dbRecord: any,
    musicInfo: LX.Music.MusicInfo
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const download = downloadFile(url, filePath, {
        begin: (res) => {
          console.log('[DownloadManager] 开始下载:', res)
          const task = this.downloadQueue.get(musicInfo.id)
          if (task) {
            task.jobId = res.jobId
          }
        },
        progress: async (res) => {
          const progress = Math.floor((res.bytesWritten / res.contentLength) * 100)
          
          // 更新数据库进度
          try {
            await database.write(async () => {
              await dbRecord.update((record: any) => {
                record.progress = progress
                record.fileSize = res.bytesWritten
              })
            })
          } catch (error) {
            console.error('[DownloadManager] 更新进度失败:', error)
          }

          // 更新通知进度（每10%更新一次）
          if (progress % 10 === 0) {
            downloadNotificationService.updateDownloadProgress(
              musicInfo.name,
              musicInfo.id,
              progress
            )
          }

          // 触发下载列表更新事件
          global.app_event.downloadListUpdate?.()
        },
      })

      download.promise
        .then(async (res) => {
          console.log('[DownloadManager] 下载完成:', res)

          // 更新数据库状态
          await database.write(async () => {
            await dbRecord.update((record: any) => {
              record.downloadStatus = 'completed'
              record.progress = 100
              record.fileSize = res.bytesWritten
              record.downloadedAt = new Date()
            })
          })

          // 从下载队列中移除
          this.downloadQueue.delete(musicInfo.id)

          // 触发下载列表更新事件
          global.app_event.downloadListUpdate?.()

          // 显示下载完成通知
          downloadNotificationService.showDownloadCompleted(musicInfo.name, musicInfo.id)

          toast('下载完成: ' + musicInfo.name)
          resolve()
        })
        .catch(async (error) => {
          console.error('[DownloadManager] 下载失败:', error)

          // 更新数据库状态
          await database.write(async () => {
            await dbRecord.update((record: any) => {
              record.downloadStatus = 'failed'
              record.errorMessage = error.message || '下载失败'
            })
          })

          // 从下载队列中移除
          this.downloadQueue.delete(musicInfo.id)

          // 触发下载列表更新事件
          global.app_event.downloadListUpdate?.()

          // 显示下载失败通知
          downloadNotificationService.showDownloadFailed(
            musicInfo.name,
            musicInfo.id,
            error.message || '下载失败'
          )

          reject(error)
        })
    })
  }

  /**
   * 暂停下载
   */
  async pauseDownload(songId: string) {
    const task = this.downloadQueue.get(songId)
    if (task) {
      stopDownload(task.jobId)
      this.downloadQueue.delete(songId)

      // 更新数据库状态
      const user = await authAPI.getCurrentUser()
      if (user) {
        const records = await database.get('downloaded_songs')
          .query(
            Q.where('user_id', user.id),
            Q.where('song_id', songId)
          )
          .fetch()

        if (records.length > 0) {
          await database.write(async () => {
            await (records[0] as any).markAsPaused()
          })
        }
      }

      // 触发下载列表更新事件
      global.app_event.downloadListUpdate?.()
    }
  }

  /**
   * 取消下载
   */
  async cancelDownload(songId: string) {
    const task = this.downloadQueue.get(songId)
    if (task) {
      stopDownload(task.jobId)
      this.downloadQueue.delete(songId)
    }

    // 删除数据库记录和文件
    const user = await authAPI.getCurrentUser()
    if (user) {
      const records = await database.get('downloaded_songs')
        .query(
          Q.where('user_id', user.id),
          Q.where('song_id', songId)
        )
        .fetch()

      if (records.length > 0) {
        const record = records[0] as any
        const filePath = record.filePath

        // 删除文件
        try {
          const exists = await RNFS.exists(filePath)
          if (exists) {
            await RNFS.unlink(filePath)
          }
        } catch (error) {
          console.error('[DownloadManager] 删除文件失败:', error)
        }

        // 删除数据库记录
        await database.write(async () => {
          await record.destroyPermanently()
        })
      }
    }

    // 触发下载列表更新事件
    global.app_event.downloadListUpdate?.()
  }

  /**
   * 删除已下载的歌曲
   */
  async deleteDownloadedSong(songId: string) {
    const user = await authAPI.getCurrentUser()
    if (!user) return

    const records = await database.get('downloaded_songs')
      .query(
        Q.where('user_id', user.id),
        Q.where('song_id', songId)
      )
      .fetch()

    if (records.length > 0) {
      const record = records[0] as any
      const filePath = record.filePath

      // 删除文件
      try {
        const exists = await RNFS.exists(filePath)
        if (exists) {
          await RNFS.unlink(filePath)
        }
      } catch (error) {
        console.error('[DownloadManager] 删除文件失败:', error)
      }

      // 删除数据库记录
      await database.write(async () => {
        await record.destroyPermanently()
      })

      // 触发下载列表更新事件
      global.app_event.downloadListUpdate?.()

      toast('已删除')
    }
  }

  /**
   * 获取歌曲URL
   */
  private async getMusicUrl(musicInfo: LX.Music.MusicInfo, quality: string): Promise<string | null> {
    try {
      // 使用核心的 getMusicUrl 方法
      const { getMusicUrl: getCoreMusicUrl } = await import('@/core/music')
      
      if (musicInfo.source === 'local') {
        console.log('[DownloadManager] 本地歌曲无需下载')
        return null
      }

      // 获取音乐URL，使用标准音质类型
      const qualityMap: Record<string, LX.Quality> = {
        'low': '128k',
        'standard': '320k',
        'high': '320k',
        'lossless': 'flac',
      }
      
      const targetQuality = qualityMap[quality] || '320k'
      const url = await getCoreMusicUrl({
        musicInfo,
        quality: targetQuality,
        isRefresh: false,
      })

      if (!url) {
        throw new Error('无法获取歌曲下载链接')
      }

      return url
    } catch (error) {
      console.error('[DownloadManager] 获取音乐URL失败:', error)
      throw error
    }
  }

  /**
   * 生成文件名
   */
  private generateFileName(musicInfo: LX.Music.MusicInfo): string {
    const name = musicInfo.name.replace(/[/\\?%*:|"<>]/g, '_')
    const singer = musicInfo.singer.replace(/[/\\?%*:|"<>]/g, '_')
    return `${singer} - ${name}.mp3`
  }

  /**
   * 获取下载进度
   */
  async getDownloadProgress(songId: string): Promise<number> {
    const user = await authAPI.getCurrentUser()
    if (!user) return 0

    const records = await database.get('downloaded_songs')
      .query(
        Q.where('user_id', user.id),
        Q.where('song_id', songId)
      )
      .fetch()

    if (records.length > 0) {
      return (records[0] as any).progress
    }

    return 0
  }

  /**
   * 检查歌曲是否已下载
   */
  async isDownloaded(songId: string): Promise<boolean> {
    const user = await authAPI.getCurrentUser()
    if (!user) return false

    const records = await database.get('downloaded_songs')
      .query(
        Q.where('user_id', user.id),
        Q.where('song_id', songId),
        Q.where('download_status', 'completed')
      )
      .fetch()

    return records.length > 0
  }

  /**
   * 批量下载歌曲
   */
  async batchDownload(musicList: LX.Music.MusicInfo[], quality: string = 'standard') {
    if (musicList.length === 0) {
      toast('没有可下载的歌曲')
      return
    }

    // 检查网络状态
    if (this.isWifiOnly) {
      const isWifi = await this.checkWifiConnection()
      if (!isWifi) {
        toast('仅WiFi下载已启用，请连接WiFi后重试')
        return
      }
    }

    // 添加到待下载队列
    for (const music of musicList) {
      this.pendingQueue.push({ musicInfo: music, quality })
    }

    toast(`已添加 ${musicList.length} 首歌曲到下载队列`)

    // 开始处理队列
    this.processQueue()
  }

  /**
   * 处理下载队列
   */
  private async processQueue() {
    // 检查当前下载数量
    while (this.downloadQueue.size < this.maxConcurrentDownloads && this.pendingQueue.length > 0) {
      const item = this.pendingQueue.shift()
      if (item) {
        try {
          await this.downloadSong(item.musicInfo, item.quality)
        } catch (error) {
          console.error('[DownloadManager] 队列下载失败:', error)
        }
      }
    }

    // 如果还有待下载的，继续处理
    if (this.pendingQueue.length > 0) {
      setTimeout(() => this.processQueue(), 1000)
    }
  }

  /**
   * 检查WiFi连接
   */
  private async checkWifiConnection(): Promise<boolean> {
    try {
      // 使用 NetInfo 检查网络状态
      const NetInfo = require('@react-native-community/netinfo')
      const state = await NetInfo.fetch()
      return state.type === 'wifi'
    } catch (error) {
      console.error('[DownloadManager] 检查网络状态失败:', error)
      return true // 如果检查失败，默认允许下载
    }
  }

  /**
   * 获取所有下载任务
   */
  async getAllDownloads(): Promise<any[]> {
    const user = await authAPI.getCurrentUser()
    if (!user) return []

    const records = await database.get('downloaded_songs')
      .query(Q.where('user_id', user.id))
      .fetch()

    return records
  }

  /**
   * 清理过期下载
   * 删除30天未播放的下载文件
   */
  async cleanupOldDownloads() {
    if (!this.autoCleanupEnabled) return

    const user = await authAPI.getCurrentUser()
    if (!user) return

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const records = await database.get('downloaded_songs')
      .query(
        Q.where('user_id', user.id),
        Q.where('download_status', 'completed'),
        Q.where('last_played_at', Q.lt(thirtyDaysAgo.getTime()))
      )
      .fetch()

    let deletedCount = 0
    for (const record of records) {
      try {
        const filePath = (record as any).filePath
        const exists = await RNFS.exists(filePath)
        if (exists) {
          await RNFS.unlink(filePath)
        }

        await database.write(async () => {
          await record.destroyPermanently()
        })

        deletedCount++
      } catch (error) {
        console.error('[DownloadManager] 清理下载失败:', error)
      }
    }

    if (deletedCount > 0) {
      console.log(`[DownloadManager] 已清理 ${deletedCount} 个过期下载`)
      toast(`已清理 ${deletedCount} 个过期下载`)
      global.app_event.downloadListUpdate?.()
    }
  }

  /**
   * 获取下载统计信息
   */
  async getDownloadStats(): Promise<{
    totalCount: number
    totalSize: number
    completedCount: number
    downloadingCount: number
  }> {
    const user = await authAPI.getCurrentUser()
    if (!user) {
      return {
        totalCount: 0,
        totalSize: 0,
        completedCount: 0,
        downloadingCount: 0,
      }
    }

    const allRecords = await database.get('downloaded_songs')
      .query(Q.where('user_id', user.id))
      .fetch()

    const completedRecords = allRecords.filter(
      (r: any) => r.downloadStatus === 'completed'
    )
    const downloadingRecords = allRecords.filter(
      (r: any) => r.downloadStatus === 'downloading'
    )

    const totalSize = completedRecords.reduce(
      (sum: number, r: any) => sum + (r.fileSize || 0),
      0
    )

    return {
      totalCount: allRecords.length,
      totalSize,
      completedCount: completedRecords.length,
      downloadingCount: downloadingRecords.length,
    }
  }
}

// 导出单例
export const downloadManager = new DownloadManager()
export default downloadManager
