// @flow

import { Navigation } from 'react-native-navigation'

import {
  Home,
  PlayDetail,
  SonglistDetail,
  Comment,
  // Setting,
  SignInScreen,
  SignUpScreen,
  ForgotPasswordScreen,
  UserProfileScreen,
  EditProfileScreen,
  FavoritesListScreen,
  PlayHistoryListScreen,
  PlaylistsListScreen,
  PlaylistDetailScreen,
  SettingsScreen,
  DataMigrationScreen,
  NotificationsListScreen,
  VipPlansScreen,
  PlayStatisticsScreen,
  DownloadsListScreen,
} from '@/screens'
import { Provider } from '@/store/Provider'

import {
  HOME_SCREEN,
  PLAY_DETAIL_SCREEN,
  SONGLIST_DETAIL_SCREEN,
  COMMENT_SCREEN,
  VERSION_MODAL,
  PACT_MODAL,
  SYNC_MODE_MODAL,
  // SETTING_SCREEN,
  SIGN_IN_SCREEN,
  SIGN_UP_SCREEN,
  FORGOT_PASSWORD_SCREEN,
  USER_PROFILE_SCREEN,
  EDIT_PROFILE_SCREEN,
  FAVORITES_LIST_SCREEN,
  PLAY_HISTORY_SCREEN,
  PLAYLISTS_SCREEN,
  PLAYLIST_DETAIL_SCREEN,
  SETTINGS_SCREEN,
  DATA_MIGRATION_SCREEN,
  NOTIFICATIONS_LIST_SCREEN,
  VIP_PLANS_SCREEN,
  PLAY_STATISTICS_SCREEN,
  DOWNLOADS_LIST_SCREEN,
} from './screenNames'
import VersionModal from './components/VersionModal'
import PactModal from './components/PactModal'
import SyncModeModal from './components/SyncModeModal'

function WrappedComponent(Component: any) {
  return function inject(props: Record<string, any>) {
    const EnhancedComponent = () => (
      <Provider>
        <Component
          {...props}
        />
      </Provider>
    )

    return <EnhancedComponent />
  }
}

export default () => {
  Navigation.registerComponent(HOME_SCREEN, () => WrappedComponent(Home))
  Navigation.registerComponent(PLAY_DETAIL_SCREEN, () => WrappedComponent(PlayDetail))
  Navigation.registerComponent(SONGLIST_DETAIL_SCREEN, () => WrappedComponent(SonglistDetail))
  Navigation.registerComponent(COMMENT_SCREEN, () => WrappedComponent(Comment))
  Navigation.registerComponent(VERSION_MODAL, () => WrappedComponent(VersionModal))
  Navigation.registerComponent(PACT_MODAL, () => WrappedComponent(PactModal))
  Navigation.registerComponent(SYNC_MODE_MODAL, () => WrappedComponent(SyncModeModal))
  // Navigation.registerComponent(SETTING_SCREEN, () => WrappedComponent(Setting))

  // 用户系统屏幕
  Navigation.registerComponent(SIGN_IN_SCREEN, () => WrappedComponent(SignInScreen))
  Navigation.registerComponent(SIGN_UP_SCREEN, () => WrappedComponent(SignUpScreen))
  Navigation.registerComponent(FORGOT_PASSWORD_SCREEN, () => WrappedComponent(ForgotPasswordScreen))
  Navigation.registerComponent(USER_PROFILE_SCREEN, () => WrappedComponent(UserProfileScreen))
  Navigation.registerComponent(EDIT_PROFILE_SCREEN, () => WrappedComponent(EditProfileScreen))
  Navigation.registerComponent(FAVORITES_LIST_SCREEN, () => WrappedComponent(FavoritesListScreen))
  Navigation.registerComponent(PLAY_HISTORY_SCREEN, () => WrappedComponent(PlayHistoryListScreen))
  Navigation.registerComponent(PLAYLISTS_SCREEN, () => WrappedComponent(PlaylistsListScreen))
  Navigation.registerComponent(PLAYLIST_DETAIL_SCREEN, () => WrappedComponent(PlaylistDetailScreen))
  Navigation.registerComponent(SETTINGS_SCREEN, () => WrappedComponent(SettingsScreen))
  Navigation.registerComponent(DATA_MIGRATION_SCREEN, () => WrappedComponent(DataMigrationScreen))
  
  // 扩展功能屏幕
  Navigation.registerComponent(NOTIFICATIONS_LIST_SCREEN, () => WrappedComponent(NotificationsListScreen))
  Navigation.registerComponent(VIP_PLANS_SCREEN, () => WrappedComponent(VipPlansScreen))
  Navigation.registerComponent(PLAY_STATISTICS_SCREEN, () => WrappedComponent(PlayStatisticsScreen))
  Navigation.registerComponent(DOWNLOADS_LIST_SCREEN, () => WrappedComponent(DownloadsListScreen))

  console.info('All screens have been registered...')
}
