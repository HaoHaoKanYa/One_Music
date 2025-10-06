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
export const syncRemoveFavorites = async (musicIds: string[]) => {
    try {
        const user = await authAPI.getCurrentUser()
        if (!user) {
            console.log('未登录，跳过收藏同步')
            return
        }

        // 由于list_music_remove事件只提供musicIds，没有source信息
        // 我们需要查询数据库找到对应的收藏记录并删除
        const { supabase } = await import('@/lib/supabase')
        
        for (const musicId of musicIds) {
            try {
                // 查询该用户的该歌曲的所有收藏记录（可能有多个source）
                const { data: favorites, error: queryError } = await supabase
                    .from('favorite_songs')
                    .select('id, source')
                    .eq('user_id', user.id)
                    .eq('song_id', musicId)

                if (queryError) {
                    console.log('查询收藏记录失败:', queryError)
                    continue
                }

                if (favorites && favorites.length > 0) {
                    // 删除找到的所有记录
                    for (const fav of favorites) {
                        await favoritesAPI.removeFavorite(musicId, fav.source)
                    }
                    console.log('已从数据库移除收藏:', musicId, favorites.length, '条记录')
                }
            } catch (err) {
                console.log('移除单个收藏失败:', musicId, err)
            }
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
