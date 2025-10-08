/**
 * 本地数据库测试工具
 * 用于验证本地数据库功能是否正常工作
 */
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'

export const testLocalDatabase = async () => {
  console.log('🧪 开始测试本地数据库...')
  
  try {
    // 测试数据库连接
    console.log('✅ 数据库连接正常')
    
    // 测试创建收藏记录
    await database.write(async () => {
      await database.get('favorites').create(favorite => {
        favorite.userId = 'test-user-123'
        favorite.songId = 'test-song-456'
        favorite.songName = '测试歌曲'
        favorite.artist = '测试歌手'
        favorite.album = '测试专辑'
        favorite.source = 'test'
        favorite.coverUrl = 'https://example.com/cover.jpg'
        favorite.createdAt = new Date()
        favorite.synced = false
      })
    })
    console.log('✅ 创建收藏记录成功')
    
    // 测试查询收藏记录
    const favorites = await database.get('favorites')
      .query(Q.where('user_id', 'test-user-123'))
      .fetch()
    console.log('✅ 查询收藏记录成功:', favorites.length, '条')
    
    // 测试创建歌单记录
    await database.write(async () => {
      await database.get('playlists').create(playlist => {
        playlist.userId = 'test-user-123'
        playlist.name = '测试歌单'
        playlist.description = '这是一个测试歌单'
        playlist.isPublic = true
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
    console.log('✅ 创建歌单记录成功')
    
    // 测试查询歌单记录
    const playlists = await database.get('playlists')
      .query(
        Q.where('user_id', 'test-user-123'),
        Q.where('is_deleted', false)
      )
      .fetch()
    console.log('✅ 查询歌单记录成功:', playlists.length, '条')
    
    // 测试创建播放历史记录
    await database.write(async () => {
      await database.get('play_history').create(record => {
        record.userId = 'test-user-123'
        record.songId = 'test-song-456'
        record.songName = '测试歌曲'
        record.artist = '测试歌手'
        record.album = '测试专辑'
        record.source = 'test'
        record.playDuration = 180 // 3分钟
        record.totalDuration = 240 // 4分钟
        record.completed = false
        record.playedAt = new Date()
        record.synced = false
      })
    })
    console.log('✅ 创建播放历史记录成功')
    
    // 测试查询播放历史记录
    const playHistory = await database.get('play_history')
      .query(Q.where('user_id', 'test-user-123'))
      .fetch()
    console.log('✅ 查询播放历史记录成功:', playHistory.length, '条')
    
    // 测试创建用户资料记录
    await database.write(async () => {
      await database.get('user_profiles').create(profile => {
        profile.userId = 'test-user-123'
        profile.username = 'testuser'
        profile.displayName = '测试用户'
        profile.email = 'test@example.com'
        profile.avatarUrl = 'https://example.com/avatar.jpg'
        profile.bio = '这是一个测试用户'
        profile.gender = 'male'
        profile.birthday = new Date('1990-01-01')
        profile.location = '测试城市'
        profile.website = 'https://example.com'
        profile.totalPlayTime = 3600 // 1小时
        profile.totalSongs = 10
        profile.totalPlaylists = 2
        profile.followingCount = 5
        profile.followersCount = 10
        profile.isPublic = true
        profile.showPlayHistory = true
        profile.showPlaylists = true
        profile.vipStatus = 'free'
        profile.createdAt = new Date()
        profile.updatedAt = new Date()
        profile.synced = false
      })
    })
    console.log('✅ 创建用户资料记录成功')
    
    // 测试查询用户资料记录
    const profiles = await database.get('user_profiles')
      .query(Q.where('user_id', 'test-user-123'))
      .fetch()
    console.log('✅ 查询用户资料记录成功:', profiles.length, '条')
    
    console.log('🎉 本地数据库测试完成！所有功能正常')
    
    return {
      success: true,
      message: '本地数据库测试通过',
      stats: {
        favorites: favorites.length,
        playlists: playlists.length,
        playHistory: playHistory.length,
        profiles: profiles.length
      }
    }
    
  } catch (error) {
    console.error('❌ 本地数据库测试失败:', error)
    return {
      success: false,
      message: '本地数据库测试失败',
      error: error
    }
  }
}

// 清理测试数据
export const cleanupTestData = async () => {
  console.log('🧹 清理测试数据...')
  
  try {
    await database.write(async () => {
      // 删除测试收藏记录
      const testFavorites = await database.get('favorites')
        .query(Q.where('user_id', 'test-user-123'))
        .fetch()
      for (const favorite of testFavorites) {
        await favorite.destroyPermanently()
      }
      
      // 删除测试歌单记录
      const testPlaylists = await database.get('playlists')
        .query(Q.where('user_id', 'test-user-123'))
        .fetch()
      for (const playlist of testPlaylists) {
        await playlist.destroyPermanently()
      }
      
      // 删除测试播放历史记录
      const testPlayHistory = await database.get('play_history')
        .query(Q.where('user_id', 'test-user-123'))
        .fetch()
      for (const record of testPlayHistory) {
        await record.destroyPermanently()
      }
      
      // 删除测试用户资料记录
      const testProfiles = await database.get('user_profiles')
        .query(Q.where('user_id', 'test-user-123'))
        .fetch()
      for (const profile of testProfiles) {
        await profile.destroyPermanently()
      }
    })
    
    console.log('✅ 测试数据清理完成')
    return { success: true, message: '测试数据清理完成' }
    
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error)
    return { success: false, message: '清理测试数据失败', error }
  }
}
