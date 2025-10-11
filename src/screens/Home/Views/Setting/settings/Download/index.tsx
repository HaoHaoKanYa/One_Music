import React, { memo } from 'react'
import { View } from 'react-native'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import CheckBoxItem from '../../components/CheckBoxItem'
import CheckBox from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

const QUALITY_OPTIONS = [
  { value: 'standard', label: '标准音质 (128kbps)' },
  { value: 'high', label: '高品质 (320kbps)' },
  { value: 'lossless', label: '无损音质 (FLAC)' },
]

const CONCURRENT_OPTIONS = [
  { value: 1, label: '1个任务' },
  { value: 2, label: '2个任务' },
  { value: 3, label: '3个任务' },
  { value: 5, label: '5个任务' },
]

const Download = memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [downloadQuality, setDownloadQuality] = React.useState('high')
  const [wifiOnly, setWifiOnly] = React.useState(false)
  const [maxConcurrent, setMaxConcurrent] = React.useState(3)
  const [autoCleanup, setAutoCleanup] = React.useState(false)

  return (
    <Section title={t('setting_download')}>
      {/* 下载音质 */}
      <SubTitle title={t('setting_download_quality')}>
        <View style={styles.list}>
          {QUALITY_OPTIONS.map(option => (
            <CheckBox
              key={option.value}
              check={downloadQuality === option.value}
              label={option.label}
              onChange={() => setDownloadQuality(option.value)}
            />
          ))}
        </View>
      </SubTitle>

      {/* WiFi限制 */}
      <View style={styles.content}>
        <CheckBoxItem
          check={wifiOnly}
          onChange={setWifiOnly}
          label={t('setting_download_wifi_only')}
        />
        <Text style={styles.desc} size={13} color={theme['c-font-label']}>
          {t('setting_download_wifi_only_desc')}
        </Text>
      </View>

      {/* 最大同时下载数 */}
      <SubTitle title={t('setting_download_max_concurrent')}>
        <View style={styles.list}>
          {CONCURRENT_OPTIONS.map(option => (
            <CheckBox
              key={option.value}
              check={maxConcurrent === option.value}
              label={option.label}
              onChange={() => setMaxConcurrent(option.value)}
            />
          ))}
        </View>
      </SubTitle>

      {/* 下载路径 */}
      <View style={styles.content}>
        <Text size={14} color={theme['c-font']}>
          {t('setting_download_path')}
        </Text>
        <Text style={styles.pathText} size={13} color={theme['c-font-label']}>
          .../files/downloads
        </Text>
      </View>

      {/* 自动清理 */}
      <View style={styles.content}>
        <CheckBoxItem
          check={autoCleanup}
          onChange={setAutoCleanup}
          label={t('setting_download_auto_cleanup')}
        />
        <Text style={styles.desc} size={13} color={theme['c-font-label']}>
          {t('setting_download_auto_cleanup_desc')}
        </Text>
      </View>
    </Section>
  )
})

Download.displayName = 'Download'

export default Download

const styles = createStyle({
  content: {
    marginTop: 5,
  },
  list: {
    paddingTop: 5,
  },
  desc: {
    marginTop: 5,
    marginLeft: 30,
  },
  pathText: {
    marginTop: 5,
    marginLeft: 5,
  },
})
