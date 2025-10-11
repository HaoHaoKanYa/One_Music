import { View, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native'
import { useState, useEffect } from 'react'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { downloadManager } from '@/services/downloadManager'
import RNFS from 'react-native-fs'

export default function DownloadSettings() {
  const theme = useTheme()
  const [wifiOnly, setWifiOnly] = useState(false)
  const [maxConcurrent, setMaxConcurrent] = useState(3)
  const [autoCleanup, setAutoCleanup] = useState(false)
  const [downloadPath, setDownloadPath] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    // 从 downloadManager 加载设置
    const stats = await downloadManager.getDownloadStats()
    setDownloadPath(RNFS.ExternalStorageDirectoryPath + '/Download/OneMusic')
  }

  const handleWifiOnlyChange = (value: boolean) => {
    setWifiOnly(value)
    downloadManager.updateSettings({ wifiOnly: value })
  }

  const handleAutoCleanupChange = (value: boolean) => {
    setAutoCleanup(value)
    downloadManager.updateSettings({ autoCleanup: value })
  }

  const handleMaxConcurrentChange = (value: number) => {
    setMaxConcurrent(value)
    downloadManager.updateSettings({ maxConcurrent: value })
  }

  const handleChangeDownloadPath = () => {
    Alert.alert(
      '下载路径',
      `当前路径:\n${downloadPath}\n\n注意：修改路径后需要重启应用`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '使用默认路径',
          onPress: () => {
            const defaultPath = RNFS.ExternalStorageDirectoryPath + '/Download/OneMusic'
            setDownloadPath(defaultPath)
            Alert.alert('提示', '已设置为默认路径，请重启应用生效')
          },
        },
      ]
    )
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
            } catch (error: any) {
              Alert.alert('错误', error.message || '清理失败')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
      {/* 下载路径 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>下载设置</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleChangeDownloadPath}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>下载路径</Text>
            <Text style={styles.settingDesc} numberOfLines={1}>
              {downloadPath}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>仅WiFi下载</Text>
            <Text style={styles.settingDesc}>
              开启后仅在WiFi环境下载
            </Text>
          </View>
          <Switch
            value={wifiOnly}
            onValueChange={handleWifiOnlyChange}
            trackColor={{ false: '#767577', true: '#4ECDC4' }}
            thumbColor={wifiOnly ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>同时下载数量</Text>
            <Text style={styles.settingDesc}>
              当前: {maxConcurrent} 个
            </Text>
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => maxConcurrent > 1 && handleMaxConcurrentChange(maxConcurrent - 1)}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => maxConcurrent < 5 && handleMaxConcurrentChange(maxConcurrent + 1)}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 存储管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>存储管理</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>自动清理</Text>
            <Text style={styles.settingDesc}>
              自动删除30天未播放的下载
            </Text>
          </View>
          <Switch
            value={autoCleanup}
            onValueChange={handleAutoCleanupChange}
            trackColor={{ false: '#767577', true: '#4ECDC4' }}
            thumbColor={autoCleanup ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleCleanupNow}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>立即清理</Text>
            <Text style={styles.settingDesc}>
              清理过期的下载文件
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: '#999',
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
})
