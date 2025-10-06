/**
 * 收藏功能集成模块
 * 将原有的收藏列表与Supabase数据库同步
 */
import { LIST_IDS } from '@/config/constant'
import { favoritesAPI } from '@/services/api/favorites'
import { authAPI } from '@/services/api/auth'

/**
 * 获取音乐属性（兼容不同类型）
 */
const getMusicProperty = (music: any, property: string): any => {
  return music[property] || null
}

/**
 * 同步添加收藏到数据库
 */
export const syncAddFavorites = async (musicInfos: LX.Music.MusicInfo[]) => {
  try {
    const user = await authAPI.getCurrentUser()
    if (!user) {
      console.log('未登录，跳过收藏同步')
      return
    }

    const favorites = musicInfos.map(music => ({
      song_id: music.id,
      song_name: music.name,
      artist: music.singer,
      album: getMusicProperty(music, 'albumName') || getMusicProperty(music, 'album'),
      duration: music.interval ? parseInt(String(music.interval)) : undefined,
      source: music.source,
      cover_url: getMusicProperty(music, 'img') || getMusicProperty(music, 'pic'),
      quality: getMusicProperty(music.meta, '_qualitys')?.join(','),
    }))

    await favoritesAPI.addFavorites(favorites)
    console.log('已同步添加收藏到数据库:', musicInfos.length, '首')
  } catch (error) {
    console.log('同步收藏失败:', error)
  }
}

/**
 * 同步移除收藏从数据库
 */
export const syncRemoveFavorites = async (musicIds: string[], source?: string) => {
  try {
    const user = await authAPI.getCurrentUser()
    if (!user) {
      console.log('未登录，跳过收藏同步')
      return
    }

    // 如果没有提供source，需要从musicInfo获取
    // 这里简化处理，假设都是同一个source
    for (const musicId of musicIds) {
      // 由于我们不知道source，这里需要改进
      // 暂时跳过，后续优化
      console.log('需要移除收藏:', musicId)
    }
  } catch (error) {
    console.log('同步移除收藏失败:', error)
  }
}

/**
 * 初始化收藏集成
 */
export const initFavoritesIntegration = () => {
  // 监听列表音乐添加事件
  global.list_event.on('list_music_add', async (listId: string, musicInfos: LX.Music.MusicInfo[]) => {
    if (listId === LIST_IDS.LOVE) {
      await syncAddFavorites(musicInfos)
    }
  })

  // 监听列表音乐移除事件
  global.list_event.on('list_music_remove', async (listId: string, musicIds: string[]) => {
    if (listId === LIST_IDS.LOVE) {
      await syncRemoveFavorites(musicIds)
    }
  })

  console.log('收藏集成已初始化')
}
