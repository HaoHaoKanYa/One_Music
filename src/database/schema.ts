import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 2,
  tables: [
    // 用户收藏表
    tableSchema({
      name: 'favorites',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'song_id', type: 'string' },
        { name: 'song_name', type: 'string' },
        { name: 'artist', type: 'string', isOptional: true },
        { name: 'album', type: 'string', isOptional: true },
        { name: 'source', type: 'string' },
        { name: 'cover_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 用户歌单表
    tableSchema({
      name: 'playlists',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'cover_url', type: 'string', isOptional: true },
        { name: 'is_public', type: 'boolean' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'song_count', type: 'number' },
        { name: 'play_count', type: 'number' },
        { name: 'like_count', type: 'number' },
        { name: 'comment_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 歌单歌曲关联表
    tableSchema({
      name: 'playlist_songs',
      columns: [
        { name: 'playlist_id', type: 'string', isIndexed: true },
        { name: 'song_id', type: 'string' },
        { name: 'song_name', type: 'string' },
        { name: 'artist', type: 'string', isOptional: true },
        { name: 'album', type: 'string', isOptional: true },
        { name: 'source', type: 'string' },
        { name: 'duration', type: 'number', isOptional: true },
        { name: 'cover_url', type: 'string', isOptional: true },
        { name: 'position', type: 'number' },
        { name: 'added_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 播放历史表
    tableSchema({
      name: 'play_history',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'song_id', type: 'string' },
        { name: 'song_name', type: 'string' },
        { name: 'artist', type: 'string', isOptional: true },
        { name: 'album', type: 'string', isOptional: true },
        { name: 'source', type: 'string' },
        { name: 'play_duration', type: 'number', isOptional: true },
        { name: 'total_duration', type: 'number', isOptional: true },
        { name: 'completed', type: 'boolean' },
        { name: 'played_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 播放统计表
    tableSchema({
      name: 'play_statistics',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'song_id', type: 'string' },
        { name: 'song_name', type: 'string' },
        { name: 'artist', type: 'string', isOptional: true },
        { name: 'source', type: 'string' },
        { name: 'play_count', type: 'number' },
        { name: 'total_duration', type: 'number' },
        { name: 'last_played_at', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 应用设置表
    tableSchema({
      name: 'app_settings',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'audio_quality', type: 'string' },
        { name: 'download_quality', type: 'string' },
        { name: 'auto_play', type: 'boolean' },
        { name: 'shuffle_mode', type: 'boolean' },
        { name: 'repeat_mode', type: 'string' },
        { name: 'wifi_only_download', type: 'boolean' },
        { name: 'wifi_only_stream', type: 'boolean' },
        { name: 'enable_notifications', type: 'boolean' },
        { name: 'notify_new_follower', type: 'boolean' },
        { name: 'notify_new_comment', type: 'boolean' },
        { name: 'notify_new_like', type: 'boolean' },
        { name: 'notify_vip_expire', type: 'boolean' },
        { name: 'show_online_status', type: 'boolean' },
        { name: 'show_listening', type: 'boolean' },
        { name: 'theme', type: 'string' },
        { name: 'language', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 用户资料表
    tableSchema({
      name: 'user_profiles',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'username', type: 'string' },
        { name: 'display_name', type: 'string', isOptional: true },
        { name: 'email', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'bio', type: 'string', isOptional: true },
        { name: 'gender', type: 'string', isOptional: true },
        { name: 'birthday', type: 'number', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'website', type: 'string', isOptional: true },
        { name: 'total_play_time', type: 'number' },
        { name: 'total_songs', type: 'number' },
        { name: 'total_playlists', type: 'number' },
        { name: 'following_count', type: 'number' },
        { name: 'followers_count', type: 'number' },
        { name: 'is_public', type: 'boolean' },
        { name: 'show_play_history', type: 'boolean' },
        { name: 'show_playlists', type: 'boolean' },
        { name: 'vip_status', type: 'string' },
        { name: 'vip_expire_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 不喜欢的歌曲表
    tableSchema({
      name: 'disliked_songs',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'song_id', type: 'string' },
        { name: 'song_name', type: 'string' },
        { name: 'artist', type: 'string', isOptional: true },
        { name: 'source', type: 'string' },
        { name: 'reason', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 艺术家播放统计表
    tableSchema({
      name: 'artist_play_stats',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'artist', type: 'string' },
        { name: 'play_count', type: 'number' },
        { name: 'total_duration', type: 'number' },
        { name: 'last_played_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 每日播放统计表
    tableSchema({
      name: 'daily_play_stats',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'string' },
        { name: 'total_plays', type: 'number' },
        { name: 'total_duration', type: 'number' },
        { name: 'unique_songs', type: 'number' },
        { name: 'unique_artists', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 评论表
    tableSchema({
      name: 'comments',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'target_type', type: 'string' },
        { name: 'target_id', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'parent_id', type: 'string', isOptional: true },
        { name: 'like_count', type: 'number' },
        { name: 'reply_count', type: 'number' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 点赞表
    tableSchema({
      name: 'likes',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'target_type', type: 'string' },
        { name: 'target_id', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 通知表
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'data', type: 'string', isOptional: true },
        { name: 'is_read', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'read_at', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 订单表
    tableSchema({
      name: 'orders',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'order_no', type: 'string' },
        { name: 'plan_id', type: 'string', isOptional: true },
        { name: 'plan_name', type: 'string' },
        { name: 'plan_type', type: 'string' },
        { name: 'duration_days', type: 'number' },
        { name: 'amount', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'payment_method', type: 'string', isOptional: true },
        { name: 'payment_time', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 用户关注表
    tableSchema({
      name: 'user_follows',
      columns: [
        { name: 'follower_id', type: 'string', isIndexed: true },
        { name: 'following_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // VIP套餐表
    tableSchema({
      name: 'vip_plans',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'duration_days', type: 'number' },
        { name: 'price', type: 'number' },
        { name: 'original_price', type: 'number', isOptional: true },
        { name: 'features', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'sort_order', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // 下载歌曲表
    tableSchema({
      name: 'downloaded_songs',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'song_id', type: 'string' },
        { name: 'song_name', type: 'string' },
        { name: 'artist', type: 'string' },
        { name: 'album', type: 'string', isOptional: true },
        { name: 'source', type: 'string' },
        { name: 'file_path', type: 'string' },
        { name: 'file_size', type: 'number' },
        { name: 'quality', type: 'string' },
        { name: 'duration', type: 'number', isOptional: true },
        { name: 'cover_url', type: 'string', isOptional: true },
        { name: 'download_status', type: 'string' }, // 'downloading' | 'completed' | 'failed' | 'paused'
        { name: 'progress', type: 'number' },
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'downloaded_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),
  ],
})
