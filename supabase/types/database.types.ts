// Supabase 数据库类型定义
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: UserProfileInsert
        Update: UserProfileUpdate
      }
      favorite_songs: {
        Row: FavoriteSong
        Insert: FavoriteSongInsert
        Update: FavoriteSongUpdate
      }
      play_history: {
        Row: PlayRecord
        Insert: PlayRecordInsert
        Update: PlayRecordUpdate
      }
      playlists: {
        Row: Playlist
        Insert: PlaylistInsert
        Update: PlaylistUpdate
      }
      playlist_songs: {
        Row: PlaylistSong
        Insert: PlaylistSongInsert
        Update: PlaylistSongUpdate
      }
      disliked_songs: {
        Row: DislikedSong
        Insert: DislikedSongInsert
        Update: DislikedSongUpdate
      }
      app_settings: {
        Row: AppSettings
        Insert: AppSettingsInsert
        Update: AppSettingsUpdate
      }
    }
  }
}

// 用户资料
export interface UserProfile {
  user_id: string
  username: string
  display_name?: string
  email: string
  avatar_url?: string
  bio?: string
  gender?: string
  birthday?: string
  location?: string
  website?: string
  total_play_time: number
  total_songs: number
  total_playlists: number
  following_count: number
  followers_count: number
  is_public: boolean
  show_play_history: boolean
  show_playlists: boolean
  vip_status: 'free' | 'vip' | 'svip'
  vip_expire_at?: string
  created_at: string
  updated_at: string
}

export type UserProfileInsert = Omit<UserProfile, 'created_at' | 'updated_at' | 'total_play_time' | 'total_songs' | 'total_playlists' | 'following_count' | 'followers_count'>
export type UserProfileUpdate = Partial<UserProfileInsert>

// 收藏歌曲
export interface FavoriteSong {
  id: string
  user_id: string
  song_id: string
  song_name: string
  artist: string
  album?: string
  duration?: number
  source: string
  cover_url?: string
  quality?: string
  created_at: string
}

export type FavoriteSongInsert = Omit<FavoriteSong, 'id' | 'created_at'>
export type FavoriteSongUpdate = Partial<FavoriteSongInsert>

// 播放历史
export interface PlayRecord {
  id: string
  user_id: string
  song_id: string
  song_name: string
  artist: string
  album?: string
  source: string
  play_duration: number
  total_duration?: number
  completed: boolean
  played_at: string
  device_type?: string
  device_id?: string
}

export type PlayRecordInsert = Omit<PlayRecord, 'id' | 'played_at'>
export type PlayRecordUpdate = Partial<PlayRecordInsert>

// 歌单
export interface Playlist {
  id: string
  user_id: string
  name: string
  description?: string
  cover_url?: string
  is_public: boolean
  is_deleted: boolean
  song_count: number
  play_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export type PlaylistInsert = Omit<Playlist, 'id' | 'created_at' | 'updated_at' | 'song_count' | 'play_count' | 'like_count' | 'comment_count' | 'is_deleted' | 'deleted_at'>
export type PlaylistUpdate = Partial<PlaylistInsert>

// 歌单歌曲
export interface PlaylistSong {
  id: string
  playlist_id: string
  song_id: string
  song_name: string
  artist: string
  album?: string
  duration?: number
  source: string
  cover_url?: string
  sort_order: number
  added_at: string
}

export type PlaylistSongInsert = Omit<PlaylistSong, 'id' | 'added_at'>
export type PlaylistSongUpdate = Partial<PlaylistSongInsert>

// 不喜欢的歌曲
export interface DislikedSong {
  id: string
  user_id: string
  song_id: string
  song_name: string
  artist: string
  source: string
  reason?: string
  created_at: string
}

export type DislikedSongInsert = Omit<DislikedSong, 'id' | 'created_at'>
export type DislikedSongUpdate = Partial<DislikedSongInsert>

// 应用设置
export interface AppSettings {
  user_id: string
  audio_quality: 'low' | 'standard' | 'high' | 'lossless'
  download_quality: 'low' | 'standard' | 'high' | 'lossless'
  auto_play: boolean
  shuffle_mode: boolean
  repeat_mode: 'off' | 'one' | 'all'
  wifi_only_download: boolean
  wifi_only_stream: boolean
  enable_notifications: boolean
  notify_new_follower: boolean
  notify_new_comment: boolean
  notify_new_like: boolean
  notify_vip_expire: boolean
  show_online_status: boolean
  show_listening: boolean
  theme: 'light' | 'dark' | 'auto'
  language: string
  created_at: string
  updated_at: string
}

export type AppSettingsInsert = Omit<AppSettings, 'created_at' | 'updated_at'>
export type AppSettingsUpdate = Partial<AppSettingsInsert>
