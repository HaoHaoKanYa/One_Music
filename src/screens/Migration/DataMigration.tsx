import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { dataMigration } from '@/utils/dataMigration'

export const DataMigrationScreen: React.FC = () => {
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMigrate = async () => {
    Alert.alert(
      '确认迁移',
      '这将把本地数据迁移到云端。迁移过程可能需要几分钟，请确保网络连接稳定。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '开始迁移',
          onPress: async () => {
            setMigrating(true)
            setResult(null)

            try {
              const migrationResult = await dataMigration.migrateAll()
              setResult(migrationResult)

              if (migrationResult.success) {
                Alert.alert(
                  '迁移成功',
                  '所有数据已成功迁移到云端！',
                  [
                    {
                      text: '清除本地数据',
                      onPress: async () => {
                        await dataMigration.clearLocalData()
                        Alert.alert('完成', '本地数据已清除')
                      },
                    },
                    { text: '保留本地数据', style: 'cancel' },
                  ]
                )
              } else {
                Alert.alert('迁移完成', '部分数据迁移失败，请查看详情')
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '迁移失败')
            } finally {
              setMigrating(false)
            }
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>数据迁移</Text>
        <Text style={styles.description}>
          将本地存储的收藏、播放历史和歌单迁移到云端，实现多设备同步。
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>迁移内容：</Text>
          <Text style={styles.infoItem}>• 收藏的歌曲</Text>
          <Text style={styles.infoItem}>• 播放历史记录</Text>
          <Text style={styles.infoItem}>• 创建的歌单</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ 注意事项</Text>
          <Text style={styles.warningText}>
            • 迁移过程需要稳定的网络连接{'\n'}
            • 数据量大时可能需要几分钟{'\n'}
            • 迁移完成后建议清除本地数据{'\n'}
            • 已存在的云端数据不会被覆盖
          </Text>
        </View>

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>
              {result.success ? '✅ 迁移成功' : '⚠️ 迁移完成（部分失败）'}
            </Text>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>收藏歌曲：</Text>
              <Text style={styles.resultValue}>
                {result.favorites.migrated}/{result.favorites.total} 成功
                {result.favorites.failed > 0 && ` (${result.favorites.failed} 失败)`}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>播放历史：</Text>
              <Text style={styles.resultValue}>
                {result.playHistory.migrated}/{result.playHistory.total} 成功
                {result.playHistory.failed > 0 && ` (${result.playHistory.failed} 失败)`}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>歌单：</Text>
              <Text style={styles.resultValue}>
                {result.playlists.migrated}/{result.playlists.total} 成功
                {result.playlists.failed > 0 && ` (${result.playlists.failed} 失败)`}
              </Text>
            </View>

            {result.errors.length > 0 && (
              <View style={styles.errorsBox}>
                <Text style={styles.errorsTitle}>错误详情：</Text>
                {result.errors.map((error: string, index: number) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.migrateButton, migrating && styles.migrateButtonDisabled]}
          onPress={handleMigrate}
          disabled={migrating}
        >
          {migrating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.migrateButtonText}>开始迁移</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#B3B3B3',
    marginBottom: 24,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 6,
  },
  warningBox: {
    backgroundColor: '#3A2A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#FFD580',
    lineHeight: 20,
  },
  resultBox: {
    backgroundColor: '#1A2A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  resultValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorsBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 4,
  },
  migrateButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  migrateButtonDisabled: {
    backgroundColor: '#404040',
  },
  migrateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
})
