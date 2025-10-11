import React, { useState } from 'react'
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { authAPI } from '@/services/api/auth'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'

const PlaylistsContentComponent: React.FC<{ playlists: any[] }> = ({ playlists }) => {
  const theme = useTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')

  const handleRefresh = () => {
    setRefreshing(true)
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
    Alert.alert('确认删除', `确定要删除歌单"${playlist.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await database.write(async () => {
              await playlist.update((p: any) => {
                p.isDeleted = true
              })
            })
          } catch (error: any) {
            Alert.alert('错误', error.message || '删除歌单失败')
          }
        },
      },
    ])
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.playlistItem, { borderBottomColor: theme['c-border'] }]}>
      <View style={[styles.cover, { backgroundColor: theme['c-primary-light-100'] }]}>
        <Icon name="album" size={32} color={theme['c-primary-font']} />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} color={theme['c-font']} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.playlistDesc} color={theme['c-font-label']} numberOfLines={1}>
          {item.description || '暂无描述'}
        </Text>
        <Text style={styles.songCount} color={theme['c-font-label']}>
          {item.songCount || 0} 首歌曲
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDeletePlaylist(item)} style={styles.deleteBtn}>
        <Icon name="close" size={20} color={theme['c-font-label']} />
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme['c-border'] }]}>
        <Text style={styles.count} color={theme['c-font-label']}>
          共 {playlists.length} 个歌单
        </Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: theme['c-primary-font'] }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Icon name="add" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText} color="#FFFFFF">
            创建歌单
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlists}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="album" size={48} color={theme['c-300']} />
            <Text style={styles.emptyText} color={theme['c-300']}>
              暂无歌单
            </Text>
          </View>
        }
      />

      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme['c-primary-background'] }]}>
            <Text style={styles.modalTitle} color={theme['c-font']}>
              创建歌单
            </Text>
            <TextInput
              style={[styles.input, { borderColor: theme['c-border'], color: theme['c-font'] }]}
              placeholder="歌单名称"
              placeholderTextColor={theme['c-font-label']}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: theme['c-border'], color: theme['c-font'] }]}
              placeholder="歌单描述（可选）"
              placeholderTextColor={theme['c-font-label']}
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme['c-300'] }]}
                onPress={() => {
                  setCreateModalVisible(false)
                  setNewPlaylistName('')
                  setNewPlaylistDesc('')
                }}
              >
                <Text color="#FFFFFF">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme['c-primary-font'] }]}
                onPress={handleCreatePlaylist}
              >
                <Text color="#FFFFFF">创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const enhance = withObservables([], () => ({
  playlists: database
    .get('playlists')
    .query(Q.where('is_deleted', false), Q.sortBy('created_at', Q.desc))
    .observe(),
}))

export default enhance(PlaylistsContentComponent)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  count: {
    fontSize: 14,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createBtnText: {
    fontSize: 14,
    marginLeft: 4,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playlistDesc: {
    fontSize: 13,
    marginBottom: 4,
  },
  songCount: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
})
