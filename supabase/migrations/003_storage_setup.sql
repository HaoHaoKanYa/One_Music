-- ============================================
-- One Music 用户系统 - 存储桶设置
-- 版本: 1.0.2
-- 日期: 2025-10-06
-- ============================================

-- 创建avatars存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 设置avatars存储桶的RLS策略
-- 允许所有人查看头像
CREATE POLICY "公开访问头像" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 允许用户上传自己的头像
CREATE POLICY "用户可以上传自己的头像" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户更新自己的头像
CREATE POLICY "用户可以更新自己的头像" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户删除自己的头像
CREATE POLICY "用户可以删除自己的头像" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
