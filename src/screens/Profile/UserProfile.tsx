import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Navigation } from 'react-native-navigation'
import { supabase } from '../../lib/supabase'
import { followAPI } from '@/services/api/social'
import {
  EDIT_PROFILE_SCREEN,
  SETTINGS_SCREEN,
  FAVORITES_LIST_SCREEN,
  PLAY_HISTORY_SCREEN,
  PLAYLISTS_SCREEN,
  PLAY_STATISTICS_SCREEN,
} from '@/navigation/screenNames'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'

interface UserProfile {
  user_id: string
  username: string
  display_name?: string
  email: string
  avatar_url?: string
  bio?: string
  total_play_time: number
  total_songs: number
  total_playlists: number
  following_count: number
  followers_count: number
  vip_status: string
}

interface UserProfileScreenProps {
  componentId: string
  userId?: string
}

const UserProfileScreenComponent: React.FC<UserProfileScreenProps & {
  userProfiles: any[]
  favorites: any[]
  playlists: any[]
  playHistory: any[]
}> = ({ componentId, userId, userProfiles, favorites, playlists, playHistory }) => {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isCurrentUser, setIsCurrentUser] = useState(true)

  // 从数组中获取第一个用户资料
  const profile = userProfiles?.[0] || null

  useEffect(() => {
    checkUser()
  }, [userId, profile])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('用户未登录')
        return
      }

      const isCurrent = profile?.userId === user.id
      setIsCurrentUser(isCurrent)

      // 如果不是当前用户，检查关注状态
      if (!isCurrent && profile) {
        await checkFollowStatus(profile.userId)
      }
    } catch (error: any) {
      console.log('检查用户状态失败:', error)
    }
  }

  const checkFollowStatus = async (targetUserId: string) => {
    try {
      const following = await followAPI.isFollowing(targetUserId)
      setIsFollowing(following)
    } catch (error) {
      console.error('检查关注状态失败:', error)
    }
  }

  const handleFollow = async () => {
    if (!profile) return

    try {
      if (isFollowing) {
        await followAPI.unfollowUser(profile.user_id)
        setIsFollowing(false)
        Alert.alert('成功', '已取消关注')
      } else {
        await followAPI.followUser(profile.user_id)
        setIsFollowing(true)
        Alert.alert('成功', '关注成功')
      }
    } catch (error: any) {
      Alert.alert('错误', error.message)
    }
  }

  // 计算统计数据
  const totalPlayTime = playHistory?.reduce((sum, record) => sum + (record.playDuration || 0), 0) || 0

  const handleSignOut = async () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              // 1. 立即关闭页面，避免显示"请先登录"
              Navigation.dismissModal(componentId)

              // 2. 显示退出成功提示
              setTimeout(() => {
                Alert.alert('成功', '已退出登录')
              }, 100)

              // 3. 后台执行清理操作（不阻塞UI）
              setTimeout(async () => {
                try {
                  console.log('[退出登录] 开始后台清理...')

                  // 同步数据到云端（后台执行）
                  try {
                    const { syncEngine } = require('@/database/sync/syncEngine')
                    console.log('[退出登录] 开始后台同步数据...')
                    await syncEngine.performSync()
                    console.log('[退出登录] 数据同步完成')
                  } catch (syncError) {
                    console.error('[退出登录] 同步失败:', syncError)
                    // 同步失败不影响退出流程
                  }

                  // 清除本地用户资料
                  await database.write(async () => {
                    const profiles = await database.get('user_profiles').query().fetch()
                    for (const profile of profiles) {
                      await profile.destroyPermanently()
                    }
                  })
                  console.log('[退出登录] 已清除本地用户资料')

                  // 清空内存中的收藏列表
                  const { clearFavoritesFromMemory } = require('@/core/list/favoritesIntegration')
                  await clearFavoritesFromMemory()
                  console.log('[退出登录] 已清空收藏列表')

                  // 清空内存中的用户歌单
                  const { setUserList } = require('@/core/list')
                  setUserList([])
                  console.log('[退出登录] 已清空用户歌单')

                  // 退出登录
                  await supabase.auth.signOut()
                  console.log('[退出登录] 已退出登录会话')

                  console.log('[退出登录] ✅ 后台清理完成')
                } catch (error) {
                  console.error('[退出登录] 后台清理失败:', error)
                  // 后台清理失败不影响用户体验
                }
              }, 100)
            } catch (error: any) {
              Alert.alert('错误', error.message)
            }
          },
        },
      ]
    )
  }

  const handleNavigate = (screenName: string, title: string) => {
    Navigation.showModal({
      stack: {
        children: [{
          component: {
            name: screenName,
            options: {
              topBar: {
                visible: false,
                height: 0,
              },
            },
          },
        }],
      },
    })
  }

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours} 小时 ${minutes} 分钟`
    }
    return `${minutes} 分钟`
  }

  // 如果没有用户资料，显示空状态（不显示错误，因为可能是未登录）
  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>请先登录</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => handleNavigate(EDIT_PROFILE_SCREEN, '编辑资料')}
        >
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile.display_name?.[0] || profile.username[0]}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.displayName}>
          {profile.displayName || profile.username}
        </Text>
        <Text style={styles.username}>@{profile.username}</Text>

        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {profile.vipStatus !== 'free' && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipText}>
              {profile.vipStatus === 'vip' ? 'VIP' : 'SVIP'}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favorites?.length || 0}</Text>
          <Text style={styles.statLabel}>收藏歌曲</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{playlists?.length || 0}</Text>
          <Text style={styles.statLabel}>创建歌单</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPlayTime(totalPlayTime)}</Text>
          <Text style={styles.statLabel}>播放时长</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statValue}>{profile.following_count}</Text>
          <Text style={styles.statLabel}>关注</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statValue}>{profile.followers_count}</Text>
          <Text style={styles.statLabel}>粉丝</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {isCurrentUser ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNavigate(EDIT_PROFILE_SCREEN, '编辑资料')}
            >
              <Text style={styles.actionButtonText}>编辑资料</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => handleNavigate(SETTINGS_SCREEN, '设置')}
            >
              <Text style={styles.actionButtonTextSecondary}>设置</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isFollowing && styles.actionButtonFollowing,
              ]}
              onPress={handleFollow}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  isFollowing && styles.actionButtonTextFollowing,
                ]}
              >
                {isFollowing ? '已关注' : '关注'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => Alert.alert('功能开发中', '私信功能正在开发中')}
            >
              <Text style={styles.actionButtonTextSecondary}>私信</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate(FAVORITES_LIST_SCREEN, '我的收藏')}
        >
          <Text style={styles.menuItemText}>我的收藏</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate(PLAY_HISTORY_SCREEN, '播放历史')}
        >
          <Text style={styles.menuItemText}>播放历史</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate(PLAYLISTS_SCREEN, '我的歌单')}
        >
          <Text style={styles.menuItemText}>我的歌单</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        {isCurrentUser && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigate(PLAY_STATISTICS_SCREEN, '播放统计')}
          >
            <Text style={styles.menuItemText}>播放统计</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        )}

        {isCurrentUser && (
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <Text style={[styles.menuItemText, styles.menuItemDanger]}>退出登录</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatar: {
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    marginTop: 8,
  },
  vipBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  vipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonFollowing: {
    backgroundColor: '#E0E0E0',
  },
  actionButtonTextFollowing: {
    color: '#666',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#212121',
  },
  menuItemDanger: {
    color: '#F44336',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#BDBDBD',
  },
})

// 使用withObservables包装组件，实现响应式数据
const UserProfileScreen = withObservables([], () => ({
  userProfiles: database.get('user_profiles')
    .query()
    .observe(),
  favorites: database.get('favorites')
    .query()
    .observe(),
  playlists: database.get('playlists')
    .query(Q.where('is_deleted', false))
    .observe(),
  playHistory: database.get('play_history')
    .query()
    .observe()
}))(UserProfileScreenComponent)

export { UserProfileScreen }
