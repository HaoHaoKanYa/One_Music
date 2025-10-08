import { useDatabase } from '@nozbe/watermelondb/hooks'
import { Q } from '@nozbe/watermelondb'
import { useObservable } from '@nozbe/watermelondb/hooks'
import Playlist from '../models/Playlist'

export const usePlaylists = (userId: string) => {
  const database = useDatabase()
  
  const playlists = useObservable(
    database.get('playlists')
      .query(
        Q.where('user_id', userId),
        Q.where('is_deleted', false)
      )
      .observe()
  )

  return playlists
}

export const usePlaylist = (playlistId: string) => {
  const database = useDatabase()
  
  const playlist = useObservable(
    database.get('playlists')
      .query(Q.where('id', playlistId))
      .observe()
  )

  return playlist?.[0] || null
}

export const usePlaylistCount = (userId: string) => {
  const database = useDatabase()
  
  const count = useObservable(
    database.get('playlists')
      .query(
        Q.where('user_id', userId),
        Q.where('is_deleted', false)
      )
      .observeCount()
  )

  return count
}

// 创建歌单
export const createPlaylist = async (
  userId: string,
  name: string,
  description?: string,
  coverUrl?: string,
  isPublic: boolean = false
) => {
  const database = useDatabase()
  
  let playlist: Playlist
  
  await database.write(async () => {
    playlist = await database.get('playlists').create(playlist => {
      playlist.userId = userId
      playlist.name = name
      playlist.description = description
      playlist.coverUrl = coverUrl
      playlist.isPublic = isPublic
      playlist.isDeleted = false
      playlist.songCount = 0
      playlist.playCount = 0
      playlist.likeCount = 0
      playlist.commentCount = 0
      playlist.createdAt = new Date()
      playlist.updatedAt = new Date()
      playlist.synced = false
    })
  })

  return playlist!
}

// 更新歌单
export const updatePlaylist = async (
  playlistId: string,
  updates: {
    name?: string
    description?: string
    coverUrl?: string
    isPublic?: boolean
  }
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    const playlist = await database.get('playlists').find(playlistId)
    await playlist.update(playlist => {
      if (updates.name !== undefined) playlist.name = updates.name
      if (updates.description !== undefined) playlist.description = updates.description
      if (updates.coverUrl !== undefined) playlist.coverUrl = updates.coverUrl
      if (updates.isPublic !== undefined) playlist.isPublic = updates.isPublic
      playlist.updatedAt = new Date()
      playlist.synced = false
    })
  })
}

// 删除歌单
export const deletePlaylist = async (playlistId: string) => {
  const database = useDatabase()
  
  await database.write(async () => {
    const playlist = await database.get('playlists').find(playlistId)
    await playlist.softDelete()
  })
}

// 添加歌曲到歌单
export const addSongToPlaylist = async (
  playlistId: string,
  songId: string,
  songName: string,
  artist?: string,
  album?: string,
  source: string = 'local',
  duration?: number,
  coverUrl?: string
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    // 获取歌单
    const playlist = await database.get('playlists').find(playlistId)
    
    // 获取当前歌曲数量作为位置
    const existingSongs = await database
      .get('playlist_songs')
      .query(Q.where('playlist_id', playlistId))
      .fetch()
    
    const position = existingSongs.length

    // 添加歌曲
    await database.get('playlist_songs').create(song => {
      song.playlistId = playlistId
      song.songId = songId
      song.songName = songName
      song.artist = artist
      song.album = album
      song.source = source
      song.duration = duration
      song.coverUrl = coverUrl
      song.position = position
      song.addedAt = new Date()
      song.synced = false
    })

    // 更新歌单歌曲数量
    await playlist.update(playlist => {
      playlist.songCount += 1
      playlist.updatedAt = new Date()
      playlist.synced = false
    })
  })
}

// 从歌单移除歌曲
export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string,
  source: string
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    // 查找并删除歌曲
    const songs = await database
      .get('playlist_songs')
      .query(
        Q.where('playlist_id', playlistId),
        Q.where('song_id', songId),
        Q.where('source', source)
      )
      .fetch()

    for (const song of songs) {
      await song.destroyPermanently()
    }

    // 更新歌单歌曲数量
    const playlist = await database.get('playlists').find(playlistId)
    await playlist.update(playlist => {
      playlist.songCount = Math.max(0, playlist.songCount - songs.length)
      playlist.updatedAt = new Date()
      playlist.synced = false
    })
  })
}

// 获取歌单中的歌曲
export const usePlaylistSongs = (playlistId: string) => {
  const database = useDatabase()
  
  const songs = useObservable(
    database.get('playlist_songs')
      .query(
        Q.where('playlist_id', playlistId)
      )
      .observe()
  )

  return songs
}
