import { useState, useEffect } from 'react'
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { authAPI } from '@/services/api/auth'
import { profileAPI } from '@/services/api/profile'
import { SIGN_IN_SCREEN, USER_PROFILE_SCREEN } from '@/navigation/screenNames'
import { supabase } from '@/lib/supabase'

const defaultAvatar = require('@/theme/themes/images/one_logo.png')

export default () => {
  const theme = useTheme()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
    
    // 监听Supabase认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    // 监听播放历史更新
    const handlePlayHistoryUpdate = () => {
      if (user) {
        checkAuth()
      }
    }

    // 监听页面焦点，返回时刷新数据
    const navigationEventListener = Navigation.events().registerComponentDidAppearListener(() => {
      if (user) {
        checkAuth()
      }
    })

    global.app_event.on('playHistoryUpdated', handlePlayHistoryUpdate)

    return () => {
      authListener?.subscription?.unsubscribe()
      navigationEventListener.remove()
      global.app_event.off('playHistoryUpdated', handlePlayHistoryUpdate)
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        const userProfile = await profileAPI.getCurrentProfile()
        
        // 获取实时播放时长
        const { data: playData, error: playError } = await supabase
          .from('play_history')
          .select('play_duration')
          .eq('user_id', currentUser.id)
        
        if (playError) {
          console.error('[UserHeader] 获取播放历史失败:', playError)
        }
        
        const totalPlayTime = playData?.reduce((sum, record) => sum + (record.play_duration || 0), 0) || 0
        const hours = Math.floor(totalPlayTime / 3600)
        const minutes = Math.floor((totalPlayTime % 3600) / 60)
        console.log('[UserHeader] 播放时长:', totalPlayTime, '秒 =', hours, '小时', minutes, '分钟')
        
        setProfile({
          ...userProfile,
          total_play_time: totalPlayTime,
        })
      }
    } catch (error) {
      console.log('[UserHeader] 未登录或加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePress = () => {
    if (user) {
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

  if (loading) return null

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.avatarContainer}>
        {user && profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <Image source={defaultAvatar} style={styles.avatar} />
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name} color={theme['c-font']}>
            {user ? (profile?.display_name || profile?.username || '用户') : '点击登录'}
          </Text>
          {user && profile && (
            <View style={[
              styles.vipBadge,
              {
                backgroundColor: profile.vip_status === 'svip' 
                  ? '#FFD700' 
                  : profile.vip_status === 'vip'
                  ? '#4A90E2'
                  : '#999'
              }
            ]}>
              <Text style={styles.vipText} color="#FFFFFF">
                {profile.vip_status === 'svip' 
                  ? 'SVIP会员' 
                  : profile.vip_status === 'vip'
                  ? 'VIP会员'
                  : '普通会员'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle} color={theme['c-350']}>
          {user 
            ? (() => {
                const totalSeconds = profile?.total_play_time || 0
                const hours = Math.floor(totalSeconds / 3600)
                const minutes = Math.floor((totalSeconds % 3600) / 60)
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
