// import { getPlayInfo } from '@/utils/data'
// import { log } from '@/utils/log'
import { init as musicSdkInit } from '@/utils/musicSdk'
import { getUserLists, setUserList } from '@/core/list'
import { setNavActiveId } from '../common'
import { getViewPrevState } from '@/utils/data'
import { bootLog } from '@/utils/bootLog'
import { getDislikeInfo, setDislikeInfo } from '@/core/dislikeList'
import { unlink } from '@/utils/fs'
import { TEMP_FILE_PATH } from '@/utils/tools'
import { syncPlaylistsFromServer } from '@/services/playlistSync'
import { database } from '@/database'
import { syncEngine } from '@/database/sync/syncEngine'
import { loadPlaylistsFromDatabase } from '@/core/list/playlistsIntegration'
// import { play, playList } from '../player/player'

// const initPrevPlayInfo = async(appSetting: LX.AppSetting) => {
//   const info = await getPlayInfo()
//   global.lx.restorePlayInfo = null
//   if (!info?.listId || info.index < 0) return
//   const list = await getListMusics(info.listId)
//   if (!list[info.index]) return
//   global.lx.restorePlayInfo = info
//   await playList(info.listId, info.index)

//   if (appSetting['player.startupAutoPlay']) setTimeout(play)
// }

export default async (appSetting: LX.AppSetting) => {
  // await Promise.all([
  //   initUserApi(), // 自定义API
  // ]).catch(err => log.error(err))

  // 初始化本地数据库
  bootLog('Initializing local database...')
  try {
    // WatermelonDB 会自动初始化，不需要手动调用 setUp
    // 只需要确保数据库实例已创建
    bootLog('Local database initialized.')
  } catch (error) {
    console.error('Failed to initialize local database:', error)
    bootLog('Local database initialization failed.')
  }

  // 启动同步引擎
  bootLog('Starting sync engine...')
  try {
    syncEngine.start()
    bootLog('Sync engine started.')
  } catch (error) {
    console.error('Failed to start sync engine:', error)
    bootLog('Sync engine start failed.')
  }

  void musicSdkInit() // 初始化音乐sdk
  bootLog('User list init...')
  
  // 从本地数据库(WatermelonDB)加载歌单到应用状态
  bootLog('Loading playlists from database...')
  try {
    // 延迟加载，避免阻塞启动，并确保数据库已初始化
    setTimeout(() => {
      void loadPlaylistsFromDatabase().then(() => {
        bootLog('Playlists loaded from database.')
      }).catch((error) => {
        console.error('Failed to load playlists from database:', error)
        bootLog('Playlists load failed.')
        // 如果加载失败，初始化为空列表
        setUserList([])
      })
    }, 1000)
  } catch (error) {
    console.error('Failed to schedule playlist loading:', error)
    // 初始化为空列表
    setUserList([])
  }

  setDislikeInfo(await getDislikeInfo()) // 获取不喜欢列表
  bootLog('User list inited.')
  setNavActiveId((await getViewPrevState()).id)
  void unlink(TEMP_FILE_PATH)
  // await initPrevPlayInfo(appSetting).catch(err => log.error(err)) // 初始化上次的歌曲播放信息
}
