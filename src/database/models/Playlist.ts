import { Model } from '@nozbe/watermelondb'
import { field, date, children } from '@nozbe/watermelondb/decorators'
import PlaylistSong from './PlaylistSong'

export default class Playlist extends Model {
  static table = 'playlists'
  static associations = {
    playlist_songs: { type: 'has_many', key: 'playlist_id' },
  }

  @field('user_id') userId!: string
  @field('name') name!: string
  @field('description') description?: string
  @field('cover_url') coverUrl?: string
  @field('is_public') isPublic!: boolean
  @field('is_deleted') isDeleted!: boolean
  @field('song_count') songCount!: number
  @field('play_count') playCount!: number
  @field('like_count') likeCount!: number
  @field('comment_count') commentCount!: number
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
  @field('synced') synced!: boolean

  @children('playlist_songs') songs!: PlaylistSong[]

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

  // 软删除
  async softDelete() {
    await this.update(f => {
      f.isDeleted = true
      f.deletedAt = new Date()
      f.synced = false
    })
  }
}
