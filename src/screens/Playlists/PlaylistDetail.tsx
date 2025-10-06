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
} from 'react-native'
import { playlistsAPI } from '@/services/api'
import type { Playlist, PlaylistSong } from '@/services/api/playlists'

interface PlaylistDetailProps {
  playlistId: string
  onSongPress?: (song: PlaylistSong) => void
  onBack?: () => void
}

export const PlaylistDetailScreen: React.FC<PlaylistDetailProps> = ({
  playlistId,
  onSongPress,
  onBack,
}) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [songs, setSongs] = useState<PlaylistSong[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPlaylistDetail = useCallback(async () => {
    try {
      const [playlistData, songsData] = await Promise.all([
        playlistsAPI.getPlaylist(playlistId),
        playlistsAPI.getPlaylistSongs(playlistId),
      ])
      setPlaylist(playlistData)
      setSongs(songsData)
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载歌单详情失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [playlistId])

  useEffect(() => {
    loadPlaylistDetail()
  }, [loadPlaylistDetail])

  const handleRefresh = () => {
    setRefreshing(true)
    loadPlaylistDetail()
  }

  const handleRemoveSong = async (songId: string) => {
    Alert.alert(
      '确认',
      '确定要从歌单中移除这首歌吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            try {
              await playlistsAPI.removeSongFromPlaylist(playlistId, songId)
              setSongs(prev => prev.filter(s => s.song_id !== songId))
            } catch (error: any) {
              Alert.alert('错误', error.message || '移除歌曲失败')
            }
          },
        },
      ]
    )
  }

  const renderSongItem = ({ item }: { item: PlaylistSong }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => onSongPress?.(item)}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songName} numberOfLines={1}>
          {item.song_name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveSong(item.song_id)}
      >
        <Text style={styles.removeButtonText}>移除</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    )
  }

  if (!playlist) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>歌单不存在</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 返回</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{playlist.name}</Text>
        {playlist.description && (
          <Text style={styles.description}>{playlist.description}</Text>
        )}
        <Text style={styles.meta}>
          {songs.length} 首歌曲 · {playlist.is_public ? '公开' : '私密'}
        </Text>
      </View>

      <FlatList
        data={songs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={songs.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>歌单还没有歌曲</Text>
            <Text style={styles.emptyHint}>添加一些喜欢的歌曲吧</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
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
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#1DB954',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: '#666666',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B3B3B3',
  },
  removeButtonText: {
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
  errorText: {
    fontSize: 16,
    color: '#B3B3B3',
  },
})
