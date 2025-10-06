import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import {
  FAVORITES_LIST_SCREEN,
  PLAY_HISTORY_SCREEN,
  PLAYLISTS_SCREEN,
  DATA_MIGRATION_SCREEN,
  NOTIFICATIONS_LIST_SCREEN,
  VIP_PLANS_SCREEN,
  PLAY_STATISTICS_SCREEN,
} from '@/navigation/screenNames'

interface MenuItem {
  icon: string
  label: string
  screen: string
  title: string
  color: string
}

const menuSections = [
  {
    title: '🎵 我的音乐',
    items: [
      { icon: 'love', label: '我喜欢的音乐', screen: FAVORITES_LIST_SCREEN, title: '我的收藏', color: '#FF6B6B' },
      { icon: 'music_time', label: '最近播放', screen: PLAY_HISTORY_SCREEN, title: '播放历史', color: '#4ECDC4' },
      { icon: 'album', label: '我的歌单', screen: PLAYLISTS_SCREEN, title: '我的歌单', color: '#95E1D3' },
    ],
  },
  {
    title: '📊 数据中心',
    items: [
      { icon: 'leaderboard', label: '播放统计', screen: PLAY_STATISTICS_SCREEN, title: '播放统计', color: '#3498DB' },
      { icon: 'comment', label: '通知中心', screen: NOTIFICATIONS_LIST_SCREEN, title: '通知中心', color: '#9B59B6' },
    ],
  },
  {
    title: '⚙️ 更多功能',
    items: [
      { icon: 'love', label: '会员中心', screen: VIP_PLANS_SCREEN, title: '会员中心', color: '#FFD700' },
      { icon: 'share', label: '数据迁移', screen: DATA_MIGRATION_SCREEN, title: '数据迁移', color: '#F38181' },
    ],
  },
]

export default () => {
  const theme = useTheme()

  const handlePress = (item: MenuItem) => {
    Navigation.showModal({
      stack: {
        children: [{
          component: {
            name: item.screen,
            options: {
              topBar: {
                title: { text: item.title },
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

  return (
    <View style={styles.container}>
      {menuSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle} color={theme['c-font']}>
            {section.title}
          </Text>
          
          <View style={[styles.menuGrid, { backgroundColor: 'transparent' }]}>
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
