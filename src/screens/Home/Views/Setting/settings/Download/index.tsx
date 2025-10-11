import React, { memo } from 'react'
import { View } from 'react-native'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Section from '../../components/Section'
import QualitySelect from './QualitySelect'
import WifiOnlySwitch from './WifiOnlySwitch'
import MaxConcurrentSelect from './MaxConcurrentSelect'
import DownloadPath from './DownloadPath'
import AutoCleanup from './AutoCleanup'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()

  return (
    <Section title={t('setting_download')}>
      <View style={styles.container}>
        <QualitySelect />
        <WifiOnlySwitch />
        <MaxConcurrentSelect />
        <DownloadPath />
        <AutoCleanup />
      </View>
    </Section>
  )
})

const styles = createStyle({
  container: {
    paddingVertical: 5,
  },
})
