import React, { memo } from 'react'
import { View, TouchableOpacity, Alert } from 'react-native'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

const QUALITY_OPTIONS = [
  { value: 'standard', label: '标准音质 (128kbps)', description: '文件较小，适合流量有限用户' },
  { value: 'high', label: '高品质 (320kbps)', description: '音质较好，文件适中' },
  { value: 'lossless', label: '无损音质 (FLAC)', description: '最佳音质，文件较大' },
]

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [downloadQuality, setDownloadQuality] = React.useState('high')

  const handleQualityChange = (quality: string) => {
    setDownloadQuality(quality)
    // TODO: 保存到设置中
  }

  const currentOption = QUALITY_OPTIONS.find(option => option.value === downloadQuality) || QUALITY_OPTIONS[1]

  const showQualitySelector = () => {
    Alert.alert(
      '选择下载音质',
      '选择您偏好的音乐下载音质',
      [
        ...QUALITY_OPTIONS.map(option => ({
          text: option.label,
          onPress: () => handleQualityChange(option.value),
          style: (option.value === downloadQuality ? 'default' : 'cancel') as any,
        })),
        { text: '取消', style: 'cancel' as any },
      ]
    )
  }

  return (
    <TouchableOpacity style={styles.container} onPress={showQualitySelector}>
      <View style={styles.left}>
        <Icon name="music" size={20} color={theme['c-primary']} />
        <View style={styles.textContainer}>
          <Text style={styles.title} color={theme['c-font']}>
            {t('setting_download_quality')}
          </Text>
          <Text style={styles.subtitle} color={theme['c-font-label']}>
            {currentOption.label}
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
