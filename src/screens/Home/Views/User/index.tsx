import { ScrollView, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import UserHeader from '@/screens/Home/Views/User/UserHeader'
import UserStats from '@/screens/Home/Views/User/UserStats'
import QuickMenu from '@/screens/Home/Views/User/QuickMenu'

export default () => {
    const theme = useTheme()

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme['c-content-background'] }]}
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
