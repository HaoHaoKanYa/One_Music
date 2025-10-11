import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useState } from 'react'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { setNavActiveId } from '@/core/common'
import UserHeaderCompact from './UserHeaderCompact'
import UserStatsCompact from './UserStatsCompact'
import FavoritesContent from './components/FavoritesContent'
import PlayHistoryContent from './components/PlayHistoryContent'
import PlaylistsContent from './components/PlaylistsContent'
import DownloadsContent from './components/DownloadsContent'
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
      { id: 'downloads', icon: 'download', label: '我的下载', color: '#9B59B6', component: <DownloadsContent /> },
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
  // 默认选中"我喜欢的音乐"
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(
    menuSections[0].items[0] // 第一个分组的第一个项目
  )

  const handleMenuPress = () => {
    setNavActiveId('nav_setting')
  }

  return (
    <View style={styles.container}>
      {/* 顶部：菜单按钮 + 账户信息 + 数据统计 */}
      <View style={[styles.topSection, { backgroundColor: theme['c-primary-background'] }]}>
        {/* 左侧菜单按钮 */}
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Icon name="menu" size={20} color={theme['c-font']} />
        </TouchableOpacity>

        <View style={styles.cardWrapper}>
          <UserHeaderCompact />
        </View>
        <View style={styles.cardWrapper}>
          <UserStatsCompact />
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
          {selectedItem && selectedItem.component}
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
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  cardWrapper: {
    flex: 1,
    height: 60,
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
