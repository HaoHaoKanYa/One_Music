import { Model } from '@nozbe/watermelondb'
import { field, date, relation } from '@nozbe/watermelondb/decorators'
import Playlist from './Playlist'

export default class PlaylistSong extends Model {
  static table = 'playlist_songs'
  static associations = {
    playlists: { type: 'belongs_to', key: 'playlist_id' },
  }

  @relation('playlists', 'playlist_id') playlist!: Playlist
  @field('song_id') songId!: string
  @field('song_name') songName!: string
  @field('artist') artist?: string
  @field('album') album?: string
  @field('source') source!: string
  @field('duration') duration?: number
  @field('cover_url') coverUrl?: string
  @field('position') position!: number
  @date('added_at') addedAt!: Date
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
}
