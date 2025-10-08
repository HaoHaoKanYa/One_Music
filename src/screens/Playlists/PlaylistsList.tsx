import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { authAPI } from '@/services/api/auth'
import { RequireAuth } from '@/components/common/RequireAuth'

interface PlaylistsListProps {
  componentId: string
  onPlaylistPress?: (playlist: any) => void
}

const PlaylistsListScreenComponent: React.FC<PlaylistsListProps & {
  playlists: any[]
}> = ({ componentId, onPlaylistPress, playlists }) => {
  const [refreshing, setRefreshing] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')

  const handleRefresh = () => {
    setRefreshing(true)
    // 本地数据库数据是实时的，不需要重新加载
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('提示', '请输入歌单名称')
      return
    }

    try {
      const user = await authAPI.getCurrentUser()
      if (!user) throw new Error('未登录')

      await database.write(async () => {
        await database.get('playlists').create((playlist: any) => {
          playlist.userId = user.id
          playlist.name = newPlaylistName.trim()
          playlist.description = newPlaylistDesc.trim()
          playlist.isPublic = false
          playlist.songCount = 0
          playlist.playCount = 0
          playlist.likeCount = 0
          playlist.commentCount = 0
          playlist.isDeleted = false
          playlist.createdAt = new Date()
          playlist.updatedAt = new Date()
          playlist.synced = false
        })
      })

      setCreateModalVisible(false)
      setNewPlaylistName('')
      setNewPlaylistDesc('')
      Alert.alert('成功', '歌单创建成功')
    } catch (error: any) {
      Alert.alert('错误', error.message || '创建歌单失败')
    }
  }

  const handleDeletePlaylist = (playlist: any) => {
    Alert.alert(
      '确认删除',
      `确定要删除歌单"${playlist.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await playlist.update((record: any) => {
                  record.isDeleted = true
                  record.deletedAt = new Date()
                  record.synced = false
                })
              })
            } catch (error: any) {
              Alert.alert('错误', error.message || '删除歌单失败')
            }
          },
        },
      ]
    )
  }

  const renderPlaylistItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => onPlaylistPress?.(item)}
    >
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.playlistDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.playlistMeta}>
          {item.songCount || 0} 首歌曲 · {item.isPublic ? '公开' : '私密'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePlaylist(item)}
      >
        <Text style={styles.deleteButtonText}>删除</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <RequireAuth componentId={componentId}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的歌单</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.createButtonText}>+ 创建歌单</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlists}
        renderItem={renderPlaylistItem}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={playlists.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>还没有创建歌单</Text>
            <Text style={styles.emptyHint}>点击上方按钮创建你的第一个歌单</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>创建新歌单</Text>

            <TextInput
              style={styles.input}
              placeholder="歌单名称"
              placeholderTextColor="#666666"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="歌单描述（可选）"
              placeholderTextColor="#666666"
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setCreateModalVisible(false)
                  setNewPlaylistName('')
                  setNewPlaylistDesc('')
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.confirmButtonText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  playlistInfo: {
    flex: 1,
    marginRight: 12,
  },
  playlistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playlistDesc: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 12,
    color: '#666666',
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B3B3B3',
  },
  deleteButtonText: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#B3B3B3',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#404040',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#1DB954',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#B3B3B3',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

// 使用withObservables包装组件，实现响应式数据
const PlaylistsListScreen = withObservables([], () => ({
  playlists: database.get('playlists')
    .query(Q.where('is_deleted', false))
    .observe()
}))(PlaylistsListScreenComponent)

export { PlaylistsListScreen }
