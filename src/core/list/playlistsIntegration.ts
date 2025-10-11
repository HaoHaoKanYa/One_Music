/**
 * 歌单功能集成模块
 * 将WatermelonDB中的歌单数据加载到应用状态中
 */
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { authAPI } from '@/services/api/auth'
import listAction from '@/store/list/action'
import { setMusicList } from '@/utils/listManage'

/**
 * 从本地数据库加载歌单列表到应用状态
 */
export const loadPlaylistsFromDatabase = async () => {
    try {
        console.log('[歌单加载] ========== 开始加载歌单列表 ==========')

        let user
        try {
            user = await authAPI.getCurrentUser()
        } catch (error: any) {
            if (error?.message?.includes('Auth session missing')) {
                console.log('[歌单加载] 用户未登录（会话不存在），跳过加载')
            } else {
                console.log('[歌单加载] 获取用户信息失败:', error?.message)
            }
            return
        }

        if (!user) {
            console.log('[歌单加载] ❌ 未登录，跳过加载')
            return
        }

        console.log('[歌单加载] ✓ 用户已登录:', user.id)
        console.log('[歌单加载] 开始从本地数据库查询歌单...')

        // 从本地数据库查询歌单（排除已删除的）
        const playlists = await database.get('playlists')
            .query(
                Q.where('user_id', user.id),
                Q.where('is_deleted', false)
            )
            .fetch()

        console.log('[歌单加载] ✓ 从本地数据库查询到', playlists.length, '个歌单')

        if (playlists.length > 0) {
            console.log('[歌单加载] 歌单示例（前3个）:')
            playlists.slice(0, 3).forEach((playlist: any, idx: number) => {
                console.log(`  [${idx + 1}] ${playlist.name} (${playlist.songCount || 0}首)`)
            })
        }

        // 转换为应用的 UserListInfo 格式
        const userLists: LX.List.UserListInfo[] = playlists.map((playlist: any) => ({
            id: `db_${playlist.id}`, // 使用db_前缀标识来自数据库的歌单
            name: playlist.name,
            source: undefined,
            sourceListId: playlist.id, // 保存数据库ID用于后续操作
            locationUpdateTime: playlist.updatedAt.getTime(),
        }))

        console.log('[歌单加载] 开始加载歌单中的歌曲...')

        // 加载每个歌单的歌曲列表到内存
        for (const playlist of playlists) {
            try {
                const playlistId = `db_${(playlist as any).id}`

                // 从数据库查询该歌单的歌曲
                const songs = await database.get('playlist_songs')
                    .query(
                        Q.where('playlist_id', (playlist as any).id),
                        Q.sortBy('position', Q.asc)
                    )
                    .fetch()

                console.log(`[歌单加载] 歌单 "${(playlist as any).name}" 有 ${songs.length} 首歌曲`)

                // 转换为 MusicInfo 格式
                const musicInfos: LX.Music.MusicInfo[] = songs.map((song: any) => {
                    const musicInfo: any = {
                        id: song.songId,
                        name: song.songName,
                        singer: song.artist || '未知歌手',
                        source: song.source as LX.Source,
                        interval: song.duration || 0,
                        img: song.coverUrl,
                        meta: {
                            songId: song.songId,
                            albumName: song.album || '',
                        }
                    }
                    return musicInfo as LX.Music.MusicInfo
                })

                // 将歌曲列表加载到内存
                setMusicList(playlistId, musicInfos)
                console.log(`[歌单加载] ✓ 已加载歌单 "${(playlist as any).name}" 的 ${musicInfos.length} 首歌曲到内存`)
            } catch (error) {
                console.error(`[歌单加载] ❌ 加载歌单 "${(playlist as any).name}" 的歌曲失败:`, error)
            }
        }

        console.log('[歌单加载] 开始更新应用状态...')

        // 更新应用状态
        listAction.setUserLists(userLists)
        console.log('[歌单加载] ✓ 已更新应用状态')

        console.log('[歌单加载] ========== ✅ 成功加载歌单列表到应用状态 ==========')

        return userLists
    } catch (error) {
        console.error('[歌单加载] ❌ 加载失败:', error)
        return []
    }
}

/**
 * 初始化歌单集成
 */
export const initPlaylistsIntegration = () => {
    console.log('[歌单集成] 已初始化')

    // 监听歌单更新事件
    if (global.app_event.on) {
        global.app_event.on('playlistsUpdated', () => {
            console.log('[歌单集成] 收到歌单更新事件，重新加载歌单...')
            void loadPlaylistsFromDatabase()
        })
    }

    // 延迟加载歌单列表，确保数据库和用户认证已准备好
    setTimeout(() => {
        console.log('[歌单集成] 准备加载歌单列表...')
        void loadPlaylistsFromDatabase()
    }, 2000)
}
