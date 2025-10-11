import { ScrollView, StyleSheet } from 'react-native'
import UserHeader from './UserHeader'
import UserStats from './UserStats'
import QuickMenu from './QuickMenu'

export default () => {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <UserHeader />
      <UserStats />
      <QuickMenu />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
