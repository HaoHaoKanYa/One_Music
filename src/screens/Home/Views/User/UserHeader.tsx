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
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        const userProfile = await profileAPI.getCurrentProfile()
        setProfile(userProfile)
      }
    } catch (error) {
      console.log('未登录')
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
                  title: { text: '个人资料' },
                  leftButtons: [{
                    id: 'close',
                    text: '关闭',
                  }],
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
                  title: { text: '登录' },
                  leftButtons: [{
                    id: 'close',
                    text: '关闭',
                  }],
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
          {user && (
            <View style={[styles.vipBadge, { backgroundColor: theme['c-primary-font'] }]}>
              <Text style={styles.vipText} color="#FFFFFF">普通会员</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle} color={theme['c-350']}>
          {user ? '累计听歌 0 小时' : '登录后可同步收藏和歌单'}
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
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
