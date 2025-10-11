import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class DownloadedSong extends Model {
    static table = 'downloaded_songs'

    @field('user_id') userId!: string
    @field('song_id') songId!: string
    @field('song_name') songName!: string
    @field('artist') artist!: string
    @field('album') album?: string
    @field('source') source!: string
    @field('file_path') filePath!: string
    @field('file_size') fileSize!: number
    @field('quality') quality!: string
    @field('duration') duration?: number
    @field('cover_url') coverUrl?: string
    @field('download_status') downloadStatus!: string // 'downloading' | 'completed' | 'failed' | 'paused'
    @field('progress') progress!: number
    @field('error_message') errorMessage?: string
    @date('downloaded_at') downloadedAt!: Date
    @date('created_at') createdAt!: Date
    @field('synced') synced!: boolean

    // 标记为已同步
    async markAsSynced() {
        await this.update(f => {
            f.synced = true
        })
    }

    // 标记为未同步
    async markAsUnsynced() {
        await this.update(f => {
            f.synced = false
        })
    }

    // 更新下载进度
    async updateProgress(progress: number) {
        await this.update(f => {
            f.progress = progress
            f.downloadStatus = 'downloading'
        })
    }

    // 标记为下载完成
    async markAsCompleted(filePath: string, fileSize: number) {
        await this.update(f => {
            f.downloadStatus = 'completed'
            f.progress = 100
            f.filePath = filePath
            f.fileSize = fileSize
            f.downloadedAt = new Date()
        })
    }

    // 标记为下载失败
    async markAsFailed(errorMessage: string) {
        await this.update(f => {
            f.downloadStatus = 'failed'
            f.errorMessage = errorMessage
        })
    }

    // 标记为暂停
    async markAsPaused() {
        await this.update(f => {
            f.downloadStatus = 'paused'
        })
    }
}
