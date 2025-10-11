import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import schema from './schema'

// 导入所有数据模型
import Favorite from './models/Favorite'
import Playlist from './models/Playlist'
import PlaylistSong from './models/PlaylistSong'
import PlayHistory from './models/PlayHistory'
import PlayStatistic from './models/PlayStatistic'
import AppSetting from './models/AppSetting'
import UserProfile from './models/UserProfile'
import DislikedSong from './models/DislikedSong'
import ArtistPlayStat from './models/ArtistPlayStat'
import DailyPlayStat from './models/DailyPlayStat'
import Comment from './models/Comment'
import Like from './models/Like'
import Notification from './models/Notification'
import Order from './models/Order'
import UserFollow from './models/UserFollow'
import VipPlan from './models/VipPlan'
import DownloadedSong from './models/DownloadedSong'

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // 启用JSI以获得最佳性能
  onSetUpError: error => {
    console.error('数据库初始化失败:', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    Favorite,
    Playlist,
    PlaylistSong,
    PlayHistory,
    PlayStatistic,
    AppSetting,
    UserProfile,
    DislikedSong,
    ArtistPlayStat,
    DailyPlayStat,
    Comment,
    Like,
    Notification,
    Order,
    UserFollow,
    VipPlan,
    DownloadedSong,
  ],
})

export default database
