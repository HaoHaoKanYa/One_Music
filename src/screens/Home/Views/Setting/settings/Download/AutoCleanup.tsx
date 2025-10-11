import React, { memo } from 'react'
import { View, Alert } from 'react-native'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [autoCleanup, setAutoCleanup] = React.useState(false)

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      Alert.alert(
        '自动清理',
        '启用后，系统会自动删除30天未播放的下载文件',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '确定',
            onPress: () => setAutoCleanup(true),
          },
        ]
      )
    } else {
      setAutoCleanup(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Icon name="delete" size={20} color={theme['c-primary']} />
        <View style={styles.textContainer}>
          <Text style={styles.title} color={theme['c-font']}>
            {t('setting_download_auto_cleanup')}
          </Text>
          <Text style={styles.subtitle} color={theme['c-font-label']}>
            {t('setting_download_auto_cleanup_desc')}
          </Text>
        </View>
      </View>
      <CheckBoxItem
        check={autoCleanup}
        onChange={handleToggle}
        label=""
      />
    </View>
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
