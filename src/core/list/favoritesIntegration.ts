/**
 * 收藏功能集成模块
 * 将原有的收藏列表与Supabase数据库和本地数据库同步
 */
import { LIST_IDS } from '@/config/constant'
import { favoritesAPI } from '@/services/api/favorites'
import { authAPI } from '@/services/api/auth'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { setMusicList } from '@/utils/listManage'

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
            console.log('[收藏同步] 未登录，跳过同步。请先登录账号。')
            return
        }

        console.log('[收藏同步] 准备同步', musicInfos.length, '首歌曲')

        const favorites = musicInfos.map(music => {
            const qualitys = getMusicProperty(music.meta, '_qualitys')
            return {
                song_id: music.id,
                song_name: music.name,
                artist: music.singer,
                album: getMusicProperty(music, 'albumName') || getMusicProperty(music, 'album'),
                duration: music.interval ? parseInt(String(music.interval)) : undefined,
                source: music.source,
                cover_url: getMusicProperty(music, 'img') || getMusicProperty(music, 'pic'),
                quality: Array.isArray(qualitys) ? qualitys.join(',') : undefined,
            }
        })

        // 同步到Supabase
        await favoritesAPI.addFavorites(favorites)
        console.log('[收藏同步] ✅ 成功同步', musicInfos.length, '首到Supabase数据库')

        // 同步到本地数据库
        await database.write(async () => {
            for (let i = 0; i < musicInfos.length; i++) {
                const music = musicInfos[i]
                const favorite = favorites[i]

                // 检查是否已存在
                const existing = await database.get('favorites')
                    .query(
                        Q.where('user_id', user.id),
                        Q.where('song_id', music.id),
                        Q.where('source', music.source)
                    )
                    .fetch()

                if (existing.length === 0) {
                    await database.get('favorites').create((record: any) => {
                        record.userId = user.id
                        record.songId = music.id
                        record.songName = music.name
                        record.artist = music.singer
                        record.album = favorite.album
                        record.duration = favorite.duration
                        record.source = music.source
                        record.coverUrl = favorite.cover_url
                        record.quality = favorite.quality
                        record.createdAt = new Date()
                        record.synced = true
                    })
                }
            }
        })
        console.log('[收藏同步] ✅ 成功同步', musicInfos.length, '首到本地数据库')

        // 触发数据更新事件，通知UI刷新
        global.app_event.favoritesUpdated()
    } catch (error: any) {
        if (error?.message?.includes('Auth session missing')) {
            console.log('[收藏同步] ❌ 登录会话已过期，请重新登录')
        } else {
            console.log('[收藏同步] ❌ 同步失败:', error?.message || error)
        }
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
                    // 从Supabase删除
                    for (const fav of favorites) {
                        await favoritesAPI.removeFavorite(musicId, fav.source)
                    }
                    console.log('[收藏同步] 已从Supabase移除收藏:', musicId, favorites.length, '条记录')

                    // 从本地数据库删除
                    await database.write(async () => {
                        const localFavorites = await database.get('favorites')
                            .query(
                                Q.where('user_id', user.id),
                                Q.where('song_id', musicId)
                            )
                            .fetch()

                        for (const localFav of localFavorites) {
                            await localFav.destroyPermanently()
                        }
                    })
                    console.log('[收藏同步] 已从本地数据库移除收藏:', musicId)

                    // 触发数据更新事件
                    global.app_event.favoritesUpdated()
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
 * 清空内存中的收藏列表
 */
export const clearFavoritesFromMemory = async () => {
    console.log('[收藏清空] 开始清空内存中的收藏列表...')

    // 清空内存中的收藏列表
    setMusicList(LIST_IDS.LOVE, [])
    console.log('[收藏清空] ✓ 已清空内存列表')

    // 保存到持久化存储
    const { saveListMusics } = await import('@/utils/data')
    await saveListMusics([{ id: LIST_IDS.LOVE, musics: [] }])
    console.log('[收藏清空] ✓ 已保存到持久化存储')

    // 触发列表更新事件
    global.app_event.myListMusicUpdate([LIST_IDS.LOVE])
    console.log('[收藏清空] ✓ 已触发列表更新事件')

    console.log('[收藏清空] ✅ 已清空内存中的收藏列表')
}

/**
 * 从本地数据库加载收藏列表到内存
 */
export const loadFavoritesFromDatabase = async () => {
    try {
        console.log('[收藏加载] ========== 开始加载收藏列表 ==========')

        let user
        try {
            user = await authAPI.getCurrentUser()
        } catch (error: any) {
            if (error?.message?.includes('Auth session missing')) {
                console.log('[收藏加载] 用户未登录（会话不存在），跳过加载')
            } else {
                console.log('[收藏加载] 获取用户信息失败:', error?.message)
            }
            return
        }

        if (!user) {
            console.log('[收藏加载] ❌ 未登录，跳过加载')
            return
        }

        console.log('[收藏加载] ✓ 用户已登录:', user.id)
        console.log('[收藏加载] 开始从本地数据库查询收藏...')

        // 从本地数据库查询收藏
        const favorites = await database.get('favorites')
            .query(Q.where('user_id', user.id))
            .fetch()

        console.log('[收藏加载] ✓ 从本地数据库查询到', favorites.length, '首收藏歌曲')

        if (favorites.length > 0) {
            console.log('[收藏加载] 收藏示例（前3首）:')
            favorites.slice(0, 3).forEach((fav: any, idx: number) => {
                console.log(`  [${idx + 1}] ${fav.songName} - ${fav.artist}`)
            })
        }

        // 转换为 MusicInfo 格式
        const musicInfos: LX.Music.MusicInfo[] = favorites.map((fav: any) => {
            const qualitys = fav.quality ? fav.quality.split(',') : []
            return {
                id: fav.songId,
                name: fav.songName,
                singer: fav.artist || '未知歌手',
                source: fav.source as LX.Source,
                interval: fav.duration || 0,
                img: fav.coverUrl,
                meta: {
                    songId: fav.songId,
                    albumName: fav.album || '',
                    qualitys: qualitys as any,
                    _qualitys: qualitys as any
                }
            } as LX.Music.MusicInfo
        })

        console.log('[收藏加载] 开始设置内存中的收藏列表...')

        // 直接设置内存中的收藏列表
        setMusicList(LIST_IDS.LOVE, musicInfos)
        console.log('[收藏加载] ✓ 已设置内存列表')

        // 触发列表更新事件
        global.app_event.myListMusicUpdate([LIST_IDS.LOVE])
        console.log('[收藏加载] ✓ 已触发列表更新事件')

        console.log('[收藏加载] ========== ✅ 成功加载收藏列表到内存 ==========')
    } catch (error) {
        console.error('[收藏加载] ❌ 加载失败:', error)
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

    console.log('[收藏集成] 已初始化')

    // 延迟加载收藏列表，确保数据库和用户认证已准备好
    setTimeout(() => {
        console.log('[收藏集成] 准备加载收藏列表...')
        void loadFavoritesFromDatabase()
    }, 2000)
}

// 导出loadFavoritesFromDatabase函数，以便在需要时手动触发加载
// 例如：在用户登录成功后调用
// import { loadFavoritesFromDatabase } from '@/core/list/favoritesIntegration'
// await loadFavoritesFromDatabase()
