-- ============================================
-- One Music 扩展功能 - 社交、通知、会员系统
-- 版本: 1.1.0
-- 日期: 2025-10-06
-- ============================================

-- ========================================
-- 1. 社交功能表
-- ========================================

-- 关注关系表
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL, -- 'song', 'playlist', 'user'
  target_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_content_length CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 1000)
);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL, -- 'song', 'playlist', 'comment'
  target_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ========================================
-- 2. 通知系统表
-- ========================================

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'follow', 'comment', 'like', 'system', 'vip_expire'
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- ========================================
-- 3. 会员系统表
-- ========================================

-- 会员套餐表
CREATE TABLE IF NOT EXISTS vip_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'vip', 'svip'
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  plan_id UUID REFERENCES vip_plans(id),
  plan_name VARCHAR(50) NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  duration_days INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled', 'refunded'
  payment_method VARCHAR(50),
  payment_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. 统计分析表
-- ========================================

-- 每日播放统计表
CREATE TABLE IF NOT EXISTS daily_play_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_plays INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  unique_songs INTEGER DEFAULT 0,
  unique_artists INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 歌手播放统计表
CREATE TABLE IF NOT EXISTS artist_play_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist VARCHAR(255) NOT NULL,
  play_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist)
);

-- ========================================
-- 5. 创建索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_play_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_artist_stats_user ON artist_play_stats(user_id);

-- ========================================
-- 6. RLS策略
-- ========================================

-- user_follows RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看所有关注关系" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "用户可以关注其他用户" ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "用户可以取消关注" ON user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看未删除的评论" ON comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "用户可以发表评论" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的评论" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的评论" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- likes RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看所有点赞" ON likes
  FOR SELECT USING (true);

CREATE POLICY "用户可以点赞" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以取消点赞" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的通知" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的通知" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- vip_plans RLS
ALTER TABLE vip_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可以查看会员套餐" ON vip_plans
  FOR SELECT USING (is_active = true);

-- orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的订单" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建订单" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- daily_play_stats RLS
ALTER TABLE daily_play_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的统计" ON daily_play_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入统计数据" ON daily_play_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新统计数据" ON daily_play_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- artist_play_stats RLS
ALTER TABLE artist_play_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的歌手统计" ON artist_play_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入歌手统计" ON artist_play_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新歌手统计" ON artist_play_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- 7. 触发器和函数
-- ========================================

-- 更新关注数量的触发器函数
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 增加关注数
    UPDATE user_profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    -- 增加粉丝数
    UPDATE user_profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- 减少关注数
    UPDATE user_profiles SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
    -- 减少粉丝数
    UPDATE user_profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_follow_counts ON user_follows;
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 更新评论回复数的触发器函数
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_reply_count ON comments;
CREATE TRIGGER trigger_update_comment_reply_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- 更新点赞数的触发器函数
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'comment' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id::UUID;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' THEN
    UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id::UUID;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_like_count ON likes;
CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- 创建通知的触发器函数
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_content TEXT;
  target_user_id UUID;
BEGIN
  -- 关注通知
  IF TG_TABLE_NAME = 'user_follows' AND TG_OP = 'INSERT' THEN
    SELECT display_name INTO notification_content FROM user_profiles WHERE user_id = NEW.follower_id;
    INSERT INTO notifications (user_id, type, title, content, data)
    VALUES (
      NEW.following_id,
      'follow',
      '新关注',
      notification_content || ' 关注了你',
      jsonb_build_object('follower_id', NEW.follower_id)
    );
  
  -- 评论通知
  ELSIF TG_TABLE_NAME = 'comments' AND TG_OP = 'INSERT' THEN
    -- 如果是回复评论
    IF NEW.parent_id IS NOT NULL THEN
      SELECT user_id INTO target_user_id FROM comments WHERE id = NEW.parent_id;
      SELECT display_name INTO notification_content FROM user_profiles WHERE user_id = NEW.user_id;
      INSERT INTO notifications (user_id, type, title, content, data)
      VALUES (
        target_user_id,
        'comment',
        '新回复',
        notification_content || ' 回复了你的评论',
        jsonb_build_object('comment_id', NEW.id, 'parent_id', NEW.parent_id)
      );
    END IF;
  
  -- 点赞通知
  ELSIF TG_TABLE_NAME = 'likes' AND TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'comment' THEN
      SELECT user_id INTO target_user_id FROM comments WHERE id = NEW.target_id::UUID;
      SELECT display_name INTO notification_content FROM user_profiles WHERE user_id = NEW.user_id;
      INSERT INTO notifications (user_id, type, title, content, data)
      VALUES (
        target_user_id,
        'like',
        '新点赞',
        notification_content || ' 赞了你的评论',
        jsonb_build_object('like_id', NEW.id, 'target_id', NEW.target_id)
      );
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_follow_notification ON user_follows;
CREATE TRIGGER trigger_create_follow_notification
  AFTER INSERT ON user_follows
  FOR EACH ROW EXECUTE FUNCTION create_notification();

DROP TRIGGER IF EXISTS trigger_create_comment_notification ON comments;
CREATE TRIGGER trigger_create_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION create_notification();

DROP TRIGGER IF EXISTS trigger_create_like_notification ON likes;
CREATE TRIGGER trigger_create_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION create_notification();

-- ========================================
-- 8. 插入默认会员套餐
-- ========================================

INSERT INTO vip_plans (name, type, duration_days, price, original_price, features, sort_order)
VALUES
  ('VIP月卡', 'vip', 30, 15.00, 20.00, '{"quality": "high", "download": true, "ad_free": true}', 1),
  ('VIP季卡', 'vip', 90, 40.00, 60.00, '{"quality": "high", "download": true, "ad_free": true}', 2),
  ('VIP年卡', 'vip', 365, 128.00, 240.00, '{"quality": "high", "download": true, "ad_free": true}', 3),
  ('SVIP月卡', 'svip', 30, 25.00, 30.00, '{"quality": "lossless", "download": true, "ad_free": true, "exclusive": true}', 4),
  ('SVIP年卡', 'svip', 365, 228.00, 360.00, '{"quality": "lossless", "download": true, "ad_free": true, "exclusive": true}', 5)
ON CONFLICT DO NOTHING;
