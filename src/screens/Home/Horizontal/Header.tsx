import { View, TouchableOpacity } from 'react-native'
// import Button from '@/components/common/Button'
// import { navigations } from '@/navigation'
// import { BorderWidths } from '@/theme'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { setNavActiveId } from '@/core/common'
import commonState from '@/store/common/state'

const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
}

const HEADER_HEIGHT = _HEADER_HEIGHT * 0.8


// const LeftTitle = () => {
//   const id = useNavActiveId()
//   const t = useI18n()

//   return <Text style={styles.leftTitle} size={18}>{t(id)}</Text>
// }
const LeftHeader = () => {
  const id = useNavActiveId()
  const t = useI18n()
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  const handleMenuPress = () => {
    setNavActiveId('nav_setting')
  }

  const handleToggleAside = () => {
    commonState.isShowAside = !commonState.isShowAside
    global.state_event.emit('isShowAsideUpdated')
  }

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
    }}>
      {/* 左上角菜单按钮 */}
      <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
        <Icon name="menu" size={20} color={theme['c-font']} />
      </TouchableOpacity>
      
      <View style={styles.left}>
        <Text style={styles.leftTitle} size={18}>{t(id)}</Text>
      </View>
      {headerComponents[id] ?? null}

      {/* 右侧侧边栏切换按钮 */}
      <TouchableOpacity style={styles.asideButton} onPress={handleToggleAside}>
        <Icon name="more" size={18} color={theme['c-font-label']} />
      </TouchableOpacity>
    </View>
  )
}


// const RightTitle = () => {
//   const id = useNavActiveId()
//   const t = useI18n()

//   return <Text style={styles.rightTitle} size={18}>{t(id)}</Text>
// }
const RightHeader = () => {
  const t = useI18n()
  const id = useNavActiveId()
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  const handleMenuPress = () => {
    setNavActiveId('nav_setting')
  }

  const handleToggleAside = () => {
    commonState.isShowAside = !commonState.isShowAside
    global.state_event.emit('isShowAsideUpdated')
  }

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
    }}>
      {/* 左上角菜单按钮 */}
      <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
        <Icon name="menu" size={20} color={theme['c-font']} />
      </TouchableOpacity>
      
      <View style={styles.left}>
        <Text style={styles.rightTitle} size={18}>{t(id)}</Text>
      </View>
      {headerComponents[id] ?? null}
      
      {/* 右侧侧边栏切换按钮 */}
      <TouchableOpacity style={styles.asideButton} onPress={handleToggleAside}>
        <Icon name="more" size={18} color={theme['c-font-label']} />
      </TouchableOpacity>
    </View>
  )
}

const Header = () => {
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  return (
    <>
      <StatusBar />
      {
        drawerLayoutPosition == 'left'
          ? <LeftHeader />
          : <RightHeader />
      }

    </>
  )
}


const styles = createStyle({
  container: {
    // width: '100%',
    paddingRight: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 5,
    alignItems: 'center',
    height: '100%',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  btn: {
    // flex: 1,
    width: HEADER_HEIGHT,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  titleBtn: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    height: '100%',
    justifyContent: 'center',
  },
  leftTitle: {
    paddingLeft: 10,
    paddingRight: 16,
  },
  rightTitle: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 4,
  },
  asideButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 4,
  },
})

export default Header
