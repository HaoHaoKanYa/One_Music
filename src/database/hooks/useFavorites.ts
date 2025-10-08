import { useDatabase } from '@nozbe/watermelondb/hooks'
import { Q } from '@nozbe/watermelondb'
import { useObservable } from '@nozbe/watermelondb/hooks'
import Favorite from '../models/Favorite'

export const useFavorites = (userId: string) => {
  const database = useDatabase()
  
  const favorites = useObservable(
    database.get('favorites')
      .query(Q.where('user_id', userId))
      .observe()
  )

  return favorites
}

export const useFavoriteCount = (userId: string) => {
  const database = useDatabase()
  
  const count = useObservable(
    database.get('favorites')
      .query(Q.where('user_id', userId))
      .observeCount()
  )

  return count
}

export const useFavorite = (userId: string, songId: string, source: string) => {
  const database = useDatabase()
  
  const favorite = useObservable(
    database.get('favorites')
      .query(
        Q.where('user_id', userId),
        Q.where('song_id', songId),
        Q.where('source', source)
      )
      .observe()
  )

  return favorite?.[0] || null
}

// 收藏歌曲
export const addFavorite = async (
  userId: string,
  songId: string,
  songName: string,
  artist?: string,
  album?: string,
  source: string = 'local',
  coverUrl?: string
) => {
  const database = useDatabase()
  
  await database.write(async () => {
    await database.get('favorites').create(favorite => {
      favorite.userId = userId
      favorite.songId = songId
      favorite.songName = songName
      favorite.artist = artist
      favorite.album = album
      favorite.source = source
      favorite.coverUrl = coverUrl
      favorite.createdAt = new Date()
      favorite.synced = false
    })
  })
}

// 取消收藏
export const removeFavorite = async (favoriteId: string) => {
  const database = useDatabase()
  
  await database.write(async () => {
    const favorite = await database.get('favorites').find(favoriteId)
    await favorite.destroyPermanently()
  })
}

// 检查是否已收藏
export const isFavorited = async (
  userId: string,
  songId: string,
  source: string
): Promise<boolean> => {
  const database = useDatabase()
  
  const favorites = await database
    .get('favorites')
    .query(
      Q.where('user_id', userId),
      Q.where('song_id', songId),
      Q.where('source', source)
    )
    .fetch()

  return favorites.length > 0
}
