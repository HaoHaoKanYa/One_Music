import { useState, useEffect } from 'react'
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { authAPI } from '@/services/api/auth'
import { SIGN_IN_SCREEN, USER_PROFILE_SCREEN } from '@/navigation/screenNames'
import { supabase } from '@/lib/supabase'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'

const defaultAvatar = require('@/theme/themes/images/one_logo.png')

const UserHeaderComponent = ({ userProfiles, playHistory }: any) => {
  const theme = useTheme()
  const [currentUser, setCurrentUser] = useState<any>(null)

  // 从数组中获取第一个用户资料
  const profile = userProfiles?.[0] || null

  useEffect(() => {
    checkAuth()
    
    // 监听Supabase认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })

    // 监听用户资料更新事件
    const handleUserProfileUpdate = () => {
      checkAuth()
    }

    global.app_event.on('userProfileUpdated', handleUserProfileUpdate)

    return () => {
      authListener?.subscription?.unsubscribe()
      global.app_event.off('userProfileUpdated', handleUserProfileUpdate)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const user = await authAPI.getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.log('[UserHeader] 未登录或加载失败:', error)
    }
  }

  // 计算总播放时长
  const totalPlayTime = playHistory?.reduce((sum: number, record: any) => sum + (record.playDuration || 0), 0) || 0

  const handlePress = () => {
    if (currentUser) {
      Navigation.showModal({
        stack: {
          children: [{
            component: {
              name: USER_PROFILE_SCREEN,
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
    } else {
      Navigation.showModal({
        stack: {
          children: [{
            component: {
              name: SIGN_IN_SCREEN,
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
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.avatarContainer}>
        {currentUser && profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <Image source={defaultAvatar} style={styles.avatar} />
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name} color={theme['c-font']}>
            {currentUser ? (profile?.displayName || profile?.username || '用户') : '点击登录'}
          </Text>
          {currentUser && profile && (
            <View style={[
              styles.vipBadge,
              {
                backgroundColor: profile.vipStatus === 'svip' 
                  ? '#FFD700' 
                  : profile.vipStatus === 'vip'
                  ? '#4A90E2'
                  : '#999'
              }
            ]}>
              <Text style={styles.vipText} color="#FFFFFF">
                {profile.vipStatus === 'svip' 
                  ? 'SVIP会员' 
                  : profile.vipStatus === 'vip'
                  ? 'VIP会员'
                  : '普通会员'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle} color={theme['c-350']}>
          {currentUser 
            ? (() => {
                const hours = Math.floor(totalPlayTime / 3600)
                const minutes = Math.floor((totalPlayTime % 3600) / 60)
                if (hours > 0) {
                  return `累计听歌 ${hours} 小时 ${minutes} 分钟`
                }
                return `累计听歌 ${minutes} 分钟`
              })()
            : '登录后可同步收藏和歌单'}
        </Text>
      </View>

      <Icon name="chevron-right" size={20} color={theme['c-350']} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 12,
    backgroundColor: 'rgba(248, 249, 250, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(232, 232, 232, 0.5)',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  vipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
  },
})

// 使用withObservables包装组件，实现响应式数据
const UserHeader = withObservables([], () => ({
  userProfiles: database.get('user_profiles')
    .query()
    .observe(),
  playHistory: database.get('play_history')
    .query()
    .observe()
}))(UserHeaderComponent)

export default UserHeader
