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
 * 记录播放开始
 */
export const recordPlayStart = async (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  try {
    // 检查是否登录
    const user = await authAPI.getCurrentUser()
    if (!user) return

    currentPlayStartTime = Date.now()
    currentPlayMusicId = musicInfo.id
    
    const name = getMusicProperty(musicInfo, 'name')
    console.log('开始记录播放:', name)
  } catch (error) {
    console.log('记录播放开始失败:', error)
  }
}

/**
 * 记录播放结束
 */
export const recordPlayEnd = async () => {
  try {
    if (!currentPlayStartTime || !currentPlayMusicId) return

    const user = await authAPI.getCurrentUser()
    if (!user) return

    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo || musicInfo.id !== currentPlayMusicId) return

    const playDuration = Math.floor((Date.now() - currentPlayStartTime) / 1000)
    
    // 只记录播放时长超过5秒的
    if (playDuration < 5) {
      console.log('播放时长太短，不记录')
      return
    }

    const name = getMusicProperty(musicInfo, 'name')
    const singer = getMusicProperty(musicInfo, 'singer')
    const albumName = getMusicProperty(musicInfo, 'albumName')
    const source = getMusicProperty(musicInfo, 'source')
    const interval = getMusicProperty(musicInfo, 'interval') || 0

    await playHistoryAPI.addPlayRecord({
      song_id: musicInfo.id,
      song_name: name,
      artist: singer,
      album: albumName,
      source: source,
      play_duration: playDuration,
      total_duration: interval,
      completed: playDuration >= interval * 0.8, // 播放超过80%算完成
    })

    console.log('播放历史已记录:', name, playDuration, '秒')
    
    // 重置
    currentPlayStartTime = null
    currentPlayMusicId = null
  } catch (error) {
    console.log('记录播放历史失败:', error)
  }
}

/**
 * 初始化播放历史集成
 */
export const initPlayHistoryIntegration = () => {
  // 监听音乐切换事件
  global.app_event.on('musicToggled', () => {
    console.log('musicToggled事件触发')
    // 先记录上一首歌的播放结束
    void recordPlayEnd()
    
    // 然后开始记录新歌曲
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (musicInfo) {
      void recordPlayStart(musicInfo)
    }
  })

  // 监听播放暂停事件
  global.app_event.on('pause', () => {
    console.log('pause事件触发')
    void recordPlayEnd()
  })

  // 监听播放开始事件
  global.app_event.on('play', () => {
    console.log('play事件触发')
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (musicInfo && !currentPlayStartTime) {
      void recordPlayStart(musicInfo)
    }
  })

  console.log('播放历史集成已初始化')
}
