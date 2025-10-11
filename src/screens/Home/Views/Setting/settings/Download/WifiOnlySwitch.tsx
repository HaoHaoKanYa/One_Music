import React, { memo } from 'react'
import { View } from 'react-native'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const wifiOnly = useSettingValue('download.wifiOnly') || false

  const handleToggle = (enabled: boolean) => {
    updateSetting({ 'download.wifiOnly': enabled })
  }

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Icon name="wifi" size={20} color={theme['c-primary']} />
        <View style={styles.textContainer}>
          <Text style={styles.title} color={theme['c-font']}>
            {t('setting_download_wifi_only')}
          </Text>
          <Text style={styles.subtitle} color={theme['c-font-label']}>
            {t('setting_download_wifi_only_desc')}
          </Text>
        </View>
      </View>
      <CheckBoxItem
        check={wifiOnly}
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
