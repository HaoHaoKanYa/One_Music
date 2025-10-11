import React, { useState } from 'react'
import { TouchableOpacity, View, StyleSheet, Alert } from 'react-native'
import { Icon } from './Icon'
import Text from './Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { downloadManager } from '@/services/downloadManager'
import { toast } from '@/utils/tools'

interface BatchDownloadButtonProps {
  musicList: LX.Music.MusicInfo[]
  onPress?: () => void
}

export const BatchDownloadButton: React.FC<BatchDownloadButtonProps> = ({
  musicList,
  onPress,
}) => {
  const theme = useTheme()
  const t = useI18n()
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePress = () => {
    if (onPress) {
      onPress()
      return
    }

    if (musicList.length === 0) {
      toast('没有可下载的歌曲')
      return
    }

    // 显示确认对话框
    Alert.alert(
      '批量下载',
      `确定要下载 ${musicList.length} 首歌曲吗？`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '标准音质',
          onPress: () => handleBatchDownload('standard'),
        },
        {
          text: '高品质',
          onPress: () => handleBatchDownload('high'),
        },
        {
          text: '无损音质',
          onPress: () => handleBatchDownload('lossless'),
        },
      ]
    )
  }

  const handleBatchDownload = async (quality: string) => {
    setIsDownloading(true)
    try {
      await downloadManager.batchDownload(musicList, quality)
    } catch (error: any) {
      console.error('批量下载失败:', error)
      toast(error.message || '批量下载失败')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isDownloading}
    >
      <Icon
        name="download-2"
        size={20}
        color={isDownloading ? theme['c-font-label'] : theme['c-primary']}
      />
      <Text
        style={styles.text}
        color={isDownloading ? theme['c-font-label'] : theme['c-primary']}
      >
        {isDownloading ? t('downloading') : t('batch_download')}
      </Text>
      {musicList.length > 0 && (
        <View style={[styles.badge, { backgroundColor: theme['c-primary'] }]}>
          <Text style={styles.badgeText} color="#fff">
            {musicList.length}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    position: 'relative',
  },
  text: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
})
