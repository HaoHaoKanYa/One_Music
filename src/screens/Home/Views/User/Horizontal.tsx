import { View, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useState } from 'react'
import { Navigation } from 'react-native-navigation'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { supabase } from '@/lib/supabase'
import UserHeader from './UserHeader'
import UserStats from './UserStats'
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
  id: string
  icon: string
  label: string
  color: string
  screen: string
  requireAuth?: boolean
}

const menuSections = [
  {
    title: '🎵 我的音乐',
    items: [
      { id: 'favorites', icon: 'love', label: '我喜欢的音乐', color: '#FF6B6B', screen: FAVORITES_LIST_SCREEN, requireAuth: true },
      { id: 'history', icon: 'music_time', label: '最近播放', color: '#4ECDC4', screen: PLAY_HISTORY_SCREEN, requireAuth: true },
      { id: 'playlists', icon: 'album', label: '我的歌单', color: '#95E1D3', screen: PLAYLISTS_SCREEN, requireAuth: true },
    ],
  },
  {
    title: '📊 数据中心',
    items: [
      { id: 'statistics', icon: 'leaderboard', label: '播放统计', color: '#3498DB', screen: PLAY_STATISTICS_SCREEN, requireAuth: true },
      { id: 'notifications', icon: 'comment', label: '通知中心', color: '#9B59B6', screen: NOTIFICATIONS_LIST_SCREEN, requireAuth: true },
    ],
  },
  {
    title: '⚙️ 更多功能',
    items: [
      { id: 'vip', icon: 'love', label: '会员中心', color: '#FFD700', screen: VIP_PLANS_SCREEN, requireAuth: false },
      { id: 'migration', icon: 'share', label: '数据迁移', color: '#F38181', screen: DATA_MIGRATION_SCREEN, requireAuth: true },
    ],
  },
]

export default () => {
  const theme = useTheme()
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      return !!user
    } catch (error) {
      setIsLoggedIn(false)
      return false
    }
  }

  const handlePress = async (item: MenuItem) => {
    // 如果需要登录但用户未登录，显示提示
    if (item.requireAuth) {
      const loggedIn = await checkAuth()
      if (!loggedIn) {
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
    }

    setSelectedItem(item)
  }

  return (
    <View style={styles.container}>
      {/* 左侧菜单 */}
      <ScrollView 
        style={[styles.leftPanel, { backgroundColor: theme['c-primary-background'] }]}
        showsVerticalScrollIndicator={false}
      >
        <UserHeader />
        <UserStats />
        
        <View style={styles.menuContainer}>
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle} color={theme['c-font']}>
                {section.title}
              </Text>
              
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    selectedItem?.id === item.id && { backgroundColor: theme['c-primary-light-100'] }
                  ]}
                  onPress={() => handlePress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Icon name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.label} color={theme['c-font']} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {selectedItem?.id === item.id && (
                    <Icon name="chevron-right" size={16} color={theme['c-primary-font']} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 右侧内容 */}
      <View style={[styles.rightPanel, { backgroundColor: theme['c-content-background'] }]}>
        {selectedItem ? (
          <View style={styles.contentContainer}>
            <View style={[styles.contentHeader, { borderBottomColor: theme['c-border'] }]}>
              <View style={[styles.iconContainer, { backgroundColor: selectedItem.color + '20' }]}>
                <Icon name={selectedItem.icon} size={20} color={selectedItem.color} />
              </View>
              <Text style={styles.contentTitle} color={theme['c-font']}>
                {selectedItem.label}
              </Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.comingSoon} color={theme['c-300']}>
                功能开发中...
              </Text>
              <Text style={styles.hint} color={theme['c-400']}>
                横屏模式下暂时无法显示此内容，请切换到竖屏模式或点击下方按钮打开详情页面
              </Text>
              <TouchableOpacity
                style={[styles.openButton, { backgroundColor: selectedItem.color }]}
                onPress={() => {
                  Navigation.showModal({
                    stack: {
                      children: [{
                        component: {
                          name: selectedItem.screen,
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
                }}
              >
                <Text style={styles.openButtonText} color="#FFFFFF">
                  打开详情页面
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="music" size={64} color={theme['c-300']} />
            <Text style={styles.emptyText} color={theme['c-300']}>
              请从左侧选择一个功能
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  rightPanel: {
    flex: 1,
  },
  menuContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  comingSoon: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 40,
    lineHeight: 22,
  },
  openButton: {
    marginTop: 32,
    marginHorizontal: 40,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  openButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
})
