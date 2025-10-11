/**
 * 歌单同步服务
 * 负责本地歌单与Supabase数据库之间的双向同步
 */

import { playlistsAPI, type Playlist, type PlaylistSong } from './api/playlists'
import { supabase } from '@/lib/supabase'
import { setUserList, addListMusics, overwriteListMusics } from '@/core/list'
import listState from '@/store/list/state'
import settingState from '@/store/setting/state'
import { Q } from '@nozbe/watermelondb'

/**
 * 从Supabase加载用户歌单到本地
 */
export const syncPlaylistsFromServer = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.log('[PlaylistSync] 用户未登录，跳过同步')
            return
        }

        // 获取服务端歌单
        const serverPlaylists = await playlistsAPI.getMyPlaylists()

        // 转换为本地歌单格式
        const userLists: LX.List.UserListInfo[] = serverPlaylists.map(playlist => ({
            id: `cloud_${playlist.id}`, // 使用cloud_前缀标识云端歌单
            name: playlist.name,
            source: undefined,
            sourceListId: playlist.id, // 保存Supabase的ID用于同步
            locationUpdateTime: new Date(playlist.updated_at || playlist.created_at!).getTime(),
        }))

        // 合并本地歌单和云端歌单
        const localOnlyLists = listState.userList.filter(list =>
            !list.id.startsWith('cloud_') // 保留纯本地歌单
        )

        const mergedLists = [...localOnlyLists, ...userLists]

        // 更新本地状态
        setUserList(mergedLists)

        console.log(`[PlaylistSync] 同步完成: ${serverPlaylists.length} 个云端歌单`)

        return mergedLists
    } catch (error) {
        console.error('[PlaylistSync] 同步失败:', error)
        throw error
    }
}

/**
 * 加载歌单中的歌曲
 */
export const loadPlaylistSongs = async (localListId: string) => {
    try {
        // 提取Supabase歌单ID
        const supabaseId = localListId.replace('cloud_', '')

        // 从服务端获取歌曲
        const songs = await playlistsAPI.getPlaylistSongs(supabaseId)

        // 转换为本地音乐格式
        const musicInfos: LX.Music.MusicInfo[] = songs.map(song => ({
            id: song.song_id,
            name: song.song_name,
            singer: song.artist,
            interval: song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}` : undefined,
            source: song.source as LX.OnlineSource,
            meta: {
                albumName: song.album || '',
            },
        } as LX.Music.MusicInfo))

        // 覆盖本地歌单的歌曲
        await overwriteListMusics(localListId, musicInfos)

        console.log(`[PlaylistSync] 加载歌单歌曲: ${localListId}, ${songs.length} 首`)

        return musicInfos
    } catch (error) {
        console.error('[PlaylistSync] 加载歌单歌曲失败:', error)
        throw error
    }
}

/**
 * 创建歌单并同步到服务端
 */
export const createPlaylistWithSync = async (name: string, description?: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error('用户未登录')
        }

        // 创建服务端歌单
        const playlist = await playlistsAPI.createPlaylist({
            name,
            description,
            is_public: false,
        })

        // 创建本地数据库记录
        const { database } = await import('@/database')
        let dbPlaylistId: string = ''

        await database.write(async () => {
            const dbPlaylist = await database.get('playlists').create((record: any) => {
                record.userId = user.id
                record.name = playlist.name
                record.description = playlist.description
                record.isPublic = playlist.is_public || false
                record.songCount = 0
                record.playCount = 0
                record.likeCount = 0
                record.commentCount = 0
                record.isDeleted = false
                record.createdAt = new Date(playlist.created_at!)
                record.updatedAt = new Date(playlist.updated_at || playlist.created_at!)
                record.synced = true
            })
            dbPlaylistId = dbPlaylist.id
        })

        // 创建本地歌单信息
        const localList: LX.List.UserListInfo = {
            id: `db_${dbPlaylistId}`, // 使用数据库ID
            name: playlist.name,
            source: undefined,
            sourceListId: dbPlaylistId,
            locationUpdateTime: Date.now(),
        }

        // 添加到本地状态
        const newUserLists = [...listState.userList, localList]
        setUserList(newUserLists)

        console.log(`[PlaylistSync] 创建歌单: ${name}`)

        // 触发歌单更新事件
        global.app_event.playlistsUpdated?.()

        return localList
    } catch (error) {
        console.error('[PlaylistSync] 创建歌单失败:', error)
        throw error
    }
}

/**
 * 添加歌曲到歌单并同步到服务端
 */
export const addSongsToPlaylistWithSync = async (
    localListId: string,
    musicInfos: LX.Music.MusicInfo[]
) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error('用户未登录')
        }

        // 检查是否是数据库歌单
        if (!localListId.startsWith('db_')) {
            // 旧格式歌单，只添加到本地
            await addListMusics(localListId, musicInfos, settingState.setting['list.addMusicLocationType'])
            return
        }

        const dbPlaylistId = localListId.replace('db_', '')
        const { database } = await import('@/database')

        // 获取歌单记录
        const playlist = await database.get('playlists').find(dbPlaylistId)

        // 获取当前歌单的最大position
        const existingSongs = await database.get('playlist_songs')
            .query(Q.where('playlist_id', dbPlaylistId))
            .fetch()

        let maxPosition = existingSongs.length > 0
            ? Math.max(...existingSongs.map((s: any) => s.position))
            : -1

        // 添加到本地数据库
        await database.write(async () => {
            for (const music of musicInfos) {
                maxPosition++
                await database.get('playlist_songs').create((song: any) => {
                    song.playlistId = dbPlaylistId
                    song.songId = music.id
                    song.songName = music.name
                    song.artist = music.singer
                    song.album = (music as any).meta?.albumName || ''
                    song.source = music.source
                    song.duration = music.interval ? parseDuration(String(music.interval)) : undefined
                    song.coverUrl = (music as any).img || ''
                    song.position = maxPosition
                    song.addedAt = new Date()
                    song.synced = false
                })
            }

            // 更新歌单的songCount
            await (playlist as any).update((record: any) => {
                record.songCount = (record.songCount || 0) + musicInfos.length
                record.updatedAt = new Date()
                record.synced = false
            })
        })

        // 添加到内存
        await addListMusics(localListId, musicInfos, settingState.setting['list.addMusicLocationType'])

        console.log(`[PlaylistSync] 添加歌曲到歌单: ${localListId}, ${musicInfos.length} 首`)

        // 触发歌单更新事件
        global.app_event.playlistsUpdated?.()
    } catch (error) {
        console.error('[PlaylistSync] 添加歌曲失败:', error)
        throw error
    }
}

/**
 * 从歌单移除歌曲并同步到服务端
 */
export const removeSongsFromPlaylistWithSync = async (
    localListId: string,
    musicIds: string[]
) => {
    try {
        // 检查是否是云端歌单
        if (!localListId.startsWith('cloud_')) {
            // 纯本地歌单，只从本地移除
            const { removeListMusics } = await import('@/core/list')
            await removeListMusics(localListId, musicIds)
            return
        }

        const supabaseId = localListId.replace('cloud_', '')

        // 获取歌曲信息以获取source
        const listMusics = listState.allMusicList.get(localListId) || []

        // 从服务端移除
        for (const musicId of musicIds) {
            const music = listMusics.find(m => m.id === musicId)
            if (music) {
                await playlistsAPI.removeSongFromPlaylist(supabaseId, musicId, music.source)
            }
        }

        // 从本地移除
        const { removeListMusics } = await import('@/core/list')
        await removeListMusics(localListId, musicIds)

        console.log(`[PlaylistSync] 从歌单移除歌曲: ${localListId}, ${musicIds.length} 首`)
    } catch (error) {
        console.error('[PlaylistSync] 移除歌曲失败:', error)
        throw error
    }
}

/**
 * 更新歌单信息并同步到服务端
 */
export const updatePlaylistWithSync = async (
    localListId: string,
    updates: { name?: string; description?: string }
) => {
    try {
        // 检查是否是云端歌单
        if (!localListId.startsWith('cloud_')) {
            // 纯本地歌单，只更新本地
            const { updateUserList } = await import('@/core/list')
            const list = listState.userList.find(l => l.id === localListId)
            if (list && updates.name) {
                await updateUserList([{ ...list, name: updates.name }])
            }
            return
        }

        const supabaseId = localListId.replace('cloud_', '')

        // 更新服务端
        await playlistsAPI.updatePlaylist(supabaseId, updates)

        // 更新本地
        const { updateUserList } = await import('@/core/list')
        const list = listState.userList.find(l => l.id === localListId)
        if (list && updates.name) {
            await updateUserList([{ ...list, name: updates.name }])
        }

        console.log(`[PlaylistSync] 更新歌单: ${localListId}`)
    } catch (error) {
        console.error('[PlaylistSync] 更新歌单失败:', error)
        throw error
    }
}

/**
 * 删除歌单并同步到服务端
 */
export const deletePlaylistWithSync = async (localListId: string) => {
    try {
        // 检查是否是云端歌单
        if (!localListId.startsWith('cloud_')) {
            // 纯本地歌单，只从本地删除
            const { removeUserList } = await import('@/core/list')
            await removeUserList([localListId])
            return
        }

        const supabaseId = localListId.replace('cloud_', '')

        // 从服务端删除
        await playlistsAPI.deletePlaylist(supabaseId)

        // 从本地删除
        const { removeUserList } = await import('@/core/list')
        await removeUserList([localListId])

        console.log(`[PlaylistSync] 删除歌单: ${localListId}`)
    } catch (error) {
        console.error('[PlaylistSync] 删除歌单失败:', error)
        throw error
    }
}

/**
 * 解析时间格式 "mm:ss" 为秒数
 */
function parseDuration(interval: string): number {
    const parts = interval.split(':')
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    return 0
}
