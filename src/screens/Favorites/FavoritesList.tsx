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
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { authAPI } from '@/services/api/auth'
import { RequireAuth } from '@/components/common/RequireAuth'

interface FavoritesListProps {
  componentId: string
  onSongPress?: (song: any) => void
  onPlayAll?: (songs: any[]) => void
}

const FavoritesListScreenComponent: React.FC<FavoritesListProps & {
  favorites: any[]
}> = ({ componentId, onSongPress, onPlayAll, favorites }) => {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    // 本地数据库数据是实时的，不需要重新加载
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleRemoveFavorite = async (song: any) => {
    Alert.alert(
      '确认',
      '确定要取消收藏这首歌吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await song.destroyPermanently()
              })
              // 触发收藏更新事件
              global.app_event.favoritesUpdated()
            } catch (error: any) {
              Alert.alert('错误', error.message || '取消收藏失败')
            }
          },
        },
      ]
    )
  }

  const handlePlayAll = () => {
    if (favorites.length === 0) {
      Alert.alert('提示', '收藏列表为空')
      return
    }
    onPlayAll?.(favorites)
  }

  const renderSongItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => onSongPress?.(item)}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songName} numberOfLines={1}>
          {item.songName}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item)}
      >
        <Text style={styles.removeButtonText}>取消收藏</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <RequireAuth componentId={componentId}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的收藏</Text>
        <Text style={styles.count}>{favorites.length} 首歌曲</Text>
        {favorites.length > 0 && (
          <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
            <Text style={styles.playAllText}>播放全部</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={favorites}
        renderItem={renderSongItem}
        keyExtractor={item => item.id}
        contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>还没有收藏的歌曲</Text>
            <Text style={styles.emptyHint}>点击歌曲旁的爱心图标来收藏</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
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
    marginBottom: 8,
  },
  count: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 12,
  },
  playAllButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
})

// 使用withObservables包装组件，实现响应式数据
const FavoritesListScreen = withObservables([], () => ({
  favorites: database.get('favorites')
    .query()
    .observe()
}))(FavoritesListScreenComponent)

export { FavoritesListScreen }
