import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { settingsAPI, AppSettings } from '../../services/api/settings'

interface SettingsScreenProps {
  componentId: string
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ componentId }) => {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await settingsAPI.getSettings()
      setSettings(data)
    } catch (error: any) {
      Alert.alert('错误', error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    try {
      const updated = await settingsAPI.updateSetting(key, value)
      setSettings(updated)
    } catch (error: any) {
      Alert.alert('更新失败', error.message)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    )
  }

  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>加载失败</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* 播放设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>播放设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>音质</Text>
          <TouchableOpacity style={styles.settingValue}>
            <Text style={styles.settingValueText}>
              {settings.audio_quality === 'lossless'
                ? '无损'
                : settings.audio_quality === 'high'
                ? '高品质'
                : settings.audio_quality === 'low'
                ? '流畅'
                : '标准'}
            </Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>自动播放</Text>
          <Switch
            value={settings.auto_play}
            onValueChange={(value) => updateSetting('auto_play', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>随机播放</Text>
          <Switch
            value={settings.shuffle_mode}
            onValueChange={(value) => updateSetting('shuffle_mode', value)}
          />
        </View>
      </View>

      {/* 下载设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>下载设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>下载音质</Text>
          <TouchableOpacity style={styles.settingValue}>
            <Text style={styles.settingValueText}>
              {settings.download_quality === 'lossless'
                ? '无损'
                : settings.download_quality === 'high'
                ? '高品质'
                : settings.download_quality === 'low'
                ? '流畅'
                : '标准'}
            </Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>仅WiFi下载</Text>
          <Switch
            value={settings.wifi_only_download}
            onValueChange={(value) => updateSetting('wifi_only_download', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>仅WiFi播放</Text>
          <Switch
            value={settings.wifi_only_stream}
            onValueChange={(value) => updateSetting('wifi_only_stream', value)}
          />
        </View>
      </View>

      {/* 通知设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>启用通知</Text>
          <Switch
            value={settings.enable_notifications}
            onValueChange={(value) => updateSetting('enable_notifications', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>新关注者通知</Text>
          <Switch
            value={settings.notify_new_follower}
            onValueChange={(value) => updateSetting('notify_new_follower', value)}
            disabled={!settings.enable_notifications}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>新评论通知</Text>
          <Switch
            value={settings.notify_new_comment}
            onValueChange={(value) => updateSetting('notify_new_comment', value)}
            disabled={!settings.enable_notifications}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>新点赞通知</Text>
          <Switch
            value={settings.notify_new_like}
            onValueChange={(value) => updateSetting('notify_new_like', value)}
            disabled={!settings.enable_notifications}
          />
        </View>
      </View>

      {/* 隐私设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>隐私设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>显示在线状态</Text>
          <Switch
            value={settings.show_online_status}
            onValueChange={(value) => updateSetting('show_online_status', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>显示正在听</Text>
          <Switch
            value={settings.show_listening}
            onValueChange={(value) => updateSetting('show_listening', value)}
          />
        </View>
      </View>

      {/* 外观设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>外观设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>主题</Text>
          <TouchableOpacity style={styles.settingValue}>
            <Text style={styles.settingValueText}>
              {settings.theme === 'dark'
                ? '深色'
                : settings.theme === 'light'
                ? '浅色'
                : '跟随系统'}
            </Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>语言</Text>
          <TouchableOpacity style={styles.settingValue}>
            <Text style={styles.settingValueText}>简体中文</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 其他 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>其他</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>清除缓存</Text>
          <Text style={styles.settingValue}>
            <Text style={styles.settingValueText}>0 MB</Text>
            <Text style={styles.arrow}>›</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>关于</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    paddingVertical: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLabel: {
    fontSize: 16,
    color: '#212121',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    color: '#757575',
    marginRight: 8,
  },
  arrow: {
    fontSize: 20,
    color: '#BDBDBD',
  },
})
