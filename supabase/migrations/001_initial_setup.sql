-- ============================================
-- One Music 用户系统 - 初始数据库设置
-- 版本: 1.0.0
-- 日期: 2025-10-05
-- ============================================

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  gender VARCHAR(20),
  birthday DATE,
  location VARCHAR(100),
  website VARCHAR(255),
  total_play_time BIGINT DEFAULT 0,
  total_songs INTEGER DEFAULT 0,
  total_playlists INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  show_play_history BOOLEAN DEFAULT true,
  show_playlists BOOLEAN DEFAULT true,
  vip_status VARCHAR(20) DEFAULT 'free',
  vip_expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_username_length CHECK (LENGTH(username) >= 2 AND LENGTH(username) <= 50)
);

-- 2. 收藏歌曲表
CREATE TABLE IF NOT EXISTS favorite_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id VARCHAR(100) NOT NULL,
  song_name VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  album VARCHAR(255),
  duration INTEGER,
  source VARCHAR(20) NOT NULL,
  cover_url TEXT,
  quality VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id, source)
);

-- 3. 播放历史表
CREATE TABLE IF NOT EXISTS play_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id VARCHAR(100) NOT NULL,
  song_name VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  album VARCHAR(255),
  source VARCHAR(20) NOT NULL,
  play_duration INTEGER NOT NULL,
  total_duration INTEGER,
  completed BOOLEAN DEFAULT false,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  device_type VARCHAR(50),
  device_id VARCHAR(100)
);

-- 4. 歌单表
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  song_count INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT check_playlist_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100)
);

-- 5. 歌单歌曲关联表
CREATE TABLE IF NOT EXISTS playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id VARCHAR(100) NOT NULL,
  song_name VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  album VARCHAR(255),
  duration INTEGER,
  source VARCHAR(20) NOT NULL,
  cover_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, song_id, source)
);

-- 6. 不喜欢的歌曲表
CREATE TABLE IF NOT EXISTS disliked_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id VARCHAR(100) NOT NULL,
  song_name VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  source VARCHAR(20) NOT NULL,
  reason VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id, source)
);

-- 7. 应用设置表
CREATE TABLE IF NOT EXISTS app_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_quality VARCHAR(20) DEFAULT 'standard',
  download_quality VARCHAR(20) DEFAULT 'standard',
  auto_play BOOLEAN DEFAULT true,
  shuffle_mode BOOLEAN DEFAULT false,
  repeat_mode VARCHAR(20) DEFAULT 'off',
  wifi_only_download BOOLEAN DEFAULT true,
  wifi_only_stream BOOLEAN DEFAULT false,
  enable_notifications BOOLEAN DEFAULT true,
  notify_new_follower BOOLEAN DEFAULT true,
  notify_new_comment BOOLEAN DEFAULT true,
  notify_new_like BOOLEAN DEFAULT true,
  notify_vip_expire BOOLEAN DEFAULT true,
  show_online_status BOOLEAN DEFAULT true,
  show_listening BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'auto',
  language VARCHAR(10) DEFAULT 'zh-CN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_favorite_songs_user_id ON favorite_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_user_id ON play_history(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
