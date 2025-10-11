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
import { database } from '@/database'

const defaultAvatar = require('@/theme/themes/images/one_logo.png')

const UserHeaderCompactComponent = ({ userProfiles, playHistory }: any) => {
  const theme = useTheme()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const profile = userProfiles?.[0] || null

  useEffect(() => {
    checkAuth()
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })

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
      console.log('[UserHeaderCompact] 未登录或加载失败:', error)
    }
  }

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
                  ? 'SVIP' 
                  : profile.vipStatus === 'vip'
                  ? 'VIP'
                  : '普通'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle} color={theme['c-350']} numberOfLines={1}>
          {currentUser 
            ? (() => {
                const hours = Math.floor(totalPlayTime / 3600)
                const minutes = Math.floor((totalPlayTime % 3600) / 60)
                if (hours > 0) {
                  return `累计 ${hours}h${minutes}m`
                }
                return `累计 ${minutes}分钟`
              })()
            : '登录后可同步收藏和歌单'}
        </Text>
      </View>

      <Icon name="chevron-right" size={16} color={theme['c-350']} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 249, 250, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(232, 232, 232, 0.5)',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  vipBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 8,
  },
  vipText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 11,
    flex: 1,
  },
})

const UserHeaderCompact = withObservables([], () => ({
  userProfiles: database.get('user_profiles')
    .query()
    .observe(),
  playHistory: database.get('play_history')
    .query()
    .observe()
}))(UserHeaderCompactComponent)

export default UserHeaderCompact
