import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useState } from 'react'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import UserHeader from './UserHeader'
import UserStats from './UserStats'
import FavoritesContent from './components/FavoritesContent'
import PlayHistoryContent from './components/PlayHistoryContent'
import PlaylistsContent from './components/PlaylistsContent'
import { PlayStatisticsScreen } from '@/screens/Statistics/PlayStatistics'

interface MenuItem {
  id: string
  icon: string
  label: string
  color: string
  component: React.ReactNode
}

const menuSections = [
  {
    title: '🎵 我的音乐',
    items: [
      { id: 'favorites', icon: 'love', label: '我喜欢的音乐', color: '#FF6B6B', component: <FavoritesContent /> },
      { id: 'history', icon: 'music_time', label: '最近播放', color: '#4ECDC4', component: <PlayHistoryContent /> },
      { id: 'playlists', icon: 'album', label: '我的歌单', color: '#95E1D3', component: <PlaylistsContent /> },
    ],
  },
  {
    title: '📊 数据中心',
    items: [
      { id: 'statistics', icon: 'leaderboard', label: '播放统计', color: '#3498DB', component: <PlayStatisticsScreen componentId="" /> },
    ],
  },
]

export default () => {
  const theme = useTheme()
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  return (
    <View style={styles.container}>
      {/* 顶部：账户信息和数据统计横向排列 */}
      <View style={[styles.topSection, { backgroundColor: theme['c-primary-background'] }]}>
        <View style={styles.cardWrapper}>
          <UserHeader />
        </View>
        <View style={styles.cardWrapper}>
          <UserStats />
        </View>
      </View>

      {/* 下方：左侧菜单 + 右侧内容 */}
      <View style={styles.mainContent}>
        {/* 左侧菜单 */}
        <View style={[styles.leftPanel, { backgroundColor: theme['c-primary-background'] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
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
                    onPress={() => setSelectedItem(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                      <Icon name={item.icon} size={18} color={item.color} />
                    </View>
                    <Text style={styles.label} color={theme['c-font']} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {selectedItem?.id === item.id && (
                      <Icon name="chevron-right" size={14} color={theme['c-primary-font']} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 右侧内容 */}
        <View style={[styles.rightPanel, { backgroundColor: theme['c-content-background'] }]}>
          {selectedItem ? (
            selectedItem.component
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
    height: 120,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 0.28,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 12,
    minWidth: 180,
    maxWidth: 220,
  },
  rightPanel: {
    flex: 0.72,
  },
  section: {
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginBottom: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  label: {
    flex: 1,
    fontSize: 13,
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
})
