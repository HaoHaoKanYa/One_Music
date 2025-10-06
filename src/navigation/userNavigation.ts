import { Navigation } from 'react-native-navigation'
import {
  SIGN_IN_SCREEN,
  SIGN_UP_SCREEN,
  USER_PROFILE_SCREEN,
  EDIT_PROFILE_SCREEN,
  FAVORITES_LIST_SCREEN,
  PLAY_HISTORY_SCREEN,
  PLAYLISTS_SCREEN,
  PLAYLIST_DETAIL_SCREEN,
  SETTINGS_SCREEN,
  DATA_MIGRATION_SCREEN,
} from './screenNames'

/**
 * 跳转到登录页面
 */
export const pushSignInScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: SIGN_IN_SCREEN,
      options: {
        topBar: {
          title: {
            text: '登录',
          },
        },
      },
    },
  })
}

/**
 * 跳转到注册页面
 */
export const pushSignUpScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: SIGN_UP_SCREEN,
      options: {
        topBar: {
          title: {
            text: '注册',
          },
        },
      },
    },
  })
}

/**
 * 跳转到用户资料页面
 */
export const pushUserProfileScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: USER_PROFILE_SCREEN,
      options: {
        topBar: {
          title: {
            text: '个人资料',
          },
        },
      },
    },
  })
}

/**
 * 跳转到编辑资料页面
 */
export const pushEditProfileScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: EDIT_PROFILE_SCREEN,
      options: {
        topBar: {
          title: {
            text: '编辑资料',
          },
        },
      },
    },
  })
}

/**
 * 跳转到收藏列表页面
 */
export const pushFavoritesListScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: FAVORITES_LIST_SCREEN,
      options: {
        topBar: {
          title: {
            text: '我的收藏',
          },
        },
      },
    },
  })
}

/**
 * 跳转到播放历史页面
 */
export const pushPlayHistoryScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: PLAY_HISTORY_SCREEN,
      options: {
        topBar: {
          title: {
            text: '播放历史',
          },
        },
      },
    },
  })
}

/**
 * 跳转到歌单列表页面
 */
export const pushPlaylistsScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: PLAYLISTS_SCREEN,
      options: {
        topBar: {
          title: {
            text: '我的歌单',
          },
        },
      },
    },
  })
}

/**
 * 跳转到歌单详情页面
 */
export const pushPlaylistDetailScreen = (componentId: string, playlistId: string) => {
  Navigation.push(componentId, {
    component: {
      name: PLAYLIST_DETAIL_SCREEN,
      passProps: {
        playlistId,
      },
      options: {
        topBar: {
          title: {
            text: '歌单详情',
          },
        },
      },
    },
  })
}

/**
 * 跳转到设置页面
 */
export const pushSettingsScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: SETTINGS_SCREEN,
      options: {
        topBar: {
          title: {
            text: '设置',
          },
        },
      },
    },
  })
}

/**
 * 跳转到数据迁移页面
 */
export const pushDataMigrationScreen = (componentId: string) => {
  Navigation.push(componentId, {
    component: {
      name: DATA_MIGRATION_SCREEN,
      options: {
        topBar: {
          title: {
            text: '数据迁移',
          },
        },
      },
    },
  })
}
