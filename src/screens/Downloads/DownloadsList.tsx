import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import DownloadsContent from '../Home/Views/User/components/DownloadsContent'

interface DownloadsListProps {
  componentId: string
}

export const DownloadsListScreen: React.FC<DownloadsListProps> = ({ componentId }) => {
  const theme = useTheme()

  const handleClose = () => {
    Navigation.dismissModal(componentId)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme['c-primary-background'] }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Icon name="arrow-left" size={24} color={theme['c-font']} />
        </TouchableOpacity>
        <Text style={styles.title} color={theme['c-font']}>
          我的下载
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <DownloadsContent />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
})
