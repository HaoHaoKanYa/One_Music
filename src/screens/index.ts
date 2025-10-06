// 原有界面 - 使用 default export
export { default as Home } from './Home'
export { default as PlayDetail } from './PlayDetail'
export { default as SonglistDetail } from './SonglistDetail'
export { default as Comment } from './Comment'

// 认证界面
export { SignInScreen } from './Auth/SignIn'
export { SignUpScreen } from './Auth/SignUp'
export { ForgotPasswordScreen } from './Auth/ForgotPassword'

// 用户资料界面
export { UserProfileScreen } from './Profile/UserProfile'
export { EditProfileScreen } from './Profile/EditProfile'

// 设置界面
export { SettingsScreen } from './Settings/Settings'

// 收藏界面
export { FavoritesListScreen } from './Favorites/FavoritesList'

// 播放历史界面
export { PlayHistoryListScreen } from './PlayHistory/PlayHistoryList'

// 歌单界面
export { PlaylistsListScreen } from './Playlists/PlaylistsList'
export { PlaylistDetailScreen } from './Playlists/PlaylistDetail'

// 数据迁移界面
export { DataMigrationScreen } from './Migration/DataMigration'

// 扩展功能界面
export { NotificationsListScreen } from './Notifications/NotificationsList'
export { VipPlansScreen } from './Vip/VipPlans'
export { PlayStatisticsScreen } from './Statistics/PlayStatistics'
