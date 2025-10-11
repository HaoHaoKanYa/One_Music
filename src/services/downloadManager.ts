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

interface DownloadTask {
  songId: string
  jobId: number
  promise: Promise<void>
}

class DownloadManager {
  private downloadQueue: Map<string, DownloadTask> = new Map()
  private maxConcurrentDownloads = 3
  private downloadPath: string = RNFS.DocumentDirectoryPath + '/downloads'

  constructor() {
    this.initDownloadPath()
  }

  /**
   * 初始化下载目录
   */
  private async initDownloadPath() {
    try {
      const exists = await RNFS.exists(this.downloadPath)
      if (!exists) {
        await RNFS.mkdir(this.downloadPath)
        console.log('[DownloadManager] 下载目录已创建:', this.downloadPath)
      }
    } catch (error) {
      console.error('[DownloadManager] 创建下载目录失败:', error)
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

      // 获取歌曲URL
      const musicUrl = await this.getMusicUrl(musicInfo, quality)
      if (!musicUrl) {
        throw new Error('无法获取歌曲下载链接')
      }

      // 生成文件名和路径
      const fileName = this.generateFileName(musicInfo)
      const filePath = `${this.downloadPath}/${fileName}`

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
      // 这里需要根据实际的音乐SDK实现获取URL
      // 暂时返回一个模拟URL
      const { default: musicSdk } = await import('@/utils/musicSdk')
      
      if (musicInfo.source === 'local') {
        return null
      }

      const sdk = musicSdk[musicInfo.source]
      if (!sdk || !sdk.getMusicUrl) {
        return null
      }

      // 获取音乐URL
      const urlInfo = await sdk.getMusicUrl(musicInfo, quality)
      return urlInfo?.url || null
    } catch (error) {
      console.error('[DownloadManager] 获取音乐URL失败:', error)
      return null
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
}

// 导出单例
export const downloadManager = new DownloadManager()
export default downloadManager
