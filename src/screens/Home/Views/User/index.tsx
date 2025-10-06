import { ScrollView, StyleSheet } from 'react-native'
import UserHeader from '@/screens/Home/Views/User/UserHeader'
import UserStats from '@/screens/Home/Views/User/UserStats'
import QuickMenu from '@/screens/Home/Views/User/QuickMenu'

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
