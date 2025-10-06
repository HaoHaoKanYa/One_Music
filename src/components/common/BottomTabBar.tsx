import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useNavActiveId } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'

const TAB_ITEMS = [
  { id: 'nav_songlist', icon: 'home', label: '首页' },
  { id: 'nav_love', icon: 'love', label: '我的列表' },
  { id: 'nav_search', icon: 'search-2', label: '搜索' },
  { id: 'nav_top', icon: 'leaderboard', label: '排行榜' },
  { id: 'nav_user', icon: 'user', label: '我的' },
] as const

type TabId = typeof TAB_ITEMS[number]['id']

const TabItem = memo(({ id, label, isActive, onPress }: {
  id: TabId
  label: string
  isActive: boolean
  onPress: (id: TabId) => void
}) => {
  const theme = useTheme()
  
  const handlePress = () => {
    onPress(id)
  }

  return (
    <TouchableOpacity 
      style={styles.tabItem} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text 
        size={15} 
        color={isActive ? theme['c-primary-font'] : theme['c-font-label']}
        style={isActive ? styles.tabLabelActive : styles.tabLabel}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
})

export default memo(() => {
  const theme = useTheme()
  const activeId = useNavActiveId()

  const handleTabPress = (id: TabId) => {
    // 关闭侧边栏
    global.app_event.changeMenuVisible(false)
    setNavActiveId(id)
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      {TAB_ITEMS.map((item) => (
        <TabItem
          key={item.id}
          id={item.id}
          label={item.label}
          isActive={activeId === item.id}
          onPress={handleTabPress}
        />
      ))}
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    height: 50,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 15,
  },
  tabLabelActive: {
    fontSize: 15,
    fontWeight: 'bold',
  },
})
