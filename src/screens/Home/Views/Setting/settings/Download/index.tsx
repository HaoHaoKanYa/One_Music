import React, { memo } from 'react'
import { View, TouchableOpacity, Alert, Platform } from 'react-native'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import CheckBoxItem from '../../components/CheckBoxItem'
import CheckBox from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import RNFS from 'react-native-fs'
import { downloadManager } from '@/services/downloadManager'
import DocumentPicker from 'react-native-document-picker'

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

  // 获取当前下载路径
  const [downloadPath, setDownloadPath] = React.useState(downloadManager.getDownloadPath())

  React.useEffect(() => {
    // 定期更新显示的路径
    const interval = setInterval(() => {
      setDownloadPath(downloadManager.getDownloadPath())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    // 同步设置到 downloadManager
    downloadManager.updateSettings({
      wifiOnly,
      maxConcurrent,
      autoCleanup,
    })
  }, [wifiOnly, maxConcurrent, autoCleanup])

  const handleChangeDownloadPath = async () => {
    try {
      // 使用 DocumentPicker 选择文件夹
      const result = await DocumentPicker.pickDirectory()

      if (result && result.uri) {
        // 将 content:// URI 转换为文件路径
        let folderPath = decodeURIComponent(result.uri)

        console.log('[Download] 选择的URI:', folderPath)

        // 处理 content:// URI
        if (folderPath.startsWith('content://')) {
          // 提取实际路径
          const pathMatch = folderPath.match(/primary:(.+)/)
          if (pathMatch) {
            folderPath = RNFS.ExternalStorageDirectoryPath + '/' + pathMatch[1]
          } else {
            // 如果无法解析，提示用户
            Alert.alert(
              '提示',
              '无法访问该目录，请选择其他目录或使用应用私有目录',
              [
                {
                  text: '使用应用私有目录',
                  onPress: async () => {
                    const privatePath = RNFS.DocumentDirectoryPath + '/OneMusic'
                    await downloadManager.setDownloadPath(privatePath)
                    setDownloadPath(privatePath)
                    Alert.alert('设置成功', `下载路径:\n${privatePath}`)
                  }
                },
                { text: '重新选择', onPress: handleChangeDownloadPath }
              ]
            )
            return
          }
        }

        // 设置下载路径
        await downloadManager.setDownloadPath(folderPath)
        setDownloadPath(folderPath)

        Alert.alert('设置成功', `下载路径已设置为:\n${folderPath}`)
      }
    } catch (error: any) {
      if (DocumentPicker.isCancel(error)) {
        // 用户取消选择
        console.log('[Download] 用户取消选择路径')
      } else {
        console.error('[Download] 选择路径失败:', error)
        Alert.alert('错误', `选择路径失败: ${error.message}`)
      }
    }
  }

  const handleCleanupNow = () => {
    Alert.alert(
      '清理过期下载',
      '将删除30天未播放的下载文件，确定继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await downloadManager.cleanupOldDownloads()
              Alert.alert('成功', '清理完成')
            } catch (error: any) {
              Alert.alert('错误', error.message || '清理失败')
            }
          },
        },
      ]
    )
  }

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
      <TouchableOpacity style={styles.content} onPress={handleChangeDownloadPath}>
        <View style={styles.pathRow}>
          <Text size={14} color={theme['c-font']}>
            {t('setting_download_path')}
          </Text>
          <Text style={styles.arrow}>›</Text>
        </View>
        <Text style={styles.pathText} size={12} color={downloadPath ? theme['c-font-label'] : '#FF6B6B'} selectable>
          {downloadPath || '未设置（点击选择下载路径）'}
        </Text>
      </TouchableOpacity>

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

      {/* 立即清理 */}
      <TouchableOpacity style={styles.content} onPress={handleCleanupNow}>
        <View style={styles.pathRow}>
          <Text size={14} color={theme['c-font']}>
            立即清理过期下载
          </Text>
          <Text style={styles.arrow}>›</Text>
        </View>
        <Text style={styles.desc} size={13} color={theme['c-font-label']}>
          清理30天未播放的下载文件
        </Text>
      </TouchableOpacity>
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
  pathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pathText: {
    marginTop: 5,
    marginLeft: 5,
  },
  arrow: {
    fontSize: 18,
    color: '#999',
  },
})
