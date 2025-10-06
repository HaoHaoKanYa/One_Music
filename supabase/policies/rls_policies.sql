-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disliked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- user_profiles 策略
CREATE POLICY "Users can view public profiles or own profile"
  ON user_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- favorite_songs 策略
CREATE POLICY "Users can view own favorite songs"
  ON favorite_songs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorite songs"
  ON favorite_songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite songs"
  ON favorite_songs FOR DELETE
  USING (auth.uid() = user_id);

-- play_history 策略
CREATE POLICY "Users can view own play history"
  ON play_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own play history"
  ON play_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own play history"
  ON play_history FOR DELETE
  USING (auth.uid() = user_id);

-- playlists 策略
CREATE POLICY "Users can view public playlists or own playlists"
  ON playlists FOR SELECT
  USING ((is_public = true AND is_deleted = false) OR auth.uid() = user_id);

CREATE POLICY "Users can create own playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  USING (auth.uid() = user_id);

-- playlist_songs 策略
CREATE POLICY "Users can view playlist songs"
  ON playlist_songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND ((playlists.is_public = true AND playlists.is_deleted = false) OR playlists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add songs to own playlists"
  ON playlist_songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete songs from own playlists"
  ON playlist_songs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- disliked_songs 策略
CREATE POLICY "Users can view own disliked songs"
  ON disliked_songs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own disliked songs"
  ON disliked_songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own disliked songs"
  ON disliked_songs FOR DELETE
  USING (auth.uid() = user_id);

-- app_settings 策略
CREATE POLICY "Users can manage own settings"
  ON app_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage 策略
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
