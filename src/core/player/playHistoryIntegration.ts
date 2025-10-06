/**
 * 播放历史集成模块
 * 将播放器事件与Supabase数据库集成
 */
import { playHistoryAPI } from '@/services/api/playHistory'
import { authAPI } from '@/services/api/auth'
import playerState from '@/store/player/state'

let currentPlayStartTime: number | null = null
let currentPlayMusicId: string | null = null

/**
 * 获取音乐信息的属性（兼容不同类型）
 */
const getMusicProperty = (musicInfo: any, property: string): any => {
    if ('metadata' in musicInfo) {
        // ListItem类型
        return musicInfo.metadata.musicInfo[property]
    }
    return musicInfo[property]
}

/**
 * 转换时长为秒数
 */
const convertDurationToSeconds = (duration: any): number => {
    if (typeof duration === 'number') {
        return duration
    }
    if (typeof duration === 'string') {
        // 处理 "03:50" 格式
        const parts = duration.split(':')
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1])
        }
        // 处理纯数字字符串
        return parseInt(duration) || 0
    }
    return 0
}

/**
 * 记录播放开始
 */
export const recordPlayStart = async (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
    try {
        // 检查是否登录
        const user = await authAPI.getCurrentUser()
        if (!user) {
            console.log('[播放历史] 未登录，跳过记录')
            return
        }

        currentPlayStartTime = Date.now()
        currentPlayMusicId = musicInfo.id

        const name = getMusicProperty(musicInfo, 'name')
        console.log('[播放历史] ▶️ 开始记录:', name)
    } catch (error) {
        console.log('[播放历史] ❌ 记录开始失败:', error)
    }
}

/**
 * 使用指定的信息记录播放结束
 */
const recordPlayEndWithInfo = async (musicId: string, startTime: number) => {
    try {
        const user = await authAPI.getCurrentUser()
        if (!user) {
            console.log('[播放历史] 未登录，跳过记录')
            return
        }

        const playDuration = Math.floor((Date.now() - startTime) / 1000)

        // 只记录播放时长超过5秒的
        if (playDuration < 5) {
            console.log('[播放历史] ⏩ 播放时长太短(' + playDuration + '秒)，不记录')
            return
        }

        // 从播放历史或当前播放信息获取歌曲详情
        const musicInfo = playerState.playMusicInfo.musicInfo

        // 如果当前歌曲不是要记录的歌曲，尝试从其他地方获取
        // 这里简化处理，使用当前信息（因为已经切歌了，只能尽力而为）
        const name = musicInfo ? getMusicProperty(musicInfo, 'name') : '未知歌曲'
        const singer = musicInfo ? getMusicProperty(musicInfo, 'singer') : '未知歌手'
        const albumName = musicInfo ? getMusicProperty(musicInfo, 'albumName') : undefined
        const source = musicInfo ? getMusicProperty(musicInfo, 'source') : 'kw'
        const interval = musicInfo ? convertDurationToSeconds(getMusicProperty(musicInfo, 'interval')) : 0

        console.log('[播放历史] 📝 准备记录(切歌):', name, '播放时长:', playDuration, '秒', '总时长:', interval, '秒')

        await playHistoryAPI.addPlayRecord({
            song_id: musicId,
            song_name: name,
            artist: singer,
            album: albumName,
            source: source,
            play_duration: playDuration,
            total_duration: interval,
            completed: playDuration >= interval * 0.8,
        })

        console.log('[播放历史] ✅ 成功记录(切歌):', name, playDuration, '秒')
    } catch (error: any) {
        console.log('[播放历史] ❌ 记录失败:', error?.message || error)
    }
}

/**
 * 记录播放结束
 */
export const recordPlayEnd = async () => {
    try {
        if (!currentPlayStartTime || !currentPlayMusicId) {
            console.log('[播放历史] ⏭️ 没有播放记录，跳过')
            return
        }

        const user = await authAPI.getCurrentUser()
        if (!user) {
            console.log('[播放历史] 未登录，跳过记录')
            return
        }

        const musicInfo = playerState.playMusicInfo.musicInfo
        if (!musicInfo || musicInfo.id !== currentPlayMusicId) {
            console.log('[播放历史] ⚠️ 歌曲ID不匹配，跳过')
            return
        }

        const playDuration = Math.floor((Date.now() - currentPlayStartTime) / 1000)

        // 只记录播放时长超过5秒的
        if (playDuration < 5) {
            console.log('[播放历史] ⏩ 播放时长太短(' + playDuration + '秒)，不记录')
            return
        }

        const name = getMusicProperty(musicInfo, 'name')
        const singer = getMusicProperty(musicInfo, 'singer')
        const albumName = getMusicProperty(musicInfo, 'albumName')
        const source = getMusicProperty(musicInfo, 'source')
        const interval = convertDurationToSeconds(getMusicProperty(musicInfo, 'interval'))

        console.log('[播放历史] 📝 准备记录:', name, '播放时长:', playDuration, '秒', '总时长:', interval, '秒')

        await playHistoryAPI.addPlayRecord({
            song_id: musicInfo.id,
            song_name: name,
            artist: singer,
            album: albumName,
            source: source,
            play_duration: playDuration,
            total_duration: interval,
            completed: interval > 0 && playDuration >= interval * 0.8, // 播放超过80%算完成
        })

        console.log('[播放历史] ✅ 成功记录:', name, playDuration, '秒')

        // 重置
        currentPlayStartTime = null
        currentPlayMusicId = null
    } catch (error: any) {
        console.log('[播放历史] ❌ 记录失败:', error?.message || error)
    }
}

/**
 * 初始化播放历史集成
 */
export const initPlayHistoryIntegration = () => {
    // 监听音乐切换事件
    global.app_event.on('musicToggled', () => {
        console.log('[播放历史] 🎵 musicToggled事件触发')

        // 保存旧歌曲信息用于记录
        const oldStartTime = currentPlayStartTime
        const oldMusicId = currentPlayMusicId

        // 立即重置，避免被新歌曲覆盖
        currentPlayStartTime = null
        currentPlayMusicId = null

        // 记录上一首歌（使用保存的信息）
        if (oldStartTime && oldMusicId) {
            void recordPlayEndWithInfo(oldMusicId, oldStartTime)
        }

        // 然后开始记录新歌曲
        const musicInfo = playerState.playMusicInfo.musicInfo
        if (musicInfo) {
            void recordPlayStart(musicInfo)
        }
    })

    // 监听播放暂停事件
    global.app_event.on('pause', () => {
        console.log('[播放历史] ⏸️ pause事件触发')
        void recordPlayEnd()
    })

    // 监听播放开始事件
    global.app_event.on('play', () => {
        console.log('[播放历史] ▶️ play事件触发')
        const musicInfo = playerState.playMusicInfo.musicInfo
        if (musicInfo && !currentPlayStartTime) {
            void recordPlayStart(musicInfo)
        }
    })

    console.log('[播放历史] 🎬 播放历史集成已初始化')
}
