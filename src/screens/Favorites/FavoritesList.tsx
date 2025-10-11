import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native'
import { withObservables } from '@nozbe/watermelondb/react'
import { database } from '@/database'
import { RequireAuth } from '@/components/common/RequireAuth'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'

interface FavoritesListProps {
  componentId: string
}

const FavoritesListScreenComponent: React.FC<FavoritesListProps & {
  favorites: any[]
}> = ({ componentId, favorites }) => {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
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
              global.app_event.favoritesUpdated()
            } catch (error: any) {
              Alert.alert('错误', error.message || '取消收藏失败')
            }
          },
        },
      ]
    )
  }

  const handlePlayAll = async () => {
    if (favorites.length === 0) {
      Alert.alert('提示', '收藏列表为空')
      return
    }

    try {
      console.log('[FavoritesList] 开始播放全部，歌曲数量:', favorites.length)
      // 直接播放收藏列表（LOVE列表）的第一首歌
      await playList(LIST_IDS.LOVE, 0)
      console.log('[FavoritesList] 播放全部成功')
    } catch (error: any) {
      console.error('[FavoritesList] 播放全部失败:', error)
      Alert.alert('错误', '播放失败，请重试')
    }
  }

  const handleSongPress = async (_song: any, index: number) => {
    try {
      console.log('[FavoritesList] 开始播放歌曲，索引:', index)
      // 直接播放收藏列表（LOVE列表）中的指定歌曲
      await playList(LIST_IDS.LOVE, index)
      console.log('[FavoritesList] 播放歌曲成功')
    } catch (error: any) {
      console.error('[FavoritesList] 播放歌曲失败:', error)
      Alert.alert('错误', '播放失败，请重试')
    }
  }

  const renderSongItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handleSongPress(item, index)}
      activeOpacity={0.6}
    >
      <Text style={styles.songIndex}>{index + 1}</Text>
      <Text style={styles.songName} numberOfLines={1}>
        {item.songName || '未知歌曲'}
      </Text>
      <Text style={styles.artistName} numberOfLines={1}>
        {item.artist || '未知歌手'}
      </Text>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={(e) => {
          e.stopPropagation()
          handleRemoveFavorite(item)
        }}
      >
        <Text style={styles.moreButtonText}>⋮</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <RequireAuth componentId={componentId}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>我的收藏</Text>
          <View style={styles.headerRow}>
            <Text style={styles.count}>{favorites.length} 首歌曲</Text>
            {favorites.length > 0 && (
              <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
                <Text style={styles.playAllText}>▶ 播放全部</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={favorites}
            renderItem={renderSongItem}
            keyExtractor={item => item.id}
            contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : styles.listContent}
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
      </View>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    fontSize: 14,
    color: '#999',
  },
  playAllButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 0,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  songIndex: {
    width: 28,
    fontSize: 15,
    color: '#999',
    fontWeight: '600',
    textAlign: 'left',
  },
  songName: {
    flex: 2,
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
    marginRight: 12,
  },
  artistName: {
    flex: 1.5,
    fontSize: 13,
    color: '#999',
    marginRight: 12,
  },
  moreButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  moreButtonText: {
    fontSize: 18,
    color: '#999',
    lineHeight: 18,
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
    color: '#999',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#BBB',
  },
})

// 使用withObservables包装组件，实现响应式数据
const FavoritesListScreen = withObservables([], () => ({
  favorites: database.get('favorites')
    .query()
    .observe()
}))(FavoritesListScreenComponent)

export { FavoritesListScreen }
