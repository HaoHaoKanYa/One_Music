import React, { memo } from 'react'
import { View, TouchableOpacity, Alert } from 'react-native'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

const CONCURRENT_OPTIONS = [
  { value: 1, label: '1个任务' },
  { value: 2, label: '2个任务' },
  { value: 3, label: '3个任务' },
  { value: 5, label: '5个任务' },
]

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [maxConcurrent, setMaxConcurrent] = React.useState(3)

  const handleChange = (value: number) => {
    setMaxConcurrent(value)
    // TODO: 保存到设置中
  }

  const currentOption = CONCURRENT_OPTIONS.find(option => option.value === maxConcurrent) || CONCURRENT_OPTIONS[2]

  const showSelector = () => {
    Alert.alert(
      '最大同时下载数',
      '选择同时下载的最大任务数',
      [
        ...CONCURRENT_OPTIONS.map(option => ({
          text: option.label,
          onPress: () => handleChange(option.value),
          style: (option.value === maxConcurrent ? 'default' : 'cancel') as 'default' | 'cancel',
        })),
        { text: '取消', style: 'cancel' as 'cancel' },
      ]
    )
  }

  return (
    <TouchableOpacity style={styles.container} onPress={showSelector}>
      <View style={styles.left}>
        <Icon name="download-2" size={20} color={theme['c-primary']} />
        <View style={styles.textContainer}>
          <Text style={styles.title} color={theme['c-font']}>
            {t('setting_download_max_concurrent')}
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
