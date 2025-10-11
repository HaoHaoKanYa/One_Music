import React, { memo } from 'react'
import { View, TouchableOpacity, Alert } from 'react-native'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useSettingValue } from '@/store/setting/hook'
import RNFS from 'react-native-fs'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const downloadPath = useSettingValue('download.path') || RNFS.DocumentDirectoryPath + '/downloads'

  const handlePress = () => {
    Alert.alert(
      '下载路径',
      downloadPath,
      [
        { text: '确定', style: 'default' },
      ]
    )
  }

  const getDisplayPath = () => {
    const parts = downloadPath.split('/')
    return parts.length > 3 ? `.../${parts.slice(-2).join('/')}` : downloadPath
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.left}>
        <Icon name="folder" size={20} color={theme['c-primary']} />
        <View style={styles.textContainer}>
          <Text style={styles.title} color={theme['c-font']}>
            {t('setting_download_path')}
          </Text>
          <Text style={styles.subtitle} color={theme['c-font-label']} numberOfLines={1}>
            {getDisplayPath()}
          </Text>
        </View>
      </View>
      <Icon name="right" size={16} color={theme['c-font-label']} />
    </TouchableOpacity>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
})
