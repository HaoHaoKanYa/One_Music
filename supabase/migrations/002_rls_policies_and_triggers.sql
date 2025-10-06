-- ============================================
-- One Music 用户系统 - RLS策略和触发器
-- 版本: 1.0.1
-- 日期: 2025-10-06
-- ============================================

-- 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disliked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以查看所有公开的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户可以插入自己的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户可以更新自己的资料" ON user_profiles;

-- user_profiles RLS策略
CREATE POLICY "用户可以查看所有公开的资料" ON user_profiles
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以查看自己的收藏" ON favorite_songs;
DROP POLICY IF EXISTS "用户可以添加收藏" ON favorite_songs;
DROP POLICY IF EXISTS "用户可以删除自己的收藏" ON favorite_songs;

-- favorite_songs RLS策略
CREATE POLICY "用户可以查看自己的收藏" ON favorite_songs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加收藏" ON favorite_songs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的收藏" ON favorite_songs
  FOR DELETE USING (auth.uid() = user_id);

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以查看自己的播放历史" ON play_history;
DROP POLICY IF EXISTS "用户可以添加播放历史" ON play_history;
DROP POLICY IF EXISTS "用户可以删除自己的播放历史" ON play_history;

-- play_history RLS策略
CREATE POLICY "用户可以查看自己的播放历史" ON play_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加播放历史" ON play_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的播放历史" ON play_history
  FOR DELETE USING (auth.uid() = user_id);

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以查看公开歌单或自己的歌单" ON playlists;
DROP POLICY IF EXISTS "用户可以创建歌单" ON playlists;
DROP POLICY IF EXISTS "用户可以更新自己的歌单" ON playlists;
DROP POLICY IF EXISTS "用户可以删除自己的歌单" ON playlists;

-- playlists RLS策略
CREATE POLICY "用户可以查看公开歌单或自己的歌单" ON playlists
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "用户可以创建歌单" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的歌单" ON playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的歌单" ON playlists
  FOR DELETE USING (auth.uid() = user_id);

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以查看公开歌单的歌曲或自己歌单的歌曲" ON playlist_songs;
DROP POLICY IF EXISTS "用户可以向自己的歌单添加歌曲" ON playlist_songs;
DROP POLICY IF EXISTS "用户可以从自己的歌单删除歌曲" ON playlist_songs;

-- playlist_songs RLS策略
CREATE POLICY "用户可以查看公开歌单的歌曲或自己歌单的歌曲" ON playlist_songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND (playlists.is_public = true OR playlists.user_id = auth.uid())
    )
  );

CREATE POLICY "用户可以向自己的歌单添加歌曲" ON playlist_songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以从自己的歌单删除歌曲" ON playlist_songs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以查看自己不喜欢的歌曲" ON disliked_songs;
DROP POLICY IF EXISTS "用户可以添加不喜欢的歌曲" ON disliked_songs;
DROP POLICY IF EXISTS "用户可以删除不喜欢的歌曲记录" ON disliked_songs;

-- disliked_songs RLS策略
CREATE POLICY "用户可以查看自己不喜欢的歌曲" ON disliked_songs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加不喜欢的歌曲" ON disliked_songs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除不喜欢的歌曲记录" ON disliked_songs
  FOR DELETE USING (auth.uid() = user_id);

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以查看自己的设置" ON app_settings;
DROP POLICY IF EXISTS "用户可以插入自己的设置" ON app_settings;
DROP POLICY IF EXISTS "用户可以更新自己的设置" ON app_settings;

-- app_settings RLS策略
CREATE POLICY "用户可以查看自己的设置" ON app_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的设置" ON app_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的设置" ON app_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建触发器函数：自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, username, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  );
  
  INSERT INTO public.app_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：在用户注册时自动创建资料
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
