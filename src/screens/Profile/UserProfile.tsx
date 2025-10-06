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

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ componentId, userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isCurrentUser, setIsCurrentUser] = useState(true)

  useEffect(() => {
    loadProfile()
    
    // 监听收藏更新事件
    const handleFavoritesUpdate = () => {
      loadProfile()
    }
    
    global.app_event.on('favoritesUpdated', handleFavoritesUpdate)
    
    return () => {
      global.app_event.off('favoritesUpdated', handleFavoritesUpdate)
    }
  }, [])

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

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const targetUserId = userId || user.id

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single()

      if (error) throw error
      
      // 获取实时统计数据
      const [favCount, playlistCount] = await Promise.all([
        supabase
          .from('favorite_songs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId)
          .then(res => res.count || 0),
        supabase
          .from('playlists')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId)
          .eq('is_deleted', false)
          .then(res => res.count || 0),
      ])
      
      // 合并实时统计数据
      setProfile({
        ...data,
        total_songs: favCount,
        total_playlists: playlistCount,
      })
      
      // 检查是否是当前用户
      const isCurrent = data.user_id === user.id
      setIsCurrentUser(isCurrent)
      
      // 如果不是当前用户，检查关注状态
      if (!isCurrent) {
        await checkFollowStatus(data.user_id)
      }
    } catch (error: any) {
      Alert.alert('错误', error.message)
    } finally {
      setLoading(false)
    }
  }

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
              await supabase.auth.signOut()
              Navigation.dismissModal(componentId)
              setTimeout(() => {
                Alert.alert('成功', '已退出登录')
              }, 300)
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
    return `${hours} 小时`
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>加载失败</Text>
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
          {profile.display_name || profile.username}
        </Text>
        <Text style={styles.username}>@{profile.username}</Text>

        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {profile.vip_status !== 'free' && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipText}>
              {profile.vip_status === 'vip' ? 'VIP' : 'SVIP'}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile.total_songs}</Text>
          <Text style={styles.statLabel}>收藏歌曲</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile.total_playlists}</Text>
          <Text style={styles.statLabel}>创建歌单</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPlayTime(profile.total_play_time)}</Text>
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
