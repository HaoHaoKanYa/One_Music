import React, { useState } from 'react'
import { View, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native'
import { withObservables } from '@nozbe/watermelondb/react'
import { database } from '@/database'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'

const FavoritesContentComponent: React.FC<{ favorites: any[] }> = ({ favorites }) => {
  const theme = useTheme()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const handlePlayAll = async () => {
    if (favorites.length === 0) {
      Alert.alert('提示', '收藏列表为空')
      return
    }
    try {
      await playList(LIST_IDS.LOVE, 0)
    } catch (error: any) {
      Alert.alert('错误', '播放失败，请重试')
    }
  }

  const handleSongPress = async (_song: any, index: number) => {
    try {
      await playList(LIST_IDS.LOVE, index)
    } catch (error: any) {
      Alert.alert('错误', '播放失败，请重试')
    }
  }

  const handleRemoveFavorite = async (song: any) => {
    Alert.alert('确认', '确定要取消收藏这首歌吗？', [
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
    ])
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={[styles.songItem, { borderBottomColor: theme['c-border'] }]}
      onPress={() => handleSongPress(item, index)}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songName} color={theme['c-font']} numberOfLines={1}>
          {item.songName}
        </Text>
        <Text style={styles.artist} color={theme['c-font-label']} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveFavorite(item)} style={styles.deleteBtn}>
        <Icon name="delete" size={20} color={theme['c-font-label']} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme['c-border'] }]}>
        <Text style={styles.count} color={theme['c-font-label']}>
          共 {favorites.length} 首歌曲
        </Text>
        {favorites.length > 0 && (
          <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
            <Icon name="play" size={16} color={theme['c-primary-font']} />
            <Text style={styles.playAllText} color={theme['c-primary-font']}>
              播放全部
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="love" size={48} color={theme['c-300']} />
            <Text style={styles.emptyText} color={theme['c-300']}>
              暂无收藏的歌曲
            </Text>
          </View>
        }
      />
    </View>
  )
}

const enhance = withObservables([], () => ({
  favorites: database.get('favorites').query().observe(),
}))

export default enhance(FavoritesContentComponent)

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
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playAllText: {
    fontSize: 14,
    marginLeft: 4,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 15,
    marginBottom: 4,
  },
  artist: {
    fontSize: 13,
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
})
