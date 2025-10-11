import { View } from 'react-native'
import Aside from './Aside'
import PlayerBar from '@/components/player/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import Header from './Header'
import Main from './Main'
import BottomTabBar from '@/components/common/BottomTabBar'
import { createStyle } from '@/utils/tools'
import { useState, useEffect } from 'react'
import commonState from '@/store/common/state'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})

export default () => {
  const [isShowAside, setIsShowAside] = useState(commonState.isShowAside)
  
  useEffect(() => {
    const handleUpdate = () => {
      setIsShowAside(commonState.isShowAside)
    }
    global.state_event.on('isShowAsideUpdated', handleUpdate)
    return () => {
      global.state_event.off('isShowAsideUpdated', handleUpdate)
    }
  }, [])
  
  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        {/* 横屏模式下侧边栏默认隐藏 */}
        {isShowAside && <Aside />}
        <View style={styles.content}>
          <Header />
          <Main />
          <PlayerBar isHome />
          <BottomTabBar />
        </View>
      </View>
    </>
  )
}
