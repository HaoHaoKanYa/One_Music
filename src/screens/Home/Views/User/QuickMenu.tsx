import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { Navigation } from 'react-native-navigation'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { supabase } from '@/lib/supabase'
import {
  FAVORITES_LIST_SCREEN,
  PLAY_HISTORY_SCREEN,
  PLAYLISTS_SCREEN,
  DATA_MIGRATION_SCREEN,
  NOTIFICATIONS_LIST_SCREEN,
  VIP_PLANS_SCREEN,
  PLAY_STATISTICS_SCREEN,
  SIGN_IN_SCREEN,
} from '@/navigation/screenNames'

interface MenuItem {
  icon: string
  label: string
  screen: string
  title: string
  color: string
  requireAuth?: boolean  // 是否需要登录
}

const menuSections = [
  {
    title: '🎵 我的音乐',
    items: [
      { icon: 'love', label: '我喜欢的音乐', screen: FAVORITES_LIST_SCREEN, title: '我的收藏', color: '#FF6B6B', requireAuth: true },
      { icon: 'music_time', label: '最近播放', screen: PLAY_HISTORY_SCREEN, title: '播放历史', color: '#4ECDC4', requireAuth: true },
      { icon: 'album', label: '我的歌单', screen: PLAYLISTS_SCREEN, title: '我的歌单', color: '#95E1D3', requireAuth: true },
    ],
  },
  {
    title: '📊 数据中心',
    items: [
      { icon: 'leaderboard', label: '播放统计', screen: PLAY_STATISTICS_SCREEN, title: '播放统计', color: '#3498DB', requireAuth: true },
      { icon: 'comment', label: '通知中心', screen: NOTIFICATIONS_LIST_SCREEN, title: '通知中心', color: '#9B59B6', requireAuth: true },
    ],
  },
  {
    title: '⚙️ 更多功能',
    items: [
      { icon: 'love', label: '会员中心', screen: VIP_PLANS_SCREEN, title: '会员中心', color: '#FFD700', requireAuth: false },
      { icon: 'share', label: '数据迁移', screen: DATA_MIGRATION_SCREEN, title: '数据迁移', color: '#F38181', requireAuth: true },
    ],
  },
]

export default () => {
  const theme = useTheme()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    checkAuth()
    
    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsLoggedIn(true)
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    } catch (error) {
      setIsLoggedIn(false)
    }
  }

  const handlePress = (item: MenuItem) => {
    // 如果需要登录但用户未登录，显示提示
    if (item.requireAuth && !isLoggedIn) {
      Alert.alert(
        '需要登录',
        '请先进行登录以同步数据',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '去登录',
            onPress: () => {
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
            },
          },
        ]
      )
      return
    }

    Navigation.showModal({
      stack: {
        children: [{
          component: {
            name: item.screen,
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

  return (
    <View style={styles.container}>
      {menuSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle} color={theme['c-font']}>
            {section.title}
          </Text>
          
          <View style={styles.menuGrid}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Icon name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.label} color={theme['c-font']} numberOfLines={1}>
                  {item.label}
                </Text>
                <Icon name="chevron-right" size={16} color={theme['c-350']} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuGrid: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(248, 249, 250, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(232, 232, 232, 0.5)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
  },
})
